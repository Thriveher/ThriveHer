// The file should already have .tsx extension, but let's ensure TypeScript is configured

// Create or update tsconfig.json in your project root with:
// {
//   "compilerOptions": {
//     "jsx": "react-native",
//     "esModuleInterop": true,
//     "strict": true,
//     "target": "esnext",
//     "module": "esnext",
//     "moduleResolution": "node",
//     "lib": ["esnext"],
//     "allowSyntheticDefaultImports": true
//   },
//   "exclude": ["node_modules"]
// }

import * as React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image, 
  Platform,
  StyleSheet,
  Dimensions
} from 'react-native';
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
const { width, height } = Dimensions.get('window');

// For Google Auth with Expo
WebBrowser.maybeCompleteAuthSession();

// Define an interface for the error state
interface AuthError {
  message: string;
}

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
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
              source={require('../../assets/images/welcome-page.png')}
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
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.button, 
              { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
              loading && styles.buttonDisabled
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 2,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
    maxHeight: height * 0.45,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold', // A sophisticated font similar to Zara's aesthetic
    fontSize: 42,
    letterSpacing: 1,
    color: DEEP_GREEN,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat-Medium', // A clean, modern font for contrast
    fontSize: 18,
    letterSpacing: 2,
    color: DEEP_GREEN,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  descriptionContainer: {
    width: '85%',
    marginVertical: 24,
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
    paddingVertical: 16,
    width: '85%',
    borderRadius: 12,
    marginTop: 24,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 1,
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
