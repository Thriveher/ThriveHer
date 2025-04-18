// app/chat/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ChatMessage from '../components/ChatMessage';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const isNewChat = id === 'new';
  const initialChatId = isNewChat ? null : String(id);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatTitle, setChatTitle] = useState('Career Guide');
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (chatId) {
      fetchChatMessages(chatId);
      fetchChatDetails(chatId);
    } else if (isNewChat) {
      // Show welcome message for new chats
      const welcomeMessage: Message = {
        id: 'welcome',
        content: "Hi there! I'm your career guide assistant. How can I help you with your career today?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [chatId, isNewChat]);

  const fetchChatDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('title')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setChatTitle(data.title);
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
    }
  };

  const fetchChatMessages = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', id)
        .order('timestamp', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async (firstMessage: string): Promise<string> => {
    try {
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');
      
      // Create a new chat session
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'New Career Discussion',
          last_message: firstMessage,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    try {
      setLoading(true);
      let currentChatId = chatId;
      
      // If this is a new chat, create it first
      if (!currentChatId) {
        currentChatId = await createNewChat(inputText);
        setChatId(currentChatId);
      }
      
      // Save user message to Supabase
      await supabase
        .from('chat_messages')
        .insert({
          chat_id: currentChatId,
          content: inputText,
          sender: 'user',
        });
      
      // Update messages locally
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      // Simulate bot response (in a real app, you'd call your AI service here)
      setTimeout(async () => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: getBotResponse(inputText),
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };
        
        // Save bot response to Supabase
        await supabase
          .from('chat_messages')
          .insert({
            chat_id: currentChatId,
            content: botResponse.content,
            sender: 'bot',
          });
        
        // Update chat session with last message
        await supabase
          .from('chat_sessions')
          .update({ 
            last_message: inputText,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentChatId);
        
        setMessages(prev => [...prev, botResponse]);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  // Temporary function to generate responses (replace with actual AI integration)
  const getBotResponse = (message: string): string => {
    const responses = [
      "That's a great career question. Have you considered exploring opportunities in that field?",
      "Based on your interests, I would recommend looking into roles that align with your strengths.",
      "Many successful professionals in that industry started exactly where you are now.",
      "I understand your concerns. Career transitions can be challenging but also rewarding.",
      "Have you tried networking with professionals in that field? It could provide valuable insights.",
      "Your experience would be valuable in several related fields. Let's explore your options.",
      "That's a common challenge many women face in their careers. Here's what has worked for others.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleBackPress = () => {
    router.back();
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#253528" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chatTitle}</Text>
        <View style={styles.headerRight} />
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#49654E" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatMessage message={item} />}
          contentContainerStyle={styles.messagesList}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#49654E"
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              !inputText.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#8BA889',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 53, 40, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32, // For layout balance with back button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 53, 40, 0.1)',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(137, 168, 137, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#253528',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(73, 101, 78, 0.5)',
  },
});