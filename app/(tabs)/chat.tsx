import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatHistoryItem, getDetailedChatHistory } from '../api/getchathistory';
import BottomNavbar from '../components/navbar';
import { Feather } from '@expo/vector-icons';

type RootStackParamList = {
  Chat: { id: string; name: string };
  ChatHistory: undefined;
  NewChat: undefined;
};

type ChatHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatHistory'>;

const ChatHistoryScreen = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<ChatHistoryScreenNavigationProp>();

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
    navigation.navigate('Chat', { id: chat.id, name: chat.name });
  };

  const handleNewChat = () => {
    navigation.navigate('NewChat');
  };

  const renderChatItem = ({ item }: { item: ChatHistoryItem }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.chatCardContent}>
        <View style={styles.chatCardHeader}>
          <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
        <View style={styles.chatCardFooter}>
          <Text style={styles.messageCount}>{item.messageCount} messages</Text>
          <Text style={styles.chatDate}>{item.formattedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Feather name="message-square" size={80} color="#49654E" />
      <Text style={styles.emptyStateTitle}>No chats yet</Text>
      <Text style={styles.emptyStateText}>Start a new conversation to begin chatting</Text>
      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
        <Text style={styles.newChatButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatButtonText}>New Chat</Text>
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
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 53, 40, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#253528',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 168, 137, 0.3)',
  },
  chatCardContent: {
    padding: 16,
  },
  chatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#49654E',
    fontWeight: '500',
  },
  chatPreview: {
    fontSize: 14,
    color: '#49654E',
    marginBottom: 12,
  },
  chatCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  messageCount: {
    fontSize: 12,
    color: '#49654E',
    fontWeight: '500',
  },
  chatDate: {
    fontSize: 12,
    color: '#49654E',
  },
  emptyStateContainer: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#253528',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#49654E',
    textAlign: 'center',
    marginBottom: 30,
  },
  newChatButton: {
    backgroundColor: '#8BA889',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatHistoryScreen;