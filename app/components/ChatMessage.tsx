// src/components/chat/ChatMessage.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageProps {
  message: {
    id: string;
    content: string;
    sender: 'user' | 'bot';
    timestamp: string;
  };
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage: React.FC<MessageProps> = ({ message }) => {
  const isUserMessage = message.sender === 'user';
  
  return (
    <View style={[
      styles.messageContainer,
      isUserMessage ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        isUserMessage ? styles.userMessageBubble : styles.botMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUserMessage ? styles.userMessageText : styles.botMessageText
        ]}>
          {message.content}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userMessageBubble: {
    backgroundColor: '#49654E',
  },
  botMessageBubble: {
    backgroundColor: 'rgba(137, 168, 137, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#253528',
  },
  timestamp: {
    fontSize: 12,
    color: '#49654E',
    marginTop: 4,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
});

export default ChatMessage;