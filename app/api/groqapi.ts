import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
// Import uuid but don't redeclare types
import { v4 as uuidv4 } from 'uuid';
import { searchJobs, getJobDetails, getJobSalaries } from '../api/getjobsforchat';
import Groq from 'groq-sdk';
 
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
  updatedContext: string; // Non-optional
  chatId: string;
  chatName: string; // Non-optional
  emoji: string; // Non-optional
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
const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || Constants.expoConfig?.extra?.groqApiKey || '';

// Initialize Groq client
const groqClient = new Groq({ 
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true // Add this flag to allow browser usage
});

/**
 * Validates API keys are available
 * @returns boolean indicating if API keys are set
 */
const validateApiKeys = (): boolean => {
  let isValid = true;
  
  if (!groqApiKey) {
    console.error('Groq API key is not configured');
    isValid = false;
  }
  
  return isValid;
};

/**
 * Perform job search using the API from the first file
 * @param message User's message text
 * @returns Analysis of job results
 */
const performJobSearch = async (message: string): Promise<{
  analysis: string, 
  jobData: any[]
}> => {
  try {
    // Simply remove the "/job" command from the message and use as query
    const query = message.replace(/\/job/i, '').trim();
    
    // Call the searchJobs function directly from the imported API
    const searchParams: JobSearchParams = {
      query: query,
      numPages: 1,
      country: 'in', // Default to India, can be made configurable
      datePosted: 'all',
      language: 'en'
    };
    
    const jobResults = await searchJobs(searchParams);

    if (!jobResults.data || jobResults.data.length === 0) {
      return {
        analysis: `I couldn't find any jobs matching "${query}". Try modifying your search terms.`,
        jobData: []
      };
    }

    // Format a response with the top 5 jobs
    const topJobs = jobResults.data.slice(0, 5);
    let analysis = `Here are the top results for "${query}":\n\n`;
    
    topJobs.forEach((job, index) => {
      const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ');
      const salary = job.job_salary_min && job.job_salary_max 
        ? `${job.job_salary_currency || '₹'}${job.job_salary_min}-${job.job_salary_max} ${job.job_salary_period || 'yearly'}`
        : 'Not specified';
      
      analysis += `${index + 1}. ${job.job_title} at ${job.employer_name}\n`;
      analysis += `   Location: ${location}\n`;
      analysis += `   Salary: ${salary}\n`;
      
      // Include skills if available from the LLM processing
      if (job.skills && job.skills.length > 0) {
        analysis += `   Skills: ${job.skills.slice(0, 3).join(', ')}${job.skills.length > 3 ? '...' : ''}\n`;
      }
      
      // Include experience level if available
      if (job.experience_level && job.experience_level !== 'not specified') {
        analysis += `   Level: ${job.experience_level}\n`;
      }
      
      analysis += `   Apply: ${job.job_apply_link}\n\n`;
    });

    analysis += `Found ${jobResults.data.length} total results.`;

    return {
      analysis,
      jobData: jobResults.data
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error searching for jobs:", errorMessage);
    return {
      analysis: "I encountered an error while searching for jobs. Please try again.",
      jobData: []
    };
  }
};

/**
 * Process a job detail request
 * @param jobId The ID of the job to get details for
 * @returns Formatted job details
 */
const getJobDetailsAnalysis = async (jobId: string): Promise<{
  analysis: string,
  jobData: any
}> => {
  try {
    const jobResult = await getJobDetails(jobId);
    
    if (!jobResult.data || jobResult.data.length === 0) {
      return {
        analysis: `I couldn't find details for job ID: ${jobId}.`,
        jobData: null
      };
    }
    
    const job = jobResult.data[0];
    let analysis = `# ${job.job_title} at ${job.employer_name}\n\n`;
    
    // Location
    const location = [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ');
    analysis += `**Location**: ${location}\n\n`;
    
    // Salary if available
    if (job.job_salary_min && job.job_salary_max) {
      analysis += `**Salary**: ${job.job_salary_currency || '$'}${job.job_salary_min}-${job.job_salary_max} ${job.job_salary_period || 'yearly'}\n\n`;
    }
    
    // Employment type
    analysis += `**Employment Type**: ${job.job_employment_type}\n\n`;
    
    // Skills section from LLM processing
    if (job.skills && job.skills.length > 0) {
      analysis += `**Skills Required**:\n`;
      job.skills.forEach((skill: string) => {
        analysis += `- ${skill}\n`;
      });
      analysis += '\n';
    }
    
    // Experience level from LLM processing
    if (job.experience_level && job.experience_level !== 'not specified') {
      analysis += `**Experience Level**: ${job.experience_level}\n\n`;
    }
    
    // Industry from LLM processing
    if (job.industry && job.industry !== 'not specified') {
      analysis += `**Industry**: ${job.industry}\n\n`;
    }
    
    // Full description
    analysis += `## Job Description\n\n${job.job_description || 'No description provided.'}\n\n`;
    
    // Application link
    analysis += `**Apply**: [Application Link](${job.job_apply_link})\n\n`;
    
    // If apply options are available
    if (job.apply_options && job.apply_options.length > 0) {
      analysis += `**Other Application Options**:\n`;
      job.apply_options.forEach((option: any) => {
        analysis += `- ${option.publisher}: ${option.is_direct ? 'Direct application' : 'External site'}\n`;
      });
    }
    
    return {
      analysis,
      jobData: job
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error getting job details:", errorMessage);
    return {
      analysis: "I encountered an error while fetching job details. Please try again.",
      jobData: null
    };
  }
};

/**
 * Process a salary information request
 * @param jobTitle The job title to get salary data for
 * @param location Optional location for salary data
 * @returns Formatted salary analysis
 */
const getSalaryAnalysis = async (jobTitle: string, location?: string): Promise<string> => {
  try {
    const salaryData = await getJobSalaries(jobTitle, location);
    
    if (!salaryData.data) {
      return `I couldn't find salary information for ${jobTitle}${location ? ` in ${location}` : ''}.`;
    }
    
    let analysis = `# Salary Information for ${jobTitle}${location ? ` in ${location}` : ''}\n\n`;
    
    // Basic salary range
    if (salaryData.data.min_salary && salaryData.data.max_salary) {
      analysis += `**Salary Range**: ${salaryData.data.currency || '$'}${salaryData.data.min_salary.toLocaleString()}-${salaryData.data.max_salary.toLocaleString()} ${salaryData.data.salary_period || 'yearly'}\n\n`;
    }
    
    // Median salary
    if (salaryData.data.median_salary) {
      analysis += `**Median Salary**: ${salaryData.data.currency || '$'}${salaryData.data.median_salary.toLocaleString()}\n\n`;
    }
    
    // Include any additional insights from LLM processing
    if (salaryData.data.industry_comparisons) {
      analysis += `## Industry Comparisons\n${salaryData.data.industry_comparisons}\n\n`;
    }
    
    if (salaryData.data.experience_level_breakdowns) {
      analysis += `## Experience Level Breakdown\n${salaryData.data.experience_level_breakdowns}\n\n`;
    }
    
    if (salaryData.data.educational_requirements_impact) {
      analysis += `## Impact of Education\n${salaryData.data.educational_requirements_impact}\n\n`;
    }
    
    return analysis;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error getting salary information:", errorMessage);
    return "I encountered an error while fetching salary information. Please try again.";
  }
};

export const processWithGroq = async (request: GroqRequest): Promise<GroqResponse> => {
  try {
    if (!validateApiKeys()) {
      throw new Error('Required API keys not configured');
    }
    
    const { message, userId } = request;
    let { chatId, chatName, context, emoji } = request;
    const timestamp = new Date().toISOString();
    let generatedChatId = chatId || uuidv4();
    
    // Parse command patterns
    const isJobSearch = message.toLowerCase().startsWith('/job ') || message.toLowerCase() === '/job';
    const isJobDetails = message.toLowerCase().match(/\/job-details\s+([a-zA-Z0-9-_]+)/);
    const isSalaryInfo = message.toLowerCase().match(/\/salary\s+(.+?)(?:\s+in\s+(.+))?$/);
    
    let jobSearchResults = null;
    let botResponse = "";
    
    // Initialize these with default values to avoid undefined
    let updatedContext = context || "";
    let updatedChatName = chatName || "Conversation";
    let updatedEmoji = emoji || "💬";
    
    // Handle job-related commands
    if (isJobSearch) {
      // Perform job search
      jobSearchResults = await performJobSearch(message);
      botResponse = jobSearchResults.analysis;
      
      // Use job-related emoji and chat name for new job search chats
      if (!chatId) {
        updatedEmoji = emoji || '💼';
        const cleanQuery = message.replace(/\/job/i, '').trim();
        updatedChatName = chatName || `Job Search: ${cleanQuery.length > 25 ? cleanQuery.substring(0, 25) + '...' : cleanQuery}`;
      }
    } else if (isJobDetails) {
      // Get job details for a specific job ID
      const jobId = isJobDetails[1];
      const jobDetails = await getJobDetailsAnalysis(jobId);
      botResponse = jobDetails.analysis;
      
      // Use job-details emoji and name for new chats
      if (!chatId) {
        updatedEmoji = emoji || '📋';
        updatedChatName = chatName || `Job Details: ${jobDetails.jobData?.job_title || jobId}`;
      }
    } else if (isSalaryInfo) {
      // Get salary information for a job title and optional location
      const jobTitle = isSalaryInfo[1];
      const location = isSalaryInfo[2];
      botResponse = await getSalaryAnalysis(jobTitle, location);
      
      // Use salary-related emoji and name for new chats
      if (!chatId) {
        updatedEmoji = emoji || '💰';
        updatedChatName = chatName || `Salary Info: ${jobTitle}${location ? ` in ${location}` : ''}`;
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
      
      // Construct the system prompt for Groq
      const systemPrompt = `You are a supportive and empathetic assistant for women. 
      Your responses should be warm, friendly, and include appropriate emojis to convey emotions and make the conversation more engaging.
      ALWAYS respond in the same language that the user's message is in.
      
      Your response must be in valid JSON format with the following structure:
      {
        "response": "Your helpful response here with appropriate emojis for emotional connection 😊",
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
      - Include emojis naturally within your responses to express emotions and create a warm, friendly tone
      - Keep your responses concise but emotionally supportive
      - Always respond in the SAME LANGUAGE as the user's message
      - If the user writes in Hindi, respond in Hindi; if they write in Spanish, respond in Spanish, etc.
      
      Previous context: ${updatedContext || "No previous context available."}`;

      // Use the groqClient instance directly
      const response = await groqClient.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
          p_emoji: updatedEmoji // Parameter for emoji
        }
      );
      
      if (createError) throw new Error(`Failed to create chat: ${createError.message}`);
      generatedChatId = newChatId || generatedChatId; // Use the returned ID or keep our generated one
      
      // If this was a job search, store the job data
      if (isJobSearch && jobSearchResults && jobSearchResults.jobData.length > 0) {
        const jobSearchId = uuidv4();
        const compactJobData = jobSearchResults.jobData.map(job => ({
          job_id: job.job_id,
          job_title: job.job_title,
          employer_name: job.employer_name,
          job_apply_link: job.job_apply_link,
          location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
          job_posted_at: job.job_posted_at_datetime_utc,
          skills: job.skills || [],
          experience_level: job.experience_level || 'not specified'
        }));
        
        // Store job search results
        await supabase
          .from('job_search_history')
          .insert({
            id: jobSearchId,
            user_id: userId,
            chat_id: generatedChatId,
            search_query: message.replace(/\/job/i, '').trim(),
            results: compactJobData,
            created_at: timestamp
          });
      }
      
    } else {
      // Add message pair for existing chat
      await supabase.rpc('add_message_pair', {
        chat_id: chatId,
        user_message: message,
        bot_response: botResponse
      });
      
      // Update context with enhanced information (only for non-job searches)
      if (!isJobSearch && !isJobDetails && !isSalaryInfo) {
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

      // Make sure generatedChatId is set to the existing chatId
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
    const errorChatId = request.chatId || uuidv4(); // Generate a temporary ID if none exists
    
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

export const getRecentJobSearches = async (userId: string, limit = 5) => {
  const { data, error } = await supabase
    .from('job_search_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw new Error(`Failed to get recent job searches: ${error.message}`);
  return data;
};

export const getJobSearchDetails = async (searchId: string) => {
  const { data, error } = await supabase
    .from('job_search_history')
    .select('*')
    .eq('id', searchId)
    .single();
    
  if (error) throw new Error(`Failed to get job search details: ${error.message}`);
  return data;
};