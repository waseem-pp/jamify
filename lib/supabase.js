import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const url = extra.supabaseUrl;
const anonKey = extra.supabaseAnonKey;

if (!url || url.startsWith('PASTE_')) {
  console.warn('Jamify: add your Supabase URL and anon key in app.json under "extra".');
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
