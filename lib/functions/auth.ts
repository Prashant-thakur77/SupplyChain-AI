import { supabaseClient } from '@/lib/supabase/client';

export async function loginWithProvider(provider: 'google' | 'github') {
  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error(`${provider} login error:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`${provider} login error:`, error);
    return null;
  }
}

export async function sendMagicLink(email: string) {
  try {
    const { data, error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Magic link error:', error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

export const loginWithEmailPassword = async (email: string, password: string) => {
  console.log('Starting email and password login process...');
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.log('An error occurred during the email login process.');
    console.error('Login Error:', error.message);
    return null;
  }

  console.log('Email login successful. Data received:', data);
  return data;
};

export const signupWithEmailPassword = async (email: string, password: string) => {
  console.log('Starting email and password signup process...');
  
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.log('An error occurred during the email signup process.');
    console.error('Signup Error:', error.message);
    return null;
  }

  console.log('Email signup successful. Data received:', data);
  return data;
};
