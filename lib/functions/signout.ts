import { supabaseClient } from "../supabase/client";
import { useUser } from '../stores/user';

export const logout = async () => {
  const { data: session } = await supabaseClient.auth.getSession();

  // Clear the user data from the Zustand store
  const clearUserData = useUser.getState().clearUserData;
  clearUserData();

  if (!session || !session.session) {
    console.warn('No active session found.');
    window.location.href = '/'; // Redirect anyway
    return;
  }

  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error('Logout failed:', error.message);
  }

  window.location.href = '/';
};