import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase'; // Import your supabase client
import Navbar from '../components/navbar';
import ProfileAPI from '../api/getprofile';

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
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to navigate to edit profile
  const handleEditProfile = () => {
    router.push('/(tabs)/edit');
  };

  // Function to navigate to onboarding
  const handleGoToOnboarding = () => {
    router.push('/(tabs)/onboard');
  };

  // Function to handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // Function to get company logo URL
  const getCompanyLogoUrl = (companyName: string) => {
    const cleanCompanyName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleanCompanyName}.com`;
  };

  // Function to get education logo URL
  const getEducationLogoUrl = (institutionName: string) => {
    const cleanInstitutionName = institutionName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `https://logo.clearbit.com/${cleanInstitutionName}.edu`;
  };

  const fetchProfileData = async () => {
    try {
      setError(null);
      const response = await ProfileAPI.getTransformedProfile();
      
      if (response.success && response.data) {
        setProfileData(response.data);
      } else {
        // If no profile data exists, redirect to onboarding
        if (response.error === 'No profile found' || 
            response.error === 'Profile not found' || 
            !response.data) {
          router.replace('/(tabs)/onboard');
          return;
        }
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
      backgroundColor: '#f0f7f1',
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
      marginBottom: 16,
    },
    
    // No profile state
    noProfileContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 24,
      margin: 12,
      alignItems: 'center' as const,
      elevation: 1,
    },
    noProfileIcon: {
      marginBottom: 16,
    },
    noProfileTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#253528',
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    noProfileSubtitle: {
      fontSize: 14,
      color: '#666666',
      textAlign: 'center' as const,
      marginBottom: 20,
      lineHeight: 20,
    },
    createProfileButton: {
      backgroundColor: '#49654E',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    createProfileButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600' as const,
      marginLeft: 8,
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
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: '#e8f4e9',
    },
    profileInfo: {
      alignItems: 'center' as const,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: '#253528',
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    currentPosition: {
      fontSize: 16,
      color: '#49654E',
      fontWeight: '500' as const,
      textAlign: 'center' as const,
      marginBottom: 16,
    },
    
    // Edit button styles
    editButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: '#49654E',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 16,
    },
    editButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600' as const,
      marginLeft: 8,
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
      marginBottom: 16,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    sectionTitleIcon: {
      marginRight: 8,
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
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    experienceItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    logoContainer: {
      marginRight: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    companyLogo: {
      width: 48,
      height: 48,
      borderRadius: 8,
    },
    fallbackLogo: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: '#e8f4e9',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    experienceContent: {
      flex: 1,
    },
    experienceTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#253528',
      marginBottom: 4,
    },
    companyName: {
      fontSize: 14,
      color: '#49654E',
      marginBottom: 6,
    },
    experienceDetails: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    experienceDuration: {
      fontSize: 12,
      color: '#666666',
    },
    experienceLocation: {
      fontSize: 12,
      color: '#666666',
    },
    detailSeparator: {
      marginHorizontal: 6,
      color: '#666666',
    },
    
    // Education section
    educationItem: {
      flexDirection: 'row' as const,
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    educationItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    educationLogo: {
      width: 48,
      height: 48,
      borderRadius: 8,
    },
    educationContent: {
      flex: 1,
    },
    institutionName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#253528',
      marginBottom: 4,
    },
    degree: {
      fontSize: 14,
      color: '#49654E',
      marginBottom: 6,
    },
    educationDuration: {
      fontSize: 12,
      color: '#666666',
    },
    
    // Project section
    projectCard: {
      backgroundColor: '#f8fdf9',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#49654E',
    },
    projectCardLast: {
      marginBottom: 0,
    },
    projectHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    projectIcon: {
      marginRight: 8,
    },
    projectName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#253528',
      flex: 1,
    },
    projectDescription: {
      fontSize: 14,
      color: '#333333',
      lineHeight: 20,
      textAlign: 'justify' as const,
    },
    
    // Achievement section
    achievementItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    achievementItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    achievementTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#253528',
      flex: 1,
      marginRight: 8,
    },
    achievementDate: {
      fontSize: 12,
      color: '#666666',
    },
    
    // Skills section
    skillsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginTop: -4,
    },
    skillItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: '#e8f4e9',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      margin: 4,
    },
    skillText: {
      fontSize: 13,
      color: '#49654E',
      fontWeight: '500' as const,
    },
    skillBadge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    skillBadgeExpert: {
      backgroundColor: '#253528',
    },
    skillBadgeAdvanced: {
      backgroundColor: '#49654E',
    },
    skillBadgeIntermediate: {
      backgroundColor: '#78a97e',
    },
    skillBadgeBeginner: {
      backgroundColor: '#a7cba9',
    },
    
    // Sign out section
    signOutContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      margin: 12,
      marginTop: 0,
      padding: 16,
      elevation: 1,
      alignItems: 'center' as const,
    },
    signOutButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    signOutText: {
      fontSize: 16,
      color: '#dc3545',
      fontWeight: '500' as const,
    },
    
    // Bottom spacing for navbar
    navbarSpacing: {
      height: 60,
    },
  };

  const renderSectionTitle = (title: string, iconName: string) => (
    <View style={styles.sectionTitle}>
      <Feather name={iconName as any} size={18} color="#49654E" style={styles.sectionTitleIcon} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#253528' }}>{title}</Text>
    </View>
  );

  const renderExperienceItem = (item: Experience, index: number, isLast: boolean) => (
    <View key={index} style={[styles.experienceItem, isLast && styles.experienceItemLast]}>
      <View style={styles.logoContainer}>
        {item.companyLogo ? (
          <Image 
            source={{ uri: item.companyLogo }} 
            style={styles.companyLogo}
            onError={() => {
              // Fallback to auto-generated logo
              const autoLogo = getCompanyLogoUrl(item.company);
              // You might need to implement a fallback mechanism here
            }}
          />
        ) : (
          <View style={styles.fallbackLogo}>
            <Feather name="briefcase" size={20} color="#49654E" />
          </View>
        )}
      </View>
      <View style={styles.experienceContent}>
        <Text style={styles.experienceTitle}>{item.title}</Text>
        <Text style={styles.companyName}>{item.company}</Text>
        <View style={styles.experienceDetails}>
          <Feather name="calendar" size={12} color="#666666" style={{ marginRight: 4 }} />
          <Text style={styles.experienceDuration}>{item.duration}</Text>
          {item.location && (
            <>
              <Text style={styles.detailSeparator}>•</Text>
              <Feather name="map-pin" size={12} color="#666666" style={{ marginRight: 4 }} />
              <Text style={styles.experienceLocation}>{item.location}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const renderEducationItem = (item: Education, index: number, isLast: boolean) => (
    <View key={index} style={[styles.educationItem, isLast && styles.educationItemLast]}>
      <View style={styles.logoContainer}>
        {item.logo ? (
          <Image 
            source={{ uri: item.logo }} 
            style={styles.educationLogo}
            onError={() => {
              // Fallback to auto-generated logo
              const autoLogo = getEducationLogoUrl(item.institution);
              // You might need to implement a fallback mechanism here
            }}
          />
        ) : (
          <View style={styles.fallbackLogo}>
            <Feather name="book" size={20} color="#49654E" />
          </View>
        )}
      </View>
      <View style={styles.educationContent}>
        <Text style={styles.institutionName}>{item.institution}</Text>
        <Text style={styles.degree}>{item.degree}</Text>
        <View style={styles.experienceDetails}>
          <Feather name="calendar" size={12} color="#666666" style={{ marginRight: 4 }} />
          <Text style={styles.educationDuration}>{item.duration}</Text>
        </View>
      </View>
    </View>
  );

  const renderProjectItem = (item: Project, index: number, isLast: boolean) => (
    <View key={index} style={[styles.projectCard, isLast && styles.projectCardLast]}>
      <View style={styles.projectHeader}>
        <Feather name="code" size={16} color="#49654E" style={styles.projectIcon} />
        <Text style={styles.projectName}>{item.name}</Text>
      </View>
      <Text style={styles.projectDescription}>{item.description}</Text>
    </View>
  );

  const renderAchievementItem = (item: Achievement, index: number, isLast: boolean) => (
    <View key={index} style={[styles.achievementItem, isLast && styles.achievementItemLast]}>
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

  // No profile data state - Show onboarding option
  if (!profileData) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.noProfileContainer}>
            <Feather name="user-plus" size={64} color="#49654E" style={styles.noProfileIcon} />
            <Text style={styles.noProfileTitle}>Welcome to Your Profile!</Text>
            <Text style={styles.noProfileSubtitle}>
              It looks like you haven't set up your profile yet. Let's get started by creating your professional profile.
            </Text>
            <TouchableOpacity style={styles.createProfileButton} onPress={handleGoToOnboarding}>
              <Feather name="plus" size={16} color="#ffffff" />
              <Text style={styles.createProfileButtonText}>Create Profile</Text>
            </TouchableOpacity>
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
          <View style={styles.profileImageWrapper}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{name}</Text>
            {currentCompany && (
              <Text style={styles.currentPosition}>{currentCompany}</Text>
            )}
          </View>

          {/* Edit Button */}
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Feather name="edit" size={16} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        {about && (
          <View style={styles.section}>
            {renderSectionTitle('About', 'user')}
            <Text style={styles.aboutText}>{about}</Text>
          </View>
        )}

        {/* Skills Section */}
        {skills && skills.length > 0 && (
          <View style={styles.section}>
            {renderSectionTitle('Skills', 'zap')}
            <View style={styles.skillsContainer}>
              {skills.map(renderSkillItem)}
            </View>
          </View>
        )}

        {/* Achievements Section - Only show if achievements exist and have data */}
        {achievements && achievements.length > 0 && (
          <View style={styles.section}>
            {renderSectionTitle('Achievements', 'award')}
            {achievements.map((item, index) => 
              renderAchievementItem(item, index, index === achievements.length - 1)
            )}
          </View>
        )}

        {/* Projects Section */}
        {projects && projects.length > 0 && (
          <View style={styles.section}>
            {renderSectionTitle('Projects', 'folder')}
            {projects.map((item, index) => 
              renderProjectItem(item, index, index === projects.length - 1)
            )}
          </View>
        )}

        {/* Experience Section */}
        {experience && experience.length > 0 && (
          <View style={styles.section}>
            {renderSectionTitle('Experience', 'briefcase')}
            {experience.map((item, index) => 
              renderExperienceItem(item, index, index === experience.length - 1)
            )}
          </View>
        )}

        {/* Education Section */}
        {education && education.length > 0 && (
          <View style={styles.section}>
            {renderSectionTitle('Education', 'book')}
            {education.map((item, index) => 
              renderEducationItem(item, index, index === education.length - 1)
            )}
          </View>
        )}

        {/* Sign Out Section */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.navbarSpacing} />
      </ScrollView>
      
      <Navbar />
    </View>
  );
};

export default ProfileScreen;