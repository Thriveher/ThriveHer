import Constants from 'expo-constants';

interface GroqRequest {
  message: string;
  chatId: string;
  chatName: string;
  context: string;
}

interface GroqResponse {
  botResponse: string;
  updatedContext: string;
}

export const processWithGroq = async (request: GroqRequest): Promise<GroqResponse> => {
  try {
    const { message, chatId, chatName, context } = request;
    
    // Get API key from various possible sources
    const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || 
                        Constants.expoConfig?.extra?.groqApiKey;
    
    if (!groqApiKey) {
      throw new Error("GROQ API key is missing. Please add it to your environment variables.");
    }
    
    // Construct the prompt with context
    const prompt = {
      model: "llama3-70b-8192", // Use the appropriate GROQ model
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Be concise, friendly, and helpful.
          The current chat is titled "${chatName}" with ID "${chatId}".
          Previous context: ${context || "No previous context available."}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GROQ API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Parse the response which should be in JSON format
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Failed to parse GROQ response as JSON:", error);
      // Fallback if JSON parsing fails
      parsedResponse = {
        response: data.choices[0].message.content,
        context: context
      };
    }
    
    // Extract the bot response and updated context
    return {
      botResponse: parsedResponse.response || "Sorry, I couldn't process that request.",
      updatedContext: parsedResponse.context || context
    };
  } catch (error) {
    console.error('Error in processWithGroq:', error);
    return {
      botResponse: "Sorry, I encountered an error while processing your message. Please try again.",
      updatedContext: request.context
    };
  }
};