import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../styles/profile';
import { profileData } from '../data/profile';
import Navbar from '../components/navbar';

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
    connectionCount = 500 // Default value if not in data
  } = profileData as ProfileData;

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
        <Text style={styles.experienceDescription}>{item.description}</Text>
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

  const renderSkillItem = (skill: string, index: number) => (
    <View key={index} style={styles.skillItem}>
      <Text style={styles.skillText}>{skill}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          {/* Cover Image */}
          <View style={styles.coverImage} />
          
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
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Experience</Text>
          </View>
          {experience.map(renderExperienceItem)}
        </View>

        {/* Education Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Education</Text>
          </View>
          {education.map(renderEducationItem)}
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Skills</Text>
          </View>
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
      
      {/* Navbar at bottom */}
      <View style={styles.navbarWrapper}>
        <Navbar />
      </View>
    </View>
  );
};

export default ProfileScreen;