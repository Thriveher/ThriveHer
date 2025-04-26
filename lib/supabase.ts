import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Define storage interface
interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

// Safe web storage with localStorage fallback
const createWebStorage = (): StorageAdapter => {
  if (typeof localStorage === 'undefined') {
    return {
      getItem: async (): Promise<null> => null,
      setItem: async (): Promise<void> => {},
      removeItem: async (): Promise<void> => {},
    };
  }

  return {
    getItem: (key: string): Promise<string | null> => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string): Promise<void> => {
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string): Promise<void> => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
};

// SecureStore adapter for native platforms
const ExpoSecureStoreAdapter: StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore get error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore set error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore remove error:', error);
    }
  },
};

// Choose storage by platform
const storage: StorageAdapter = Platform.OS === 'web' ? createWebStorage() : ExpoSecureStoreAdapter;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Type check for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});