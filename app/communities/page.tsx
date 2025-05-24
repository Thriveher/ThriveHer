

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { searchRedditCommunities, RedditCommunity } from '@/app/api/redditCommunitySearch';

// Interface for component state
interface SearchState {
  query: string;
  communities: RedditCommunity[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}

/**
 * Reddit Community Search Screen Component
 * Allows users to search for Reddit communities/subreddits and displays results
 */
const RedditCommunitySearchScreen: React.FC = () => {
  // Component state using useState hook
  const [state, setState] = useState<SearchState>({
    query: '',
    communities: [],
    loading: false,
    error: null,
    hasSearched: false,
  });

  /**
   * Formats subscriber count with appropriate suffixes (k, M)
   * @param count - Number of subscribers
   * @returns Formatted string (e.g., "12.3k", "1.2M")
   */
  const formatSubscriberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  /**
   * Truncates text to specified length with ellipsis
   * @param text - Text to truncate
   * @param maxLength - Maximum character length
   * @returns Truncated text
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  /**
   * Handles the search functionality
   * Makes API call to Reddit and updates component state
   */
  const handleSearch = useCallback(async () => {
    // Validate search query
    if (!state.query.trim()) {
      Alert.alert('Invalid Search', 'Please enter a search term');
      return;
    }

    // Set loading state
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      hasSearched: true,
    }));

    try {
      // Call Reddit API search function
      const communities = await searchRedditCommunities(state.query.trim());
      
      // Update state with results
      setState(prev => ({
        ...prev,
        communities,
        loading: false,
        error: null,
      }));
    } catch (error) {
      // Handle search errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      setState(prev => ({
        ...prev,
        communities: [],
        loading: false,
        error: errorMessage,
      }));

      // Show error alert to user
      Alert.alert('Search Error', errorMessage);
    }
  }, [state.query]);

  /**
   * Handles text input changes
   * @param text - New input text
   */
  const handleQueryChange = (text: string) => {
    setState(prev => ({ ...prev, query: text }));
  };

  /**
   * Renders individual subreddit item in the list
   * @param item - RedditCommunity object
   * @returns JSX element for list item
   */
  const renderCommunityItem = ({ item }: { item: RedditCommunity }) => (
    <TouchableOpacity style={styles.communityItem} activeOpacity={0.7}>
      <View style={styles.communityContent}>
        {/* Subreddit icon or placeholder */}
        <View style={styles.iconContainer}>
          {item.icon_img ? (
            <Image
              source={{ uri: item.icon_img }}
              style={styles.communityIcon}
              defaultSource={require('../../assets/default-subreddit-icon.png')} // Add default icon to assets
            />
          ) : (
            <View style={styles.placeholderIcon}>
              <Text style={styles.placeholderText}>r/</Text>
            </View>
          )}
        </View>

        {/* Community information */}
        <View style={styles.communityInfo}>
          <Text style={styles.displayName}>r/{item.display_name}</Text>
          <Text style={styles.title}>{truncateText(item.title, 50)}</Text>
          {item.description && (
            <Text style={styles.description}>
              {truncateText(item.description, 100)}
            </Text>
          )}
          <Text style={styles.subscribers}>
            {formatSubscriberCount(item.subscribers)} members
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Renders empty state when no results found
   */
  const renderEmptyState = () => {
    if (state.loading) return null;
    
    if (!state.hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Search for Reddit communities to get started
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          No communities found for "{state.query}"
        </Text>
        <Text style={styles.emptyStateSubtext}>
          Try searching with different keywords
        </Text>
      </View>
    );
  };

  /**
   * Key extractor for FlatList optimization
   */
  const keyExtractor = (item: RedditCommunity) => item.id;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reddit Communities</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search communities (e.g., react, gaming, music)"
              placeholderTextColor="#999"
              value={state.query}
              onChangeText={handleQueryChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.searchButton,
                state.loading && styles.searchButtonDisabled
              ]}
              onPress={handleSearch}
              disabled={state.loading}
              activeOpacity={0.8}
            >
              {state.loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsSection}>
          {state.loading && state.communities.length === 0 ? (
            // Loading state for initial search
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff4500" />
              <Text style={styles.loadingText}>Searching communities...</Text>
            </View>
          ) : (
            // Community list or empty state
            <FlatList
              data={state.communities}
              renderItem={renderCommunityItem}
              keyExtractor={keyExtractor}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={state.loading && state.communities.length > 0}
              onRefresh={handleSearch}
            />
          )}
        </View>

        {/* Error message (if any) */}
        {state.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Styles using StyleSheet for better performance and organization
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ff4500',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f6f8fa',
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#ff4500',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#ccc',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    flexGrow: 1,
  },
  communityItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  communityContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
  },
  communityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1b',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#1a1a1b',
    marginBottom: 4,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  subscribers: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RedditCommunitySearchScreen;
