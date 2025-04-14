// jobSearchApi.ts

import axios from 'axios';

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

/**
 * Search for jobs using the jSearch RapidAPI
 * @param searchParams - Parameters for the job search query
 * @returns Promise with job search results
 */
export const searchJobs = async (searchParams: JobSearchParams): Promise<JobSearchResponse> => {
  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: searchParams.query,
        page: searchParams.page || 1,
        num_pages: searchParams.numPages || 1,
        country: searchParams.country || 'us',
        date_posted: searchParams.datePosted || 'all',
        language: searchParams.language || 'en'
      },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY
      }
    });

    return response.data;
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
  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/job-details', {
      params: {
        job_id: jobId
      },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY
      }
    });

    return response.data;
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
  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/estimated-salary', {
      params: {
        job_title: jobTitle,
        location: location || '',
        radius: '100'
      },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching salary estimates:', error);
    throw error;
  }
};

// Export a default function that combines the above functionality
export default {
  searchJobs,
  getJobDetails,
  getJobSalaries
};