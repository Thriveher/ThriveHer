// app/(tabs)/chat.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ChatHistoryCard from '../components/ChatHistoryCard';
 
interface ChatHistory {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  updated_at: string;
}

export default function ChatScreen() {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      
      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch chat history from Supabase
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setChatHistory(data);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    // Navigate to new chat using expo-router
    router.push('/chat/new');
  };

  const handleChatSelect = (chatId: string) => {
    // Navigate to specific chat using expo-router
    router.push(`/chat/${chatId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#8BA889" barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Conversations</Text>
        <TouchableOpacity 
          style={styles.newChatButton} 
          onPress={handleNewChat}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>
      </View>
      
      {chatHistory.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={60} color="#49654E" />
          <Text style={styles.emptyStateTitle}>No conversations yet</Text>
          <Text style={styles.emptyStateText}>
            Start your first chat with your career guide assistant
          </Text>
          <TouchableOpacity 
            style={styles.startChatButton} 
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Text style={styles.startChatText}>Start a Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chatHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatHistoryCard
              title={item.title}
              lastMessage={item.last_message}
              date={new Date(item.updated_at)}
              onPress={() => handleChatSelect(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BA889',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#8BA889',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#253528',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#49654E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  newChatText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for the bottom navbar
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#253528',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#253528',
    textAlign: 'center',
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: '#253528',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  startChatText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});