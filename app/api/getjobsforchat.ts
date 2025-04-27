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

// Base API configuration with hardcoded API key for demo app
const API_BASE_URL = 'https://jsearch.p.rapidapi.com';
const API_KEY = '3fe4222f05mshee7786231fb68c8p1cae9bjsnaeb6f8469718'; // Hardcoded API key for demo
const API_HOST = 'jsearch.p.rapidapi.com';

// Groq configuration
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

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
  
  // API_KEY is now hardcoded, so we only need to check GROQ_API_KEY
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
 * Fetch employer logo from API when it's not available
 * @param employerName - The name of the employer to search for
 * @returns URL to the employer logo or null
 */
const fetchEmployerLogo = async (employerName: string): Promise<string | null> => {
  try {
    // Use a search API to find the company logo
    const searchUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(employerName)}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      console.error(`Error fetching logo for ${employerName}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Return the logo URL if available
    if (data && data.length > 0 && data[0].logo) {
      return data[0].logo;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching logo for ${employerName}:`, error);
    return null;
  }
};

/**
 * Enhance job data with additional information including logos
 * @param jobs - Array of job data to enhance
 * @returns Enhanced job data with logos
 */
const enhanceJobData = async (jobs: JobData[]): Promise<JobData[]> => {
  const enhancedJobs = await Promise.all(jobs.map(async (job: JobData) => {
    // If employer logo is missing, try to fetch it
    if (!job.employer_logo) {
      job.employer_logo = await fetchEmployerLogo(job.employer_name);
    }
    
    return job;
  }));
  
  return enhancedJobs;
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
    
    const data = await response.json() as JobSearchResponse;
    
    // Enhance job data with logos
    data.data = await enhanceJobData(data.data);
    
    return data;
  } catch (error) {
    console.error('Error fetching job search results:', error);
    throw error;
  }
};

/**
 * Search for jobs and process them with LLM
 * @param searchParams - Parameters for the job search query
 * @returns Promise with job search results including processed data
 */
export const searchJobs = async (searchParams: JobSearchParams): Promise<JobSearchResponse> => {
  if (!validateApiKeys()) {
    throw new Error('Required API keys not configured');
  }
  
  try {
    // Fetch from API
    const apiResponse = await fetchJobsFromApi(searchParams);
    
    // Process each job with LLM to extract structured data
    if (apiResponse.status === 'success' && apiResponse.data.length > 0) {
      const processedJobs = await Promise.all(
        apiResponse.data.map(job => processJobWithLLM(job, searchParams.query))
      );
      
      // Return the processed results
      return {
        ...apiResponse,
        data: processedJobs
      };
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
    // Fetch from API
    const url = buildUrl('/job-details', { job_id: jobId });
    const options = getRequestOptions();
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const apiError = await handleApiError(new Error(`HTTP error ${response.status}`), response);
      console.error(`Error fetching job details: ${apiError.message}`);
      throw apiError;
    }
    
    const apiResponse = await response.json();
    
    // Enhance job data with logos
    if (apiResponse.status === 'success' && apiResponse.data.length > 0) {
      apiResponse.data = await enhanceJobData(apiResponse.data);
      
      // Process with LLM for additional structured data
      const processedJobs = await Promise.all(
        apiResponse.data.map((job: JobData) => processJobWithLLM(job, `job_id:${jobId}`))
      );
      
      return {
        ...apiResponse,
        data: processedJobs
      };
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
  
  try {
    // Fetch from API
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
    if (apiResponse.status === 'success' && apiResponse.data) {
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
      
      // Return enhanced data
      return {
        status: 'success',
        data: processedSalaryData
      };
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching salary estimates:', error);
    throw error;
  }
};

// Export a default object that combines the above functionality
export default {
  searchJobs,
  getJobDetails,
  getJobSalaries
};