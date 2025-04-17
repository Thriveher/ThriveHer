import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase.js';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { AntDesign } from '@expo/vector-icons';
import styles from './styles';

// For Google Auth with Expo
WebBrowser.maybeCompleteAuthSession();

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the correct redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'yourapp', // Replace with your app's scheme
  });
  
  // Configure Google auth properly with explicit nonce handling
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      responseType: 'id_token',
      usePKCE: false,
      scopes: ['profile', 'email'],
    }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      // The ID token will contain a matching nonce from the request
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Auth response error:', response.error);
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    if (!idToken) {
      console.error('No ID token received');
      setError('Authentication failed: No ID token received');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Signing in with ID token...');
      
      // When using signInWithIdToken, we need to specify the nonce from the original request
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: request?.nonce, // Pass the nonce from the original request
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      console.log('User signed in:', data.user);
      router.replace('/(tabs)/home');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('Error signing in with Google:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await promptAsync();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Could not start authentication';
      console.error('Error starting auth flow:', errorMessage);
      setError(errorMessage);
      setLoading(false);
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
              source={require('../assets/images/welcome-page.png')}
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
          
          {error && (
            <View style={{ marginVertical: 10, padding: 10 }}>
              <Text style={{ color: '#ff3b30', textAlign: 'center' }}>{error}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.button, 
              { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
              loading && { opacity: 0.6 }
            ]}
            onPress={handleSignIn}
            disabled={loading || !request}
          >
            <AntDesign name="google" size={24} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}