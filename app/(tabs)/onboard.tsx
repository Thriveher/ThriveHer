import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

// Enhanced Color Palette
const COLORS = {
  primary: '#49654E',        // Deep forest green
  secondary: '#49654E',      // Medium green  
  accent: '#F8FDF8',         // Light sage green
  mediumOlive: '#49654E',    // Medium olive for skills
  background: '#F8FDF8',     // Very light green tint
  white: '#FFFFFF',
  text: '#1C3A29',           // Dark green text
  textLight: '#6B8E73',      // Light green text
  border: '#E8F5E8',         // Very light green border
  error: '#DC3545',
  success: '#28A745',
  gray: '#F1F8F1',
  placeholder: '#8DA58D',
  shadow: 'rgba(45, 80, 22, 0.1)',
};

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
  location: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  location: string;
}

interface FormData {
  name: string;
  email: string;
  profilePhoto: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
}

// Predefined skill suggestions
const SKILL_SUGGESTIONS = [
  'JavaScript', 'React', 'React Native', 'TypeScript', 'Node.js', 'Python', 'Java',
  'Swift', 'Kotlin', 'Flutter', 'Vue.js', 'Angular', 'MongoDB', 'PostgreSQL',
  'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Git', 'Figma',
  'Adobe Photoshop', 'Project Management', 'Agile', 'Scrum', 'Leadership',
  'Communication', 'Problem Solving', 'Data Analysis', 'Machine Learning',
  'UI/UX Design', 'Digital Marketing', 'Content Writing', 'SEO', 'Social Media'
];

// Year options for picker
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = ['Present'];
  for (let i = currentYear; i >= currentYear - 50; i--) {
    years.push(i.toString());
  }
  return years;
};

const YEARS = generateYears();

// Import ProfileAPI
import { ProfileAPI } from '../api/createprofile';

// Define interfaces for better type safety
interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
  location: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  location: string;
}

interface FormData {
  name: string;
  email: string;
  profilePhoto: string | null;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: string[];
}

interface YearPickerState {
  show: boolean;
  type: 'education' | 'experience';
  id: string;
  field: 'startYear' | 'endYear';
}

export default function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [skillInput, setSkillInput] = React.useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = React.useState(false);
  const [filteredSkills, setFilteredSkills] = React.useState<string[]>([]);
  const [showYearPicker, setShowYearPicker] = React.useState<YearPickerState>({
    show: false,
    type: 'education',
    id: '',
    field: 'startYear'
  });
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = React.useState(false);
  
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    email: '',
    profilePhoto: null,
    education: [{ 
      id: '1', 
      institution: '', 
      degree: '', 
      startYear: '', 
      endYear: '', 
      location: '' 
    }],
    experience: [{ 
      id: '1', 
      company: '', 
      position: '', 
      startYear: '', 
      endYear: '', 
      location: '' 
    }],
    skills: [],
  });

  // Auto-populate user data on component mount
  React.useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            email: user.email || '',
          }));
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    getUserData();
  }, []);

  // Filter skills based on input
  React.useEffect(() => {
    if (skillInput.trim()) {
      const filtered = SKILL_SUGGESTIONS.filter(skill => 
        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
        !formData.skills.includes(skill)
      );
      setFilteredSkills(filtered);
      setShowSkillSuggestions(filtered.length > 0);
    } else {
      setShowSkillSuggestions(false);
      setFilteredSkills([]);
    }
  }, [skillInput, formData.skills]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          profilePhoto: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Skills management
  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill],
      }));
      setSkillInput('');
      setShowSkillSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };

  const handleSkillInputSubmit = () => {
    if (skillInput.trim()) {
      addSkill(skillInput);
    }
  };

  // Education management
  const addEducationEntry = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { 
        id: newId, 
        institution: '', 
        degree: '', 
        startYear: '', 
        endYear: '', 
        location: '' 
      }],
    }));
  };

  const removeEducationEntry = (id: string) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter(entry => entry.id !== id),
      }));
    }
  };

  const updateEducationEntry = (id: string, field: keyof EducationEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  // Experience management
  const addExperienceEntry = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { 
        id: newId, 
        company: '', 
        position: '', 
        startYear: '', 
        endYear: '', 
        location: '' 
      }],
    }));
  };

  const removeExperienceEntry = (id: string) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter(entry => entry.id !== id),
      }));
    }
  };

  const updateExperienceEntry = (id: string, field: keyof ExperienceEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const openYearPicker = (type: 'education' | 'experience', id: string, field: 'startYear' | 'endYear') => {
    setShowYearPicker({ show: true, type, id, field });
  };

  const selectYear = (year: string) => {
    const { type, id, field } = showYearPicker;
    if (type === 'education') {
      updateEducationEntry(id, field, year);
    } else {
      updateExperienceEntry(id, field, year);
    }
    setShowYearPicker({ show: false, type: 'education', id: '', field: 'startYear' });
  };

  // Updated handleSubmit function with post-submission handling
  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      // Use ProfileAPI validation instead of local validation
      const validation = ProfileAPI.validateProfileData(formData);
      
      if (!validation.isValid) {
        setError(validation.errors[0]); // Show first error
        return;
      }
      
      // Create profile using ProfileAPI
      const result = await ProfileAPI.createProfile(formData);
      
      if (!result.success) {
        setError(result.error || 'Failed to save profile');
        return;
      }
      
      // Set submission success state
      setIsSubmitted(true);
      setShowSuccessAnimation(true);
      
      // Hide success animation after 2 seconds and navigate
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setTimeout(() => {
          router.replace('/(tabs)/chat');
        }, 300);
      }, 2500);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      console.error('Error saving profile:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsSubmitted(false);
    setError(null);
  };

  const renderProfilePhoto = () => (
    <View style={styles.photoSection}>
      <TouchableOpacity 
        onPress={isSubmitted ? undefined : pickImage} 
        style={[styles.photoContainer, isSubmitted && styles.photoContainerDisabled]}
        disabled={isSubmitted}
      >
        {formData.profilePhoto ? (
          <Image source={{ uri: formData.profilePhoto }} style={styles.profileImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Feather name="camera" size={40} color={COLORS.textLight} />
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
        {!isSubmitted && (
          <View style={styles.photoEditIcon}>
            <Feather name="edit-2" size={18} color={COLORS.white} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderYearSelector = (type: 'education' | 'experience', id: string, field: 'startYear' | 'endYear', value: string) => (
    <TouchableOpacity
      style={[styles.yearSelector, isSubmitted && styles.yearSelectorDisabled]}
      onPress={isSubmitted ? undefined : () => openYearPicker(type, id, field)}
      disabled={isSubmitted}
    >
      <Text style={[styles.yearText, !value && styles.placeholder]}>
        {value || (field === 'startYear' ? 'Start Year' : 'End Year')}
      </Text>
      {!isSubmitted && <AntDesign name="down" size={16} color={COLORS.textLight} />}
    </TouchableOpacity>
  );

  const renderSkillTag = ({ item }: { item: string }) => (
    <View style={styles.skillTag}>
      <Text style={styles.skillTagText}>{item}</Text>
      {!isSubmitted && (
        <TouchableOpacity
          onPress={() => removeSkill(item)}
          style={styles.skillRemoveButton}
        >
          <AntDesign name="close" size={14} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSkillsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionTitleContainer}>
        <MaterialIcons name="stars" size={24} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
      </View>
      
      <View style={styles.skillsContainer}>
        {!isSubmitted && (
          <>
            <View style={styles.skillInputContainer}>
              <TextInput
                style={styles.skillInput}
                placeholder="Add a skill..."
                placeholderTextColor={COLORS.placeholder}
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={handleSkillInputSubmit}
                returnKeyType="done"
              />
            </View>

            {showSkillSuggestions && (
              <View style={styles.skillSuggestions}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {filteredSkills.map((skill, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionTag}
                      onPress={() => addSkill(skill)}
                    >
                      <Text style={styles.suggestionText}>{skill}</Text>
                      <AntDesign name="plus" size={12} color={COLORS.mediumOlive} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {formData.skills.length > 0 && (
          <View style={styles.skillsList}>
            <Text style={styles.skillsLabel}>Your Skills ({formData.skills.length})</Text>
            <FlatList
              data={formData.skills}
              renderItem={renderSkillTag}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.skillRow}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderEducationSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons name="school" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Education</Text>
        </View>
        {!isSubmitted && (
          <TouchableOpacity onPress={addEducationEntry} style={styles.addButton}>
            <AntDesign name="plus" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {formData.education.map((entry, index) => (
        <View key={entry.id} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View style={styles.entryIndexContainer}>
              <Text style={styles.entryIndex}>{index + 1}</Text>
            </View>
            {!isSubmitted && formData.education.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeEducationEntry(entry.id)}
                style={styles.removeButton}
              >
                <AntDesign name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, isSubmitted && styles.inputDisabled]}
              placeholder="Institution Name"
              placeholderTextColor={COLORS.placeholder}
              value={entry.institution}
              onChangeText={isSubmitted ? undefined : (text) => updateEducationEntry(entry.id, 'institution', text)}
              editable={!isSubmitted}
            />
            
            <TextInput
              style={[styles.input, isSubmitted && styles.inputDisabled]}
              placeholder="Degree/Program"
              placeholderTextColor={COLORS.placeholder}
              value={entry.degree}
              onChangeText={isSubmitted ? undefined : (text) => updateEducationEntry(entry.id, 'degree', text)}
              editable={!isSubmitted}
            />

            <View style={styles.yearRow}>
              {renderYearSelector('education', entry.id, 'startYear', entry.startYear)}
              <View style={styles.yearDivider} />
              {renderYearSelector('education', entry.id, 'endYear', entry.endYear)}
            </View>
            
            <TextInput
              style={[styles.input, isSubmitted && styles.inputDisabled]}
              placeholder="Location"
              placeholderTextColor={COLORS.placeholder}
              value={entry.location}
              onChangeText={isSubmitted ? undefined : (text) => updateEducationEntry(entry.id, 'location', text)}
              editable={!isSubmitted}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderExperienceSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialIcons name="work" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Experience</Text>
        </View>
        {!isSubmitted && (
          <TouchableOpacity onPress={addExperienceEntry} style={styles.addButton}>
            <AntDesign name="plus" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      {formData.experience.map((entry, index) => (
        <View key={entry.id} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View style={styles.entryIndexContainer}>
              <Text style={styles.entryIndex}>{index + 1}</Text>
            </View>
            {!isSubmitted && formData.experience.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeExperienceEntry(entry.id)}
                style={styles.removeButton}
              >
                <AntDesign name="close" size={16} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, isSubmitted && styles.inputDisabled]}
              placeholder="Company Name"
              placeholderTextColor={COLORS.placeholder}
              value={entry.company}
              onChangeText={isSubmitted ? undefined : (text) => updateExperienceEntry(entry.id, 'company', text)}
              editable={!isSubmitted}
            />
            
            <TextInput
              style={[styles.input, isSubmitted && styles.inputDisabled]}
              placeholder="Position/Role"
              placeholderTextColor={COLORS.placeholder}
              value={entry.position}
              onChangeText={isSubmitted ? undefined : (text) => updateExperienceEntry(entry.id, 'position', text)}
              editable={!isSubmitted}
            />

            <View style={styles.yearRow}>
              {renderYearSelector('experience', entry.id, 'startYear', entry.startYear)}
              <View style={styles.yearDivider} />
              {renderYearSelector('experience', entry.id, 'endYear', entry.endYear)}
            </View>
            
            <TextInput
              style={[styles.input, isSubmitted && styles.inputDisabled]}
              placeholder="Location"
              placeholderTextColor={COLORS.placeholder}
              value={entry.location}
              onChangeText={isSubmitted ? undefined : (text) => updateExperienceEntry(entry.id, 'location', text)}
              editable={!isSubmitted}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderSuccessMessage = () => (
  <View style={styles.successContainer}>
    <LinearGradient
      colors={[COLORS.white, COLORS.background]}
      style={styles.successCard}
    >
      {/* Animated Success Icon */}
      <View style={[styles.successIconContainer, showSuccessAnimation && styles.successIconAnimated]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.successIconBackground}
        >
          <AntDesign name="checkcircle" size={50} color={COLORS.white} />
        </LinearGradient>
        
        {/* Ripple Effect */}
        <View style={[styles.ripple1, showSuccessAnimation && styles.rippleAnimated]} />
        <View style={[styles.ripple2, showSuccessAnimation && styles.rippleAnimated]} />
        <View style={[styles.ripple3, showSuccessAnimation && styles.rippleAnimated]} />
      </View>

      {/* Success Content */}
      <View style={styles.successContent}>
        <Text style={styles.successTitle}>Profile Complete! 🎉</Text>
        <Text style={styles.successSubtitle}>
          Your professional profile has been successfully created and saved.
        </Text>
        
        {/* Success Stats */}
        <View style={styles.successStats}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Feather name="user" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>Profile</Text>
            <Text style={styles.statValue}>Complete</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <MaterialIcons name="stars" size={20} color={COLORS.mediumOlive} />
            </View>
            <Text style={styles.statLabel}>Skills</Text>
            <Text style={styles.statValue}>{formData.skills.length}</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <MaterialIcons name="school" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.statLabel}>Education</Text>
            <Text style={styles.statValue}>{formData.education.length}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Setting up your experience...</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, showSuccessAnimation && styles.progressFillAnimated]} />
          </View>
        </View>
      </View>
    </LinearGradient>
  </View>
);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.background, COLORS.white]}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!showSuccessAnimation}
          >
            <View style={styles.header}>
              <Text style={styles.title}>
                {isSubmitted ? 'Profile Complete' : 'Complete Your Profile'}
              </Text>
              <Text style={styles.subtitle}>
                {isSubmitted 
                  ? 'Your profile has been successfully created' 
                  : 'Tell us about yourself to get started'}
              </Text>
            </View>

            {isSubmitted && showSuccessAnimation && renderSuccessMessage()}

            {(!isSubmitted || !showSuccessAnimation) && (
              <>
                {renderProfilePhoto()}

                <View style={styles.section}>
                  <View style={styles.sectionTitleContainer}>
                    <Feather name="user" size={24} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, isSubmitted && styles.inputDisabled]}
                      placeholder="Full Name *"
                      placeholderTextColor={COLORS.placeholder}
                      value={formData.name}
                      onChangeText={isSubmitted ? undefined : (text) => updateFormField('name', text)}
                      editable={!isSubmitted}
                    />
                    
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      placeholder="Email"
                      placeholderTextColor={COLORS.placeholder}
                      value={formData.email}
                      editable={false}
                    />
                  </View>
                </View>

                {renderSkillsSection()}
                {renderEducationSection()}
                {renderExperienceSection()}

                {error && (
                  <View style={styles.errorContainer}>
                    <AntDesign name="exclamationcircle" size={20} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {!isSubmitted ? (
                  <TouchableOpacity 
                    style={[styles.submitButton, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>
                        {loading ? 'Saving Profile...' : 'Save Profile'}
                      </Text>
                      {!loading && <AntDesign name="arrowright" size={20} color={COLORS.white} />}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.submittedActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={handleEditProfile}
                    >
                      <Text style={styles.editButtonText}>Edit Profile</Text>
                      <AntDesign name="edit" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.continueButton}
                      onPress={() => router.replace('/(tabs)/chat')}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.continueButtonGradient}
                      >
                        <Text style={styles.continueButtonText}>Continue to Chat</Text>
                        <AntDesign name="arrowright" size={20} color={COLORS.white} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>

        <Modal
          visible={showYearPicker.show && !isSubmitted}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowYearPicker(prev => ({ ...prev, show: false }))}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Select Year</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(prev => ({ ...prev, show: false }))}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue=""
                onValueChange={selectYear}
                style={styles.picker}
              >
                {YEARS.map((year) => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    fontWeight: '500',
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 12,
    letterSpacing: -0.3,
  },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  entryCard: {
    backgroundColor: COLORS.gray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  entryIndexContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  entryIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  removeButton: {
    backgroundColor: '#FFE5E5',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    gap: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    fontWeight: '500',
  },
  disabledInput: {
    backgroundColor: COLORS.gray,
    color: COLORS.textLight,
  },
  yearRow: {
    flexDirection: 'row',
    gap: 16,
  },
  yearSelector: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  yearDivider: {
    width: 16,
  },
  yearText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  placeholder: {
    color: COLORS.placeholder,
  },
  // Skills Section Styles
  skillsContainer: {
    marginTop: 20,
  },
  skillInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  skillInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    fontWeight: '500',
  },
  addSkillButton: {
    backgroundColor: COLORS.mediumOlive,
    borderRadius: 14,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  skillSuggestions: {
    marginBottom: 20,
  },
  suggestionTag: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.mediumOlive,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.mediumOlive,
    fontWeight: '500',
  },
  skillsList: {
    marginTop: 8,
  },
  skillsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  skillRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: COLORS.mediumOlive,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.48,
    marginBottom: 8,
  },
  skillTagText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    flex: 1,
  },
  skillRemoveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB3B3',
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
    lineHeight: 22,
  },
  submitButton: {
    borderRadius: 20,
    marginTop: 32,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  pickerCancel: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  pickerDone: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  picker: {
    height: 200,
  },
successContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 24,
  paddingVertical: 40,
},
successCard: {
  width: '100%',
  borderRadius: 24,
  padding: 32,
  alignItems: 'center',
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 20,
  elevation: 10,
  borderWidth: 1,
  borderColor: COLORS.border,
},
successIconContainer: {
  position: 'relative',
  marginBottom: 32,
  alignItems: 'center',
  justifyContent: 'center',
},
successIconBackground: {
  width: 100,
  height: 100,
  borderRadius: 50,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 8,
  zIndex: 3,
},
successIconAnimated: {
  transform: [{ scale: 1.1 }],
},
ripple1: {
  position: 'absolute',
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: COLORS.primary,
  opacity: 0,
  zIndex: 1,
},
ripple2: {
  position: 'absolute',
  width: 140,
  height: 140,
  borderRadius: 70,
  backgroundColor: COLORS.secondary,
  opacity: 0,
  zIndex: 0,
},
ripple3: {
  position: 'absolute',
  width: 160,
  height: 160,
  borderRadius: 80,
  backgroundColor: COLORS.mediumOlive,
  opacity: 0,
  zIndex: -1,
},
rippleAnimated: {
  opacity: 0.2,
  transform: [{ scale: 1.2 }],
},
successContent: {
  alignItems: 'center',
  width: '100%',
},
successTitle: {
  fontSize: 28,
  fontWeight: '800',
  color: COLORS.primary,
  marginBottom: 12,
  textAlign: 'center',
  letterSpacing: -0.5,
},
successSubtitle: {
  fontSize: 16,
  color: COLORS.textLight,
  textAlign: 'center',
  lineHeight: 24,
  marginBottom: 32,
  paddingHorizontal: 16,
},
successStats: {
  flexDirection: 'row',
  backgroundColor: COLORS.gray,
  borderRadius: 20,
  padding: 24,
  marginBottom: 32,
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-around',
},
statItem: {
  alignItems: 'center',
  flex: 1,
},
statIcon: {
  backgroundColor: COLORS.white,
  borderRadius: 25,
  width: 50,
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
statLabel: {
  fontSize: 12,
  color: COLORS.textLight,
  fontWeight: '500',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
statValue: {
  fontSize: 18,
  color: COLORS.text,
  fontWeight: '700',
},
statDivider: {
  width: 1,
  height: 40,
  backgroundColor: COLORS.border,
  marginHorizontal: 16,
},
progressContainer: {
  width: '100%',
  alignItems: 'center',
},
progressLabel: {
  fontSize: 14,
  color: COLORS.textLight,
  marginBottom: 12,
  fontWeight: '500',
},
progressBar: {
  width: '100%',
  height: 6,
  backgroundColor: COLORS.gray,
  borderRadius: 3,
  overflow: 'hidden',
},
progressFill: {
  height: '100%',
  backgroundColor: COLORS.primary,
  borderRadius: 3,
  width: '0%',
},
progressFillAnimated: {
  width: '100%',
},
// Enhanced disabled states for better visual consistency
photoContainerDisabled: {
  opacity: 0.8,
},
yearSelectorDisabled: {
  backgroundColor: COLORS.gray,
  opacity: 0.7,
},
inputDisabled: {
  backgroundColor: COLORS.gray,
  color: COLORS.textLight,
  borderColor: COLORS.border,
  opacity: 0.8,
},
// Improved submitted actions section
submittedActions: {
  flexDirection: 'row',
  gap: 16,
  marginTop: 32,
  marginBottom: 20,
},
editButton: {
  flex: 1,
  backgroundColor: COLORS.white,
  borderRadius: 16,
  paddingVertical: 16,
  paddingHorizontal: 24,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
  borderWidth: 2,
  borderColor: COLORS.primary,
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
},
editButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.primary,
},
continueButton: {
  flex: 2,
  borderRadius: 16,
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
},
continueButtonGradient: {
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 16,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},
continueButtonText: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.white,
  letterSpacing: 0.3,
},
});