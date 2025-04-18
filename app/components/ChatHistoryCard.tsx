 // src/components/chat/ChatHistoryCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ChatHistoryCardProps {
  title: string;
  lastMessage: string;
  date: Date;
  onPress: () => void;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const ChatHistoryCard: React.FC<ChatHistoryCardProps> = ({
  title,
  lastMessage,
  date,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Feather name="message-circle" size={24} color="#49654E" />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title || "Career Discussion"}
          </Text>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {lastMessage || "Start a conversation with your career guide assistant"}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="#49654E" style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#253528',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(137, 168, 137, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#49654E',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#49654E',
    opacity: 0.8,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default ChatHistoryCard;