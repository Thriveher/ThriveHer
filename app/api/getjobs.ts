// jobSearchApi.ts

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

// Base API configuration
const API_BASE_URL = 'https://jsearch.p.rapidapi.com';
const API_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '050d270b0amshe7e983a2e9b8dcbp140f54jsn48788648a45a'; // Fallback to provided key for testing
const API_HOST = 'jsearch.p.rapidapi.com';

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
 * Validates API key is available
 * @returns boolean indicating if API key is set
 */
const validateApiKey = (): boolean => {
  if (!API_KEY) {
    console.error('API key is not configured');
    return false;
  }
  return true;
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
 * Search for jobs using the jSearch RapidAPI
 * @param searchParams - Parameters for the job search query
 * @returns Promise with job search results
 */
export const searchJobs = async (searchParams: JobSearchParams): Promise<JobSearchResponse> => {
  if (!validateApiKey()) {
    throw new Error('API key not configured');
  }

  const params = {
    query: searchParams.query,
    page: searchParams.page || 1,
    num_pages: searchParams.numPages || 1,
    country: searchParams.country || 'us',
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
 * Get job details by job ID
 * @param jobId - The unique job identifier
 * @returns Promise with job details
 */
export const getJobDetails = async (jobId: string): Promise<any> => {
  if (!validateApiKey()) {
    throw new Error('API key not configured');
  }

  const url = buildUrl('/job-details', { job_id: jobId });
  const options = getRequestOptions();

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const apiError = await handleApiError(new Error(`HTTP error ${response.status}`), response);
      console.error(`Error fetching job details: ${apiError.message}`);
      throw apiError;
    }
    
    return await response.json();
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
  if (!validateApiKey()) {
    throw new Error('API key not configured');
  }

  const url = buildUrl('/estimated-salary', {
    job_title: jobTitle,
    location: location || '',
    radius: '100'
  });
  const options = getRequestOptions();

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const apiError = await handleApiError(new Error(`HTTP error ${response.status}`), response);
      console.error(`Error fetching salary estimates: ${apiError.message}`);
      throw apiError;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching salary estimates:', error);
    throw error;
  }
};

/**
 * Example usage:
 * 
 * // Search for jobs
 * const searchResults = await searchJobs({ 
 *   query: 'developer jobs in chicago',
 *   country: 'us'
 * });
 * 
 * // Get job details
 * const jobDetails = await getJobDetails('some-job-id');
 * 
 * // Get salary estimates
 * const salaryData = await getJobSalaries('software developer', 'San Francisco');
 */

// Export a default object that combines the above functionality
export default {
  searchJobs,
  getJobDetails,
  getJobSalaries
};