// JobSearchScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { searchJobs, JobSearchParams } from '../api/getjobs';
import { Ionicons } from '@expo/vector-icons';

// Common job search keywords for suggestions
const JOB_SUGGESTIONS = [
  'Software Developer',
  'Graphic Designer',
  'Data Analyst',
  'Project Manager',
  'UI/UX Designer',
  'Marketing Manager',
  'Web Developer',
  'Content Writer'
];

// Job card component
const JobCard = ({ job }: { job: any }) => {
  return (
    <TouchableOpacity style={styles.jobCard}>
      <View style={styles.jobHeader}>
        {job.employer_logo ? (
          <Image 
            source={{ uri: job.employer_logo }} 
            style={styles.companyLogo} 
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.companyLogo, styles.placeholderLogo]}>
            <Text style={styles.placeholderText}>
              {job.employer_name?.charAt(0) || 'J'}
            </Text>
          </View>
        )}
        <View style={styles.jobHeaderText}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.job_title}</Text>
          <Text style={styles.companyName} numberOfLines={1}>{job.employer_name}</Text>
        </View>
      </View>
      
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailItem}>
          <Ionicons name="briefcase-outline" size={14} color="#49654E" />
          <Text style={styles.jobDetailText}>{job.job_employment_type || 'Not specified'}</Text>
        </View>
        
        {job.job_city && (
          <View style={styles.jobDetailItem}>
            <Ionicons name="location-outline" size={14} color="#49654E" />
            <Text style={styles.jobDetailText}>
              {`${job.job_city}${job.job_state ? `, ${job.job_state}` : ''}`}
            </Text>
          </View>
        )}
        
        {job.job_posted_at_datetime_utc && (
          <View style={styles.jobDetailItem}>
            <Ionicons name="time-outline" size={14} color="#49654E" />
            <Text style={styles.jobDetailText}>
              {new Date(job.job_posted_at_datetime_utc).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>View Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Main component
const JobSearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = JOB_SUGGESTIONS.filter(
        suggestion => suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchQuery]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);
    
    try {
      const params: JobSearchParams = {
        query: searchQuery,
        page: 1,
        numPages: 5,
        country: 'in'
      };
      
      const response = await searchJobs(params);
      
      if (response.status === 'OK' && response.data) {
        setJobResults(response.data);
      } else {
        setError('No results found. Please try a different search term.');
        setJobResults([]);
      }
    } catch (err) {
      setError('An error occurred while searching for jobs. Please try again.');
      setJobResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Select suggestion and search
  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#8BA889" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Search</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={22} color="#49654E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for jobs..."
            placeholderTextColor="#49654E"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(text.length > 0);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#49654E" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {/* Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(suggestion)}
            >
              <Ionicons name="search-outline" size={16} color="#49654E" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#253528" />
          <Text style={styles.loadingText}>Searching jobs...</Text>
        </View>
      )}
      
      {/* Error Message */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#253528" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Job Results */}
      {!isLoading && !error && jobResults.length > 0 && (
        <FlatList
          data={jobResults}
          keyExtractor={(item) => item.job_id}
          renderItem={({ item }) => <JobCard job={item} />}
          contentContainerStyle={styles.jobList}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* No Results */}
      {!isLoading && !error && jobResults.length === 0 && searchQuery.trim() !== '' && (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={64} color="#49654E" />
          <Text style={styles.noResultsText}>No jobs found matching your search.</Text>
          <Text style={styles.noResultsSubtext}>Try adjusting your search terms.</Text>
        </View>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && jobResults.length === 0 && searchQuery.trim() === '' && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="briefcase-outline" size={80} color="#49654E" />
          <Text style={styles.emptyStateTitle}>Find Your Dream Job</Text>
          <Text style={styles.emptyStateText}>
            Search for jobs using the search bar above.
          </Text>
          <View style={styles.quickSearchContainer}>
            <Text style={styles.quickSearchTitle}>Quick Searches:</Text>
            <View style={styles.quickSearchButtonsRow}>
              {['Developer', 'Designer', 'Manager'].map((term, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.quickSearchButton}
                  onPress={() => {
                    setSearchQuery(term);
                    handleSearch();
                  }}
                >
                  <Text style={styles.quickSearchButtonText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BA889',
  },
  header: {
    backgroundColor: '#253528',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F6F3',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#253528',
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#253528',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 12,
    elevation: 1,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -12,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F6F3',
  },
  suggestionText: {
    color: '#253528',
    fontSize: 15,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#253528',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#253528',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  jobList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F2F6F3',
    marginRight: 12,
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#49654E',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  jobHeaderText: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#253528',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#49654E',
  },
  jobDetails: {
    marginBottom: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobDetailText: {
    fontSize: 13,
    color: '#49654E',
    marginLeft: 6,
  },
  applyButton: {
    backgroundColor: '#253528',
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#253528',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 15,
    color: '#49654E',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#253528',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#49654E',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  quickSearchContainer: {
    width: '100%',
    alignItems: 'center',
  },
  quickSearchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#253528',
    marginBottom: 10,
  },
  quickSearchButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  quickSearchButton: {
    backgroundColor: '#49654E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 6,
    borderRadius: 20,
  },
  quickSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default JobSearchScreen;