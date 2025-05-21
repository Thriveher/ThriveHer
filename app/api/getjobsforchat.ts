// Define TypeScript interfaces for the API response
interface JobSearchParams {
  query: string;
  page?: number;
  numPages?: number;
  country?: string;
  datePosted?: string;
  language?: string;
  location?: string;
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

// Base API configuration with hardcoded API key for demo app
const API_BASE_URL = 'https://jsearch.p.rapidapi.com';
const API_KEY = '3fe4222f05mshee7786231fb68c8p1cae9bjsnaeb6f8469718'; // Hardcoded API key for demo
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
 * Search for jobs by job title and location
 * @param jobTitle - The job title to search for
 * @param location - The location to search in (optional)
 * @param page - Page number for pagination (default: 1)
 * @param numPages - Number of pages to fetch (default: 1)
 * @param country - Country code to search in (default: 'in')
 * @param datePosted - Filter by date posted (default: 'all')
 * @returns Promise with job search results
 */
export const searchJobs = async (
  jobTitle: string, 
  location?: string, 
  page: number = 1, 
  numPages: number = 1,
  country: string = 'in',
  datePosted: string = 'all'
): Promise<JobSearchResponse> => {
  try {
    // Build search query with location if provided
    let query = jobTitle;
    if (location) {
      query = `${jobTitle} in ${location}`;
    }
    
    // Set up search parameters
    const params = {
      query,
      page,
      num_pages: numPages,
      country,
      date_posted: datePosted,
      language: 'en'
    };
    
    const url = buildUrl('/search', params);
    const options = getRequestOptions();
    
    // Make API request
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
    }
    
    return apiResponse;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
};

// Export a default object that combines the above functionality
export default {
  searchJobs,
  getJobDetails
};