import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Define types for our data
interface Experience {
  title: string;
  company: string;
  companyLogo: string;
  duration: string;
  location: string;
  description: string;
}

interface Education {
  institution: string;
  logo: string;
  degree: string;
  duration: string;
}

interface Recommendation {
  name: string;
  title: string;
  image: string;
  text: string;
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
  skills: string[];
  accomplishments: string[];
  recommendations: Recommendation[];
  connectionCount?: number;
}

const ProfileScreen = () => {
  // Assume profileData is imported from elsewhere
  const profileData = {
    name: "Jane Doe",
    headline: "UX Designer & Developer",
    currentCompany: "Tech Innovations Inc.",
    location: "San Francisco, CA",
    profileImage: "https://example.com/profile.jpg",
    about: "Passionate designer with over 5 years experience creating intuitive digital experiences.",
    experience: [
      {
        title: "Senior UX Designer",
        company: "Tech Innovations Inc.",
        companyLogo: "https://example.com/tech.png",
        duration: "Jan 2022 - Present",
        location: "San Francisco, CA",
        description: "Leading design initiatives for flagship products and mentoring junior designers."
      }
    ],
    education: [
      {
        institution: "Design University",
        logo: "https://example.com/uni.png",
        degree: "Master of Design",
        duration: "2018 - 2020"
      }
    ],
    skills: ["UX Design", "UI Design", "Prototyping", "User Research", "Figma", "React Native"],
    accomplishments: [
      "Best Designer Award 2023",
      "Published in UX Magazine",
      "Speaker at Design Conference 2022"
    ],
    recommendations: [
      {
        name: "John Smith",
        title: "Product Manager at Tech Co",
        image: "https://example.com/john.jpg",
        text: "Jane is an exceptional designer who brings both creativity and strategic thinking."
      }
    ],
    connectionCount: 500
  };

  const {
    name,
    headline,
    currentCompany,
    location,
    profileImage,
    about,
    experience,
    education,
    skills,
    accomplishments,
    recommendations,
    connectionCount = 500
  } = profileData;

  const styles = {
    // Container styles
    container: {
      flex: 1,
      backgroundColor: '#f0f7f1', // Very light green background
    },
    scrollView: {
      flex: 1,
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
      alignItems: 'center',
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
      alignItems: 'center',
    },
    name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#253528',
      marginBottom: 4,
    },
    headline: {
      fontSize: 16,
      color: '#49654E',
      marginBottom: 12,
      textAlign: 'center',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    infoIcon: {
      marginRight: 8,
    },
    infoText: {
      fontSize: 14,
      color: '#555555',
    },
    
    // Action buttons
    actionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    primaryButton: {
      backgroundColor: '#49654E',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginRight: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '500',
    },
    secondaryButton: {
      backgroundColor: '#e8f4e9',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginLeft: 8,
    },
    secondaryButtonText: {
      color: '#253528',
      fontWeight: '500',
    },
    buttonIconSpacing: {
      marginRight: 8,
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
      fontWeight: '600',
      color: '#253528',
      marginBottom: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    
    // About section
    aboutText: {
      fontSize: 14,
      lineHeight: 22,
      color: '#333333',
      textAlign: 'justify',
    },
    
    // Experience section
    experienceItem: {
      flexDirection: 'row',
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
      fontWeight: '500',
      color: '#253528',
    },
    companyName: {
      fontSize: 14,
      color: '#49654E',
      marginBottom: 2,
    },
    experienceDetails: {
      flexDirection: 'row',
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
    experienceDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: '#333333',
      textAlign: 'justify',
    },
    
    // Education section
    educationItem: {
      flexDirection: 'row',
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
      fontWeight: '500',
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
    
    // Skills section
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillItem: {
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
    
    // Accomplishments section
    accomplishmentItem: {
      fontSize: 14,
      lineHeight: 22,
      color: '#333333',
      marginBottom: 8,
      textAlign: 'justify',
    },
    
    // Recommendations section
    recommendationItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    recommenderImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    recommendationContent: {
      flex: 1,
    },
    recommenderName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#253528',
    },
    recommenderTitle: {
      fontSize: 12,
      color: '#666666',
      marginBottom: 4,
    },
    recommendationText: {
      fontSize: 14,
      fontStyle: 'italic',
      lineHeight: 20,
      color: '#333333',
      textAlign: 'justify',
    },
    
    // Bottom spacing for navbar
    navbarSpacing: {
      height: 60,
    },
    navbarWrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      elevation: 8,
    },
  };

  const renderExperienceItem = (item, index) => (
    <View key={index} style={styles.experienceItem}>
      <Image source={{ uri: item.companyLogo }} style={styles.companyLogo} />
      <View style={styles.experienceContent}>
        <Text style={styles.experienceTitle}>{item.title}</Text>
        <Text style={styles.companyName}>{item.company}</Text>
        <View style={styles.experienceDetails}>
          <Text style={styles.experienceDuration}>{item.duration}</Text>
          <Text style={styles.experienceLocation}> • {item.location}</Text>
        </View>
        <Text style={styles.experienceDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderEducationItem = (item, index) => (
    <View key={index} style={styles.educationItem}>
      <Image source={{ uri: item.logo }} style={styles.educationLogo} />
      <View style={styles.educationContent}>
        <Text style={styles.institutionName}>{item.institution}</Text>
        <Text style={styles.degree}>{item.degree}</Text>
        <Text style={styles.educationDuration}>{item.duration}</Text>
      </View>
    </View>
  );

  const renderSkillItem = (skill, index) => (
    <View key={index} style={styles.skillItem}>
      <Text style={styles.skillText}>{skill}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            
            <View style={styles.infoRow}>
              <Feather name="briefcase" size={14} color="#49654E" style={styles.infoIcon} />
              <Text style={styles.infoText}>{currentCompany}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={14} color="#49654E" style={styles.infoIcon} />
              <Text style={styles.infoText}>{location}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="users" size={14} color="#49654E" style={styles.infoIcon} />
              <Text style={styles.infoText}>{connectionCount} connections</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Feather name="message-circle" size={16} color="#FFFFFF" style={styles.buttonIconSpacing} />
              <Text style={styles.primaryButtonText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Feather name="user-plus" size={16} color="#253528" style={styles.buttonIconSpacing} />
              <Text style={styles.secondaryButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{about}</Text>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {experience.map(renderExperienceItem)}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {education.map(renderEducationItem)}
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {skills.map(renderSkillItem)}
          </View>
        </View>

        {/* Accomplishments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accomplishments</Text>
          {accomplishments.map((item, index) => (
            <Text key={index} style={styles.accomplishmentItem}>• {item}</Text>
          ))}
        </View>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations.map((item, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Image source={{ uri: item.image }} style={styles.recommenderImage} />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommenderName}>{item.name}</Text>
                <Text style={styles.recommenderTitle}>{item.title}</Text>
                <Text style={styles.recommendationText}>"{item.text}"</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Extra space at bottom for navbar */}
        <View style={styles.navbarSpacing} />
      </ScrollView>
      
      {/* Navbar placeholder - actual Navbar component would be imported */}
      <View style={styles.navbarWrapper}>
        {/* Navbar component would go here */}
      </View>
    </View>
  );
};

export default ProfileScreen;