import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { mockData } from '../lib/config';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'legalai_demo_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const demoUser = localStorage.getItem(DEMO_USER_KEY);
    if (demoUser) {
      try {
        const parsedUser = JSON.parse(demoUser);
        // Migrate old demo users with invalid ID format
        if (parsedUser.id === 'demo-user-id') {
          console.log('Migrating old demo user to new format');
          localStorage.removeItem(DEMO_USER_KEY);
          // Let it fall through to auth check
        } else {
          setUser(parsedUser);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Failed to parse demo user', e);
        localStorage.removeItem(DEMO_USER_KEY);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setSession(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const demoLogin = () => {
    // Use a fixed UUID for demo user to ensure database compatibility
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: mockData.demoUser.email,
      user_metadata: { full_name: mockData.demoUser.name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
