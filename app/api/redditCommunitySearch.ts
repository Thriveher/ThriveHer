// redditCommunitySearch.ts
// Reddit API community search module with OAuth2 authentication

// Interface for Reddit community data
export interface RedditCommunity {
  id: string;
  title: string;
  display_name: string;
  description: string;
  subscribers: number;
  icon_img: string;
}

// Interface for Reddit API token response
interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Interface for Reddit API subreddit search response
interface RedditSearchResponse {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        display_name: string;
        public_description: string;
        subscribers: number;
        icon_img: string;
      };
    }>;
  };
}

// Reddit API credentials from environment variables
const REDDIT_CLIENT_ID = 'OtJ6cXIHCLfB4eb5tAq6Sw';
const REDDIT_CLIENT_SECRET = 'NPxEnHkK3z9FV6vnjjBYk6maKgho1g';
const REDDIT_USER_AGENT = 'ReactNativeApp/1.0';

// Cache for access token to avoid unnecessary authentication requests
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Authenticates with Reddit API using OAuth2 client credentials flow
 * @returns Promise<string> - Access token for API requests
 */
async function authenticateWithReddit(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  try {
    // Prepare authentication request
    const authString = btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`);
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Reddit authentication failed: ${response.status} ${response.statusText}`);
    }

    const tokenData: RedditTokenResponse = await response.json();
    
    // Cache the token and set expiry time
    cachedToken = tokenData.access_token;
    tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
    
    return cachedToken;
  } catch (error) {
    throw new Error(`Failed to authenticate with Reddit API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Searches Reddit communities (subreddits) by query string
 * @param query - Search term for finding relevant subreddits
 * @returns Promise<RedditCommunity[]> - Array of matching Reddit communities
 */
export async function searchRedditCommunities(query: string): Promise<RedditCommunity[]> {
  // Validate input
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Search query must be a non-empty string');
  }

  try {
    // Get authentication token
    const accessToken = await authenticateWithReddit();
    
    // Prepare search request URL with query parameters
    const searchUrl = new URL('https://oauth.reddit.com/subreddits/search');
    searchUrl.searchParams.append('q', query.trim());
    searchUrl.searchParams.append('type', 'sr');
    searchUrl.searchParams.append('sort', 'relevance');
    searchUrl.searchParams.append('limit', '25'); // Limit results for better performance

    // Make API request to search subreddits
    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API request failed: ${response.status} ${response.statusText}`);
    }

    const searchData: RedditSearchResponse = await response.json();
    
    // Transform Reddit API response to our interface format
    const communities: RedditCommunity[] = searchData.data.children.map((child) => ({
      id: child.data.id,
      title: child.data.title || child.data.display_name,
      display_name: child.data.display_name,
      description: child.data.public_description || '',
      subscribers: child.data.subscribers || 0,
      icon_img: child.data.icon_img || '', // May be empty if no icon
    }));

    return communities;
  } catch (error) {
    // Re-throw with more context if it's our custom error, otherwise wrap it
    if (error instanceof Error && error.message.startsWith('Reddit')) {
      throw error;
    }
    throw new Error(`Failed to search Reddit communities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to clear cached authentication token (useful for testing or token refresh)
 */
export function clearAuthCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}


