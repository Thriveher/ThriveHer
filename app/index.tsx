import * as React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StyleSheet, Dimensions, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser'; 
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { AntDesign } from '@expo/vector-icons';

// Color constants
const SOFT_GREEN = '#8BA889';
const DEEP_GREEN = '#253528';
const MEDIUM_OLIVE = '#49654E';
const WHITE = '#FFFFFF';
const ERROR_RED = '#ff3b30';

// For Google Auth with Expo
WebBrowser.maybeCompleteAuthSession();

// Define an interface for the error state
interface AuthError {
  message: string;
}

// Get screen dimensions
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  // Get the correct redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'yourapp', // Replace with your app's scheme
  });
  
  // Hardcoded Google client ID for demo purposes
  const googleWebClientId = '533095823294-v30vk06bomnpa5gk4qtgcagvct3pjgk0.apps.googleusercontent.com';
  
  // Configure Google auth properly with explicit nonce handling
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      clientId: googleWebClientId, // Use hardcoded value
      webClientId: googleWebClientId, // Use hardcoded value
      redirectUri,
      responseType: 'id_token',
      usePKCE: false,
      scopes: ['profile', 'email'],
    }
  );

  React.useEffect(() => {
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

  // Handle image loading errors
  const handleImageError = () => {
    console.error('Error loading image');
    setImageLoaded(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(139, 168, 137, 0.9)', 'rgba(139, 168, 137, 0.7)']}
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.contentContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: 'https://github.com/Durva24/ThriveHer/blob/main/assets/images/welcome-page.png?raw=true' }}
                style={styles.welcomeImage}
                resizeMode="contain"
                accessibilityLabel="Welcome image"
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
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
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                loading && styles.buttonDisabled
              ]}
              onPress={handleSignIn}
              disabled={loading || !request}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <View style={styles.buttonContent}>
                <AntDesign name="google" size={24} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// Styles remain the same
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // Changed from space-between to center
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 300, // Fixed height instead of flex
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
    maxWidth: 350,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 38,
    letterSpacing: 1,
    color: DEEP_GREEN,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    letterSpacing: 2,
    color: DEEP_GREEN,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    width: '90%',
    marginBottom: 30,
  },
  descriptionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: DEEP_GREEN,
  },
  button: {
    backgroundColor: DEEP_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '80%',
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorContainer: {
    marginVertical: 10,
    padding: 10,
    width: '85%',
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: ERROR_RED,
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});