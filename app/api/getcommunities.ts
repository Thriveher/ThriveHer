interface SubredditResult {
  name: string;
  displayName: string;
  title: string;
  description: string;
  subscribers: number;
  url: string;
  fullUrl: string;
  isNsfw: boolean;
  category: string;
  created: number;
}

interface RedditSearchResponse {
  communities: SubredditResult[];
  totalFound: number;
  query: string;
}

// Hardcoded Reddit API credentials
const REDDIT_CONFIG = {
  CLIENT_ID: 'KpkMk-lm0rBBC0-Hvtfs4Q',
  CLIENT_SECRET: 'pJEGTk6t6BjKhm3FqMLYkzH-ibHAZA',
  USER_AGENT: 'CommunityFinder/1.0.0 by YourUsername',
  USERNAME: 'Ok_Present241',
  PASSWORD: 'HerKey@123'
};

/**
 * Get Reddit OAuth access token
 */
async function getRedditAccessToken(): Promise<string> {
  const auth = btoa(`${REDDIT_CONFIG.CLIENT_ID}:${REDDIT_CONFIG.CLIENT_SECRET}`);
  
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_CONFIG.USER_AGENT
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: REDDIT_CONFIG.USERNAME,
      password: REDDIT_CONFIG.PASSWORD
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Search for subreddits using Reddit's search API
 */
async function searchSubreddits(query: string, accessToken: string, limit: number = 25): Promise<any> {
  const searchUrl = `https://oauth.reddit.com/subreddits/search?q=${encodeURIComponent(query)}&type=sr&sort=relevance&limit=${limit}&include_over_18=false`;
  
  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': REDDIT_CONFIG.USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to search subreddits: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search for Reddit communities based on keywords (Safe for Work only)
 * @param keywords - Search query/keywords to find relevant communities
 * @param maxResults - Maximum number of results to return (default: 20)
 * @returns Promise<RedditSearchResponse> - Array of community details and links
 */
export async function findRedditCommunities(
  keywords: string, 
  maxResults: number = 20
): Promise<RedditSearchResponse> {
  try {
    // Get access token
    const accessToken = await getRedditAccessToken();
    
    // Search for subreddits
    const searchResults = await searchSubreddits(keywords, accessToken, maxResults);
    
    // Process and filter results (SFW only)
    const communities: SubredditResult[] = searchResults.data.children
      .map((child: any) => {
        const subreddit = child.data;
        return {
          name: subreddit.name,
          displayName: subreddit.display_name,
          title: subreddit.title || subreddit.display_name,
          description: subreddit.public_description || subreddit.description || 'No description available',
          subscribers: subreddit.subscribers || 0,
          url: `/r/${subreddit.display_name}`,
          fullUrl: `https://www.reddit.com/r/${subreddit.display_name}`,
          isNsfw: subreddit.over18 || false,
          category: subreddit.subreddit_type || 'public',
          created: subreddit.created_utc || 0
        };
      })
      .filter((community: SubredditResult) => !community.isNsfw) // Filter out NSFW content
      .slice(0, maxResults);

    return {
      communities,
      totalFound: communities.length,
      query: keywords
    };

  } catch (error) {
    console.error('Error searching Reddit communities:', error);
    throw new Error(`Failed to search Reddit communities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get detailed information about a specific subreddit
 * @param subredditName - Name of the subreddit (without r/ prefix)
 * @returns Promise<SubredditResult | null> - Detailed subreddit information
 */
export async function getSubredditDetails(subredditName: string): Promise<SubredditResult | null> {
  try {
    const accessToken = await getRedditAccessToken();
    
    const response = await fetch(`https://oauth.reddit.com/r/${subredditName}/about`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': REDDIT_CONFIG.USER_AGENT
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const subreddit = data.data;

    // Return null if NSFW
    if (subreddit.over18) {
      return null;
    }

    return {
      name: subreddit.name,
      displayName: subreddit.display_name,
      title: subreddit.title || subreddit.display_name,
      description: subreddit.public_description || subreddit.description || 'No description available',
      subscribers: subreddit.subscribers || 0,
      url: `/r/${subreddit.display_name}`,
      fullUrl: `https://www.reddit.com/r/${subreddit.display_name}`,
      isNsfw: subreddit.over18 || false,
      category: subreddit.subreddit_type || 'public',
      created: subreddit.created_utc || 0
    };

  } catch (error) {
    console.error('Error getting subreddit details:', error);
    return null;
  }
}

/**
 * Example usage function
 */
export async function exampleUsage() {
  try {
    // Search for programming communities
    const programmingCommunities = await findRedditCommunities('programming javascript', 10);
    
    console.log(`Found ${programmingCommunities.totalFound} programming communities:`);
    programmingCommunities.communities.forEach(community => {
      console.log(`- ${community.displayName}: ${community.title}`);
      console.log(`  Subscribers: ${community.subscribers.toLocaleString()}`);
      console.log(`  Link: ${community.fullUrl}`);
      console.log(`  Description: ${community.description.substring(0, 100)}...`);
      console.log('');
    });

    // Get details for a specific subreddit
    const reactDetails = await getSubredditDetails('reactjs');
    if (reactDetails) {
      console.log('React.js Subreddit Details:');
      console.log(`- Name: ${reactDetails.displayName}`);
      console.log(`- Subscribers: ${reactDetails.subscribers.toLocaleString()}`);
      console.log(`- Link: ${reactDetails.fullUrl}`);
    }

  } catch (error) {
    console.error('Example usage failed:', error);
  }
}

// Export the main function as default
export default findRedditCommunities;