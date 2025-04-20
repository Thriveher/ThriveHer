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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import MessageBubble from '../components/chatbubble';
import { fetchChatMessages, sendMessage } from '../api/chatapi';
import { processWithGroq } from '../api/groqapi';
import { StatusBar } from 'expo-status-bar';

// Types
export interface Message {
  id: string;
  content: string;
  is_user_message: boolean;
  timestamp: string;
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
  const flatListRef = useRef<FlatList>(null);

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
    
    // Optimistically add user message to the UI
    const tempUserMessageId = `temp-${Date.now()}`;
    const newUserMessage: Message = {
      id: tempUserMessageId,
      content: userMessage,
      is_user_message: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    scrollToBottom();
    
    // Show typing indicator
    setSending(true);
    
    try {
      // Process with Groq API
      const groqResponse = await processWithGroq({
        message: userMessage,
        chatId,
        chatName: decodeURIComponent(chatName),
        context,
      });
      
      // Add bot response to messages
      const { botResponse, updatedContext } = groqResponse;
      
      // Save both messages to the database
      await sendMessage(chatId, userMessage, botResponse, updatedContext);
      
      // Update messages with the actual response
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

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble 
      message={item.content}
      isUser={item.is_user_message}
      timestamp={new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    />
  );

  const handleBackPress = () => {
    router.back();
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

        <View style={styles.inputContainer}>
          <TextInput
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
});

export default ChatScreen;