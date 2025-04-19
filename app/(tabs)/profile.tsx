import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Navbar from '../components/navbar';

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

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
  skills: Skill[];
}

const ProfileScreen = () => {
  // Simplified profile data
  const profileData = {
    name: "Priya Sharma",
    headline: "Full Stack Developer & AI Enthusiast",
    currentCompany: "Infosys",
    location: "Bangalore, India",
    profileImage: "https://example.com/profile.jpg",
    about: "Passionate technology professional with over 7 years of experience creating scalable software solutions and AI-powered applications. Advocate for women in tech and regular speaker at tech conferences across India.",
    experience: [
      {
        title: "Senior Software Engineer",
        company: "Infosys",
        companyLogo: "https://example.com/infosys.png",
        duration: "Jan 2022 - Present",
        location: "Bangalore, India"
      },
      {
        title: "Software Developer",
        company: "TCS",
        companyLogo: "https://example.com/tcs.png",
        duration: "Jun 2018 - Dec 2021",
        location: "Hyderabad, India"
      }
    ],
    education: [
      {
        institution: "Indian Institute of Technology, Delhi",
        logo: "https://example.com/iit.png",
        degree: "Master of Technology in Computer Science",
        duration: "2016 - 2018"
      }
    ],
    skills: [
      { name: "React Native", level: "expert" },
      { name: "React.js", level: "expert" },
      { name: "Node.js", level: "advanced" },
      { name: "TypeScript", level: "advanced" },
      { name: "Python", level: "intermediate" },
      { name: "TensorFlow", level: "intermediate" },
      { name: "AWS", level: "advanced" },
      { name: "MongoDB", level: "intermediate" }
    ]
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
    skills
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
      flexDirection: 'row',
      alignItems: 'center',
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

  const renderSkillItem = (skill, index) => {
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
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{about}</Text>
        </View>

        {/* Skills Section - Moved up in importance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {skills.map(renderSkillItem)}
          </View>
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
        
        {/* Extra space at bottom for navbar */}
        <View style={styles.navbarSpacing} />
      </ScrollView>
      
      {/* Imported Navbar component */}
      <Navbar />
    </View>
  );
};

export default ProfileScreen;