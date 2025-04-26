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
  // Profile data for Durva Dongre
  const profileData: ProfileData = {
    name: "Durva Dongre",
    headline: "Computer Engineering Student & AI Enthusiast",
    currentCompany: "Pillai HOC College of Engineering",
    location: "Mumbai, India",
    profileImage: "https://avatars.githubusercontent.com/u/178024340?v=4", // This will be replaced with the provided image
    about: "Passionate computer engineering student with a keen interest in artificial intelligence and machine learning. Winner of the Asha AI Hackathon. Currently looking for internship opportunities to apply and enhance my technical skills in a real-world setting.",
    experience: [
      {
        title: "Women Head",
        company: "Pillai HOC College of Engineering",
        companyLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQK1lOFsZnuC4J5OGRFMIp-LJZ4HvrZbAkv3A&s",
        duration: "Aug 2023 - Present",
        location: "Mumbai, India"
      }
    ],
    education: [
      {
        institution: "Pillai HOC College of Engineering",
        logo: "https://pbs.twimg.com/profile_images/1151138020738785283/f_Vl5vt6_400x400.png",
        degree: "Bachelor of Engineering in Computer Engineering",
        duration: "2022 - 2026"
      }
    ],
    projects: [
      {
        name: "Peekaboo",
        description: "An AI-based Search Engine that utilizes advanced machine learning algorithms to provide more accurate and context-aware search results."
      }
    ],
    skills: [
      { name: "Python", level: "advanced" },
      { name: "Machine Learning", level: "intermediate" },
      { name: "React.js", level: "intermediate" },
      { name: "JavaScript", level: "intermediate" },
      { name: "C++", level: "advanced" },
      { name: "AI Development", level: "intermediate" },
      { name: "Data Structures", level: "advanced" },
      { name: "TensorFlow", level: "intermediate" }
    ],
    achievements: [
      {
        title: "Winner - Asha AI Hackathon",
        date: "2023"
      }
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
    projects,
    skills,
    achievements
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
          <Text style={styles.experienceLocation}> • {item.location}</Text>
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

        {/* Skills Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {skills.map(renderSkillItem)}
          </View>
        </View>

        {/* Achievement Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {achievements.map(renderAchievementItem)}
        </View>

        {/* Projects Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {projects.map(renderProjectItem)}
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