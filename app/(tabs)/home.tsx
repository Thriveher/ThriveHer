import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { learningTopics } from '../data/topics';
import Navbar from '../components/navbar';
import { router } from 'expo-router';

export default function HomePage() {
  // Handle topic navigation to the skills detail page
  const handleTopicPress = (topicId: string | number) => {
    // Use the correct format for dynamic routes in Expo Router
    router.push(`/skills/${topicId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>My Learning Journey</Text>
          <Text style={styles.subtitle}>Track your progress across different skills</Text>
        </View>
        <View style={styles.cardsContainer}>
          {learningTopics.map((topic) => (
            <TouchableOpacity 
              key={topic.id} 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => handleTopicPress(topic.id)}
            >
              <View style={[styles.iconContainer, {backgroundColor: topic.bgColor || '#8BA889'}]}>
                <Text style={styles.icon}>{topic.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{topic.title}</Text>
                <Text style={styles.cardSubtitle}>{topic.description}</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, {width: `${topic.progress}%`}]} />
                </View>
                <Text style={styles.progressText}>{topic.progress}% complete</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 90, // Extra padding to account for navbar
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
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
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
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
  progressText: {
    fontSize: 12,
    color: '#49654E',
  },
});