import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import { searchJobsFormatted } from '../api/getjobsforchat';
import { generateResume } from '../api/createresume';

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
    
    // Construct the system prompt that handles job detection, resume generation, and normal responses
    const systemPrompt = `You are a supportive and empathetic female assistant for women. 
Your responses should be warm, friendly, and conversational, creating a genuine connection with users.
ALWAYS respond in the same language that the user's message is in.

CRITICAL INSTRUCTIONS:
Analyze the user's current message only carefully (not the context). Check for these specific intents:

1. If the user is asking about RESUME GENERATION, CV creation, resume building, or wants to create/generate their resume, then respond ONLY with:
"GENERATEPDF"

Examples of resume generation requests:
- "Generate my resume"
- "Create a CV for me"
- "I need to build my resume"
- "Can you make my resume?"
- "Help me create a resume"

2. If the user is specifically asking about jobs, careers, employment opportunities, or looking for work (they mention a specific job title/role they want), then respond ONLY in this exact format:
"JOB_SEARCH: [job_title] [location]"

Where:
- job_title is the specific role/position they mentioned
- location is the city/area they mentioned (use "anywhere" if no location specified)

Examples of job search requests:
- "I'm looking for software engineer jobs in Mumbai" → "JOB_SEARCH: software engineer Mumbai"
- "Find me marketing jobs" → "JOB_SEARCH: marketing anywhere"
- "Any data analyst positions in Bangalore?" → "JOB_SEARCH: data analyst Bangalore"
- "I need a teacher job in Delhi" → "JOB_SEARCH: teacher Delhi"

3. If the user is NOT asking about resume generation OR job searching, provide a normal conversational response in this JSON format:
{
  "response": "Your helpful response here written in a natural, cheerful tone, Reply in the Same Language, Use Proper Grammatically Correct Language, use local slangs when needed (limit emojis to only where they genuinely enhance communication)",
  "context": "Detailed conversation context that captures key information, emotions, topics discussed, and important details for future reference",
  "chatName": "Suggested name for this conversation based on content",
  "emoji": "A single aesthetic emoji that represents the main theme of this conversation"
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

RESPONSE STYLE FOR NON-JOB/NON-RESUME SEARCHES:
- Write in a fun-loving, cheerful tone that feels natural and human
- Keep responses conversational and genuinely engaging
- Use expressive language rather than relying on emojis to convey emotion
- Be warm and supportive while maintaining a natural flow
- Always respond in the SAME LANGUAGE as the user's message

Previous context: ${updatedContext || "No previous context available."}`;

    // Make single Groq request
    const response = await groqClient.chat.completions.create({
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.8,
      max_tokens: 4000
    });

    const groqResponse = response.choices[0]?.message?.content || '';

    // Check if this is a resume generation request
    if (groqResponse.trim() === 'GENERATEPDF') {
      try {
        // Call the resume generation API
        const resumeResult = await generateResume();
        
        // Return the result as is from the resume generator
        botResponse = resumeResult;
        
        // Use resume-related emoji and chat name for new chats
        if (!chatId) {
          updatedEmoji = emoji || '📄';
          updatedChatName = chatName || 'Resume Generation';
          updatedContext = 'User requested resume generation. Generated resume successfully.';
        } else {
          // Update context for existing chats
          updatedContext = `${updatedContext}\n\nUser requested resume generation. Generated resume successfully.`;
        }
      } catch (error) {
        console.error('Resume generation error:', error);
        botResponse = "I encountered an error while generating your resume. Please try again.";
      }
    }
    // Check if this is a job search request
    else if (groqResponse.startsWith('JOB_SEARCH:')) {
      const jobSearchPart = groqResponse.replace('JOB_SEARCH:', '').trim();
      const parts = jobSearchPart.split(' ');
      
      if (parts.length >= 2) {
        // Extract job title (all parts except the last one) and location (last part)
        const location = parts[parts.length - 1];
        const jobTitle = parts.slice(0, -1).join(' ');
        
        try {
          // Call the job search API which will return formatted response
          botResponse = await searchJobsFormatted(
            jobTitle, 
            location === 'anywhere' ? undefined : location
          );
          
          // Use job-related emoji and chat name for new chats
          if (!chatId) {
            updatedEmoji = emoji || '💼';
            updatedChatName = chatName || `Job Search: ${jobTitle}${location !== 'anywhere' ? ` in ${location}` : ''}`;
            updatedContext = `User is searching for ${jobTitle} jobs${location !== 'anywhere' ? ` in ${location}` : ''}. Providing job search results.`;
          } else {
            // Update context for existing chats
            updatedContext = `${updatedContext}\n\nUser searched for ${jobTitle} jobs${location !== 'anywhere' ? ` in ${location}` : ''}. Provided job search results.`;
          }
        } catch (error) {
          console.error('Job search error:', error);
          botResponse = "I encountered an error while searching for jobs. Please try again with a different search term.";
        }
      } else {
        botResponse = "I couldn't understand your job search request. Please specify the job title you're looking for.";
      }
    } else {
      // Handle normal conversation - parse JSON response
      try {
        const parsedResponse = JSON.parse(groqResponse);
        botResponse = parsedResponse.response || "I'm here to help! How can I assist you today?";
        updatedContext = parsedResponse.context || updatedContext;
        updatedChatName = parsedResponse.chatName || updatedChatName;
        updatedEmoji = parsedResponse.emoji || updatedEmoji;
      } catch (error) {
        console.error("Failed to parse GROQ response as JSON:", error);
        // Fallback if JSON parsing fails
        botResponse = groqResponse || "I'm here to help! How can I assist you today?";
      }
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
      
      // Update context with enhanced information
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