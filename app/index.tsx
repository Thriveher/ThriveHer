import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase.js';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import styles from './styles';

// For Google Auth with Expo
WebBrowser.maybeCompleteAuthSession();

export default function WelcomePage() {
  const router = useRouter();
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      
      if (error) throw error;
      
      console.log('User signed in:', data.user);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    }
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
              source={require('../assets/images/welcome-page.png')} // Replace with your artwork path
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
            style={[styles.button, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Image 
              source={require('../assets/images/google-icon.png')} // Add a Google icon image to your assets
              style={{ width: 24, height: 24, marginRight: 10 }}
              resizeMode="contain"
            />
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}