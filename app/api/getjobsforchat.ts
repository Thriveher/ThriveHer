// jobSearchApi.ts

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// Define TypeScript interfaces for the API response
interface JobSearchParams {
  query: string;
  page?: number;
  numPages?: number;
  country?: string;
  datePosted?: string;
  language?: string;
}

interface ApplyOption {
  publisher: string;
  apply_link: string;
  is_direct: boolean;
}

interface JobData {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_publisher: string;
  job_employment_type: string;
  job_employment_types: string[];
  job_apply_link: string;
  job_apply_is_direct: boolean;
  apply_options: ApplyOption[];
  job_description?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_posted_at_datetime_utc?: string;
  job_salary_currency?: string;
  job_salary_min?: number;
  job_salary_max?: number;
  job_salary_period?: string;
  [key: string]: any; // Allow for additional fields
}

interface JobSearchResponse {
  status: string;
  request_id: string;
  parameters: JobSearchParams;
  data: JobData[];
}

interface ApiError {
  message: string;
  status: number;
  originalError?: Error;
}

interface ProcessedJob extends JobData {
  categories: string[];
  skills: string[];
  experience_level: string;
  industry: string;
  query_relevance: number;
  search_terms: string[];
  created_at: string;
  query_text: string;
}

// Base API configuration
const API_BASE_URL = 'https://jsearch.p.rapidapi.com';
const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || ''; // Fallback to provided key for testing
const API_HOST = 'jsearch.p.rapidapi.com';

// Supabase and Groq configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize Groq client with dangerouslyAllowBrowser option
const groqClient = new Groq({ 
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Add this flag to allow browser usage
});

/**
 * Creates fetch request options with proper headers
 * @returns Request options for fetch API
 */
const getRequestOptions = (): RequestInit => {
  return {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };
};

/**
 * Validates API keys are available
 * @returns boolean indicating if API keys are set
 */
const validateApiKeys = (): boolean => {
  let isValid = true;
  
  if (!API_KEY) {
    console.error('RapidAPI key is not configured');
    isValid = false;
  }
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase credentials are not configured');
    isValid = false;
  }
  
  if (!GROQ_API_KEY) {
    console.error('Groq API key is not configured');
    isValid = false;
  }
  
  return isValid;
};

/**
 * Process job data using Groq LLM to extract structured information
 * @param job The job data to process
 * @param query The original search query
 * @returns Processed job with additional structured fields
 */
const processJobWithLLM = async (job: JobData, query: string): Promise<ProcessedJob> => {
  try {
    // Combine job details for LLM to analyze
    const jobText = `
    Job Title: ${job.job_title}
    Employer: ${job.employer_name}
    Employment Type: ${job.job_employment_type}
    Description: ${job.job_description || 'Not provided'}
    Location: ${[job.job_city, job.job_state, job.job_country].filter(Boolean).join(', ')}
    Salary: ${job.job_salary_min ? `${job.job_salary_min}-${job.job_salary_max} ${job.job_salary_currency} ${job.job_salary_period || ''}` : 'Not specified'}
    Search Query: ${query}
    `;

    // Ask LLM to extract structured data
    const response = await groqClient.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "You are a job data processing assistant. Extract structured information from job listings. Respond ONLY with JSON. Do not include any explanations."
        },
        {
          role: "user",
          content: `Analyze this job listing and extract the following information:
          1. A list of relevant skills mentioned or implied
          2. The industry this job is in
          3. Experience level (entry, mid, senior)
          4. Key categories or tags for this job
          5. Search terms relevant to this job
          6. A relevance score from 0-100 showing how well this job matches the search query
          
          Return ONLY a JSON object with these fields: skills (array), industry (string), experience_level (string), categories (array), search_terms (array), query_relevance (number).
          
          Job details:
          ${jobText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    // Parse LLM response
    const content = response.choices[0]?.message?.content || '{}';
    // Extract JSON from content (in case it's wrapped in markdown code blocks)
    const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || content.match(/```\n([\s\S]*)\n```/) || [null, content];
    let jsonContent = jsonMatch[1] || content;
    
    // If the content has multiple JSON objects, take the first complete one
    if (jsonContent.includes('}{')) {
      jsonContent = jsonContent.split('}{')[0] + '}';
    }

    try {
      const processedData = JSON.parse(jsonContent);
      
      // Return combined original job data with LLM-extracted metadata
      return {
        ...job,
        categories: processedData.categories || [],
        skills: processedData.skills || [],
        experience_level: processedData.experience_level || 'not specified',
        industry: processedData.industry || 'not specified',
        query_relevance: processedData.query_relevance || 50,
        search_terms: processedData.search_terms || [],
        created_at: new Date().toISOString(),
        query_text: query
      };
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      console.log('Raw LLM response:', content);
      
      // Return default processed job if parsing fails
      return {
        ...job,
        categories: [],
        skills: [],
        experience_level: 'not specified',
        industry: 'not specified', 
        query_relevance: query.toLowerCase().includes(job.job_title.toLowerCase()) ? 70 : 50,
        search_terms: [job.job_title.toLowerCase()],
        created_at: new Date().toISOString(),
        query_text: query
      };
    }
  } catch (error) {
    console.error('Error processing job with LLM:', error);
    
    // Return basic processed job on error
    return {
      ...job,
      categories: [],
      skills: [],
      experience_level: 'not specified',
      industry: 'not specified',
      query_relevance: 50,
      search_terms: [],
      created_at: new Date().toISOString(),
      query_text: query
    };
  }
};

/**
 * Search for jobs in Supabase database using text search
 * @param query The search query
 * @returns Promise with job search results from the database
 */
const searchJobsInDatabase = async (query: string): Promise<JobData[]> => {
  try {
    // Generate search terms from the query
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // First try exact match on query_text
    let { data: exactMatches, error: exactError } = await supabase
      .from('job_vectors')
      .select('*')
      .ilike('query_text', `%${query}%`)
      .order('query_relevance', { ascending: false })
      .limit(20);
    
    if (exactError) {
      console.error('Error searching jobs in database (exact):', exactError);
      exactMatches = [];
    }
    
    // If we found enough exact matches, return them
    if (exactMatches && exactMatches.length >= 10) {
      return exactMatches;
    }
    
    // Otherwise search by job title and keywords
    const { data: titleMatches, error: titleError } = await supabase
      .from('job_vectors')
      .select('*')
      .or(`job_title.ilike.%${query}%,employer_name.ilike.%${query}%`)
      .order('query_relevance', { ascending: false })
      .limit(20);
    
    if (titleError) {
      console.error('Error searching jobs in database (title):', titleError);
      return exactMatches || [];
    }
    
    // Combine results, remove duplicates
    const combinedResults = [...(exactMatches || [])];
    titleMatches?.forEach(job => {
      if (!combinedResults.some(existing => existing.job_id === job.job_id)) {
        combinedResults.push(job);
      }
    });
    
    // If we still need more results, try search terms
    if (combinedResults.length < 10) {
      // Try full text search on search terms array
      const { data: termMatches, error: termError } = await supabase
        .from('job_vectors')
        .select('*')
        .contains('search_terms', searchTerms)
        .order('query_relevance', { ascending: false })
        .limit(20);
      
      if (!termError && termMatches) {
        termMatches.forEach(job => {
          if (!combinedResults.some(existing => existing.job_id === job.job_id)) {
            combinedResults.push(job);
          }
        });
      }
    }
    
    return combinedResults;
  } catch (error) {
    console.error('Error searching in database:', error);
    return [];
  }
};

/**
 * Save job data to Supabase with LLM processed information
 * @param jobs Array of job data
 * @param query Original search query
 */
const saveJobsToDatabase = async (jobs: JobData[], query: string): Promise<void> => {
  try {
    // Process each job with LLM to extract structured data
    const processedJobs = await Promise.all(
      jobs.map(job => processJobWithLLM(job, query))
    );
    
    // Insert processed jobs to Supabase
    const { error } = await supabase
      .from('job_vectors')
      .upsert(processedJobs, { 
        onConflict: 'job_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('Error saving jobs to database:', error);
    } else {
      console.log(`Successfully saved ${jobs.length} jobs to database`);
    }
  } catch (error) {
    console.error('Error in saveJobsToDatabase:', error);
  }
};

/**
 * Handles API errors in a structured way
 * @param error - The error that occurred
 * @param response - Optional response object if available
 * @returns Structured API error
 */
const handleApiError = async (error: unknown, response?: Response): Promise<ApiError> => {
  // Handle HTTP response errors
  if (response) {
    if (response.status === 401) {
      return {
        message: 'Invalid API key. Please check your API key configuration.',
        status: 401,
        originalError: error instanceof Error ? error : undefined
      };
    }
    
    try {
      // Try to parse error response body
      const errorData = await response.json();
      return {
        message: errorData.message || `API Error: ${response.statusText}`,
        status: response.status,
        originalError: error instanceof Error ? error : undefined
      };
    } catch {
      // If can't parse JSON, use status text
      return {
        message: `API Error: ${response.statusText}`,
        status: response.status,
        originalError: error instanceof Error ? error : undefined
      };
    }
  }
  
  // Handle other types of errors
  return {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    status: 500,
    originalError: error instanceof Error ? error : undefined
  };
};

/**
 * Build URL with query parameters
 * @param endpoint - API endpoint
 * @param params - Query parameters
 * @returns Formatted URL string
 */
const buildUrl = (endpoint: string, params: Record<string, string | number | undefined>): string => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
};

/**
 * Fetch jobs from API
 * @param searchParams - Parameters for the job search query
 * @returns Promise with job search results
 */
const fetchJobsFromApi = async (searchParams: JobSearchParams): Promise<JobSearchResponse> => {
  const params = {
    query: searchParams.query,
    page: searchParams.page || 1,
    num_pages: searchParams.numPages || 1,
    country: searchParams.country || 'in',
    date_posted: searchParams.datePosted || 'all',
    language: searchParams.language || 'en'
  };

  const url = buildUrl('/search', params);
  const options = getRequestOptions();

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const apiError = await handleApiError(new Error(`HTTP error ${response.status}`), response);
      console.error(`Error fetching job search results: ${apiError.message}`);
      throw apiError;
    }
    
    const data = await response.json();
    return data as JobSearchResponse;
  } catch (error) {
    console.error('Error fetching job search results:', error);
    throw error;
  }
};

/**
 * Search for jobs using cached data or API
 * @param searchParams - Parameters for the job search query
 * @returns Promise with job search results
 */
export const searchJobs = async (searchParams: JobSearchParams): Promise<JobSearchResponse> => {
  if (!validateApiKeys()) {
    throw new Error('Required API keys not configured');
  }

  try {
    // First, try to get results from the database
    const dbResults = await searchJobsInDatabase(searchParams.query);
    
    // If we have enough results in the database, return them
    if (dbResults.length >= 10) {
      console.log(`Found ${dbResults.length} relevant results in database`);
      
      // Format results to match API response structure
      return {
        status: 'success',
        request_id: `db-request-${Date.now()}`,
        parameters: searchParams,
        data: dbResults
      };
    }
    
    // Otherwise, fetch from API
    console.log('Not enough results in database, fetching from API');
    const apiResponse = await fetchJobsFromApi(searchParams);
    
    // If API call was successful, save results to database
    if (apiResponse.status === 'success' && apiResponse.data.length > 0) {
      await saveJobsToDatabase(apiResponse.data, searchParams.query);
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error in searchJobs:', error);
    throw error;
  }
};

/**
 * Get job details by job ID
 * @param jobId - The unique job identifier
 * @returns Promise with job details
 */
export const getJobDetails = async (jobId: string): Promise<any> => {
  if (!validateApiKeys()) {
    throw new Error('Required API keys not configured');
  }

  try {
    // First, check if the job details exist in Supabase
    const { data: jobFromDb, error: dbError } = await supabase
      .from('job_vectors')
      .select('*')
      .eq('job_id', jobId)
      .single();
    
    if (jobFromDb && !dbError) {
      console.log('Job details found in database');
      return {
        status: 'success',
        data: [jobFromDb]
      };
    }
    
    // If not found in DB, fetch from API
    console.log('Job details not found in database, fetching from API');
    const url = buildUrl('/job-details', { job_id: jobId });
    const options = getRequestOptions();
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const apiError = await handleApiError(new Error(`HTTP error ${response.status}`), response);
      console.error(`Error fetching job details: ${apiError.message}`);
      throw apiError;
    }
    
    const apiResponse = await response.json();
    
    // If we got details, save to database for future use
    if (apiResponse.status === 'success' && apiResponse.data.length > 0) {
      await saveJobsToDatabase(apiResponse.data, `job_id:${jobId}`);
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
};

/**
 * Get estimated salaries for a job title
 * @param jobTitle - The job title to get salary estimates for
 * @param location - Optional location to filter salary data
 * @returns Promise with salary data
 */
export const getJobSalaries = async (jobTitle: string, location?: string): Promise<any> => {
  if (!validateApiKeys()) {
    throw new Error('Required API keys not configured');
  }

  // Create a unique key for this salary search
  const salarySearchKey = `${jobTitle}${location ? `-${location}` : ''}`;
  
  try {
    // First check if we have this salary data cached
    const { data: salaryFromDb, error: dbError } = await supabase
      .from('salary_vectors')
      .select('*')
      .textSearch('search_key', salarySearchKey, { 
        config: 'english',
        type: 'plain'
      })
      .limit(1);
    
    if (salaryFromDb && salaryFromDb.length > 0 && !dbError) {
      console.log('Salary data found in database');
      return {
        status: 'success',
        data: salaryFromDb[0].salary_data
      };
    }
    
    // If not found in DB, fetch from API
    console.log('Salary data not found in database, fetching from API');
    const url = buildUrl('/estimated-salary', {
      job_title: jobTitle,
      location: location || '',
      radius: '100'
    });
    const options = getRequestOptions();
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const apiError = await handleApiError(new Error(`HTTP error ${response.status}`), response);
      console.error(`Error fetching salary estimates: ${apiError.message}`);
      throw apiError;
    }
    
    const apiResponse = await response.json();
    
    // Process salary data with LLM for additional insights
    const salaryData = apiResponse.data;
    let processedSalaryData = salaryData;
    
    try {
      // Use LLM to add additional context to salary data
      const salaryPrompt = `
        Analyze this salary data for ${jobTitle} ${location ? `in ${location}` : ''}:
        ${JSON.stringify(salaryData)}
        
        Extract additional insights such as:
        - Industry comparisons
        - Experience level breakdowns
        - Educational requirements impact
        
        Return ONLY a JSON object with the original data plus these new fields.
      `;
      
      const salaryResponse = await groqClient.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a salary data analyst. Extract and enhance salary information."
          },
          {
            role: "user",
            content: salaryPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });
      
      const salaryContent = salaryResponse.choices[0]?.message?.content || '{}';
      // Extract JSON from content (in case it's wrapped in markdown code blocks)
      const jsonMatch = salaryContent.match(/```json\n([\s\S]*)\n```/) || salaryContent.match(/```\n([\s\S]*)\n```/) || [null, salaryContent];
      let jsonContent = jsonMatch[1] || salaryContent;
      
      try {
        processedSalaryData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('Error parsing LLM salary response:', parseError);
        processedSalaryData = salaryData;
      }
    } catch (llmError) {
      console.error('Error processing salary data with LLM:', llmError);
      processedSalaryData = salaryData;
    }
    
    // Save the processed salary data to database
    if (apiResponse.status === 'success' && processedSalaryData) {
      const { error } = await supabase
        .from('salary_vectors')
        .insert({
          search_key: salarySearchKey,
          job_title: jobTitle,
          location: location || null,
          salary_data: processedSalaryData,
          search_terms: [jobTitle.toLowerCase(), location ? location.toLowerCase() : ''],
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error saving salary data to database:', error);
      }
    }
    
    // Return enhanced data
    return {
      status: 'success',
      data: processedSalaryData
    };
  } catch (error) {
    console.error('Error fetching salary estimates:', error);
    throw error;
  }
};

/**
 * Setup the necessary Supabase tables and functions if they don't exist
 */
export const setupSupabaseVectorStore = async (): Promise<void> => {
  try {
    // Create job_vectors table if it doesn't exist
    const { error: tableError } = await supabase.rpc('create_job_vectors_table_no_vector', {});
    if (tableError && !tableError.message.includes('already exists')) {
      console.error('Error creating job_vectors table:', tableError);
    }
    
    // Create salary_vectors table if it doesn't exist
    const { error: salaryTableError } = await supabase.rpc('create_salary_vectors_table_no_vector', {});
    if (salaryTableError && !salaryTableError.message.includes('already exists')) {
      console.error('Error creating salary_vectors table:', salaryTableError);
    }
    
    // Create indexes for search
    const { error: indexError } = await supabase.rpc('create_job_search_indexes', {});
    if (indexError && !indexError.message.includes('already exists')) {
      console.error('Error creating search indexes:', indexError);
    }
    
    console.log('Supabase store setup completed');
  } catch (error) {
    console.error('Error setting up Supabase store:', error);
  }
};

// Export a default object that combines the above functionality
export default {
  searchJobs,
  getJobDetails,
  getJobSalaries,
  setupSupabaseVectorStore
};