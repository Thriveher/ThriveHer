import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface GroqRequest {
  message: string;
  chatId?: string; // Optional for new chats
  userId: string;
  chatName?: string; // Optional for new chats
  context?: string; // Optional for new chats
}

interface GroqResponse {
  botResponse: string;
  updatedContext: string;
  chatId: string;
  chatName: string;
  timestamp: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

export const processWithGroq = async (request: GroqRequest): Promise<GroqResponse> => {
  try {
    const { message, userId } = request;
    let { chatId, chatName, context } = request;
    const timestamp = new Date().toISOString();
    
    // Get API key
    const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || Constants.expoConfig?.extra?.groqApiKey;
    
    if (!groqApiKey) {
      throw new Error("GROQ API key is missing");
    }
    
    // Create a new chat if chatId is not provided
    if (!chatId) {
      // Generate a default chat name based on first message
      const defaultChatName = message.length > 30 
        ? `${message.substring(0, 30)}...` 
        : message;
      
      // Create new chat in Supabase
      const { data, error } = await supabase.rpc('create_chat_with_messages', {
        user_id: userId,
        title: chatName || defaultChatName,
        user_message: message,
        bot_response: '', // Will update after getting Groq response
        context: context || '' 
      });
      
      if (error) throw new Error(`Failed to create chat: ${error.message}`);
      
      chatId = data;
      chatName = chatName || defaultChatName;
      context = context || '';
    } else {
      // Fetch existing context if not provided but chatId exists
      if (!context) {
        const { data, error } = await supabase
          .from('chat_contexts')
          .select('context')
          .eq('chat_id', chatId)
          .single();
          
        if (!error && data) {
          context = data.context;
        } else {
          context = '';
        }
      }
      
      // Fetch chat name if not provided
      if (!chatName) {
        const { data, error } = await supabase
          .from('chats')
          .select('title')
          .eq('id', chatId)
          .single();
          
        if (!error && data) {
          chatName = data.title;
        } else {
          chatName = 'Ongoing Conversation';
        }
      }
    }
    
    // Construct the system prompt for Groq
    const systemPrompt = `You are a supportive and empathetic assistant for women. 
    Your response must be in valid JSON format with the following structure:
    {
      "response": "Your helpful response here",
      "context": "Updated conversation context for future reference",
      "chatName": "Suggested name for this conversation based on content",
      "timestamp": "${timestamp}"
    }
    
    Current chat name: "${chatName}"
    Previous context: ${context || "No previous context available."}
    
    Keep your responses concise, friendly, and helpful. The context field should summarize key points from the conversation that will be useful for future reference.`;

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
        max_tokens: 800,
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
        timestamp: timestamp
      };
    }
    
    // Update database with the bot response and context
    if (parsedResponse.response) {
      // If this was a new chat, update the bot_response
      if (!request.chatId) {
        await supabase
          .from('messages')
          .update({ content: parsedResponse.response })
          .eq('chat_id', chatId)
          .eq('is_user_message', false);
      } else {
        // Add message pair for existing chat
        await supabase.rpc('add_message_pair', {
          chat_id: chatId,
          user_message: message,
          bot_response: parsedResponse.response
        });
      }
      
      // Update context
      const updatedContext = parsedResponse.context || context;
      await supabase
        .from('chat_contexts')
        .upsert({
          chat_id: chatId,
          context: updatedContext,
          timestamp: timestamp
        });
      
      // Update chat name if suggested
      if (parsedResponse.chatName && parsedResponse.chatName !== chatName) {
        await supabase
          .from('chats')
          .update({ 
            title: parsedResponse.chatName,
            updated_at: timestamp
          })
          .eq('id', chatId);
        
        chatName = parsedResponse.chatName;
      } else {
        // Just update the timestamp
        await supabase
          .from('chats')
          .update({ updated_at: timestamp })
          .eq('id', chatId);
      }
    }
    
    // Return the formatted response
    return {
      botResponse: parsedResponse.response || "Sorry, I couldn't process that request.",
      updatedContext: parsedResponse.context || context,
      chatId: chatId,
      chatName: parsedResponse.chatName || chatName,
      timestamp: timestamp
    };
    
  } catch (error) {
    console.error('Error in processWithGroq:', error);
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