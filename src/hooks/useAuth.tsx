import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LockoutInfo {
  isLocked: boolean;
  lockedUntil: string | null;
  reason: string | null;
  remainingMinutes: number;
}

// Client-side rate limiter using a sliding window
const loginAttempts: { timestamp: number }[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5; // max 5 attempts per minute

const isRateLimited = (): { limited: boolean; waitSeconds: number } => {
  const now = Date.now();
  // Remove expired entries
  while (loginAttempts.length > 0 && now - loginAttempts[0].timestamp > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.shift();
  }
  if (loginAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS) {
    const oldestInWindow = loginAttempts[0].timestamp;
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
    return { limited: true, waitSeconds: Math.ceil(waitMs / 1000) };
  }
  return { limited: false, waitSeconds: 0 };
};

const recordAttempt = () => {
  loginAttempts.push({ timestamp: Date.now() });
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; locked?: boolean; rateLimited?: boolean; lockoutInfo?: LockoutInfo }>;
  signOut: () => Promise<void>;
  checkAccountLockout: (email: string) => Promise<LockoutInfo>;
}

// Parse user agent to get browser and OS info
const parseUserAgent = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os, deviceInfo: `${browser} on ${os}` };
};

// Send login notification
const sendLoginNotification = async (userId: string, email: string) => {
  try {
    const { browser, os, deviceInfo } = parseUserAgent();
    
    await supabase.functions.invoke('send-login-notification', {
      body: {
        userId,
        email,
        deviceInfo,
        browser,
        os,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Account created!",
        description: "You can now sign in to your account.",
      });
    }

    return { error };
  };

  const checkAccountLockout = async (email: string): Promise<LockoutInfo> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-account-lockout', {
        body: { email },
      });

      if (error) {
        console.error('Error checking lockout:', error);
        return { isLocked: false, lockedUntil: null, reason: null, remainingMinutes: 0 };
      }

      return data as LockoutInfo;
    } catch (error) {
      console.error('Error checking lockout:', error);
      return { isLocked: false, lockedUntil: null, reason: null, remainingMinutes: 0 };
    }
  };

  const recordFailedLogin = async (email: string) => {
    try {
      const { deviceInfo } = parseUserAgent();
      await supabase.functions.invoke('check-account-lockout?action=record-failure', {
        body: { 
          email,
          userAgent: deviceInfo,
        },
      });
    } catch (error) {
      console.error('Error recording failed login:', error);
    }
  };

  const clearFailedAttempts = async (email: string) => {
    try {
      await supabase.functions.invoke('check-account-lockout?action=clear', {
        body: { email },
      });
    } catch (error) {
      console.error('Error clearing failed attempts:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: any; locked?: boolean; rateLimited?: boolean; lockoutInfo?: LockoutInfo }> => {
    // Client-side rate limiting
    const rateCheck = isRateLimited();
    if (rateCheck.limited) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: `Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      });
      return { error: { message: 'Rate limited' }, rateLimited: true };
    }
    recordAttempt();

    // Check if account is locked
    const lockoutInfo = await checkAccountLockout(email);
    
    if (lockoutInfo.isLocked) {
      toast({
        variant: "destructive",
        title: "Account Locked",
        description: `Your account is temporarily locked. Please try again in ${lockoutInfo.remainingMinutes} minutes.`,
      });
      return { error: { message: 'Account is locked' }, locked: true, lockoutInfo };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed attempt
      await recordFailedLogin(email);
      
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } else if (data.user) {
      // Clear failed attempts on successful login
      await clearFailedAttempts(email);
      // Send login notification for new device detection
      sendLoginNotification(data.user.id, email);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut, checkAccountLockout }}>
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
