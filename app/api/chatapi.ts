import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase connection
const supabaseUrl = "https://ibwjjwzomoyhkxugmmmw.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac";

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

import { Message } from '../chat/[id]';

interface ChatData {
  messages: Message[];
  context: string | null;
}

/**
 * Fetches all messages for a specific chat
 * @param chatId - The ID of the chat to fetch messages for
 * @returns Promise with chat messages and context
 */
export const fetchChatMessages = async (chatId: string): Promise<ChatData> => {
  try {
    // Fetch messages sorted by timestamp
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });
    
    if (messagesError) throw messagesError;
    
    // Fetch associated context
    const { data: contextData, error: contextError } = await supabase
      .from('chat_contexts')
      .select('context')
      .eq('chat_id', chatId)
      .single();
    
    // PGRST116 = "no rows returned" - this is acceptable
    if (contextError && contextError.code !== 'PGRST116') {
      throw contextError;
    }
    
    return {
      messages: messagesData,
      context: contextData?.context || null,
    };
  } catch (error) {
    console.error('Error in fetchChatMessages:', error);
    throw error;
  }
};

/**
 * Sends a message pair (user message + bot response) to the database
 * @param chatId - The chat ID
 * @param userMessage - User's message text
 * @param botResponse - Bot's response text (can include emojis 😀🤖💬)
 * @param context - Current conversation context
 */
export const sendMessage = async (
  chatId: string,
  userMessage: string,
  botResponse: string,
  context: string
): Promise<void> => {
  try {
    // Add message pair using stored procedure
    const { error } = await supabase.rpc('add_message_pair', {
      p_bot_response: botResponse,
      p_chat_id: chatId,
      p_user_message: userMessage
    });
    
    if (error) throw error;
    
    // Update conversation context with timestamp
    const { error: contextError } = await supabase
      .from('chat_contexts')
      .upsert(
        { 
          chat_id: chatId, 
          context: context,
          timestamp: new Date().toISOString()
        },
        { onConflict: 'chat_id' }
      );
    
    if (contextError) throw contextError;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Creates a new chat with initial message and response
 * @param userId - User's ID
 * @param title - Chat title
 * @param userMessage - Initial user message
 * @param botResponse - Initial bot response (include emojis like 👋 🤖 ✨)
 * @param context - Initial context
 * @param emoji - Chat emoji identifier
 * @returns Promise with new chat ID
 */
export const createNewChatWithMessage = async (
  userId: string,
  title: string,
  userMessage: string,
  botResponse: string,
  context: string,
  emoji: string = '💬'  // Default chat emoji
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('create_chat_with_messages', {
      p_user_id: userId,
      p_title: title,
      p_user_message: userMessage,
      p_bot_response: botResponse,
      p_context: context,
      p_emoji: emoji
    });
    
    if (error) {
      console.error('Failed to create new chat:', error);
      throw error;
    }
    
    return data; // Returns the new chat_id
  } catch (error) {
    console.error('Error in createNewChatWithMessage:', error);
    throw error;
  }
};