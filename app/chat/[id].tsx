import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Pressable,
  Linking,
  Image,
  Animated,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import MessageBubble from '../components/chatbubble';
import { fetchChatMessages, sendMessage } from '../api/chatapi';
import { processWithGroq } from '../api/groqapi'; 
import { StatusBar } from 'expo-status-bar';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import JobDetailCard from '../components/JobCard';
import ResumeCard from '../components/ResumeCard';
import VoiceService, { VoiceServiceError, TranscriptionResult, ChatResponse } from '@/app/api/voiceService';

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';
const FALLBACK_USER_ID = 'demo-user-123';

// Types
export interface Message {
  id: string;
  content: string;
  is_user_message: boolean;
  timestamp: string;
  isJobSearch?: boolean;
  jobData?: any[];
  isVoiceMessage?: boolean;
}

interface CommandSuggestion {
  command: string;
  description: string;
}

interface GroqRequestParams {
  message: string;
  chatId: string;
  chatName: string;
  context: string;
  userId: string;
}

const COMMANDS: CommandSuggestion[] = [
  { command: '/job', description: 'Search for jobs' },
];

const ChatScreen = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const chatName = useLocalSearchParams<{ name: string }>().name || 'Chat';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [showCommands, setShowCommands] = useState<boolean>(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobDetailsModalVisible, setJobDetailsModalVisible] = useState<boolean>(false);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [userId, setUserId] = useState<string>(FALLBACK_USER_ID);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribingAndProcessing, setIsTranscribingAndProcessing] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceProcessingStep, setVoiceProcessingStep] = useState<string>('');
  
  // Animation values
  const recordingAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize voice service configuration
  useEffect(() => {
    VoiceService.updateConfig({
      language: 'en',
      cleanupAfterTranscription: true,
    });
  }, []);

  // Get Google user ID from session
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const googleUserInfo = await AsyncStorage.getItem('googleUserInfo');
        if (googleUserInfo) {
          const userInfo = JSON.parse(googleUserInfo);
          if (userInfo.id) {
            setUserId(userInfo.id);
          }
        }
      } catch (error) {
        console.log('Error retrieving Google user info:', error);
      }
    };
    
    getUserInfo();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadChatMessages();
    } else {
      setLoading(false);
      Alert.alert('Error', 'Chat ID is missing');
    }
  }, [chatId]);

  useEffect(() => {
    if (inputText === '/') {
      setShowCommands(true);
    } else if (inputText.length > 0 && !inputText.startsWith('/')) {
      setShowCommands(false);
    }
  }, [inputText]);

  // Recording animation effect
  useEffect(() => {
    if (isRecording) {
      const startPulseAnimation = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnimation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      startPulseAnimation();

      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnimation.stopAnimation();
      pulseAnimation.setValue(1);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording]);

  const loadChatMessages = async () => {
    try {
      setLoading(true);
      const { messages: chatMessages, context: chatContext } = await fetchChatMessages(chatId);
      
      const processedMessages = chatMessages.map(msg => {
        if (msg.is_user_message && msg.content.toLowerCase().startsWith('/job ')) {
          return { ...msg, isJobSearch: true };
        }
        return msg;
      });
      
      setMessages(processedMessages);
      setContext(chatContext || '');
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText?: string, isVoice: boolean = false) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !chatId) return;
    
    setInputText('');
    setShowCommands(false);
    
    const isJobSearch = textToSend.toLowerCase().startsWith('/job ') || textToSend.toLowerCase() === '/job';
    
    const tempUserMessageId = `temp-${Date.now()}`;
    const newUserMessage: Message = {
      id: tempUserMessageId,
      content: textToSend,
      is_user_message: true,
      timestamp: new Date().toISOString(),
      isJobSearch: isJobSearch,
      isVoiceMessage: isVoice,
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    scrollToBottom();
    
    setSending(true);
    
    try {
      const groqResponse = await processWithGroq({
        message: textToSend,
        chatId,
        chatName: decodeURIComponent(chatName),
        context,
        userId
      });
      
      const { botResponse, updatedContext } = groqResponse;
      
      await sendMessage(chatId, textToSend, botResponse, updatedContext);
      
      let jobData: any[] | undefined = undefined;
      if (isJobSearch) {
        try {
          const jobMatches = botResponse.match(/\d+\.\s(.*?)\sat\s(.*?)\n\s*Location:\s(.*?)\n\s*Salary:\s(.*?)\n/g);
          
          if (jobMatches && jobMatches.length > 0) {
            jobData = jobMatches.map(match => {
              const titleMatch = match.match(/\d+\.\s(.*?)\sat\s(.*?)\n/);
              const locationMatch = match.match(/Location:\s(.*?)\n/);
              const salaryMatch = match.match(/Salary:\s(.*?)\n/);
              const linkMatch = match.match(/Apply:\s(.*?)(\n|$)/);
              
              const rawSalary = salaryMatch ? salaryMatch[1] : 'Not specified';
              const salary = rawSalary.replace(/\$/g, '₹');
              
              return {
                title: titleMatch ? titleMatch[1] : 'Unknown position',
                company: titleMatch ? titleMatch[2] : 'Unknown company',
                location: locationMatch ? locationMatch[1] : 'Unknown location',
                salary: salary,
                applyLink: linkMatch ? linkMatch[1].trim() : '#',
                id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                logoUrl: `https://logo.clearbit.com/${titleMatch ? titleMatch[2].toLowerCase().replace(/\s+/g, '') : 'company'}.com`,
              };
            });
          }
        } catch (parseError) {
          console.error("Error parsing job data:", parseError);
        }
      }
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: botResponse,
        is_user_message: false,
        timestamp: new Date().toISOString(),
        jobData: jobData,
        isJobSearch: isJobSearch
      };
      
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== tempUserMessageId),
        newUserMessage,
        botMessage
      ]);
      
      setContext(updatedContext);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempUserMessageId)
      );
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  // Enhanced voice recording with automatic Groq processing
  const startVoiceRecording = async () => {
    try {
      setShowVoiceModal(true);
      setIsRecording(true);
      setVoiceProcessingStep('Recording...');
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        Vibration.vibrate([0, 50]);
      } else {
        Vibration.vibrate(50);
      }
      
      const result = await VoiceService.startRecording();
      console.log('Recording started:', result);
    } catch (error: any) {
      console.error('Recording start error:', error);
      setIsRecording(false);
      setShowVoiceModal(false);
      
      const voiceError = error as VoiceServiceError;
      const errorMessage = VoiceService.getErrorMessage(voiceError);
      Alert.alert('Recording Error', errorMessage);
    }
  };

  const stopVoiceRecordingAndProcess = async () => {
    try {
      setIsRecording(false);
      setIsTranscribingAndProcessing(true);
      setVoiceProcessingStep('Transcribing audio...');
      
      // Stop recording and get the audio file
      const recordingResult = await VoiceService.stopRecording();
      console.log('Recording stopped:', recordingResult);
      
      // Transcribe the audio
      const transcriptionResult = await VoiceService.transcribeAudio(recordingResult.uri);
      console.log('Transcription result:', transcriptionResult);
      
      if (!transcriptionResult.text.trim()) {
        setIsTranscribingAndProcessing(false);
        setShowVoiceModal(false);
        Alert.alert('No Speech Detected', 'Please try recording again and speak clearly.');
        return;
      }

      // Update processing step
      setVoiceProcessingStep('Processing with AI...');
      
      // Create temporary user message to show immediately
      const tempUserMessageId = `temp-voice-${Date.now()}`;
      const transcribedText = transcriptionResult.text.trim();
      const isJobSearch = transcribedText.toLowerCase().includes('job') || 
                         transcribedText.toLowerCase().includes('career') ||
                         transcribedText.toLowerCase().startsWith('/job');
      
      const newUserMessage: Message = {
        id: tempUserMessageId,
        content: transcribedText,
        is_user_message: true,
        timestamp: new Date().toISOString(),
        isJobSearch: isJobSearch,
        isVoiceMessage: true,
      };
      
      // Close modal and show transcribed message
      setIsTranscribingAndProcessing(false);
      setShowVoiceModal(false);
      
      // Add user message immediately
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      scrollToBottom();
      
      // Process with Groq
      setSending(true);
      
      try {
        const groqResponse = await processWithGroq({
          message: transcribedText,
          chatId,
          chatName: decodeURIComponent(chatName),
          context,
          userId
        });
        
        const { botResponse, updatedContext } = groqResponse;
        
        // Save to database
        await sendMessage(chatId, transcribedText, botResponse, updatedContext);
        
        // Parse job data if needed
        let jobData: any[] | undefined = undefined;
        if (isJobSearch) {
          try {
            const jobMatches = botResponse.match(/\d+\.\s(.*?)\sat\s(.*?)\n\s*Location:\s(.*?)\n\s*Salary:\s(.*?)\n/g);
            
            if (jobMatches && jobMatches.length > 0) {
              jobData = jobMatches.map(match => {
                const titleMatch = match.match(/\d+\.\s(.*?)\sat\s(.*?)\n/);
                const locationMatch = match.match(/Location:\s(.*?)\n/);
                const salaryMatch = match.match(/Salary:\s(.*?)\n/);
                const linkMatch = match.match(/Apply:\s(.*?)(\n|$)/);
                
                const rawSalary = salaryMatch ? salaryMatch[1] : 'Not specified';
                const salary = rawSalary.replace(/\$/g, '₹');
                
                return {
                  title: titleMatch ? titleMatch[1] : 'Unknown position',
                  company: titleMatch ? titleMatch[2] : 'Unknown company',
                  location: locationMatch ? locationMatch[1] : 'Unknown location',
                  salary: salary,
                  applyLink: linkMatch ? linkMatch[1].trim() : '#',
                  id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  logoUrl: `https://logo.clearbit.com/${titleMatch ? titleMatch[2].toLowerCase().replace(/\s+/g, '') : 'company'}.com`,
                };
              });
            }
          } catch (parseError) {
            console.error("Error parsing job data:", parseError);
          }
        }
        
        // Create bot response message
        const botMessage: Message = {
          id: `bot-voice-${Date.now()}`,
          content: botResponse,
          is_user_message: false,
          timestamp: new Date().toISOString(),
          jobData: jobData,
          isJobSearch: isJobSearch
        };
        
        // Update messages with both user and bot messages
        setMessages(prevMessages => [
          ...prevMessages.filter(msg => msg.id !== tempUserMessageId),
          newUserMessage,
          botMessage
        ]);
        
        setContext(updatedContext);
        
      } catch (groqError) {
        console.error('Error processing with Groq:', groqError);
        Alert.alert('Processing Error', 'Failed to process your voice message. Please try again.');
        
        // Remove the temporary user message on error
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== tempUserMessageId)
        );
      } finally {
        setSending(false);
        scrollToBottom();
      }
      
    } catch (error: any) {
      console.error('Voice processing error:', error);
      setIsRecording(false);
      setIsTranscribingAndProcessing(false);
      setShowVoiceModal(false);
      
      const voiceError = error as VoiceServiceError;
      const errorMessage = VoiceService.getErrorMessage(voiceError);
      Alert.alert('Voice Processing Error', errorMessage);
    }
  };

  const cancelVoiceRecording = async () => {
    try {
      await VoiceService.cancelRecording();
    } catch (error) {
      console.warn('Error canceling recording:', error);
    } finally {
      setIsRecording(false);
      setIsTranscribingAndProcessing(false);
      setShowVoiceModal(false);
      setVoiceProcessingStep('');
    }
  };

  const handleVoiceButtonPress = () => {
    if (isRecording) {
      stopVoiceRecordingAndProcess();
    } else {
      startVoiceRecording();
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !sending) {
        handleSendMessage();
      }
    }
  };

  const handleCommandSelect = (command: string) => {
    setInputText(command + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleJobCardPress = (jobId: string) => {
    setSelectedJobId(jobId);
    const allJobs = messages
      .filter(msg => msg.jobData)
      .flatMap(msg => msg.jobData || []);
    
    const jobDetails = allJobs.find(job => job.id === jobId);
    if (jobDetails) {
      setSelectedJobDetails(jobDetails);
      setJobDetailsModalVisible(true);
    }
  };

  const openJobApplication = (url: string) => {
    if (!url || url === '#') {
      Alert.alert('Info', 'Application link is not available');
      return;
    }
    
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    Linking.canOpenURL(formattedUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(formattedUrl);
        } else {
          Alert.alert('Error', `Cannot open URL: ${formattedUrl}`);
        }
      })
      .catch(err => {
        console.error('Error opening URL:', err);
        Alert.alert('Error', 'Could not open the application link');
      });
  };

  const formatRecordingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderCompanyLogo = (logoUrl: string) => {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: logoUrl }}
          style={styles.companyLogo}
          defaultSource={require('../../assets/images/placeholder-logo.jpeg')}
          onError={(e) => console.log('Error loading logo', e.nativeEvent.error)}
        />
      </View>
    );
  };

  const renderJobCard = (job: any) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => handleJobCardPress(job.id)}
      key={job.id}
    >
      <View style={styles.jobCardHeader}>
        {renderCompanyLogo(job.logoUrl)}
        <View style={styles.modalTitleContainer}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.jobCompany} numberOfLines={1}>{job.company}</Text>
        </View>
      </View>
      <View style={styles.jobCardDetails}>
        <View style={styles.jobCard}>
          <Feather name="map-pin" size={14} color="#49654E" />
          <Text style={styles.jobLocation} numberOfLines={1}>{job.location}</Text>
        </View>
        <View style={styles.jobCard}>
          <Feather name="dollar-sign" size={14} color="#49654E" />
          <Text style={styles.jobSalary} numberOfLines={1}>{job.salary}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.jobApplyButton}
        onPress={() => openJobApplication(job.applyLink)}
        activeOpacity={0.7}
      >
        <Text style={styles.jobApplyText}>Apply Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderJobCards = (jobData: any[]) => (
    <View style={styles.noJobsContainer}>
      <Text style={styles.jobResultsTitle}>Job Search Results</Text>
      {jobData.map(job => renderJobCard(job))}
    </View>
  );

  const ResumeCardComponent = ({ message }: { message: string }) => {
    const resumeMatch = message.match(/\/resume\s*:\s*(https?:\/\/[^\s]+)/i);
    
    if (!resumeMatch) return null;
    
    const resumeUrl = resumeMatch[1];
    
    const openResume = () => {
      Linking.canOpenURL(resumeUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(resumeUrl);
          } else {
            Alert.alert('Error', 'Cannot open resume URL');
          }
        })
        .catch(err => {
          console.error('Error opening resume:', err);
          Alert.alert('Error', 'Could not open the resume');
        });
    };

    return (
      <View style={styles.resumeCard}>
        <View style={styles.resumeCardHeader}>
          <View style={styles.resumeIconContainer}>
            <Feather name="file-text" size={24} color="#49654E" />
          </View>
          <View style={styles.resumeTextContainer}>
            <Text style={styles.resumeSubtitle}>Resume Document</Text>
            <Text style={styles.resumeSubtitle}>Click to view or download</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.resumeViewText}
          onPress={openResume}
          activeOpacity={0.7}
        >
          <Feather name="external-link" size={16} color="#FFFFFF" />
          <Text style={styles.resumeViewText}>View Resume</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (!item.is_user_message && item.content.toLowerCase().includes('/jobdata')) {
      return <JobDetailCard message={item.content} />;
    }
    
    if (item.content.toLowerCase().includes('/resume')) {
      return <ResumeCardComponent message={item.content} />;
    }
    
    if (item.isJobSearch && !item.is_user_message) {
      return item.jobData && item.jobData.length > 0 ? (
        renderJobCards(item.jobData)
      ) : (
        <View style={styles.noJobsContainer}>
          <Text style={styles.noJobsText}>No job results found</Text>
        </View>
      );
    }
    
    return (
      <View>
        <MessageBubble 
          message={item.content}
          isUser={item.is_user_message}
          timestamp={new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />
      </View>
    );
  };

  const renderCommandSuggestion = ({ item }: { item: CommandSuggestion }) => (
    <TouchableOpacity 
      style={styles.commandText} 
      onPress={() => handleCommandSelect(item.command)}
    >
      <Text style={styles.commandText}>{item.command}</Text>
      <Text style={styles.commandDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const handleBackPress = () => {
    router.push('/chat');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#253528" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{decodeURIComponent(chatName)}</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#49654E" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
          />
        )}

        {showCommands && (
          <View style={styles.commandsContainer}>
            <FlatList
              data={COMMANDS}
              renderItem={renderCommandSuggestion}
              keyExtractor={(item) => item.command}
              style={styles.commandsList}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#49654E80"
            value={inputText}
            onChangeText={setInputText}
            onKeyPress={handleKeyPress}
            multiline
            maxLength={2000}
          />
          
          {/* Voice recording button */}
          <TouchableOpacity 
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording
            ]}
            onPress={handleVoiceButtonPress}
            activeOpacity={0.7}
            disabled={isTranscribingAndProcessing || sending}
          >
            <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnimation : 1 }] }}>
              {isTranscribingAndProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons 
                  name={isRecording ? "stop" : "mic"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              )}
            </Animated.View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Enhanced Voice Recording Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showVoiceModal}
        onRequestClose={cancelVoiceRecording}
      >
        <View style={styles.voiceModalOverlay}>
          <View style={styles.voiceModalContent}>
            {isTranscribingAndProcessing ? (
              <>
                <View style={styles.processingHint}>
                  <ActivityIndicator size="large" color="#49654E" />
                </View>
                <Text style={styles.voiceModalTitle}>Processing Voice...</Text>
                <Text style={styles.voiceModalSubtitle}>{voiceProcessingStep}</Text>
                <Text style={styles.processingHint}>
                  Converting speech to text and getting AI response
                </Text>
              </>
            ) : (
              <>
                <Animated.View 
                  style={[
                    styles.recordingIndicator,
                    { transform: [{ scale: pulseAnimation }] }
                  ]}
                >
                  <MaterialIcons name="mic" size={40} color="#FFFFFF" />
                </Animated.View>
                
                <Text style={styles.voiceModalTitle}>
                  {isRecording ? 'Recording...' : 'Ready to Record'}
                </Text>
                
                {isRecording && (
                  <Text style={styles.recordingTimer}>
                    {formatRecordingTime(recordingDuration)}
                  </Text>
                )}
                
               <Text style={styles.voiceModalSubtitle}>
  {isRecording ? 'Tap stop to send to AI' : 'Tap to start recording'}
</Text>
                
                <View style={styles.voiceModalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={cancelVoiceRecording}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.recordButton,
                      isRecording && styles.stopButton
                    ]}
                    onPress={handleVoiceButtonPress}
                  >
                    <MaterialIcons 
                      name={isRecording ? "stop" : "mic"} 
                      size={24} 
                      color="#FFFFFF" 
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Job Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={jobDetailsModalVisible}
        onRequestClose={() => setJobDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {selectedJobDetails?.logoUrl && (
                <Image 
                  source={{ uri: selectedJobDetails.logoUrl }} 
                  style={styles.modalLogo}
                  defaultSource={require('../../assets/images/placeholder-logo.jpeg')}
                />
              )}
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedJobDetails?.title}
                </Text>
                <Text style={styles.modalCompany}>
                  {selectedJobDetails?.company}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setJobDetailsModalVisible(false)}
                style={styles.modalClose}
              >
                <MaterialIcons name="close" size={24} color="#253528" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={16} color="#49654E" />
                <Text style={styles.detailText}>{selectedJobDetails?.location}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Feather name="dollar-sign" size={16} color="#49654E" />
                <Text style={styles.detailText}>{selectedJobDetails?.salary}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.applyButtonLarge}
                onPress={() => {
                  setJobDetailsModalVisible(false);
                  setTimeout(() => {
                    if (selectedJobDetails?.applyLink) {
                      openJobApplication(selectedJobDetails.applyLink);
                    }
                  }, 300);
                }}
                activeOpacity={0.6}
              >
                <Feather name="external-link" size={18} color="#FFFFFF" style={styles.applyButtonIcon} />
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  jobResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#253528',
    marginBottom: 12,
    textAlign: 'left',
  },
  jobApplyText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  jobCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  noJobsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  noJobsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E7E0',
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 14,
    color: '#49654E',
    fontWeight: '500',
    marginBottom: 2,
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#E0E7E0',
    resizeMode: 'contain',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  commandsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    maxHeight: 120,
  },
  commandsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commandDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  commandText: {
    fontSize: 16,
    color: '#253528',
    fontWeight: '500',
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E7E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#253528',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    textAlignVertical: 'top',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#DC2626',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A8B8A8',
  },
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordingIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  voiceModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 8,
    textAlign: 'center',
  },
  voiceModalSubtitle: {
    fontSize: 14,
    color: '#49654E',
    textAlign: 'center',
    marginBottom: 20,
  },
  recordingTimer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  voiceModalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 4,
    lineHeight: 24,
  },
  modalCompany: {
    fontSize: 14,
    color: '#49654E',
    fontWeight: '500',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#253528',
    flex: 1,
  },
  applyButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#49654E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  applyButtonIcon: {
    marginRight: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  processingHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  resumeViewText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  resumeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resumeTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  resumeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E0E7E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resumeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E7E0',
  },
  resumeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  jobApplyButton: {
    backgroundColor: '#49654E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  jobSalary: {
    fontSize: 14,
    color: '#253528',
    fontWeight: '500',
    marginLeft: 4,
  },

  jobLocation: {
    fontSize: 14,
    color: '#253528',
    fontWeight: '500',
    marginLeft: 4,
  },

});

export default ChatScreen;
