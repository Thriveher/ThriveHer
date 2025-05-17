import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Interface aligned perfectly with the API structure
interface JobData {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  job_city: string | null;
  job_state: string | null;
  job_country: string | null;
  job_apply_link: string;
  job_employment_type: string | null;
  job_salary_currency: string | null;
  job_salary_min: number | null;
  job_salary_max: number | null;
  job_salary_period: string | null;
  experience_level?: string;
}

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  jobData?: JobData[];
  isJobSearch?: boolean;
  onJobCardPress?: (jobId: string) => void;
}

const MessageBubble = ({
  message,
  isUser,
  timestamp,
  jobData,
  isJobSearch,
  onJobCardPress
}: MessageBubbleProps) => {
  
  // Safe function to open URLs
  const openJobLink = (url: string) => {
    if (!url) return;
    
    // Validate URL format
    try {
      const validUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.canOpenURL(validUrl).then(supported => {
        if (supported) {
          Linking.openURL(validUrl);
        } else {
          console.log("Cannot open URL: " + validUrl);
        }
      }).catch(err => console.error('Error checking link:', err));
    } catch (error) {
      console.error('Invalid URL format:', error);
    }
  };
  
  // Format salary range safely
  const formatSalary = (job: JobData): string => {
    if (job.job_salary_min && job.job_salary_max) {
      const currency = job.job_salary_currency || '$';
      const period = job.job_salary_period ? ` per ${job.job_salary_period}` : '';
      return `${currency}${job.job_salary_min.toLocaleString()}-${job.job_salary_max.toLocaleString()}${period}`;
    }
    return 'Salary not specified';
  };
  
  // Format location safely
  const formatLocation = (job: JobData): string => {
    const locationParts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
    return locationParts.length > 0 ? locationParts.join(', ') : 'Remote/Unspecified';
  };
  
  // If this is a job search response from the bot, render job cards
  if (!isUser && isJobSearch && jobData && jobData.length > 0) {
    return (
      <View style={styles.jobCardsContainer}>
        <Text style={styles.jobResultsTitle}>Job Search Results</Text>
        {jobData.map(job => (
          <View 
            style={styles.jobCard}
            key={job.job_id}
          >
            <View style={styles.jobCardHeader}>
              <View style={styles.logoContainer}>
                {job.employer_logo ? (
                  <Image
                    source={{ uri: job.employer_logo }}
                    style={styles.companyLogo}
                    defaultSource={require('../../assets/images/placeholder-logo.jpeg')}
                  />
                ) : (
                  <View style={styles.placeholderLogo}>
                    <Text style={styles.placeholderText}>
                      {job.employer_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.jobTitleContainer}>
                <Text style={styles.jobTitle} numberOfLines={1}>{job.job_title}</Text>
                <Text style={styles.jobCompany} numberOfLines={1}>{job.employer_name}</Text>
              </View>
            </View>
            
            <View style={styles.jobCardDetails}>
              <View style={styles.jobCardRow}>
                <Feather name="map-pin" size={14} color="#49654E" />
                <Text style={styles.jobLocation} numberOfLines={1}>{formatLocation(job)}</Text>
              </View>
              <View style={styles.jobCardRow}>
                <Feather name="dollar-sign" size={14} color="#49654E" />
                <Text style={styles.jobSalary} numberOfLines={1}>{formatSalary(job)}</Text>
              </View>
              {job.job_employment_type && (
                <View style={styles.jobCardRow}>
                  <Feather name="briefcase" size={14} color="#49654E" />
                  <Text style={styles.jobType} numberOfLines={1}>{job.job_employment_type}</Text>
                </View>
              )}
              {job.experience_level && (
                <View style={styles.jobCardRow}>
                  <Feather name="award" size={14} color="#49654E" />
                  <Text style={styles.jobExperience} numberOfLines={1}>{job.experience_level}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.jobViewButton}
                onPress={() => onJobCardPress && onJobCardPress(job.job_id)}
              >
                <Text style={styles.jobViewText}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.jobApplyButton}
                onPress={() => openJobLink(job.job_apply_link)}
              >
                <Text style={styles.jobApplyText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  }
  
  // If this is a job search request with no results
  if (!isUser && isJobSearch && (!jobData || jobData.length === 0)) {
    return (
      <View style={styles.noJobsContainer}>
        <Text style={styles.noJobsText}>No job results found</Text>
      </View>
    );
  }
  
  // Default message bubble for regular messages
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText
        ]}>
          {message}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        isUser ? styles.userTimestamp : styles.botTimestamp
      ]}>
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: '#8BA889',
    borderColor: '#8BA889',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E7E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#253528',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#49654E',
  },
  botTimestamp: {
    color: '#49654E',
    opacity: 0.7,
  },
  // Job card styles
  jobCardsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
    alignSelf: 'stretch',
    width: '100%',
  },
  jobResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 12,
    marginLeft: 4,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  placeholderLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#49654E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#253528',
  },
  jobCompany: {
    fontSize: 14,
    color: '#49654E',
    marginTop: 2,
  },
  jobCardDetails: {
    marginBottom: 12,
  },
  jobCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  jobLocation: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  jobSalary: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  jobType: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  jobExperience: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobViewButton: {
    flex: 1,
    backgroundColor: '#F0F4F0',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  jobViewText: {
    color: '#49654E',
    fontWeight: '600',
    fontSize: 14,
  },
  jobApplyButton: {
    flex: 1,
    backgroundColor: '#8BA889',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  jobApplyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  noJobsContainer: {
    padding: 16,
    backgroundColor: '#F0F4F0',
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    marginVertical: 8,
  },
  noJobsText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default MessageBubble;