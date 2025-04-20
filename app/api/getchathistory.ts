import { createClient } from '@supabase/supabase-js';
import { format, formatDistanceToNow } from 'date-fns';

// Types
export interface ChatHistoryItem {
  id: string;
  title: string;  // Changed from 'name' to match your table structure
  created_at: string;  // Changed from camelCase to snake_case to match table
  updated_at: string;  // Changed from camelCase to snake_case to match table
  messageCount?: number;
  lastMessage?: string;
  formattedDate?: string;
  timeAgo?: string;
}

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetches all chat histories with title and timestamp information
 * @returns Array of chat history items
 */
export const getChatHistory = async (): Promise<ChatHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const createdDate = new Date(chat.created_at);
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true })
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
 * @returns Array of chat history items with message counts and last message
 */
export const getDetailedChatHistory = async (): Promise<ChatHistoryItem[]> => {
  try {
    // First get basic chat history
    const chatHistory = await getChatHistory();
    
    // For each chat, get message count and last message
    const detailedHistory = await Promise.all(
      chatHistory.map(async (chat) => {
        // Get message count
        const { count, error: countError } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id);
        
        if (countError) throw countError;
        
        // Get last message
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('content, is_user_message')  // Changed from 'role' to 'is_user_message'
          .eq('chat_id', chat.id)
          .order('timestamp', { ascending: false })  // Changed from 'createdAt' to 'timestamp'
          .limit(1);
        
        if (msgError) throw msgError;
        
        // Format last message preview (truncate if needed)
        const lastMessage = messages && messages.length > 0 
          ? `${messages[0].is_user_message ? 'You: ' : 'AI: '}${truncateText(messages[0].content, 50)}`
          : 'No messages yet';
        
        return {
          ...chat,
          messageCount: count || 0,
          lastMessage
        };
      })
    );
    
    return detailedHistory;
  } catch (error) {
    console.error('Error fetching detailed chat history:', error);
    return chatHistory; // Return basic history if detailed fetch fails
  }
};

/**
 * Searches chat history by title
 * @param searchTerm Term to search for in chat titles
 * @returns Filtered array of chat history items
 */
export const searchChatHistory = async (searchTerm: string): Promise<ChatHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        created_at,
        updated_at
      `)
      .ilike('title', `%${searchTerm}%`)  // Changed from 'name' to 'title'
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true })
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
 * @param limit Maximum number of chats to return
 * @returns Array of recent chat history items
 */
export const getRecentChats = async (limit: number = 5): Promise<ChatHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true })
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
 * @param days Number of days to look back
 * @returns Array of chat history items from the specified period
 */
export const getChatsFromPeriod = async (days: number = 7): Promise<ChatHistoryItem[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateIso = startDate.toISOString();
    
    const { data, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        created_at,
        updated_at
      `)
      .gte('created_at', startDateIso)  // Changed from 'createdAt' to 'created_at'
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Format dates and add time ago for each chat
    const formattedData = data.map(chat => {
      const updatedDate = new Date(chat.updated_at);
      
      return {
        ...chat,
        formattedDate: format(updatedDate, 'MMM d, yyyy h:mm a'),
        timeAgo: formatDistanceToNow(updatedDate, { addSuffix: true })
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
 * @returns Object with chats grouped by date
 */
export const getChatHistoryByDate = async (): Promise<Record<string, ChatHistoryItem[]>> => {
  try {
    const chatHistory = await getChatHistory();
    
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