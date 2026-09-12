'use client';

import { useUser } from '@/lib/stores/user';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

const SessionProvider = () => {
  const setUser = useUser((state) => state.setUserData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Initial fetch
    setUser();

    // Listen to auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, setUser]);

  return null;
};

export default SessionProvider;