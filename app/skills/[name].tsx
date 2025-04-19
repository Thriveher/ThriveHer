import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { getSyllabusBySkillId } from '../data/syllabus';
import Navbar from '../components/navbar';

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

// Define route param type
type RouteParams = {
  Skills: {
    name: string;
  }
}

export default function SkillsDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Skills'>>();
  const navigation = useNavigation<any>();
  const { name } = route.params;
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillTitle, setSkillTitle] = useState('');

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        // Fetch the syllabus data for this specific skill
        const data = await getSyllabusBySkillId(name);
        setSyllabus(data.items);
        setSkillTitle(data.title);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching syllabus:', error);
        setLoading(false);
      }
    };

    fetchSyllabus();
  }, [name]);

  const handleTopicPress = (topicId: string, index: number) => {
    // Check if this topic is unlocked (either it's the first one or previous is completed)
    const isUnlocked = index === 0 || syllabus[index - 1].progress === 100;
    
    if (isUnlocked) {
      navigation.navigate('lessonDetail', {
        skillId: name,
        topicId: topicId
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{skillTitle}</Text>
          <Text style={styles.subtitle}>Complete all topics to master this skill</Text>
        </View>

        <View style={styles.cardsContainer}>
          {syllabus.map((topic, index) => {
            // Calculate if this topic is locked
            const isLocked = index > 0 && syllabus[index - 1].progress < 100;
            
            return (
              <TouchableOpacity 
                key={topic.id} 
                style={[
                  styles.card,
                  isLocked && styles.lockedCard
                ]}
                activeOpacity={isLocked ? 0.5 : 0.7}
                onPress={() => handleTopicPress(topic.id, index)}
                disabled={isLocked}
              >
                <View style={[styles.iconContainer, {backgroundColor: topic.bgColor || '#8BA889'}]}>
                  <Text style={styles.icon}>{topic.icon}</Text>
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, isLocked && styles.lockedText]}>{topic.title}</Text>
                  <Text style={[styles.cardSubtitle, isLocked && styles.lockedText]}>
                    {topic.description}
                  </Text>
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        {width: `${topic.progress}%`},
                        isLocked && styles.lockedProgressBar
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, isLocked && styles.lockedText]}>
                    {isLocked ? 'Complete previous topic to unlock' : `${topic.progress}% complete`}
                  </Text>
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
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
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
    opacity: 0.7,
    backgroundColor: '#F5F5F5',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 24,
    color: '#FFFFFF',
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
    backgroundColor: '#BBBBBB',
  },
  progressText: {
    fontSize: 12,
    color: '#49654E',
  },
  lockedText: {
    color: '#888888',
  },
});