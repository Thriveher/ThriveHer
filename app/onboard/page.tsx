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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { AntDesign } from '@expo/vector-icons';

// Color constants - matching the welcome page theme
const SOFT_GREEN = '#8BA889';
const DEEP_GREEN = '#253528';
const MEDIUM_OLIVE = '#49654E';
const WHITE = '#FFFFFF';
const ERROR_RED = '#ff3b30';
const LIGHT_GRAY = '#F5F5F5';
const BORDER_GRAY = '#E0E0E0';

// Get screen dimensions
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface EducationEntry {
  id: string;
  name: string;
  timeline: string;
  location: string;
}

interface ExperienceEntry {
  id: string;
  name: string;
  timeline: string;
  location: string;
}

interface FormData {
  name: string;
  email: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
}

export default function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    email: '',
    education: [{ id: '1', name: '', timeline: '', location: '' }],
    experience: [{ id: '1', name: '', timeline: '', location: '' }],
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

  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addEducationEntry = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { id: newId, name: '', timeline: '', location: '' }],
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

  const addExperienceEntry = () => {
    const newId = Date.now().toString();
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: newId, name: '', timeline: '', location: '' }],
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

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Check if at least one education entry has some data
    const hasValidEducation = formData.education.some(
      entry => entry.name.trim() || entry.timeline.trim() || entry.location.trim()
    );
    
    // Check if at least one experience entry has some data
    const hasValidExperience = formData.experience.some(
      entry => entry.name.trim() || entry.timeline.trim() || entry.location.trim()
    );

    if (!hasValidEducation && !hasValidExperience) {
      setError('Please add at least one education or experience entry');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      // Filter out empty entries
      const filteredEducation = formData.education.filter(
        entry => entry.name.trim() || entry.timeline.trim() || entry.location.trim()
      );
      
      const filteredExperience = formData.experience.filter(
        entry => entry.name.trim() || entry.timeline.trim() || entry.location.trim()
      );

      // Save to Supabase (adjust table name and structure as needed)
      const profileData = {
        user_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        education: filteredEducation,
        experience: filteredExperience,
        onboarding_completed: true,
      };

      // Replace 'profiles' with your actual table name
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (insertError) throw insertError;

      Alert.alert(
        'Success!',
        'Your profile has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)/chat'),
          },
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      console.error('Error saving profile:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderEducationSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Education</Text>
        <TouchableOpacity onPress={addEducationEntry} style={styles.addButton}>
          <AntDesign name="plus" size={20} color={DEEP_GREEN} />
        </TouchableOpacity>
      </View>
      
      {formData.education.map((entry, index) => (
        <View key={entry.id} style={styles.entryContainer}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryNumber}>Education {index + 1}</Text>
            {formData.education.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeEducationEntry(entry.id)}
                style={styles.removeButton}
              >
                <AntDesign name="minus" size={18} color={ERROR_RED} />
              </TouchableOpacity>
            )}
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Institution/Program Name"
            placeholderTextColor={MEDIUM_OLIVE}
            value={entry.name}
            onChangeText={(text) => updateEducationEntry(entry.id, 'name', text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Timeline (e.g., 2018-2022)"
            placeholderTextColor={MEDIUM_OLIVE}
            value={entry.timeline}
            onChangeText={(text) => updateEducationEntry(entry.id, 'timeline', text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor={MEDIUM_OLIVE}
            value={entry.location}
            onChangeText={(text) => updateEducationEntry(entry.id, 'location', text)}
          />
        </View>
      ))}
    </View>
  );

  const renderExperienceSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <TouchableOpacity onPress={addExperienceEntry} style={styles.addButton}>
          <AntDesign name="plus" size={20} color={DEEP_GREEN} />
        </TouchableOpacity>
      </View>
      
      {formData.experience.map((entry, index) => (
        <View key={entry.id} style={styles.entryContainer}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryNumber}>Experience {index + 1}</Text>
            {formData.experience.length > 1 && (
              <TouchableOpacity 
                onPress={() => removeExperienceEntry(entry.id)}
                style={styles.removeButton}
              >
                <AntDesign name="minus" size={18} color={ERROR_RED} />
              </TouchableOpacity>
            )}
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Company/Role Name"
            placeholderTextColor={MEDIUM_OLIVE}
            value={entry.name}
            onChangeText={(text) => updateExperienceEntry(entry.id, 'name', text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Timeline (e.g., Jan 2020 - Present)"
            placeholderTextColor={MEDIUM_OLIVE}
            value={entry.timeline}
            onChangeText={(text) => updateExperienceEntry(entry.id, 'timeline', text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor={MEDIUM_OLIVE}
            value={entry.location}
            onChangeText={(text) => updateExperienceEntry(entry.id, 'location', text)}
          />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(139, 168, 137, 0.9)', 'rgba(139, 168, 137, 0.7)']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Tell us about yourself</Text>
            </View>

            {/* Basic Information */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={MEDIUM_OLIVE}
                value={formData.name}
                onChangeText={(text) => updateFormField('name', text)}
              />
              
              <TextInput
                style={[styles.input, styles.disabledInput]}
                placeholder="Email"
                placeholderTextColor={MEDIUM_OLIVE}
                value={formData.email}
                editable={false}
              />
            </View>

            {/* Education Section */}
            {renderEducationSection()}

            {/* Experience Section */}
            {renderExperienceSection()}

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: screenHeight,
    width: '100%',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    letterSpacing: 1,
    color: DEEP_GREEN,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    letterSpacing: 1,
    color: DEEP_GREEN,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 18,
    color: DEEP_GREEN,
  },
  addButton: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  entryContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryNumber: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: MEDIUM_OLIVE,
  },
  removeButton: {
    backgroundColor: '#FFE5E5',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: DEEP_GREEN,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: MEDIUM_OLIVE,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ERROR_RED,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: ERROR_RED,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: DEEP_GREEN,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  submitButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});