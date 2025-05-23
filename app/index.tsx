import * as React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser'; 
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { AntDesign } from '@expo/vector-icons';

// Hardcoded Supabase configuration
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1yZWYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzQwMDAwMCwiZXhwIjoxOTYyOTc2MDAwfQ.your-anon-key-signature';

// Initialize Supabase client with hardcoded values
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color constants
const SOFT_GREEN = '#8BA889';
const DEEP_GREEN = '#253528';
const MEDIUM_OLIVE = '#49654E';
const WHITE = '#FFFFFF';
const ERROR_RED = '#ff3b30';

// For Google Auth with Expo
WebBrowser.maybeCompleteAuthSession();

// Define interfaces
interface AuthError {
  message: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Get screen dimensions
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [currentUserUUID, setCurrentUserUUID] = React.useState<string | null>(null);
  
  // Get the correct redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'thriveher', // Updated scheme name
  });
  
  // Hardcoded Google client ID
  const googleWebClientId = '533095823294-v30vk06bomnpa5gk4qtgcagvct3pjgk0.apps.googleusercontent.com';
  
  // Configure Google auth
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      clientId: googleWebClientId,
      webClientId: googleWebClientId,
      redirectUri,
      responseType: 'id_token',
      usePKCE: false,
      scopes: ['profile', 'email'],
    }
  );

  // Check current session on component mount
  React.useEffect(() => {
    checkCurrentSession();
  }, []);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error('Auth response error:', response.error);
      setError('Authentication failed. Please try again.');
      setLoading(false);
    }
  }, [response]);

  const checkCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        return;
      }
      
      if (session?.user) {
        console.log('Existing session found for user:', session.user.id);
        setCurrentUserUUID(session.user.id);
        
        // Check if profile exists and navigate accordingly
        const profileExists = await checkUserProfile(session.user.id);
        if (profileExists) {
          router.replace('/(tabs)/chat');
        } else {
          router.replace('/onboard');
        }
      }
    } catch (error) {
      console.error('Error checking current session:', error);
    }
  };

  const checkUserProfile = async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking user profile for UUID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log('Profile not found or error:', error.message);
        return false;
      }
      
      if (data) {
        console.log('Profile found:', data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  const matchUserUUID = async (email: string, newUserId: string): Promise<boolean> => {
    try {
      console.log('Attempting to match user UUID for email:', email);
      
      // First, check if there's an existing profile with this email
      const { data: existingProfile, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error searching for existing profile:', searchError);
        return false;
      }
      
      if (existingProfile && existingProfile.id !== newUserId) {
        console.log('Found existing profile with different UUID, updating...');
        
        // Update the existing profile with the new UUID
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ id: newUserId, updated_at: new Date().toISOString() })
          .eq('email', email);
        
        if (updateError) {
          console.error('Error updating profile UUID:', updateError);
          return false;
        }
        
        console.log('Successfully updated profile UUID');
        return true;
      }
      
      console.log('No UUID mismatch found or profile does not exist');
      return true;
    } catch (error) {
      console.error('Error matching user UUID:', error);
      return false;
    }
  };

  const createUserProfile = async (user: any): Promise<boolean> => {
    try {
      console.log('Creating user profile for:', user.id);
      
      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .insert(profileData);
      
      if (error) {
        console.error('Error creating profile:', error);
        return false;
      }
      
      console.log('Profile created successfully');
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  };

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
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: request?.nonce,
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No user data received');
      }
      
      console.log('User signed in:', data.user);
      setCurrentUserUUID(data.user.id);
      
      // Attempt to match UUID if there's an existing profile
      const uuidMatched = await matchUserUUID(data.user.email!, data.user.id);
      
      if (!uuidMatched) {
        console.warn('UUID matching failed, but continuing with authentication');
      }
      
      // Check if user profile exists
      const profileExists = await checkUserProfile(data.user.id);
      
      if (profileExists) {
        console.log('Profile exists, redirecting to chat');
        router.replace('/(tabs)/chat');
      } else {
        // Create profile if it doesn't exist
        const profileCreated = await createUserProfile(data.user);
        
        if (profileCreated) {
          console.log('New profile created, redirecting to onboard');
          router.replace('/onboard');
        } else {
          console.log('Profile creation failed, redirecting to onboard anyway');
          router.replace('/onboard');
        }
      }
      
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

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        Alert.alert('Error', 'Failed to sign out');
      } else {
        setCurrentUserUUID(null);
        console.log('User signed out successfully');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

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
            {/* Debug info - remove in production */}
            {currentUserUUID && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>Current UUID: {currentUserUUID}</Text>
                <TouchableOpacity onPress={handleSignOut} style={styles.debugButton}>
                  <Text style={styles.debugButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
            
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  debugContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugText: {
    fontSize: 12,
    color: DEEP_GREEN,
    textAlign: 'center',
    marginBottom: 5,
  },
  debugButton: {
    backgroundColor: ERROR_RED,
    padding: 5,
    borderRadius: 4,
    alignSelf: 'center',
  },
  debugButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 300,
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