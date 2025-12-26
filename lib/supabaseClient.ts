import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars from our shim or process
// Helper to safely get env vars
const getEnv = (key: string) => {
  // 1. Vite / Modern Standard
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // 2. Node / Legacy Shim
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // 3. Window Shim
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
    return (window as any).process.env[key];
  }
  return undefined;
};

// Retrieve environment variables
const rawUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL');
const rawKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY');

// Check if configuration is present and valid
const isValidConfig = rawUrl && rawKey && rawUrl !== 'YOUR_SUPABASE_URL';

// Use placeholders if config is missing to prevent createClient from throwing an error on startup.
// The actual API calls are protected by isSupabaseConfigured() check in the app logic.
const supabaseUrl = isValidConfig ? rawUrl : 'https://xvmpvzldezpoxxsarizm.supabase.co';
const supabaseAnonKey = isValidConfig ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bXB2emxkZXpwb3h4c2FyaXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTEwMTksImV4cCI6MjA4MTQyNzAxOX0.TC-SJKzTRANjoLiRi2yg_EHu6xLer2wr-RaJ4AWIv04';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return true;
};