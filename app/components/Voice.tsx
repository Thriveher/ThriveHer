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
import { transcribeVoice, isAudioRecordingSupported } from '../api/getTranscription';

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

interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  recordingTime: number;
}

export default function VoiceRecordingOverlay({ 
  isOpen, 
  onClose, 
  onTranscriptionComplete 
}: VoiceRecordingOverlayProps) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    recordingTime: 0
  });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    if (state.isRecording) {
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
          if (state.isRecording) pulse();
        });
      };
      pulse();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.isRecording]);

  // Timer effect
  useEffect(() => {
    if (state.isRecording) {
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isRecording]);

  // Auto-stop after 30 seconds
  useEffect(() => {
    if (state.recordingTime >= 30) {
      handleStopRecording();
    }
  }, [state.recordingTime]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      handleStopRecording();
      setState({
        isRecording: false,
        isProcessing: false,
        error: null,
        recordingTime: 0
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

    try {
      setState(prev => ({ 
        ...prev, 
        error: null, 
        isRecording: true, 
        recordingTime: 0
      }));

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });

      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setState(prev => ({ 
            ...prev, 
            error: 'No audio data recorded. Please try again.',
            isProcessing: false
          }));
          return;
        }

        setState(prev => ({ ...prev, isProcessing: true }));
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const audioFile = new File([audioBlob], 'recording.webm', { 
            type: mimeType 
          });
          
          const result = await transcribeVoice(audioFile);
          
          if (result.success && result.text && result.text.trim()) {
            const transcribedText = result.text.trim();
            
            const filteredText = transcribedText.toLowerCase();
            if (filteredText === 'thank you' || 
                filteredText === 'thanks' || 
                filteredText === 'thank you.' ||
                filteredText.length < 2) {
              setState(prev => ({ 
                ...prev, 
                error: 'No speech detected. Please try recording again.',
                isProcessing: false
              }));
              return;
            }
            
            // Pass transcription and close immediately
            onTranscriptionComplete(transcribedText);
            onClose();
            
          } else {
            setState(prev => ({ 
              ...prev, 
              error: result.error || 'Transcription failed. Please try again.',
              isProcessing: false
            }));
          }
        } catch (error) {
          console.error('Transcription error:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to process audio. Please try again.',
            isProcessing: false
          }));
        } finally {
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setState(prev => ({ 
          ...prev, 
          error: 'Recording failed. Please try again.',
          isRecording: false,
          isProcessing: false
        }));
      };

      mediaRecorder.start(1000);
      
    } catch (error) {
      console.error('Recording start error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Unable to access microphone. Please check permissions.',
        isRecording: false
      }));
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({ ...prev, isRecording: false }));
  };

  const handleClose = () => {
    handleStopRecording();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderContent = () => {
    if (state.isProcessing) {
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
          </View>
        )}

        <View style={styles.recordingArea}>
          {state.isRecording ? (
            <>
              <View style={styles.recordingStatusContainer}>
                <View style={styles.recordingIndicatorWrapper}>
                  <View style={styles.recordingIndicator} />
                  <Text style={styles.recordingStatusText}>Recording</Text>
                </View>
                <Text style={styles.timerText}>{formatTime(state.recordingTime)}</Text>
              </View>
              
              <Animated.View style={[styles.micButtonWrapper, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity 
                  onPress={handleStopRecording} 
                  style={[styles.micButton, styles.stopButton]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="stop" size={24} color={COLORS.WHITE} />
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={styles.instructionText}>Tap to stop recording</Text>
              <Text style={styles.hintText}>Speak clearly for best transcription results</Text>
            </>
          ) : (
            <>
              <View style={styles.readyStateContainer}>
                <View style={styles.microphoneIconContainer}>
                  <Ionicons name="mic-outline" size={48} color={COLORS.SOFT_GREEN} />
                </View>
                <Text style={styles.readyTitle}>Ready to Record</Text>
                <Text style={styles.readySubtitle}>Tap the microphone to start recording</Text>
              </View>
              
              <TouchableOpacity 
                onPress={handleStartRecording} 
                style={[styles.micButton, styles.startButton]}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={24} color={COLORS.WHITE} />
              </TouchableOpacity>
              
              <Text style={styles.hintText}>
                Maximum duration: 30 seconds • Speak clearly and minimize background noise
              </Text>
            </>
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
    marginBottom: 24,
  },
  stopButton: {
    backgroundColor: COLORS.ERROR_RED,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.MEDIUM_OLIVE,
    fontWeight: '500',
    marginBottom: 8,
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