// src/screens/ChatHistoryScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatCard from '../components/chatcard';
import NavBar from '../components/navbar';

const ChatHistoryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');
  
  const chatHistory = [
    { 
      id: '1', 
      title: 'Resume Review', 
      lastMessage: 'Here are some improvements for your resume...', 
      timestamp: '2 hours ago',
      category: 'professional' 
    },
    { 
      id: '2', 
      title: 'Interview Preparation', 
      lastMessage: 'Let\'s practice some common interview questions...', 
      timestamp: '1 day ago',
      category: 'professional' 
    },
    { 
      id: '3', 
      title: 'Work-Life Balance', 
      lastMessage: 'These strategies might help you balance your career and personal life...', 
      timestamp: '3 days ago',
      category: 'personal' 
    },
    { 
      id: '4', 
      title: 'Salary Negotiation', 
      lastMessage: 'When negotiating your salary, remember to highlight your achievements...', 
      timestamp: '1 week ago',
      category: 'professional' 
    },
  ];

  const filteredChats = activeTab === 'all' 
    ? chatHistory 
    : chatHistory.filter(chat => chat.category === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => navigation.navigate('ChatScreen', { isNewChat: true })}
        >
          <Text style={styles.newChatText}>New Chat</Text>
          <Ionicons name="add-circle-outline" size={20} color="#253528" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'professional' && styles.activeTab]}
          onPress={() => setActiveTab('professional')}
        >
          <Text style={[styles.tabText, activeTab === 'professional' && styles.activeTabText]}>Professional</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>Personal</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.chatList}>
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => (
            <ChatCard 
              key={chat.id}
              title={chat.title}
              lastMessage={chat.lastMessage}
              timestamp={chat.timestamp}
              onPress={() => navigation.navigate('ChatScreen', { chatId: chat.id, title: chat.title })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No chats found</Text>
            <TouchableOpacity 
              style={styles.startChatButton}
              onPress={() => navigation.navigate('ChatScreen', { isNewChat: true })}
            >
              <Text style={styles.startChatText}>Start a Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      <NavBar navigation={navigation} currentScreen="history" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BA889',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 53, 40, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#253528',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#49654E',
  },
  newChatText: {
    color: '#253528',
    marginRight: 4,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#49654E',
  },
  tabText: {
    color: '#253528',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  chatList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#49654E',
    marginBottom: 16,
  },
  startChatButton: {
    backgroundColor: '#253528',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  startChatText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ChatHistoryScreen;