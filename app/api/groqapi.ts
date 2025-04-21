import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface GroqRequest {
  message: string;
  chatId?: string; // Optional for new chats
  userId: string;
  chatName?: string; // Optional for new chats
  context?: string; // Optional for new chats
  emoji?: string; // Optional emoji
}

interface GroqResponse {
  botResponse: string;
  updatedContext: string;
  chatId: string;
  chatName: string;
  emoji: string;
  timestamp: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

export const processWithGroq = async (request: GroqRequest): Promise<GroqResponse> => {
  try {
    const { message, userId } = request;
    let { chatId, chatName, context, emoji } = request;
    const timestamp = new Date().toISOString();
    
    // Get API key
    const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || Constants.expoConfig?.extra?.groqApiKey;
    
    if (!groqApiKey) {
      throw new Error("GROQ API key is missing");
    }
    
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
          context = contextData.context;
        } else {
          context = '';
        }
      }
      
      // Fetch chat details if not provided
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('title, emoji')
        .eq('id', chatId)
        .single();
        
      if (!chatError && chatData) {
        chatName = chatName || chatData.title;
        emoji = emoji || chatData.emoji;
      } else {
        chatName = chatName || 'Ongoing Conversation';
        emoji = emoji || '💬';
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
        if (!context || context.length < 1000) {
          const recentExchanges = recentMessages
            .reverse()
            .map(msg => `${msg.is_user_message ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');
            
          // Append recent exchanges to existing context or create new context
          context = context 
            ? `${context}\n\nRecent conversation:\n${recentExchanges}` 
            : `Conversation history:\n${recentExchanges}`;
        }
      }
    } else {
      // Create a new chat if chatId is not provided
      // Generate a default chat name based on first message
      const defaultChatName = message.length > 30 
        ? `${message.substring(0, 30)}...` 
        : message;
      
      chatName = chatName || defaultChatName;
      emoji = emoji || '💬'; // Default emoji
      context = context || '';
    }
    
    // Construct the system prompt for Groq
    const systemPrompt = `You are a supportive and empathetic assistant for women. 
    Your response must be in valid JSON format with the following structure:
    {
      "response": "Your helpful response here",
      "context": "Detailed conversation context that captures key information, emotions, topics discussed, and important details for future reference",
      "chatName": "Suggested name for this conversation based on content",
      "emoji": "A single aesthetic emoji that represents the main theme of this conversation",
      "timestamp": "${timestamp}"
    }
    
    Current chat name: "${chatName}"
    Current emoji: "${emoji || '💬'}"
    
    CONTEXT INSTRUCTIONS:
    - The context should be comprehensive yet concise
    - Include key topics, user preferences, important details, and emotional states
    - Structure the context to help you better understand the user in future interactions
    - Update the context by building on previous context, not replacing it entirely
    
    EMOJI INSTRUCTIONS:
    - Choose ONE aesthetic emoji that best represents the conversation theme
    - The emoji should be visually appealing and relevant to the discussion
    - Avoid generic emojis unless truly appropriate
    
    Previous context: ${context || "No previous context available."}
    
    Keep your responses concise, friendly, and helpful.`;

    // Make the request to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GROQ API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Parse Groq's JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Failed to parse GROQ response as JSON:", error);
      // Fallback if JSON parsing fails
      parsedResponse = {
        response: data.choices[0].message.content,
        context: context,
        chatName: chatName,
        emoji: emoji || '💬',
        timestamp: timestamp
      };
    }
    
    // Extract values from parsed response with fallbacks
    const botResponse = parsedResponse.response || "Sorry, I couldn't process that request.";
    const updatedContext = parsedResponse.context || context || "";
    const updatedChatName = parsedResponse.chatName || chatName;
    const updatedEmoji = parsedResponse.emoji || emoji || '💬';
    
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
          p_emoji: updatedEmoji // New parameter for emoji
        }
      );
      
      if (createError) throw new Error(`Failed to create chat: ${createError.message}`);
      chatId = newChatId;
      
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
    }
    
    // Return the complete formatted response
    return {
      botResponse,
      updatedContext,
      chatId,
      chatName: updatedChatName,
      emoji: updatedEmoji,
      timestamp
    };
    
  } catch (error) {
    console.error('Error in processWithGroq:', error);
    // Provide default values for error case
    const errorEmoji = '⚠️';
    
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
      chatId: request.chatId || uuidv4(), // Generate a temporary ID if none exists
      chatName: request.chatName || "Error Conversation",
      emoji: request.emoji || errorEmoji,
      timestamp: new Date().toISOString()
    };
  }
};

// Helper function to get chat history
export const getChatHistory = async (chatId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: true });
    
  if (error) throw new Error(`Failed to get chat history: ${error.message}`);
  return data;
};

// Helper function to get chat details including emoji
export const getChatDetails = async (chatId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('title, emoji, created_at, updated_at')
    .eq('id', chatId)
    .single();
    
  if (error) throw new Error(`Failed to get chat details: ${error.message}`);
  return data;
};