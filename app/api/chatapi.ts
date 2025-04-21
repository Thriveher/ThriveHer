import { supabase } from '../../lib/supabase';
import { Message } from '../chat/[id]';

interface ChatData {
  messages: Message[];
  context: string | null;
}

export const fetchChatMessages = async (chatId: string): Promise<ChatData> => {
  try {
    // Fetch messages for the chat
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true });
    
    if (messagesError) throw messagesError;
    
    // Fetch context for the chat
    const { data: contextData, error: contextError } = await supabase
      .from('chat_contexts')
      .select('context')
      .eq('chat_id', chatId)
      .single();
    
    if (contextError && contextError.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" which is fine
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

export const sendMessage = async (
  chatId: string,
  userMessage: string,
  botResponse: string,
  context: string
): Promise<void> => {
  try {
    // Call the stored procedure to add message pair with corrected parameter order
    const { error } = await supabase.rpc('add_message_pair', {
      p_bot_response: botResponse,
      p_chat_id: chatId,
      p_user_message: userMessage
    });
    
    if (error) throw error;
    
    // Update the context
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

export const createNewChatWithMessage = async (
  userId: string,
  title: string,
  userMessage: string,
  botResponse: string,
  context: string,
  emoji: string = '💬'  // Added emoji parameter with default value
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('create_chat_with_messages', {
      p_user_id: userId,
      p_title: title,
      p_user_message: userMessage,
      p_bot_response: botResponse,
      p_context: context,
      p_emoji: emoji  // Pass emoji to the stored procedure
    });
    
    if (error) {
      console.error('Failed to create new chat:', error);
      throw error;
    }
    
    return data; // This should return the new chat_id
  } catch (error) {
    console.error('Error in createNewChatWithMessage:', error);
    throw error;
  }
};