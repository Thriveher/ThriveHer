import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChatHistoryItem, getDetailedChatHistory } from '../api/getchathistory';
import BottomNavbar from '../components/navbar';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { createNewChatWithMessage } from '../api/chatapi';
import { Platform } from 'react-native';

const ChatHistoryScreen = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingChat, setCreatingChat] = useState<boolean>(false);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const history = await getDetailedChatHistory();
      setChatHistory(history);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (chat: ChatHistoryItem) => {
    router.push(`/chat/${chat.id}?name=${encodeURIComponent(chat.name)}`);
  };

  const handleNewChat = async () => {
    try {
      setCreatingChat(true);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('User not authenticated');
      
      const userId = session.user.id;
      const title = 'New Conversation';
      const initialMessage = 'Hello!';
      const initialResponse = 'Hi there! How can I help you today?';
      const initialContext = 'New conversation started.';
      
      // Create the new chat
      const chatId = await createNewChatWithMessage(
        userId,
        title,
        initialMessage,
        initialResponse,
        initialContext
      );
      
      // Navigate to the new chat
      router.push(`/chat/${chatId}?name=${encodeURIComponent(title)}`);
      
    } catch (error) {
      console.error('Failed to create new chat:', error);
      
      // Special handling for web platform auth issues
      if (Platform.OS === 'web' && 
          error instanceof Error && 
          error.message.includes('getValueWithKeyAsync is not a function')) {
        Alert.alert(
          'Authentication Error',
          'SecureStore is not supported in web environment. Please use the mobile app or implement a web-specific auth solution.'
        );
      } else if (error instanceof Error && error.message === 'User not authenticated') {
        Alert.alert(
          'Authentication Required',
          'Please log in to create a new chat.',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/login') 
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to create a new chat. Please try again later.'
        );
      }
    } finally {
      setCreatingChat(false);
    }
  };

  const renderChatItem = ({ item }: { item: ChatHistoryItem }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => handleChatPress(item)}
      android_ripple={{ color: 'rgba(73, 101, 78, 0.1)' }}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
        <View style={styles.chipContainer}>
          <View style={styles.messageCountChip}>
            <Text style={styles.chipText}>{item.messageCount}</Text>
          </View>
          <Text style={styles.chatDate}>{item.formattedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name="chat-bubble-outline" size={64} color="#8BA889" style={styles.emptyIcon} />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateText}>Start chatting to create your first conversation</Text>
      <TouchableOpacity 
        style={styles.emptyNewChatButton} 
        onPress={handleNewChat}
        disabled={creatingChat}
        android_ripple={{ color: 'rgba(139, 168, 137, 0.2)', borderless: false }}
      >
        {creatingChat ? (
          <ActivityIndicator size="small" color="#8BA889" />
        ) : (
          <Text style={styles.newChatButtonText}>Start New Chat</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
        <TouchableOpacity 
          style={styles.fabButton} 
          onPress={handleNewChat}
          disabled={creatingChat}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: true }}
        >
          {creatingChat ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#49654E" />
        </View>
      ) : (
        <FlatList
          data={chatHistory}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#253528',
    letterSpacing: 0.25,
  },
  fabButton: {
    backgroundColor: '#8BA889',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  listContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8BA889',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#253528',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#49654E',
    marginLeft: 8,
  },
  chatPreview: {
    fontSize: 14,
    color: '#49654E',
    opacity: 0.8,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageCountChip: {
    backgroundColor: 'rgba(139, 168, 137, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    color: '#49654E',
    fontWeight: '500',
  },
  chatDate: {
    fontSize: 12,
    color: '#49654E',
    opacity: 0.7,
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#253528',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#49654E',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  emptyNewChatButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#8BA889',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8BA889',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatHistoryScreen;