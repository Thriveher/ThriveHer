import { createClient } from '@supabase/supabase-js';
import { format, formatDistanceToNow } from 'date-fns';

// Hardcoded Supabase URL and anon key (for demo project only)
const supabaseUrl = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface ChatHistoryItem {
  id: string;
  title: string;
  emoji: string;  // Added emoji field
  created_at: string;
  updated_at: string;
  messageCount: number;
  lastMessage: string;
  formattedDate: string;
  timeAgo: string;
  createdAt?: string;  // For compatibility with the updated interface
  updatedAt?: string;  // For compatibility with the updated interface
}

/**
 * Fetches all chat histories with title and timestamp information
 * @returns Array of chat history items
 */
export const getChatHistory = async (userId: string): Promise<ChatHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        emoji,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)  // Filter by userId
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const createdDate = new Date(chat.created_at);
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        emoji: chat.emoji || '💬',  // Use default emoji if none is set
        messageCount: 0,
        lastMessage: 'No messages yet',
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true }),
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
};

/**
 * Fetches chat history with additional message details
 * @param userId The ID of the user whose chats to fetch
 * @returns Array of chat history items with message counts and last message
 */
export const getDetailedChatHistory = async (userId: string): Promise<ChatHistoryItem[]> => {
  try {
    // Get all chats for the current user, including the emoji field
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, title, emoji, created_at, updated_at')
      .eq('user_id', userId)  // Filter by userId
      .order('updated_at', { ascending: false });
    
    if (chatsError) throw chatsError;
    if (!chats || chats.length === 0) return [];
    
    // Process each chat to get message counts and last message
    const detailedChats = await Promise.all(chats.map(async (chat) => {
      // Get message count
      const { count: messageCount, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chat.id);
      
      if (countError) throw countError;
      
      // Get last message
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('content, is_user_message, timestamp')
        .eq('chat_id', chat.id)
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (messagesError) throw messagesError;
      
      const lastMessage = messages && messages.length > 0 
        ? messages[0].content 
        : 'No messages yet';
        
      // Format dates
      const updatedAt = new Date(chat.updated_at);
      const formattedDate = format(updatedAt, 'MMM d');
      const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });
      
      return {
        id: chat.id,
        title: chat.title,
        emoji: chat.emoji || '💬',  // Use default emoji if none is set
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        lastMessage: truncateText(lastMessage, 50),
        messageCount: messageCount || 0,
        timeAgo,
        formattedDate,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      };
    }));
    
    return detailedChats;
    
  } catch (error) {
    console.error('Error fetching detailed chat history:', error);
    throw error;
  }
};

/**
 * Searches chat history by title
 * @param userId User ID to filter chats
 * @param searchTerm Term to search for in chat titles
 * @returns Filtered array of chat history items
 */
export const searchChatHistory = async (userId: string, searchTerm: string): Promise<ChatHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        emoji,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .ilike('title', `%${searchTerm}%`)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        emoji: chat.emoji || '💬',
        messageCount: 0,
        lastMessage: '',
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true }),
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error searching chat history:', error);
    return [];
  }
};

/**
 * Fetches recent chats (limited number)
 * @param userId User ID to filter chats
 * @param limit Maximum number of chats to return
 * @returns Array of recent chat history items
 */
export const getRecentChats = async (userId: string, limit: number = 5): Promise<ChatHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        emoji,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        emoji: chat.emoji || '💬',
        messageCount: 0,
        lastMessage: '',
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true }),
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    return [];
  }
};

/**
 * Fetches chats created within a specific time period
 * @param userId User ID to filter chats
 * @param days Number of days to look back
 * @returns Array of chat history items from the specified period
 */
export const getChatsFromPeriod = async (userId: string, days: number = 7): Promise<ChatHistoryItem[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateIso = startDate.toISOString();
    
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        emoji,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .gte('created_at', startDateIso)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        emoji: chat.emoji || '💬',
        messageCount: 0,
        lastMessage: '',
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true }),
        createdAt: chat.created_at,
        updatedAt: chat.updated_at
      };
    });
    
    return formattedData || [];
  } catch (error) {
    console.error(`Error fetching chats from last ${days} days:`, error);
    return [];
  }
};

/**
 * Groups chat history by date
 * @param userId User ID to filter chats
 * @returns Object with chats grouped by date
 */
export const getChatHistoryByDate = async (userId: string): Promise<Record<string, ChatHistoryItem[]>> => {
  try {
    const chatHistory = await getChatHistory(userId);
    
    // Group chats by date
    const groupedChats = chatHistory.reduce((groups, chat) => {
      const date = new Date(chat.updated_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(chat);
      return groups;
    }, {} as Record<string, ChatHistoryItem[]>);
    
    return groupedChats;
  } catch (error) {
    console.error('Error grouping chat history by date:', error);
    return {};
  }
};

/**
 * Helper function to truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};