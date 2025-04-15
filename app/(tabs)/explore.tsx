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
import BottomNavbar from '../components/navbar'; // Import the navbar component

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
      <StatusBar backgroundColor="#E8F5E9" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Search</Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#49654E" style={styles.searchIcon} />
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
              <Ionicons name="close-circle" size={16} color="#49654E" />
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
              <Ionicons name="search-outline" size={14} color="#49654E" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#49654E" />
          <Text style={styles.loadingText}>Searching jobs...</Text>
        </View>
      )}
      
      {/* Error Message */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#49654E" />
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
          <Ionicons name="search-outline" size={40} color="#49654E" />
          <Text style={styles.noResultsText}>No jobs found</Text>
          <Text style={styles.noResultsSubtext}>Try different search terms</Text>
        </View>
      )}
      
      {/* Empty State */}
      {!isLoading && !error && jobResults.length === 0 && searchQuery.trim() === '' && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="briefcase-outline" size={60} color="#49654E" />
          <Text style={styles.emptyStateTitle}>Find Your Dream Job</Text>
          <Text style={styles.emptyStateText}>
            Start by searching for a job position
          </Text>
          <View style={styles.quickSearchContainer}>
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
      
      {/* Bottom Navbar */}
      <BottomNavbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  header: {
    backgroundColor: '#49654E',
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
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
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    marginTop: -6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
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
    paddingBottom: 80, // Add bottom padding for the navbar
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  placeholderLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#49654E',
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
    fontWeight: '600',
    color: '#253528',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 13,
    color: '#49654E',
  },
  jobDetails: {
    marginBottom: 10,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  jobDetailText: {
    fontSize: 12,
    color: '#49654E',
    marginLeft: 6,
  },
  viewButton: {
    backgroundColor: '#49654E',
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
    fontWeight: '600',
    color: '#253528',
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#49654E',
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
    fontWeight: '600',
    color: '#253528',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#49654E',
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 20,
  },
  quickSearchContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  quickSearchButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickSearchButton: {
    backgroundColor: '#49654E',
    paddingHorizontal: 14,
    paddingVertical: 6,
    margin: 4,
    borderRadius: 16,
  },
  quickSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default JobSearchScreen;