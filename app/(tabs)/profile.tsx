import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Navbar from '../components/navbar';
import ProfileAPI from '../api/getprofile'; // Adjust import path as needed

// Define types for our data
interface Experience {
  title: string;
  company: string;
  companyLogo: string;
  duration: string;
  location: string;
}

interface Education {
  institution: string;
  logo: string;
  degree: string;
  duration: string;
}

interface Project {
  name: string;
  description: string;
}

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface Achievement {
  title: string;
  date: string;
}

interface ProfileData {
  name: string;
  headline: string;
  currentCompany: string;
  location: string;
  profileImage: string;
  about: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  achievements: Achievement[];
}

const ProfileScreen = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    try {
      setError(null);
      const response = await ProfileAPI.getTransformedProfile();
      
      if (response.success && response.data) {
        setProfileData(response.data);
      } else {
        setError(response.error || 'Failed to load profile data');
      }
    } catch (err) {
      setError('Network error occurred while fetching profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const styles = {
    // Container styles
    container: {
      flex: 1,
      backgroundColor: '#f0f7f1', // Very light green background
    },
    scrollView: {
      flex: 1,
    },
    
    // Loading and error states
    centerContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#49654E',
      textAlign: 'center' as const,
    },
    errorContainer: {
      backgroundColor: '#ffebee',
      borderRadius: 8,
      padding: 16,
      margin: 12,
      alignItems: 'center' as const,
    },
    errorText: {
      fontSize: 16,
      color: '#c62828',
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    retryText: {
      fontSize: 14,
      color: '#49654E',
      textAlign: 'center' as const,
    },
    
    // Profile header
    profileHeader: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      margin: 12,
      elevation: 1,
      padding: 16,
    },
    profileImageWrapper: {
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: '#e8f4e9',
    },
    profileInfo: {
      alignItems: 'center' as const,
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      color: '#253528',
      marginBottom: 4,
    },
    headline: {
      fontSize: 16,
      color: '#49654E',
      marginBottom: 12,
      textAlign: 'center' as const,
    },
    infoRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 6,
    },
    infoIcon: {
      marginRight: 8,
    },
    infoText: {
      fontSize: 14,
      color: '#555555',
    },
    
    // Content sections
    section: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      margin: 12,
      marginTop: 0,
      padding: 16,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#253528',
      marginBottom: 12,
    },
    
    // Empty state
    emptyText: {
      fontSize: 14,
      color: '#666666',
      textAlign: 'center' as const,
      fontStyle: 'italic' as const,
    },
    
    // About section
    aboutText: {
      fontSize: 14,
      lineHeight: 22,
      color: '#333333',
      textAlign: 'justify' as const,
    },
    
    // Experience section
    experienceItem: {
      flexDirection: 'row' as const,
      marginBottom: 16,
    },
    companyLogo: {
      width: 40,
      height: 40,
      borderRadius: 4,
      marginRight: 12,
    },
    experienceContent: {
      flex: 1,
    },
    experienceTitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: '#253528',
    },
    companyName: {
      fontSize: 14,
      color: '#49654E',
      marginBottom: 2,
    },
    experienceDetails: {
      flexDirection: 'row' as const,
      marginBottom: 4,
    },
    experienceDuration: {
      fontSize: 12,
      color: '#666666',
    },
    experienceLocation: {
      fontSize: 12,
      color: '#666666',
    },
    
    // Education section
    educationItem: {
      flexDirection: 'row' as const,
      marginBottom: 16,
    },
    educationLogo: {
      width: 40,
      height: 40,
      borderRadius: 4,
      marginRight: 12,
    },
    educationContent: {
      flex: 1,
    },
    institutionName: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: '#253528',
    },
    degree: {
      fontSize: 14,
      color: '#49654E',
      marginBottom: 2,
    },
    educationDuration: {
      fontSize: 12,
      color: '#666666',
    },
    
    // Project section
    projectItem: {
      marginBottom: 16,
    },
    projectName: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: '#253528',
      marginBottom: 4,
    },
    projectDescription: {
      fontSize: 14,
      color: '#333333',
      lineHeight: 20,
    },
    
    // Achievement section
    achievementItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 12,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#253528',
      flex: 1,
    },
    achievementDate: {
      fontSize: 12,
      color: '#666666',
    },
    
    // Skills section
    skillsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
    },
    skillItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: '#e8f4e9',
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      margin: 4,
    },
    skillText: {
      fontSize: 13,
      color: '#49654E',
    },
    skillBadge: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginLeft: 6,
    },
    skillBadgeExpert: {
      backgroundColor: '#49654E',
    },
    skillBadgeAdvanced: {
      backgroundColor: '#78a97e',
    },
    skillBadgeIntermediate: {
      backgroundColor: '#a7cba9',
    },
    skillBadgeBeginner: {
      backgroundColor: '#d8ebd9',
    },
    
    // Bottom spacing for navbar
    navbarSpacing: {
      height: 60,
    },
  };

  const renderExperienceItem = (item: Experience, index: number) => (
    <View key={index} style={styles.experienceItem}>
      <Image source={{ uri: item.companyLogo }} style={styles.companyLogo} />
      <View style={styles.experienceContent}>
        <Text style={styles.experienceTitle}>{item.title}</Text>
        <Text style={styles.companyName}>{item.company}</Text>
        <View style={styles.experienceDetails}>
          <Text style={styles.experienceDuration}>{item.duration}</Text>
          {item.location && <Text style={styles.experienceLocation}> • {item.location}</Text>}
        </View>
      </View>
    </View>
  );

  const renderEducationItem = (item: Education, index: number) => (
    <View key={index} style={styles.educationItem}>
      <Image source={{ uri: item.logo }} style={styles.educationLogo} />
      <View style={styles.educationContent}>
        <Text style={styles.institutionName}>{item.institution}</Text>
        <Text style={styles.degree}>{item.degree}</Text>
        <Text style={styles.educationDuration}>{item.duration}</Text>
      </View>
    </View>
  );

  const renderProjectItem = (item: Project, index: number) => (
    <View key={index} style={styles.projectItem}>
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.projectDescription}>{item.description}</Text>
    </View>
  );

  const renderAchievementItem = (item: Achievement, index: number) => (
    <View key={index} style={styles.achievementItem}>
      <Text style={styles.achievementTitle}>{item.title}</Text>
      <Text style={styles.achievementDate}>{item.date}</Text>
    </View>
  );

  const renderSkillItem = (skill: Skill, index: number) => {
    const badgeStyle = [
      styles.skillBadge,
      skill.level === 'expert' && styles.skillBadgeExpert,
      skill.level === 'advanced' && styles.skillBadgeAdvanced,
      skill.level === 'intermediate' && styles.skillBadgeIntermediate,
      skill.level === 'beginner' && styles.skillBadgeBeginner,
    ];
    
    return (
      <View key={index} style={styles.skillItem}>
        <Text style={styles.skillText}>{skill.name}</Text>
        <View style={badgeStyle} />
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#49654E" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <Navbar />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color="#c62828" />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Pull down to refresh</Text>
          </View>
        </ScrollView>
        <Navbar />
      </View>
    );
  }

  // No profile data state
  if (!profileData) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.centerContainer}>
            <Feather name="user" size={48} color="#49654E" />
            <Text style={styles.loadingText}>No profile data found</Text>
            <Text style={styles.retryText}>Pull down to refresh</Text>
          </View>
        </ScrollView>
        <Navbar />
      </View>
    );
  }

  const {
    name,
    headline,
    currentCompany,
    location,
    profileImage,
    about,
    experience,
    education,
    projects,
    skills,
    achievements
  } = profileData;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          {/* Profile Image */}
          <View style={styles.profileImageWrapper}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          </View>
          
          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.headline}>{headline}</Text>
            
            {currentCompany && (
              <View style={styles.infoRow}>
                <Feather name="briefcase" size={14} color="#49654E" style={styles.infoIcon} />
                <Text style={styles.infoText}>{currentCompany}</Text>
              </View>
            )}
            
            {location && (
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color="#49654E" style={styles.infoIcon} />
                <Text style={styles.infoText}>{location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        {about && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{about}</Text>
          </View>
        )}

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map(renderSkillItem)}
            </View>
          </View>
        )}

        {/* Achievement Section */}
        {achievements && achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {achievements.map(renderAchievementItem)}
          </View>
        )}

        {/* Projects Section */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map(renderProjectItem)}
          </View>
        )}

        {/* Experience Section */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map(renderExperienceItem)}
          </View>
        )}

        {/* Education Section */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map(renderEducationItem)}
          </View>
        )}
        
        {/* Extra space at bottom for navbar */}
        <View style={styles.navbarSpacing} />
      </ScrollView>
      
      {/* Imported Navbar component */}
      <Navbar />
    </View>
  );
};

export default ProfileScreen;