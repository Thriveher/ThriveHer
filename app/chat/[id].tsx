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
import CommunityCard from '../components/CommunityCard';
import JobPortalsCard from '../components/JobPortalCard';
import CourseCard from '../components/CourseCard';
import VoiceRecordingOverlay from '../components/Voice'


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
}

// Command suggestions interface
interface CommandSuggestion {
  command: string;
  description: string;
}

// Define the correct interface for Groq request
interface GroqRequestParams {
  message: string;
  chatId: string;
  chatName: string;
  context: string;
  userId: string;
} 


const ChatScreen = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const chatName = useLocalSearchParams<{ name: string }>().name || 'Chat';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [userId, setUserId] = useState<string>(FALLBACK_USER_ID);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState<boolean>(false);
  
  // Scroll management state
  const [isUserScrolling, setIsUserScrolling] = useState<boolean>(false);
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const loadChatMessages = async () => {
    try {
      setLoading(true);
      const { messages: chatMessages, context: chatContext } = await fetchChatMessages(chatId);
      
      setMessages(chatMessages);
      setContext(chatContext || '');
      
      // Mark that we should auto-scroll after initial load
      setShouldAutoScroll(true);
      setIsInitialLoad(true);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      Alert.alert(
        'Error',
        'Failed to load messages. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll events to detect user scrolling
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    
    setIsNearBottom(isAtBottom);
    
    // If user scrolls up and we're not at bottom, disable auto-scroll
    if (!isAtBottom && !isInitialLoad) {
      setIsUserScrolling(true);
      setShouldAutoScroll(false);
    }
    
    // If user scrolls back to bottom, re-enable auto-scroll
    if (isAtBottom && isUserScrolling) {
      setShouldAutoScroll(true);
      setIsUserScrolling(false);
    }
  };

  // Handle when user starts scrolling
  const handleScrollBeginDrag = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    setIsUserScrolling(true);
    setIsInitialLoad(false);
  };

  // Handle when user stops scrolling
  const handleScrollEndDrag = () => {
    // Set a timeout to detect when user has stopped interacting
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
  };

  // Smart scroll function that only scrolls when appropriate
  const scrollToBottomIfNeeded = () => {
    if (flatListRef.current && (shouldAutoScroll || isInitialLoad)) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: !isInitialLoad });
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }, 100);
    }
  };

  // Handle content size change (when new messages are added)
  const handleContentSizeChange = () => {
    scrollToBottomIfNeeded();
  };

  // Handle layout change (when component is first rendered)
  const handleLayout = () => {
    if (isInitialLoad) {
      scrollToBottomIfNeeded();
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputText.trim();
    if (!messageToSend || !chatId) return;
    
    // Only clear input if using typed text (not voice)
    if (!messageText) {
      setInputText('');
    }
    
    // Re-enable auto-scroll when user sends a message
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    
    // Optimistically add user message to the UI
    const tempUserMessageId = `temp-${Date.now()}`;
    const newUserMessage: Message = {
      id: tempUserMessageId,
      content: messageToSend,
      is_user_message: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    
    // Show typing indicator
    setSending(true);
    
    try {
      const groqResponse = await processWithGroq({
        message: messageToSend,
        chatId,
        chatName: decodeURIComponent(chatName),
        context,
        userId
      });
      
      const { botResponse, updatedContext } = groqResponse;
      
      await sendMessage(
        chatId, 
        messageToSend, 
        botResponse, 
        updatedContext
      );
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: botResponse,
        is_user_message: false,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== tempUserMessageId),
        newUserMessage,
        botMessage
      ]);
      
      setContext(updatedContext);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.'
      );
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempUserMessageId)
      );
    } finally {
      setSending(false);
    }
  };

  // Handle key press for Enter key to send message
  const handleKeyPress = (e) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !sending) {
        handleSendMessage();
      }
    }
  };

  const handleOpenVoiceRecording = () => {
    setIsVoiceOverlayOpen(true);
  };

  const handleTranscriptionComplete = (transcribedText: string) => {
    setIsVoiceOverlayOpen(false);
    
    if (transcribedText.trim()) {
      handleSendMessage(transcribedText.trim());
    }
  };

  // Scroll to bottom button handler
  const handleScrollToBottom = () => {
    setShouldAutoScroll(true);
    setIsUserScrolling(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Check if the message contains various commands
    if (!item.is_user_message && item.content.toLowerCase().includes('/jobdata')) {
      return <JobDetailCard message={item.content} />;
    }
    
    if (!item.is_user_message && item.content.toLowerCase().includes('/resume')) {
      return <ResumeCard message={item.content} />;
    }
    
    if (!item.is_user_message && item.content.toLowerCase().includes('/community')) {
      return <CommunityCard message={item.content} />;
    }
    
    if (!item.is_user_message && item.content.toLowerCase().includes('/jobportals')) {
      return <JobPortalsCard message={item.content} />;
    }
    
    if (!item.is_user_message && item.content.toLowerCase().includes('/course')) {
      return <CourseCard message={item.content} />;
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

  const handleBackPress = () => {
    router.push('/chat');
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleLayout}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              scrollEventThrottle={16}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
            />
            
            {/* Scroll to bottom button - only show when user has scrolled up */}
            {!isNearBottom && !isInitialLoad && (
              <TouchableOpacity 
                style={styles.scrollToBottomButton}
                onPress={handleScrollToBottom}
                activeOpacity={0.8}
              >
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
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
          
          {inputText.trim() ? (
            <TouchableOpacity 
              style={[
                styles.sendButton,
                sending && styles.sendButtonDisabled
              ]}
              onPress={() => handleSendMessage()}
              disabled={sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={handleOpenVoiceRecording}
              activeOpacity={0.7}
            >
              <MaterialIcons name="mic" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Voice Recording Overlay */}
        <VoiceRecordingOverlay
          isOpen={isVoiceOverlayOpen}
          onClose={() => setIsVoiceOverlayOpen(false)}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
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
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#8BA889',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F4F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    color: '#253528',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#8BA889',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#8BA88980',
  },
  voiceButton: {
    backgroundColor: '#8BA889',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commandsContainer: {
    position: 'absolute',
    bottom: 70,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  commandsList: {
    borderRadius: 12,
    padding: 4,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
  },
  commandText: {
    fontWeight: '600',
    color: '#49654E',
    fontSize: 16,
    marginRight: 8,
  },
  commandDescription: {
    color: '#666666',
    fontSize: 14,
    flex: 1,
  },
  jobCardsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  jobResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 12,
    marginLeft: 4,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
  },
  jobCompany: {
    fontSize: 14,
    color: '#49654E',
    marginTop: 2,
  },
  jobCardDetails: {
    marginBottom: 12,
  },
  jobCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  jobLocation: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  jobSalary: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  jobApplyButton: {
    backgroundColor: '#8BA889',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  jobApplyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
    marginBottom: 16,
  },
  modalLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#253528',
  },
  modalCompany: {
    fontSize: 16,
    color: '#49654E',
    marginTop: 4,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#253528',
    marginLeft: 10,
  },
  applyButtonLarge: {
    backgroundColor: '#49654E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  noJobsContainer: {
    padding: 16,
    backgroundColor: '#F0F4F0',
    borderRadius: 12,
    alignItems: 'center',
  },
  noJobsText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default ChatScreen;