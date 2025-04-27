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

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';
const FALLBACK_USER_ID = 'demo-user-123'; // Fallback user ID for the demo

// Types
export interface Message {
  id: string;
  content: string;
  is_user_message: boolean;
  timestamp: string;
  isJobSearch?: boolean; // Flag to identify job search messages
  jobData?: any[]; // Note: this can't be null, only undefined or an array
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
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Get Google user ID from session
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Try to get Google user ID from AsyncStorage
        const googleUserInfo = await AsyncStorage.getItem('googleUserInfo');
        if (googleUserInfo) {
          const userInfo = JSON.parse(googleUserInfo);
          if (userInfo.id) {
            setUserId(userInfo.id);
          }
        }
      } catch (error) {
        console.log('Error retrieving Google user info:', error);
        // Fall back to demo user ID
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
    // Show command suggestions when user types '/'
    if (inputText === '/') {
      setShowCommands(true);
    } else if (inputText.length > 0 && !inputText.startsWith('/')) {
      setShowCommands(false);
    }
  }, [inputText]);

  const loadChatMessages = async () => {
    try {
      setLoading(true);
      // Pass only the chatId to fetchChatMessages (fix for error #1)
      const { messages: chatMessages, context: chatContext } = await fetchChatMessages(chatId);
      
      // Process messages to flag job search commands
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
      Alert.alert(
        'Error',
        'Failed to load messages. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatId) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setShowCommands(false);
    
    // Check if this is a job search command
    const isJobSearch = userMessage.toLowerCase().startsWith('/job ') || userMessage.toLowerCase() === '/job';
    
    // Optimistically add user message to the UI
    const tempUserMessageId = `temp-${Date.now()}`;
    const newUserMessage: Message = {
      id: tempUserMessageId,
      content: userMessage,
      is_user_message: true,
      timestamp: new Date().toISOString(),
      isJobSearch: isJobSearch
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    scrollToBottom();
    
    // Show typing indicator
    setSending(true);
    
    try {
      // Process with Groq API using correct parameters (fix for error #2)
      const groqResponse = await processWithGroq({
        message: userMessage,
        chatId,
        chatName: decodeURIComponent(chatName),
        context,
        userId // Using the Google user ID if available
      });
      
      // Add bot response to messages
      const { botResponse, updatedContext } = groqResponse;
      
      // Save both messages to the database with correct parameters (fix for error #3)
      await sendMessage(
        chatId, 
        userMessage, 
        botResponse, 
        updatedContext
      );
      
      // Check if this is a job search response and parse job data
      let jobData: any[] | undefined = undefined;
      if (isJobSearch) {
        try {
          // Extract job data from the response if it's a job search
          const jobMatches = botResponse.match(/\d+\.\s(.*?)\sat\s(.*?)\n\s*Location:\s(.*?)\n\s*Salary:\s(.*?)\n/g);
          
          if (jobMatches && jobMatches.length > 0) {
            jobData = jobMatches.map(match => {
              const titleMatch = match.match(/\d+\.\s(.*?)\sat\s(.*?)\n/);
              const locationMatch = match.match(/Location:\s(.*?)\n/);
              const salaryMatch = match.match(/Salary:\s(.*?)\n/);
              const linkMatch = match.match(/Apply:\s(.*?)(\n|$)/);
              
              // Convert $ to ₹ in salary string
              const rawSalary = salaryMatch ? salaryMatch[1] : 'Not specified';
              const salary = rawSalary.replace(/\$/g, '₹');
              
              return {
                title: titleMatch ? titleMatch[1] : 'Unknown position',
                company: titleMatch ? titleMatch[2] : 'Unknown company',
                location: locationMatch ? locationMatch[1] : 'Unknown location',
                salary: salary,
                applyLink: linkMatch ? linkMatch[1] : '#',
                id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                logoUrl: `https://logo.clearbit.com/${titleMatch ? titleMatch[2].toLowerCase().replace(/\s+/g, '') : 'company'}.com`, // Generate logo URL
              };
            });
          }
        } catch (parseError) {
          console.error("Error parsing job data:", parseError);
        }
      }
      
      // Update messages with the actual response
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
      
      // Update context
      setContext(updatedContext);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.'
      );
      // Remove the temporary user message if there was an error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempUserMessageId)
      );
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleCommandSelect = (command: string) => {
    setInputText(command + ' ');
    setShowCommands(false);
    // Focus the input after selecting a command
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
    // In a real app, you'd fetch the job details here
    // For now, we'll simulate it with the job data we already have
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
    if (url && url !== '#') {
      Linking.openURL(url).catch(err => 
        Alert.alert('Error', 'Could not open the application link')
      );
    }
  };

  const renderCompanyLogo = (logoUrl: string) => {
    return (
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: logoUrl }}
          style={styles.companyLogo}
          defaultSource={require('../../assets/images/placeholder-logo.jpeg')} // Add a placeholder image to your assets
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
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.jobCompany} numberOfLines={1}>{job.company}</Text>
        </View>
      </View>
      <View style={styles.jobCardDetails}>
        <View style={styles.jobCardRow}>
          <Feather name="map-pin" size={14} color="#49654E" />
          <Text style={styles.jobLocation} numberOfLines={1}>{job.location}</Text>
        </View>
        <View style={styles.jobCardRow}>
          <Feather name="dollar-sign" size={14} color="#49654E" />
          <Text style={styles.jobSalary} numberOfLines={1}>{job.salary}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.jobApplyButton}
        onPress={() => openJobApplication(job.applyLink)}
      >
        <Text style={styles.jobApplyText}>Apply</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderJobCards = (jobData: any[]) => (
    <View style={styles.jobCardsContainer}>
      <Text style={styles.jobResultsTitle}>Job Search Results</Text>
      {jobData.map(job => renderJobCard(job))}
    </View>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    // For job search messages, only show user message bubble without assistant response
    if (item.isJobSearch && !item.is_user_message) {
      // This is a bot response to a job search command, so render only job cards
      return item.jobData && item.jobData.length > 0 ? (
        renderJobCards(item.jobData)
      ) : (
        <View style={styles.noJobsContainer}>
          <Text style={styles.noJobsText}>No job results found</Text>
        </View>
      );
    }
    
    // For all other messages, render normal message bubbles
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
      style={styles.commandItem} 
      onPress={() => handleCommandSelect(item.command)}
    >
      <Text style={styles.commandText}>{item.command}</Text>
      <Text style={styles.commandDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const handleBackPress = () => {
    // Changed to navigate to /chat instead of using router.back()
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
            multiline
            maxLength={2000}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
                  if (selectedJobDetails?.applyLink) {
                    openJobApplication(selectedJobDetails.applyLink);
                  }
                }}
              >
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
  messageList: {
    padding: 16,
    paddingBottom: 8,
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
  commandsContainer: {
    position: 'absolute',
    bottom: 70, // Position above the input box
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