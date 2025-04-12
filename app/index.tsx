import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import styles from './styles';

export default function WelcomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['rgba(139, 168, 137, 0.9)', 'rgba(139, 168, 137, 0.7)']}
        style={styles.background}
      >
        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/images/react-logo.png')} // Replace with your artwork path
              style={styles.welcomeImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Thrive Her</Text>
            <Text style={styles.subtitle}>Connect. Grow. Succeed.</Text>
          </View>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              A community designed to empower women through networking, resources, and growth opportunities.
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}