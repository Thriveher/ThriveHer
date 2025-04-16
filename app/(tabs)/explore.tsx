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
  StatusBar
} from 'react-native';
import { searchJobs, JobSearchParams } from '../api/getjobs';
import { Ionicons } from '@expo/vector-icons';
import BottomNavbar from '../components/navbar';

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
          <Ionicons name="briefcase-outline" size={14} color="#5A7A61" />
          <Text style={styles.jobDetailText}>{job.job_employment_type || 'Not specified'}</Text>
        </View>
        
        {job.job_city && (
          <View style={styles.jobDetailItem}>
            <Ionicons name="location-outline" size={14} color="#5A7A61" />
            <Text style={styles.jobDetailText}>
              {`${job.job_city}${job.job_state ? `, ${job.job_state}` : ''}`}
            </Text>
          </View>
        )}
        
        {job.job_posted_at_datetime_utc && (
          <View style={styles.jobDetailItem}>
            <Ionicons name="time-outline" size={14} color="#5A7A61" />
            <Text style={styles.jobDetailText}>
              {new Date(job.job_posted_at_datetime_utc).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View Details</Text>
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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Auto search functionality
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (searchQuery.trim().length > 2) {
      const timeout = setTimeout(() => {
        handleSearch();
      }, 500);
      
      setSearchTimeout(timeout);
    }
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) return;
    
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
        setError('No results found. Please try different keywords.');
        setJobResults([]);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setJobResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Select suggestion
  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F0F7F1" barStyle="dark-content" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#5A7A61" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for jobs..."
            placeholderTextColor="#5A7A61"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(text.length > 0);
            }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
                setJobResults([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={16} color="#5A7A61" />
            </TouchableOpacity>
          )}
        </View>
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
              <Ionicons name="search-outline" size={14} color="#5A7A61" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Content Area */}
      <View style={styles.contentContainer}>
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#5A7A61" />
            <Text style={styles.loadingText}>Searching jobs...</Text>
          </View>
        )}
        
        {/* Error Message */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#5A7A61" />
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
            <Ionicons name="search-outline" size={40} color="#5A7A61" />
            <Text style={styles.noResultsText}>No jobs found</Text>
            <Text style={styles.noResultsSubtext}>Try different search terms</Text>
          </View>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && jobResults.length === 0 && searchQuery.trim() === '' && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="briefcase-outline" size={50} color="#5A7A61" />
            <Text style={styles.emptyStateTitle}>Find Your Dream Job</Text>
            <Text style={styles.emptyStateText}>
              Start by searching for a job position
            </Text>
            <View style={styles.quickSearchContainer}>
              <View style={styles.quickSearchButtonsRow}>
                {['Developer', 'Designer', 'Manager', 'Engineer', 'Analyst'].map((term, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.quickSearchButton}
                    onPress={() => {
                      setSearchQuery(term);
                    }}
                  >
                    <Text style={styles.quickSearchButtonText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
      
      {/* Bottom Navbar */}
      <View style={styles.navbarContainer}>
        <BottomNavbar />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F1',
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F0F7F1',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#253528',
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    color: '#253528',
    fontSize: 14,
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#253528',
    fontSize: 14,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#253528',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  jobList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyLogo: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5A7A61',
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  jobHeaderText: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#253528',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    color: '#5A7A61',
  },
  jobDetails: {
    marginBottom: 10,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  jobDetailText: {
    fontSize: 12,
    color: '#5A7A61',
    marginLeft: 6,
  },
  viewButton: {
    backgroundColor: '#5A7A61',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#253528',
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#5A7A61',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#253528',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#5A7A61',
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  quickSearchContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  quickSearchButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: 280,
  },
  quickSearchButton: {
    backgroundColor: '#5A7A61',
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderRadius: 16,
  },
  quickSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  navbarContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
});

export default JobSearchScreen;