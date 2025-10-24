import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department?: string;
  manager_id?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('🔍 Fetching user profile for userId:', userId);

    if (!userId) {
      console.error('❌ Cannot fetch profile: userId is undefined or null');
      setUserProfile(null);
      return;
    }

    try {
      console.log('📡 Making Supabase query to users table...');

      // Add a timeout to prevent hanging forever
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId);

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('📥 Query response received');
      console.log('   Error:', error ? JSON.stringify(error) : 'none');
      console.log('   Data:', data);

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        setUserProfile(null);
        return;
      }

      // Check if we got any results
      if (!data || data.length === 0) {
        console.warn('⚠️ No user profile found for userId:', userId);
        setUserProfile(null);
        return;
      }

      console.log('✅ User profile fetched successfully:', data[0]);
      setUserProfile(data[0]);
    } catch (error) {
      console.error('💥 Exception fetching user profile:', error);
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 Setting up auth...');
    let mounted = true;

    // Listen for auth changes - this handles both initial session and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth event:', event, 'Session:', session ? 'exists' : 'none');

      if (!mounted) {
        console.log('⚠️ Component unmounted, skipping auth update');
        return;
      }

      try {
        setSession(session);
        setUser(session?.user ?? null);

        // ALWAYS set loading to false first to unblock the UI
        if (mounted) {
          console.log('✅ Setting loading to false (before profile fetch)');
          setLoading(false);
        }

        // Fetch profile in the background - don't block the UI
        if (session?.user) {
          console.log('👤 User authenticated:', session.user.id);
          // Don't await - let it happen in the background
          fetchUserProfile(session.user.id).catch(error => {
            console.error('Background profile fetch failed:', error);
          });
        } else {
          console.log('ℹ️ No user session, clearing profile');
          setUserProfile(null);
        }
      } catch (error) {
        console.error('💥 Error handling auth change:', error);
        // Still set loading to false even on error
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) return { error };

      // If sign up successful and user is created, update the users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            name: fullName,
            role: 'employee', // Default role
          }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
