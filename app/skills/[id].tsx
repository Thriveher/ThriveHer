import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { getSyllabusBySkillId } from '../data/syllabus';
import Navbar from '../components/navbar';
import * as SecureStore from 'expo-secure-store';

// Define types for our data structure
type SyllabusItem = {
  id: string;
  title: string;
  description: string;
  progress: number;
  icon: string;
  bgColor: string;
  lessons: Lesson[];
}

type Lesson = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

// Create a storage adapter to handle web vs native platforms
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        return localStorage.getItem(key);
      } else {
        // Use SecureStore for native platforms
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error retrieving data from storage:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.setItem(key, value);
      } else {
        // Use SecureStore for native platforms
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        localStorage.removeItem(key);
      } else {
        // Use SecureStore for native platforms
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing data from storage:', error);
    }
  }
};

// Export the storage adapter for use elsewhere in the app
export { storage };

export default function SkillsDetailScreen() {
  // Use Expo Router's useLocalSearchParams instead of React Navigation's useRoute
  const params = useLocalSearchParams();
  const skillId = params.id as string;
  
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillTitle, setSkillTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSyllabus();
  }, [skillId]);

  async function fetchSyllabus() {
    try {
      // Fetch the syllabus data for this specific skill
      const data = await getSyllabusBySkillId(skillId);
      setSyllabus(data.items);
      setSkillTitle(data.title);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
      setError('Failed to load syllabus data. Please try again.');
      setLoading(false);
    }
  }

  const handleTopicPress = (topicId: string, index: number, progress: number) => {
    // Only allow clicking lessons that are in progress (not completed and not locked)
    const isCompleted = progress === 100;
    const isLocked = index > 0 && syllabus[index - 1].progress < 100;
    
    if (!isCompleted && !isLocked) {
      // Use Expo Router navigation
      router.push({
        pathname: '/lesson/[topicId]',
        params: { 
          skillId: skillId,
          topicId: topicId
        }
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8BA889" />
        <Text style={styles.loadingText}>Loading syllabus...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchSyllabus();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{skillTitle}</Text>
          <Text style={styles.subtitle}>Complete all topics to master this skill</Text>
        </View>

        <View style={styles.cardsContainer}>
          {syllabus.map((topic, index) => {
            // Calculate if this topic is locked or completed
            const isLocked = index > 0 && syllabus[index - 1].progress < 100;
            const isCompleted = topic.progress === 100;
            
            // Determine if this topic is clickable
            const isClickable = !isLocked && !isCompleted;
            
            return (
              <TouchableOpacity 
                key={topic.id} 
                style={[
                  styles.card,
                  isLocked && styles.lockedCard,
                  isCompleted && styles.completedCard
                ]}
                activeOpacity={isClickable ? 0.7 : 1}
                onPress={() => handleTopicPress(topic.id, index, topic.progress)}
                disabled={!isClickable}
              >
                <View style={[
                  styles.iconContainer, 
                  {backgroundColor: isLocked ? '#B8B8B8' : topic.bgColor || '#8BA889'},
                  isCompleted && styles.completedIconContainer
                ]}>
                  <Text style={styles.icon}>{topic.icon}</Text>
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                  {isCompleted && (
                    <View style={styles.completedOverlay}>
                      <Text style={styles.completedIcon}>✓</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardTitle, 
                    isLocked && styles.lockedText,
                    isCompleted && styles.completedText
                  ]}>
                    {topic.title}
                  </Text>
                  <Text style={[
                    styles.cardSubtitle, 
                    isLocked && styles.lockedText,
                    isCompleted && styles.completedText
                  ]}>
                    {topic.description}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        {width: `${topic.progress}%`},
                        isLocked && styles.lockedProgressBar,
                        isCompleted && styles.completedProgressBar
                      ]} 
                    />
                  </View>
                  <Text style={[
                    styles.progressText, 
                    isLocked && styles.lockedText,
                    isCompleted && styles.completedText
                  ]}>
                    {isLocked ? 'Complete previous topic to unlock' : 
                     isCompleted ? 'Completed' : 
                     `${topic.progress}% complete`}
                  </Text>
                  {isClickable && (
                    <Text style={styles.continueText}>Tap to continue</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      <Navbar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8BA889',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#49654E',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90, // Extra padding to account for navbar
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    marginBottom: 16,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: '#253528',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#253528',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#49654E',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  lockedCard: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
  },
  completedCard: {
    backgroundColor: '#F0F7F0',
    borderColor: '#D7E6D7',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  completedIconContainer: {
    backgroundColor: '#6CA870',
  },
  icon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  completedOverlay: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6CA870',
  },
  completedIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6CA870',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253528',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#49654E',
    marginBottom: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E8EFE8',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8BA889',
    borderRadius: 4,
  },
  lockedProgressBar: {
    backgroundColor: '#CCCCCC',
  },
  completedProgressBar: {
    backgroundColor: '#6CA870',
  },
  progressText: {
    fontSize: 12,
    color: '#49654E',
  },
  lockedText: {
    color: '#999999',
  },
  completedText: {
    color: '#6CA870',
  },
  continueText: {
    fontSize: 12,
    color: '#8BA889',
    fontWeight: '600',
    marginTop: 4,
  },
});