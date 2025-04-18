// src/screens/ChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NavBar from '../components/navbar';
import ChatBubble from '../components/chatbubble';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, title, isNewChat } = route.params || {};
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // If it's an existing chat, load previous messages
    if (chatId && !isNewChat) {
      // This would typically be a fetch from your API or local storage
      // For now, we'll use dummy data
      const dummyMessages = [
        { id: '1', text: 'Hello! How can I help with your career today?', sender: 'bot', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', text: 'I need advice on my resume.', sender: 'user', timestamp: new Date(Date.now() - 3500000).toISOString() },
        { id: '3', text: 'I\'d be happy to help with your resume! Could you share what specific aspect you\'d like advice on?', sender: 'bot', timestamp: new Date(Date.now() - 3400000).toISOString() },
      ];
      setMessages(dummyMessages);
    } else {
      // If it's a new chat, start with a welcome message
      const welcomeMessage = { 
        id: Date.now().toString(), 
        text: 'Welcome to CareerGuide AI! How can I assist you with your career journey today?', 
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [chatId, isNewChat]);

  const sendMessage = () => {
    if (message.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setMessage('');
    setIsTyping(true);
    
    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponses = [
        "I understand your career concerns. Let's explore some options that align with your skills and interests.",
        "That's a great question about the job market. Based on recent trends, I'd suggest focusing on these areas...",
        "When preparing for interviews, remember to research the company thoroughly and prepare specific examples of your achievements.",
        "For your resume, I recommend highlighting your accomplishments rather than just listing duties. Let me show you how...",
        "Work-life balance is important. Here are some strategies that have helped other women in similar career stages."
      ];
      
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      
      const botMessage = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#253528" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Career Guide AI'}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#253528" />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item.text}
              isUser={item.sender === 'user'}
              timestamp={new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
          )}
          contentContainerStyle={styles.messageList}
        />
        
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>Career Guide is typing...</Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor="#49654E"
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={message.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={message.trim() === '' ? '#8BA889' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <NavBar navigation={navigation} currentScreen="chat" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 53, 40, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#253528',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F5F8F6',
  },
  messageList: {
    padding: 16,
    paddingBottom: 16,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(139, 168, 137, 0.1)',
  },
  typingText: {
    color: '#49654E',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 53, 40, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F8F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    color: '#253528',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#253528',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatScreen;