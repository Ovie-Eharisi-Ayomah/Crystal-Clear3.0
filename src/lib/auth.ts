/**
 * Authentication utilities for managing user authentication state
 * and operations using Supabase Auth.
 */

import { supabase } from './supabase';
import { Provider } from '@supabase/supabase-js';

/**
 * Valid user types in the system
 */
export type UserType = 'homeowner' | 'cleaner';

/**
 * Data required for user registration
 */
interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  userType: UserType;
}

/**
 * Registers a new user with Supabase Auth
 * @param param0 - Object containing user registration data
 * @returns The authentication data from Supabase
 */
export async function signUp({ email, password, fullName, userType }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: userType,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Data required for user authentication
 */
interface SignInData {
  email: string;
  password: string;
}

/**
 * Authenticates a user with email and password
 * @param param0 - Object containing login credentials
 * @returns The authentication data from Supabase
 */
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Signs in with a social provider
 * @param provider - The social provider to use
 * @param userType - The type of user (homeowner or cleaner)
 * @returns The authentication data from Supabase
 */
export async function signInWithSocial(provider: Provider, userType: UserType) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        user_type: userType,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Signs out the current user with enhanced error handling
 * @returns A promise that resolves when the sign-out process completes
 */
export async function signOut() {
  // Step 1: First check if we actually have a session to prevent unnecessary errors
  const { data: sessionData } = await supabase.auth.getSession();
  const hasActiveSession = !!sessionData?.session;
  
  // Always clear local storage to ensure client-side logout occurs
  // regardless of server-side success
  const clearLocalState = () => {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    // Clear any other auth-related items you might have
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('supabase.auth.expiresAt');
    // Any other app-specific auth state
  };
  
  try {
    // Only attempt server-side logout if we think we have a session
    if (hasActiveSession) {
      try {
        // Try to sign out from Supabase
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          console.warn('Supabase sign-out returned an error, but continuing with local logout:', error);
        }
      } catch (supabaseError) {
        // Catch and log the error but continue with local logout
        console.warn('Caught error during Supabase sign-out, continuing with local logout:', supabaseError);
      }
    } else {
      console.log('No active session detected, performing local logout only');
    }
    
    // Always clear local state as the final step
    clearLocalState();
    
    return { success: true, method: hasActiveSession ? 'full' : 'local-only' };
  } catch (error) {
    // Ensure local state is cleared even if there's an unexpected error
    clearLocalState();
    console.error('Unexpected error during sign-out:', error);
    
    // Return success anyway since we've cleared local state
    return { success: true, method: 'local-only', error };
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Refreshes the current session
 * @returns The refreshed session data
 */
export async function refreshSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  if (error) throw error;
  return session;
}