import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  transcribeVoice, 
  stopRecording,
  getRecordingStatus,
  isRecording,
  isAudioRecordingSupported, 
  type VoiceRecordingOptions,
  type RecordingStatus
} from '../api/getTranscription';

const { width, height } = Dimensions.get('window');

const COLORS = {
  SOFT_GREEN: '#8BA889',
  DEEP_GREEN: '#253528',
  MEDIUM_OLIVE: '#49654E',
  WHITE: '#FFFFFF',
  ERROR_RED: '#ff3b30',
  OVERLAY_BG: 'rgba(0, 0, 0, 0.65)',
  LIGHT_GRAY: '#F8F9FA',
  BORDER_LIGHT: '#E8E9EA',
  SUCCESS_GREEN: '#34C759',
  ICON_GRAY: '#6B7280',
  MUTED_TEXT: '#8E8E93',
};

interface VoiceRecordingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionComplete: (text: string) => void;
}

interface ComponentState {
  recordingStatus: RecordingStatus;
  error: string | null;
  recordingTime: number;
  transcriptionText: string | null;
  detectedLanguage: string | null;
}

export default function VoiceRecordingOverlay({ 
  isOpen, 
  onClose, 
  onTranscriptionComplete 
}: VoiceRecordingOverlayProps) {
  const [state, setState] = useState<ComponentState>({
    recordingStatus: 'idle',
    error: null,
    recordingTime: 0,
    transcriptionText: null,
    detectedLanguage: null
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  
  // Clean up function
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = null;
    }
  };

  // Entrance animation
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [isOpen]);

  // Pulse animation for recording
  useEffect(() => {
    if (state.recordingStatus === 'recording') {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (state.recordingStatus === 'recording') pulse();
        });
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.recordingStatus]);

  // Status monitoring effect
  useEffect(() => {
    if (isOpen) {
      // Check recording status every 100ms
      statusCheckRef.current = setInterval(() => {
        const currentStatus = getRecordingStatus();
        const currentlyRecording = isRecording();
        
        setState(prev => {
          if (prev.recordingStatus !== currentStatus) {
            return { ...prev, recordingStatus: currentStatus };
          }
          return prev;
        });
      }, 100);
    }

    return cleanup;
  }, [isOpen]);

  // Timer effect - only run when recording
  useEffect(() => {
    if (state.recordingStatus === 'recording') {
      if (!timerRef.current) {
        recordingStartTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setState(prev => ({ ...prev, recordingTime: elapsed }));
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (state.recordingStatus === 'idle' || state.recordingStatus === 'completed') {
        setState(prev => ({ ...prev, recordingTime: 0 }));
      }
    }
  }, [state.recordingStatus]);

  // Auto-stop after 30 seconds
  useEffect(() => {
    if (state.recordingTime >= 30 && state.recordingStatus === 'recording') {
      handleStopRecording();
    }
  }, [state.recordingTime, state.recordingStatus]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      // Force stop any ongoing recording
      if (getRecordingStatus() === 'recording') {
        stopRecording().catch(console.error);
      }
      // Reset state
      setState({
        recordingStatus: 'idle',
        error: null,
        recordingTime: 0,
        transcriptionText: null,
        detectedLanguage: null
      });
    }
  }, [isOpen]);

  const handleStartRecording = async () => {
    if (!isAudioRecordingSupported()) {
      setState(prev => ({ 
        ...prev, 
        error: 'Audio recording is not supported on this device' 
      }));
      return;
    }

    // Clear any previous errors
    setState(prev => ({ 
      ...prev, 
      error: null,
      transcriptionText: null,
      detectedLanguage: null
    }));

    try {
      // Configure recording options
      const options: VoiceRecordingOptions = {
        maxDuration: 30000, // 30 seconds
        autoStop: true,
        onStatusChange: (status: RecordingStatus) => {
          setState(prev => ({ ...prev, recordingStatus: status }));
          
          // Handle different status changes
          if (status === 'error') {
            setState(prev => ({ 
              ...prev, 
              error: 'Recording failed. Please try again.' 
            }));
          }
        }
      };

      // Start recording using the API
      const result = await transcribeVoice(options);
      
      // Handle the result
      if (result.success && result.text) {
        const transcribedText = result.text.trim();
        
        // Filter out common false positives
        const filteredText = transcribedText.toLowerCase();
        if (filteredText === 'thank you' || 
            filteredText === 'thanks' || 
            filteredText === 'thank you.' ||
            filteredText.length < 2) {
          setState(prev => ({ 
            ...prev, 
            error: 'No speech detected. Please try recording again.',
            recordingStatus: 'error'
          }));
          return;
        }
        
        // Success - store result
        setState(prev => ({
          ...prev,
          transcriptionText: transcribedText,
          detectedLanguage: result.languageName || result.language,
          recordingStatus: 'completed'
        }));
        
        // Pass transcription to parent and close
        setTimeout(() => {
          onTranscriptionComplete(transcribedText);
          onClose();
        }, 1000); // Brief delay to show success state
        
      } else {
        setState(prev => ({ 
          ...prev, 
          error: result.error || 'Transcription failed. Please try again.',
          recordingStatus: 'error'
        }));
      }
    } catch (error) {
      console.error('Recording error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Recording failed. Please try again.',
        recordingStatus: 'error'
      }));
    }
  };

  const handleStopRecording = async () => {
    if (state.recordingStatus !== 'recording') {
      return;
    }

    try {
      setState(prev => ({ ...prev, recordingStatus: 'stopping' }));
      await stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to stop recording properly',
        recordingStatus: 'error'
      }));
    }
  };

  const handleMainButtonPress = () => {
    // Prevent interaction during processing states
    if (['requesting-permission', 'stopping', 'processing'].includes(state.recordingStatus)) {
      return;
    }
    
    if (state.recordingStatus === 'recording') {
      handleStopRecording();
    } else if (['idle', 'error', 'completed'].includes(state.recordingStatus)) {
      handleStartRecording();
    }
  };

  const handleClose = async () => {
    cleanup();
    // Stop any ongoing recording
    if (state.recordingStatus === 'recording') {
      await stopRecording().catch(console.error);
    }
    onClose();
  };

  const handleRetry = () => {
    setState(prev => ({ 
      ...prev, 
      error: null, 
      recordingTime: 0,
      recordingStatus: 'idle',
      transcriptionText: null,
      detectedLanguage: null
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMainButtonContent = () => {
    switch (state.recordingStatus) {
      case 'requesting-permission':
        return {
          icon: 'hourglass' as const,
          text: 'Requesting microphone access...',
          buttonStyle: styles.processingButton,
          showPulse: false,
          disabled: true
        };
      case 'recording':
        return {
          icon: 'stop' as const,
          text: 'Tap to stop recording',
          buttonStyle: styles.stopButton,
          showPulse: true,
          disabled: false
        };
      case 'stopping':
        return {
          icon: 'hourglass' as const,
          text: 'Stopping recording...',
          buttonStyle: styles.processingButton,
          showPulse: false,
          disabled: true
        };
      case 'processing':
        return {
          icon: 'hourglass' as const,
          text: 'Processing audio...',
          buttonStyle: styles.processingButton,
          showPulse: false,
          disabled: true
        };
      case 'completed':
        return {
          icon: 'checkmark' as const,
          text: 'Transcription completed!',
          buttonStyle: styles.completedButton,
          showPulse: false,
          disabled: true
        };
      case 'error':
        return {
          icon: 'mic' as const,
          text: 'Tap to try again',
          buttonStyle: styles.startButton,
          showPulse: false,
          disabled: false
        };
      default: // idle
        return {
          icon: 'mic' as const,
          text: 'Tap to start recording',
          buttonStyle: styles.startButton,
          showPulse: false,
          disabled: false
        };
    }
  };

  const renderContent = () => {
    if (state.recordingStatus === 'processing') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <View style={styles.processingIconContainer}>
                <Ionicons name="mic" size={18} color={COLORS.SOFT_GREEN} />
              </View>
              <Text style={styles.title}>Processing Audio</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color={COLORS.ICON_GRAY} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.processingContainer}>
            <View style={styles.processingIconWrapper}>
              <ActivityIndicator size="large" color={COLORS.SOFT_GREEN} />
            </View>
            <Text style={styles.processingText}>Converting speech to text...</Text>
            <Text style={styles.processingSubtext}>Please wait a moment</Text>
          </View>
        </View>
      );
    }

    const buttonContent = getMainButtonContent();

    return (
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <View style={styles.voiceIconContainer}>
              <Ionicons name="mic" size={18} color={COLORS.SOFT_GREEN} />
            </View>
            <Text style={styles.title}>Voice Message</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={COLORS.ICON_GRAY} />
          </TouchableOpacity>
        </View>

        {state.error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.ERROR_RED} />
            </View>
            <Text style={styles.errorText}>{state.error}</Text>
            <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.recordingStatus === 'completed' && state.transcriptionText && (
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS_GREEN} />
            </View>
            <Text style={styles.successText}>Recording transcribed successfully!</Text>
            {state.detectedLanguage && (
              <Text style={styles.languageText}>Detected: {state.detectedLanguage}</Text>
            )}
          </View>
        )}

        <View style={styles.recordingArea}>
          {state.recordingStatus === 'recording' ? (
            <>
              <View style={styles.recordingStatusContainer}>
                <View style={styles.recordingIndicatorWrapper}>
                  <View style={styles.recordingIndicator} />
                  <Text style={styles.recordingStatusText}>Recording</Text>
                </View>
                <Text style={styles.timerText}>{formatTime(state.recordingTime)}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.readyStateContainer}>
                <View style={styles.microphoneIconContainer}>
                  <Ionicons 
                    name={state.recordingStatus === 'completed' ? "checkmark-circle-outline" : "mic-outline"} 
                    size={48} 
                    color={state.recordingStatus === 'completed' ? COLORS.SUCCESS_GREEN : COLORS.SOFT_GREEN} 
                  />
                </View>
                <Text style={styles.readyTitle}>
                  {state.recordingStatus === 'completed' ? 'Transcription Complete' : 
                   state.recordingStatus === 'error' ? 'Ready to Retry' : 'Ready to Record'}
                </Text>
                <Text style={styles.readySubtitle}>
                  {state.recordingStatus === 'completed' ? 'Your voice has been converted to text' :
                   state.recordingStatus === 'error' ? 'Tap the microphone to try again' :
                   'Tap the microphone to start recording'}
                </Text>
              </View>
            </>
          )}
          
          <Animated.View 
            style={[
              styles.micButtonWrapper, 
              buttonContent.showPulse ? { transform: [{ scale: pulseAnim }] } : {}
            ]}
          >
            <TouchableOpacity 
              onPress={handleMainButtonPress} 
              style={[styles.micButton, buttonContent.buttonStyle]}
              activeOpacity={buttonContent.disabled ? 1 : 0.8}
              disabled={buttonContent.disabled}
            >
              <Ionicons name={buttonContent.icon} size={24} color={COLORS.WHITE} />
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.instructionText}>{buttonContent.text}</Text>
          
          {state.recordingStatus === 'idle' && (
            <Text style={styles.hintText}>
              Maximum duration: 30 seconds • Supports Indian languages and English
            </Text>
          )}
          
          {state.recordingStatus === 'recording' && (
            <Text style={styles.hintText}>Speak clearly for best transcription results</Text>
          )}

          {state.recordingStatus === 'requesting-permission' && (
            <Text style={styles.hintText}>Please allow microphone access to continue</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {renderContent()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY_BG,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    width: Math.min(width - 40, 360),
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  contentContainer: {
    padding: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_LIGHT,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.SOFT_GREEN}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  processingIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.SOFT_GREEN}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.DEEP_GREEN,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.ERROR_RED}08`,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${COLORS.ERROR_RED}15`,
  },
  errorIconContainer: {
    marginRight: 8,
    marginTop: 1,
  },
  errorText: {
    color: COLORS.ERROR_RED,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.SUCCESS_GREEN}08`,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${COLORS.SUCCESS_GREEN}15`,
  },
  successIconContainer: {
    marginRight: 8,
    marginTop: 1,
  },
  successText: {
    color: COLORS.SUCCESS_GREEN,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  languageText: {
    color: COLORS.SUCCESS_GREEN,
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  recordingArea: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  readyStateContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  microphoneIconContainer: {
    marginBottom: 16,
    opacity: 0.7,
  },
  readyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.DEEP_GREEN,
    marginBottom: 4,
  },
  readySubtitle: {
    fontSize: 13,
    color: COLORS.MEDIUM_OLIVE,
    textAlign: 'center',
  },
  recordingStatusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordingIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ERROR_RED,
    marginRight: 8,
  },
  recordingStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.DEEP_GREEN,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.SOFT_GREEN,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  micButtonWrapper: {
    marginBottom: 20,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  startButton: {
    backgroundColor: COLORS.SOFT_GREEN,
  },
  stopButton: {
    backgroundColor: COLORS.ERROR_RED,
  },
  processingButton: {
    backgroundColor: COLORS.MEDIUM_OLIVE,
    opacity: 0.7,
  },
  completedButton: {
    backgroundColor: COLORS.SUCCESS_GREEN,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.MEDIUM_OLIVE,
    fontWeight: '500',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    fontSize: 11,
    color: COLORS.MEDIUM_OLIVE,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 11,
    color: COLORS.MUTED_TEXT,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 300,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingIconWrapper: {
    marginBottom: 20,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.DEEP_GREEN,
    marginBottom: 6,
  },
  processingSubtext: {
    fontSize: 12,
    color: COLORS.MEDIUM_OLIVE,
  },
});