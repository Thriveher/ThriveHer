import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  applyLink: string;
  logoUrl: string;
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
  
  // If this is a job search response from the bot, render job cards
  if (!isUser && isJobSearch && jobData && jobData.length > 0) {
    return (
      <View style={styles.jobCardsContainer}>
        <Text style={styles.jobResultsTitle}>Job Search Results</Text>
        {jobData.map(job => (
          <TouchableOpacity 
            style={styles.jobCard}
            onPress={() => onJobCardPress && onJobCardPress(job.id)}
            key={job.id}
          >
            <View style={styles.jobCardHeader}>
              <View style={styles.logoContainer}>
                <Image
                  source={{ uri: job.logoUrl }}
                  style={styles.companyLogo}
                  defaultSource={require('../../assets/images/placeholder-logo.jpeg')}
                  onError={(e) => console.log('Error loading logo', e.nativeEvent.error)}
                />
              </View>
              <View style={styles.jobTitleContainer}>
                <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                <Text style={styles.jobCompany} numberOfLines={1}>{job.company}</Text>
              </View>
            </View>
            <View style={styles.jobCardDetails}>
              <View style={styles.jobCardRow}>
                <Feather name="map-pin" size={14} color="#49654E" />
                <Text style={styles.jobLocation} numberOfLines={1}>{job.location}</Text>
              </View>
              <View style={styles.jobCardRow}>
                <Feather name="dollar-sign" size={14} color="#49654E" />
                <Text style={styles.jobSalary} numberOfLines={1}>{job.salary}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.jobApplyButton}
              onPress={() => {
                // This would be handled by parent component
                if (onJobCardPress) onJobCardPress(job.id);
              }}
            >
              <Text style={styles.jobApplyText}>Apply</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  jobApplyButton: {
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