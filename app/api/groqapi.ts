import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';

interface GroqRequest {
  message: string;
  chatId?: string;
  userId: string;
  chatName?: string;
  context?: string;
  emoji?: string;
}

interface GroqResponse {
  botResponse: string;
  updatedContext: string;
  chatId: string;
  chatName: string;
  emoji: string;
  timestamp: string;
}

interface JobSearchParams {
  query: string;
  page?: number;
  numPages?: number;
  country?: string;
  datePosted?: string;
  language?: string;
}

// Initialize Supabase client with hardcoded URL and key
const supabaseUrl = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Groq API key
const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || Constants.expoConfig?.extra?.groqApiKey || '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';

// Initialize Groq client
const groqClient = new Groq({ 
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true
});

// Base API configuration for job search
const API_BASE_URL = 'https://jsearch.p.rapidapi.com';
const API_KEY = '3fe4222f05mshee7786231fb68c8p1cae9bjsnaeb6f8469718';
const API_HOST = 'jsearch.p.rapidapi.com';

const getRequestOptions = (): RequestInit => {
  return {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };
};

const buildUrl = (endpoint: string, params: Record<string, string | number | undefined>): string => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
};

const searchJobs = async (params: JobSearchParams) => {
  try {
    const url = buildUrl('/search', {
      query: params.query,
      page: params.page || 1,
      num_pages: params.numPages || 1,
      country: params.country || 'in',
      date_posted: params.datePosted || 'all',
      language: params.language || 'en'
    });
    
    const options = getRequestOptions();
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in searchJobs:', error);
    throw error;
  }
};

export const processWithGroq = async (request: GroqRequest): Promise<GroqResponse> => {
  try {
    const { message, userId } = request;
    let { chatId, chatName, context, emoji } = request;
    const timestamp = new Date().toISOString();
    let generatedChatId = chatId || uuidv4();
    
    // Initialize with default values
    let updatedContext = context || "";
    let updatedChatName = chatName || "Conversation";
    let updatedEmoji = emoji || "💬";
    let botResponse = "";
    
    // Check if message contains job search intent
    const jobSearchRegex = /(?:find|search|looking for|job|work|career|position|employment|opening|vacancy|opportunities|hiring) (?:for|as|in) ([\w\s]+?)(?:\s+in\s+([a-zA-Z\s]+))?$/i;
    const jobMatch = message.match(jobSearchRegex);
    
    if (message.toLowerCase().startsWith('/job ') || message.toLowerCase() === '/job' || jobMatch) {
      // Extract job title and location
      let jobTitle, location;
      
      if (message.toLowerCase().startsWith('/job ')) {
        const query = message.replace(/\/job\s+/i, '').trim();
        const parts = query.split(/\s+in\s+/i);
        jobTitle = parts[0].trim();
        location = parts.length > 1 ? parts[1].trim() : undefined;
      } else if (jobMatch) {
        jobTitle = jobMatch[1].trim();
        location = jobMatch[2] ? jobMatch[2].trim() : undefined;
      } else {
        jobTitle = "";
        location = undefined;
      }
      
      // Construct query
      const query = location ? `${jobTitle} in ${location}` : jobTitle;
      
      // Search for jobs
      try {
        const jobResults = await searchJobs({
          query: query,
          numPages: 1,
          country: 'in',
          datePosted: 'all',
          language: 'en'
        });
        
        if (!jobResults.data || jobResults.data.length === 0) {
          botResponse = `I couldn't find any jobs matching "${query}". Try modifying your search terms.`;
        } else {
          // Format response to directly show in chat
          botResponse = `Here are some job opportunities I found for ${jobTitle}${location ? ` in ${location}` : ''}:\n\n`;
          
          // Add top job results
          const topJobs = jobResults.data.slice(0, 5);
          
          topJobs.forEach((job, index) => {
            const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ');
            
            botResponse += `${index + 1}. ${job.job_title} at ${job.employer_name}\n`;
            botResponse += `   Location: ${location}\n`;
            
            // Include salary if available
            if (job.job_salary_min && job.job_salary_max) {
              botResponse += `   Salary: ${job.job_salary_currency || '₹'}${job.job_salary_min}-${job.job_salary_max} ${job.job_salary_period || 'yearly'}\n`;
            }
            
            // Include apply link
            botResponse += `   Apply: ${job.job_apply_link}\n\n`;
          });
          
          botResponse += `Found ${jobResults.data.length} total results. Let me know if you'd like to see more details about any of these positions!`;
        }
        
        // Use job-related emoji and chat name
        if (!chatId) {
          updatedEmoji = emoji || '💼';
          updatedChatName = chatName || `Job Search: ${jobTitle}${location ? ` in ${location}` : ''}`;
        }
      } catch (error) {
        botResponse = "I encountered an error while searching for jobs. Please try again.";
      }
    } else {
      // For non-job related queries, proceed with normal Groq processing
      
      // For existing chats, fetch full information
      if (chatId) {
        // Fetch existing context if not provided but chatId exists
        if (!context) {
          const { data: contextData, error: contextError } = await supabase
            .from('chat_contexts')
            .select('context')
            .eq('chat_id', chatId)
            .single();
            
          if (!contextError && contextData) {
            updatedContext = contextData.context;
          } else {
            updatedContext = '';
          }
        }
        
        // Fetch chat details if not provided
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('title, emoji')
          .eq('id', chatId)
          .single();
          
        if (!chatError && chatData) {
          updatedChatName = chatName || chatData.title;
          updatedEmoji = emoji || chatData.emoji;
        } else {
          updatedChatName = chatName || 'Ongoing Conversation';
          updatedEmoji = emoji || '💬';
        }
        
        // Fetch recent message history to enhance context
        const { data: recentMessages, error: messagesError } = await supabase
          .from('messages')
          .select('is_user_message, content')
          .eq('chat_id', chatId)
          .order('timestamp', { ascending: false })
          .limit(10);
          
        if (!messagesError && recentMessages) {
          // Create a context summary from recent messages if we have a limited context
          if (!updatedContext || updatedContext.length < 1000) {
            const recentExchanges = recentMessages
              .reverse()
              .map(msg => `${msg.is_user_message ? 'User' : 'Assistant'}: ${msg.content}`)
              .join('\n');
              
            // Append recent exchanges to existing context or create new context
            updatedContext = updatedContext 
              ? `${updatedContext}\n\nRecent conversation:\n${recentExchanges}` 
              : `Conversation history:\n${recentExchanges}`;
          }
        }
      } else {
        // Create a new chat if chatId is not provided
        // Generate a default chat name based on first message
        const defaultChatName = message.length > 30 
          ? `${message.substring(0, 30)}...` 
          : message;
        
        updatedChatName = chatName || defaultChatName;
        updatedEmoji = emoji || '💬'; // Default emoji
        updatedContext = context || '';
      }
      
      // Construct the system prompt for Groq - Removed job suggestion
      const systemPrompt = `You are a supportive and empathetic female assistant for women. 
Your responses should be warm, friendly, and conversational, creating a genuine connection with users.
ALWAYS respond in the same language that the user's message is in.

Your response must be in valid JSON format with the following structure:

{
  "response": "Your helpful response here written in a natural, cheerful tone, Reply in the Same Language, Use Proper Grammatically Correct Language, use local slangs when needed (limit emojis to only where they genuinely enhance communication)",
  "context": "Detailed conversation context that captures key information, emotions, topics discussed, and important details for future reference",
  "chatName": "Suggested name for this conversation based on content",
  "emoji": "A single aesthetic emoji that represents the main theme of this conversation",
  "timestamp": "${timestamp}"
}


Current chat name: "${updatedChatName}"
Current emoji: "${updatedEmoji}"

CONTEXT INSTRUCTIONS:
- The context should be comprehensive yet concise
- Include key topics, user preferences, important details, and emotional states
- Structure the context to help you better understand the user in future interactions
- Update the context by building on previous context, not replacing it entirely

EMOJI INSTRUCTIONS:
- Choose ONE aesthetic emoji that best represents the conversation theme
- The emoji should be visually appealing and relevant to the discussion
- Avoid generic emojis unless truly appropriate

RESPONSE STYLE:
- Write in a fun-loving, cheerful tone that feels natural and human
- Keep responses conversational and genuinely engaging
- Use expressive language rather than relying on emojis to convey emotion
- Be warm and supportive while maintaining a natural flow
- Always respond in the SAME LANGUAGE as the user's message
- If the user writes in Hindi, respond in Hindi; if they write in Spanish, respond in Spanish, etc.
- Strictly adhere to the JSON structure requirements

Previous context: ${updatedContext || "No previous context available."}`;

      // Use the groqClient instance directly
      const response = await groqClient.chat.completions.create({
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      // Parse Groq's response
      let parsedResponse;
      try {
        const content = response.choices[0]?.message?.content || '{}';
        parsedResponse = JSON.parse(content);
      } catch (error) {
        console.error("Failed to parse GROQ response as JSON:", error);
        // Fallback if JSON parsing fails
        parsedResponse = {
          response: response.choices[0]?.message?.content || "Sorry, I couldn't process that request.",
          context: updatedContext,
          chatName: updatedChatName,
          emoji: updatedEmoji,
          timestamp: timestamp
        };
      }
      
      // Extract values from parsed response with fallbacks
      botResponse = parsedResponse.response || "Sorry, I couldn't process that request.";
      updatedContext = parsedResponse.context || updatedContext;
      updatedChatName = parsedResponse.chatName || updatedChatName;
      updatedEmoji = parsedResponse.emoji || updatedEmoji;
    }
    
    // Handle database operations based on whether this is a new or existing chat
    if (!chatId) {
      // Create new chat with all information
      const { data: newChatId, error: createError } = await supabase.rpc(
        'create_chat_with_messages',
        {
          user_id: userId,
          title: updatedChatName,
          user_message: message,
          bot_response: botResponse,
          context: updatedContext,
          p_emoji: updatedEmoji
        }
      );
      
      if (createError) throw new Error(`Failed to create chat: ${createError.message}`);
      generatedChatId = newChatId || generatedChatId;
    } else {
      // Add message pair for existing chat
      await supabase.rpc('add_message_pair', {
        chat_id: chatId,
        user_message: message,
        bot_response: botResponse
      });
      
      // Update context with enhanced information (only for non-job searches)
      if (!message.toLowerCase().startsWith('/job') && !jobMatch) {
        await supabase
          .from('chat_contexts')
          .upsert({
            chat_id: chatId,
            context: updatedContext,
            timestamp: timestamp
          });
        
        // Update chat details if they've changed
        await supabase
          .from('chats')
          .update({ 
            title: updatedChatName,
            emoji: updatedEmoji,
            updated_at: timestamp
          })
          .eq('id', chatId);
      }

      generatedChatId = chatId;
    }
    
    // Return the complete formatted response
    return {
      botResponse,
      updatedContext,
      chatId: generatedChatId,
      chatName: updatedChatName,
      emoji: updatedEmoji,
      timestamp
    };
    
  } catch (error) {
    console.error('Error in processWithGroq:', error);
    // Provide default values for error case
    const errorEmoji = '⚠️';
    const errorChatId = request.chatId || uuidv4();
    
    // If we have a chatId, still try to save the error message
    if (request.chatId) {
      try {
        await supabase.rpc('add_message_pair', {
          chat_id: request.chatId,
          user_message: request.message,
          bot_response: "Sorry, I encountered an error while processing your message. Please try again."
        });
      } catch (dbError) {
        console.error('Failed to save error message:', dbError);
      }
    }
    
    return {
      botResponse: "Sorry, I encountered an error while processing your message. Please try again.",
      updatedContext: request.context || "", 
      chatId: errorChatId,
      chatName: request.chatName || "Error Conversation",
      emoji: request.emoji || errorEmoji,
      timestamp: new Date().toISOString()
    };
  }
};

// Helper functions remain unchanged
export const getChatHistory = async (chatId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true });
    
  if (error) throw new Error(`Failed to get chat history: ${error.message}`);
  return data;
};

export const getChatDetails = async (chatId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('title, emoji, created_at, updated_at')
    .eq('id', chatId)
    .single();
    
  if (error) throw new Error(`Failed to get chat details: ${error.message}`);
  return data;
};