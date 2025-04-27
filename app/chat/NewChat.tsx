import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { createNewChatWithMessage } from '../api/chatapi';
import { processWithGroq } from '../api/groqapi';
import { supabase } from '../../lib/supabase';

// Hardcoded Supabase configuration for demo purposes
// NOTE: In a production app, these should be stored securely, not hardcoded
export const SUPABASE_URL = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';

type RootStackParamList = {
  Chat: { id: string; name: string };
  ChatHistory: undefined;
  NewChat: undefined;
};

type NewChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewChat'>;

const NewChatScreen = () => {
  const [chatTitle, setChatTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const navigation = useNavigation<NewChatScreenNavigationProp>();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message to start the chat.');
      return;
    }

    try {
      setSending(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Authentication Error', 'Please log in to start a new chat.');
        return;
      }

      // Process with GROQ
      const title = chatTitle.trim() || `Chat ${new Date().toLocaleDateString()}`;
      const userMessage = message.trim();
      
      const groqResponse = await processWithGroq({
        userId: user.id,
        message: userMessage,
        chatId: 'new', // Placeholder ID since we don't have one yet
        chatName: title,
        context: '', // Empty context for new chat
      });
      
      const { botResponse, updatedContext } = groqResponse;
      
      // Create new chat with first message pair
      const newChatId = await createNewChatWithMessage(
        user.id,
        title,
        userMessage,
        botResponse,
        updatedContext
      );
      
      // Navigate to the new chat
      navigation.replace('Chat', { id: newChatId, name: title });
      
    } catch (error) {
      console.error('Failed to create new chat:', error);
      Alert.alert(
        'Error',
        'Something went wrong when creating the new chat. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#253528" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Conversation</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Conversation Title (Optional)</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Give your conversation a name"
              placeholderTextColor="#49654E80"
              value={chatTitle}
              onChangeText={setChatTitle}
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor="#49654E80"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!message.trim() || sending) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Start Conversation</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
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
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#253528',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E7E0',
    color: '#253528',
    fontSize: 16,
  },
  messageInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E7E0',
    color: '#253528',
    fontSize: 16,
    minHeight: 150,
  },
  submitButton: {
    backgroundColor: '#8BA889',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#8BA88980',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
});

export default NewChatScreen;