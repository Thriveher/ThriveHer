import * as React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, StyleSheet, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser'; 
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { AntDesign } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

// Hardcoded Supabase configuration - ENSURE THESE ARE CORRECT
const SUPABASE_URL = 'https://ibwjjwzomoyhkxugmmmw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2pqd3pvbW95aGt4dWdtbW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzkwODgsImV4cCI6MjA2MDQ1NTA4OH0.RmnNBQh_1KJo0TgCjs72aBoxWoOsd_vWjNeIHRfVXac';

// Validate Supabase configuration
if (!SUPABASE_URL || SUPABASE_URL.includes('your-project-ref') || !SUPABASE_ANON_KEY) {
  console.error('CRITICAL: Invalid Supabase configuration detected!');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('Contains placeholder:', SUPABASE_URL.includes('your-project-ref'));
  throw new Error('Invalid Supabase configuration. Please check SUPABASE_URL and SUPABASE_ANON_KEY');
}

console.log('✅ Using Supabase URL:', SUPABASE_URL);
console.log('✅ Supabase key length:', SUPABASE_ANON_KEY.length);

// Initialize Supabase client with better configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options = {}) => {
      // Convert url to string for type safety and logging
      const urlString = typeof url === 'string' ? url : url.toString();
      console.log('🔍 Supabase fetch URL attempted:', urlString);
      
      // Critical check - ensure we're not using placeholder URL
      if (urlString.includes('your-project-ref.supabase.co')) {
        console.error('🚨 CRITICAL ERROR: Placeholder URL detected in request!');
        console.error('Request URL:', urlString);
        console.error('Expected base URL:', SUPABASE_URL);
        throw new Error('Invalid Supabase URL configuration detected in request');
      }
      
      // Verify the URL starts with our expected base URL
      if (!urlString.startsWith(SUPABASE_URL)) {
        console.error('🚨 URL mismatch detected!');
        console.error('Request URL:', urlString);
        console.error('Expected to start with:', SUPABASE_URL);
      }
      
      // Add timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        console.log('📡 Making request to:', urlString);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        clearTimeout(timeoutId);
        
        console.log('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          console.error('❌ Supabase response not OK:', response.status, response.statusText);
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Supabase fetch error:', error);
        console.error('Failed URL:', urlString);
        throw error;
      }
    },
  },
});

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
  const [isConnected, setIsConnected] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);
  
  // Get the correct redirect URI
  const redirectUri = makeRedirectUri({
    scheme: 'thriveher',
  });
  
  // Hardcoded Google client ID
  const googleWebClientId = '533095823294-v30vk06bomnpa5gk4qtgcagvct3pjgk0.apps.googleusercontent.com';
  
  // Configure Google auth with better error handling - removed additionalParameters
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

  // Check network connectivity
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      if (!state.isConnected) {
        setError('No internet connection. Please check your network and try again.');
      } else if (error?.includes('internet connection')) {
        setError(null);
      }
    });

    return unsubscribe;
  }, [error]);

  // Check current session on component mount
  React.useEffect(() => {
    checkCurrentSession();
  }, []);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleSignIn(id_token);
      } else {
        setError('Authentication failed: No token received');
        setLoading(false);
      }
    } else if (response?.type === 'error') {
      console.error('Auth response error:', response.error);
      setError(`Authentication failed: ${response.error?.description || 'Unknown error'}`);
      setLoading(false);
    } else if (response?.type === 'cancel') {
      setError('Authentication was cancelled');
      setLoading(false);
    }
  }, [response]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const retryWithBackoff = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
    
    throw lastError!;
  };

  const checkCurrentSession = async () => {
    try {
      console.log('Checking current session...');
      
      const sessionCheck = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          throw error;
        }
        
        console.log('Session check result:', session ? 'Session found' : 'No session');
        return session;
      };

      const session = await retryWithBackoff(sessionCheck, 2, 1000); // Reduced retries for session check
      
      if (session?.user) {
        console.log('Existing session found for user:', session.user.id);
        setCurrentUserUUID(session.user.id);
        
        // Check if profile exists and navigate accordingly
        const profileExists = await checkUserProfile(session.user.id);
        if (profileExists) {
          router.replace('/(tabs)/chat');
        } else {
          router.replace('/(tabs)/onboard');
        }
      }
    } catch (error) {
      console.error('Error checking current session:', error);
      // Don't show error for session check - user might not be logged in
      // But if it's a configuration error, we should show it
      if (error instanceof Error && error.message.includes('Invalid Supabase URL')) {
        setError('Configuration error. Please contact support.');
      }
    }
  };

  const checkUserProfile = async (userId: string): Promise<boolean> => {
    try {
      console.log('Checking user profile for UUID:', userId);
      
      const profileCheck = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Not found error is OK
          throw error;
        }
        
        return data;
      };

      const data = await retryWithBackoff(profileCheck);
      
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
      
      const matchOperation = async () => {
        // First, check if there's an existing profile with this email
        const { data: existingProfile, error: searchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
        
        if (searchError && searchError.code !== 'PGRST116') {
          throw searchError;
        }
        
        if (existingProfile && existingProfile.id !== newUserId) {
          console.log('Found existing profile with different UUID, updating...');
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ id: newUserId, updated_at: new Date().toISOString() })
            .eq('email', email);
          
          if (updateError) {
            throw updateError;
          }
          
          console.log('Successfully updated profile UUID');
        }
        
        return true;
      };

      await retryWithBackoff(matchOperation);
      return true;
    } catch (error) {
      console.error('Error matching user UUID:', error);
      return false;
    }
  };

  const createUserProfile = async (user: any): Promise<boolean> => {
    try {
      console.log('Creating user profile for:', user.id);
      
      const createOperation = async () => {
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
          throw error;
        }
        
        return true;
      };

      await retryWithBackoff(createOperation);
      console.log('Profile created successfully');
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    if (!idToken) {
      console.error('❌ No ID token received');
      setError('Authentication failed: No ID token received');
      setLoading(false);
      return;
    }

    if (!isConnected) {
      setError('No internet connection. Please check your network and try again.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting Google sign-in process...');
      console.log('🔑 ID Token length:', idToken.length);
      console.log('🌐 Using Supabase URL for auth:', SUPABASE_URL);
      
      // Double-check configuration before making request
      if (SUPABASE_URL.includes('your-project-ref')) {
        throw new Error('🚨 CRITICAL: Supabase URL still contains placeholder. Please update SUPABASE_URL.');
      }
      
      const signInOperation = async () => {
        console.log('📡 Calling supabase.auth.signInWithIdToken...');
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce: request?.nonce,
        });
        
        if (error) {
          console.error('❌ SignInWithIdToken error:', error);
          console.error('Error message:', error.message);
          console.error('Error status:', error.status);
          throw error;
        }
        
        if (!data.user) {
          throw new Error('No user data received from authentication');
        }
        
        console.log('✅ Authentication successful for user:', data.user.id);
        return data;
      };

      const data = await retryWithBackoff(signInOperation, 3, 2000);
      
      console.log('✅ User signed in successfully:', data.user.id);
      setCurrentUserUUID(data.user.id);
      setRetryCount(0);
      
      // Attempt to match UUID if there's an existing profile
      const uuidMatched = await matchUserUUID(data.user.email!, data.user.id);
      
      if (!uuidMatched) {
        console.warn('⚠️ UUID matching failed, but continuing with authentication');
      }
      
      // Check if user profile exists
      const profileExists = await checkUserProfile(data.user.id);
      
      if (profileExists) {
        console.log('✅ Profile exists, redirecting to chat');
        router.replace('/(tabs)/chat');
      } else {
        // Create profile if it doesn't exist
        const profileCreated = await createUserProfile(data.user);
        
        if (profileCreated) {
          console.log('✅ New profile created, redirecting to onboard');
          router.replace('/(tabs)/onboard');
        } else {
          console.log('⚠️ Profile creation failed, redirecting to onboard anyway');
          router.replace('/(tabs)/onboard');
        }
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('❌ Error signing in with Google:', errorMessage);
      
      // Check if it's a configuration issue
      if (errorMessage.includes('your-project-ref') || errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
        setError('🚨 Configuration Error: Invalid Supabase URL detected. Please check your setup.');
        console.error('🚨 CONFIGURATION ISSUE DETECTED!');
        console.error('Current SUPABASE_URL:', SUPABASE_URL);
        console.error('Make sure you have replaced the placeholder URL with your actual Supabase project URL');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (errorMessage.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else if (errorMessage.includes('Invalid token')) {
        setError('Authentication token is invalid. Please try signing in again.');
      } else {
        setError(`Authentication failed: ${errorMessage}`);
      }
      
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!isConnected) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      if (!request) {
        throw new Error('Authentication not ready. Please wait and try again.');
      }
      
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
      
      const signOutOperation = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      };

      await retryWithBackoff(signOutOperation);
      
      setCurrentUserUUID(null);
      setRetryCount(0);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => {
    console.error('Error loading image');
    setImageLoaded(false);
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    handleSignIn();
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
            
            {/* Network status indicator */}
            {!isConnected && (
              <View style={styles.networkStatusContainer}>
                <Text style={styles.networkStatusText}>⚠️ No Internet Connection</Text>
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
                {retryCount > 0 && retryCount < 3 && (
                  <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Retry ({retryCount}/3)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                (loading || !request || !isConnected) && styles.buttonDisabled
              ]}
              onPress={handleSignIn}
              disabled={loading || !request || !isConnected}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <View style={styles.buttonContent}>
                {loading ? (
                  <ActivityIndicator size="small" color={WHITE} style={styles.buttonIcon} />
                ) : (
                  <AntDesign name="google" size={24} color="white" style={styles.buttonIcon} />
                )}
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
  networkStatusContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    padding: 8,
    borderRadius: 6,
    zIndex: 999,
  },
  networkStatusText: {
    color: WHITE,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
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
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: ERROR_RED,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: DEEP_GREEN,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});