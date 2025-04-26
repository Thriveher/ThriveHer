import { createClient } from '@supabase/supabase-js';

// Types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface Chat {
  id?: string;
  name: string;
  messages: Message[];
  createdAt?: string;
  updatedAt?: string;
}

// Initialize Supabase client using Expo environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Groq API configuration
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.EXPO_PUBLIC_GROQ_MODEL || 'llama3-8b-8192';

/**
 * Creates a new chat in the database
 * @param chatName Name of the chat
 * @returns The newly created chat object
 */
export const createChat = async (chatName: string): Promise<Chat | null> => {
  try {
    const newChat: Chat = {
      name: chatName,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('chats')
      .insert(newChat)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating chat:', error);
    return null;
  }
};

/**
 * Fetches all chat sessions for the current user
 * @returns Array of chat objects
 */
export const getAllChats = async (): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('updatedAt', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
};

/**
 * Fetches a specific chat session by ID
 * @param chatId ID of the chat to fetch
 * @returns The requested chat object with messages
 */
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*, messages(*)')
      .eq('id', chatId)
      .single();
    
    if (error) throw error;
    
    // Format the messages array
    const chat: Chat = {
      ...data,
      messages: data.messages || [],
    };
    
    // Sort messages by timestamp
    chat.messages.sort((a, b) => 
      new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
    );
    
    return chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
};

/**
 * Adds a new message to an existing chat and generates an AI response
 * @param chatId ID of the chat
 * @param message User's message content
 * @returns Updated chat with AI response
 */
export const sendMessage = async (chatId: string, message: string): Promise<Chat | null> => {
  try {
    // First get the current chat to have the message history
    const currentChat = await getChatById(chatId);
    if (!currentChat) throw new Error('Chat not found');
    
    // Add user message
    const timestamp = new Date().toISOString();
    const userMessage: Message = {
      role: 'user',
      content: message,
      createdAt: timestamp,
    };
    
    // Save user message to database
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      });
    
    if (msgError) throw msgError;
    
    // Update chat's updated timestamp
    const { error: updateError } = await supabase
      .from('chats')
      .update({ updatedAt: timestamp })
      .eq('id', chatId);
    
    if (updateError) throw updateError;
    
    // Get AI response
    const aiResponse = await getGroqResponse([...currentChat.messages, userMessage]);
    
    // Save AI response
    if (aiResponse) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        createdAt: new Date().toISOString(),
      };
      
      await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt,
        });
      
      // Return updated chat with both messages
      return getChatById(chatId);
    }
    
    return null;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

/**
 * Makes an API call to Groq to generate a response based on message history
 * @param messages Array of message objects representing the conversation
 * @returns AI generated response text
 */
const getGroqResponse = async (messages: Message[]): Promise<string> => {
  try {
    // Format messages for Groq API
    const groqMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting Groq response:', error);
    return "Sorry, I couldn't generate a response. Please try again.";
  }
};

/**
 * Deletes a chat and all its messages
 * @param chatId ID of the chat to delete
 * @returns Boolean indicating success
 */
export const deleteChat = async (chatId: string): Promise<boolean> => {
  try {
    // Delete all messages first (cascade delete should handle this on DB level too)
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);
      
    if (msgError) throw msgError;
    
    // Delete the chat
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    return false;
  }
};

/**
 * Updates a chat's name
 * @param chatId ID of the chat
 * @param newName New name for the chat
 * @returns Updated chat object
 */
export const updateChatName = async (chatId: string, newName: string): Promise<Chat | null> => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({ 
        name: newName,
        updatedAt: new Date().toISOString()
      })
      .eq('id', chatId);
      
    if (error) throw error;
    
    return getChatById(chatId);
  } catch (error) {
    console.error('Error updating chat name:', error);
    return null;
  }
};

/**
 * Clears chat history but keeps the chat
 * @param chatId ID of the chat
 * @returns Updated empty chat
 */
export const clearChatHistory = async (chatId: string): Promise<Chat | null> => {
  try {
    // Delete all messages
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);
      
    if (msgError) throw msgError;
    
    // Update the chat's timestamp
    const { error } = await supabase
      .from('chats')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', chatId);
      
    if (error) throw error;
    
    // Get the updated chat
    const updatedChat = await getChatById(chatId);
    if (!updatedChat) throw new Error('Failed to fetch updated chat');
    
    // Return the proper chat object with empty messages
    return {
      id: updatedChat.id,
      name: updatedChat.name,  // Ensure name is always defined
      messages: [],
      createdAt: updatedChat.createdAt,
      updatedAt: updatedChat.updatedAt
    };
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return null;
  }
};

/**
 * Search for chats by name
 * @param searchTerm Term to search for in chat names
 * @returns Array of matching chats
 */
export const searchChats = async (searchTerm: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('updatedAt', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching chats:', error);
    return [];
  }
};