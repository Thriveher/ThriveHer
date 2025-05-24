import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Navbar from '../components/navbar';
import ProfileAPI from '../api/editprofile';

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

// Type for API response data that might have undefined values
interface UIProfileData {
  name?: string;
  headline?: string;
  currentCompany?: string;
  location?: string;
  profileImage?: string;
  about?: string;
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  skills?: Skill[];
  achievements?: Achievement[];
}

const ProfileEditScreen = () => {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    headline: '',
    currentCompany: '',
    location: '',
    profileImage: 'https://via.placeholder.com/100x100/e8f4e9/49654E?text=Profile',
    about: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    achievements: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple navigation function
  const navigateToProfile = () => {
    try {
      router.push('/(tabs)/profile');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.back();
    }
  };

  // Transform API data to match ProfileData interface
  const transformApiData = (apiData: UIProfileData): ProfileData => {
    return {
      name: apiData.name || '',
      headline: apiData.headline || '',
      currentCompany: apiData.currentCompany || '',
      location: apiData.location || '',
      profileImage: apiData.profileImage || 'https://via.placeholder.com/100x100/e8f4e9/49654E?text=Profile',
      about: apiData.about || '',
      experience: apiData.experience || [],
      education: apiData.education || [],
      projects: apiData.projects || [],
      skills: apiData.skills || [],
      achievements: apiData.achievements || []
    };
  };

  // Fetch existing profile data
  const fetchProfileData = async () => {
    try {
      setError(null);
      const response = await ProfileAPI.getTransformedProfile();
      
      if (response.success && response.data) {
        // Transform the data to ensure all required fields are present
        const transformedData = transformApiData(response.data);
        setProfileData(transformedData);
      } else if (response.error && !response.error.includes('No profile found')) {
        setError(response.error || 'Failed to load profile data');
      }
      // If no profile found, we'll start with empty form
    } catch (err) {
      setError('Network error occurred while fetching profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImagePicker = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        console.log('Permission to access camera roll denied');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileData(prev => ({
          ...prev,
          profileImage: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  // Handle save profile
  const handleSave = async () => {
    if (saving) return; // Prevent multiple saves
    
    // Basic validation - just check if name exists
    if (!profileData.name.trim()) {
      console.log('Name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log('Saving profile data:', profileData);
      const response = await ProfileAPI.saveProfile(profileData);
      
      if (response.success) {
        console.log('Profile saved successfully');
        // Navigate directly without alert
        navigateToProfile();
      } else {
        console.error('Failed to save profile:', response.error);
        setError(response.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Profile save error:', err);
      setError('Network error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel - navigate directly without confirmation
  const handleCancel = () => {
    console.log('Cancelling edit');
    navigateToProfile();
  };

  // Add new experience
  const addExperience = () => {
    setProfileData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          companyLogo: '',
          duration: '',
          location: ''
        }
      ]
    }));
  };

  // Remove experience
  const removeExperience = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Update experience
  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  // Add new education
  const addEducation = () => {
    setProfileData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          institution: '',
          logo: '',
          degree: '',
          duration: ''
        }
      ]
    }));
  };

  // Remove education
  const removeEducation = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Update education
  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Add new skill
  const addSkill = () => {
    setProfileData(prev => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          name: '',
          level: 'intermediate'
        }
      ]
    }));
  };

  // Remove skill
  const removeSkill = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Update skill
  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const styles = {
    container: {
      flex: 1,
      backgroundColor: '#f0f7f1',
    },
    scrollView: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    
    // Loading state
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
    
    // Header
    header: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      margin: 12,
      padding: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: '#253528',
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#666666',
      textAlign: 'center' as const,
    },
    
    // Profile image section
    imageSection: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      margin: 12,
      marginTop: 0,
      padding: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      alignItems: 'center' as const,
    },
    profileImageWrapper: {
      position: 'relative' as const,
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
    imageOverlay: {
      position: 'absolute' as const,
      bottom: 0,
      right: 0,
      backgroundColor: '#49654E',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 3,
      borderColor: '#ffffff',
    },
    imageButtonText: {
      fontSize: 14,
      color: '#49654E',
      marginTop: 8,
    },
    
    // Form sections
    section: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      margin: 12,
      marginTop: 0,
      padding: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
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
    
    // Input styles
    inputLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#253528',
      marginBottom: 8,
      marginTop: 12,
    },
    inputLabelFirst: {
      marginTop: 0,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: '#333333',
      backgroundColor: '#ffffff',
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top' as const,
    },
    
    // Dynamic list items
    listItem: {
      backgroundColor: '#f8fdf9',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#49654E',
    },
    listItemHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    listItemTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#253528',
    },
    removeButton: {
      backgroundColor: '#ffebee',
      borderRadius: 20,
      padding: 8,
    },
    
    // Add button
    addButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: '#e8f4e9',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      borderWidth: 2,
      borderColor: '#49654E',
      borderStyle: 'dashed' as const,
    },
    addButtonText: {
      color: '#49654E',
      fontSize: 14,
      fontWeight: '500' as const,
      marginLeft: 8,
    },
    
    // Select input
    selectInput: {
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: '#333333',
      backgroundColor: '#ffffff',
    },
    
    // Action buttons
    actionButtons: {
      backgroundColor: '#ffffff',
      margin: 12,
      marginTop: 0,
      borderRadius: 8,
      padding: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    buttonRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      minHeight: 48,
    },
    saveButton: {
      backgroundColor: '#49654E',
    },
    cancelButton: {
      backgroundColor: '#ffffff',
      borderWidth: 2,
      borderColor: '#49654E',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginLeft: 8,
    },
    saveButtonText: {
      color: '#ffffff',
    },
    cancelButtonText: {
      color: '#49654E',
    },
    disabledButton: {
      opacity: 0.6,
    },
    
    // Bottom spacing
    navbarSpacing: {
      height: 80,
    },
  };

  const renderSectionTitle = (title: string, iconName: string) => (
    <View style={styles.sectionTitle}>
      <Feather name={iconName as any} size={18} color="#49654E" style={styles.sectionTitleIcon} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#253528' }}>{title}</Text>
    </View>
  );

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

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>Update your profile information</Text>
          </View>

          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity 
              style={styles.profileImageWrapper} 
              onPress={handleImagePicker}
              activeOpacity={0.7}
            >
              <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} />
              <View style={styles.imageOverlay}>
                <Feather name="camera" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageButtonText}>Tap to change profile photo</Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            {renderSectionTitle('Basic Information', 'user')}
            
            <Text style={[styles.inputLabel, styles.inputLabelFirst]}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              placeholderTextColor="#999999"
            />

            <Text style={styles.inputLabel}>Professional Headline</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.headline}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, headline: text }))}
              placeholder="e.g. Software Developer | Student"
              placeholderTextColor="#999999"
            />

            <Text style={styles.inputLabel}>Current Company/Organization</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.currentCompany}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, currentCompany: text }))}
              placeholder="Where do you currently work or study?"
              placeholderTextColor="#999999"
            />

            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={profileData.location}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
              placeholder="City, Country"
              placeholderTextColor="#999999"
            />

            <Text style={styles.inputLabel}>About</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={profileData.about}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, about: text }))}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999999"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Skills Section */}
          <View style={styles.section}>
            {renderSectionTitle('Skills', 'zap')}
            
            {profileData.skills.map((skill, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <Text style={styles.listItemTitle}>Skill {index + 1}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeSkill(index)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color="#c62828" />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.inputLabel, styles.inputLabelFirst]}>Skill Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={skill.name}
                  onChangeText={(text) => updateSkill(index, 'name', text)}
                  placeholder="e.g. JavaScript, Python, Design"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.inputLabel}>Level</Text>
                <View style={styles.selectInput}>
                  <Text style={{ fontSize: 16, color: '#333333' }}>
                    {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                  </Text>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={addSkill}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color="#49654E" />
              <Text style={styles.addButtonText}>Add Skill</Text>
            </TouchableOpacity>
          </View>

          {/* Experience Section */}
          <View style={styles.section}>
            {renderSectionTitle('Experience', 'briefcase')}
            
            {profileData.experience.map((exp, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <Text style={styles.listItemTitle}>Experience {index + 1}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeExperience(index)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color="#c62828" />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.inputLabel, styles.inputLabelFirst]}>Job Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={exp.title}
                  onChangeText={(text) => updateExperience(index, 'title', text)}
                  placeholder="e.g. Software Developer"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.inputLabel}>Company</Text>
                <TextInput
                  style={styles.textInput}
                  value={exp.company}
                  onChangeText={(text) => updateExperience(index, 'company', text)}
                  placeholder="Company name"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.textInput}
                  value={exp.duration}
                  onChangeText={(text) => updateExperience(index, 'duration', text)}
                  placeholder="e.g. Jan 2023 - Present"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={exp.location}
                  onChangeText={(text) => updateExperience(index, 'location', text)}
                  placeholder="City, Country"
                  placeholderTextColor="#999999"
                />
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={addExperience}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color="#49654E" />
              <Text style={styles.addButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </View>

          {/* Education Section */}
          <View style={styles.section}>
            {renderSectionTitle('Education', 'book')}
            
            {profileData.education.map((edu, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <Text style={styles.listItemTitle}>Education {index + 1}</Text>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeEducation(index)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color="#c62828" />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.inputLabel, styles.inputLabelFirst]}>Institution</Text>
                <TextInput
                  style={styles.textInput}
                  value={edu.institution}
                  onChangeText={(text) => updateEducation(index, 'institution', text)}
                  placeholder="University or School name"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.inputLabel}>Degree</Text>
                <TextInput
                  style={styles.textInput}
                  value={edu.degree}
                  onChangeText={(text) => updateEducation(index, 'degree', text)}
                  placeholder="e.g. Bachelor of Science in Computer Science"
                  placeholderTextColor="#999999"
                />

                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.textInput}
                  value={edu.duration}
                  onChangeText={(text) => updateEducation(index, 'duration', text)}
                  placeholder="e.g. 2020 - 2024"
                  placeholderTextColor="#999999"
                />
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={addEducation}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color="#49654E" />
              <Text style={styles.addButtonText}>Add Education</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.cancelButton,
                  saving && styles.disabledButton
                ]} 
                onPress={handleCancel}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color="#49654E" />
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.saveButton,
                  saving && styles.disabledButton
                ]} 
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.buttonText, styles.saveButtonText]}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="save" size={16} color="#ffffff" />
                    <Text style={[styles.buttonText, styles.saveButtonText]}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.navbarSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      <Navbar />
    </View>
  );
};

export default ProfileEditScreen;