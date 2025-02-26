import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// This helper function properly checks if the current path is within the dashboard section
const isDashboardRoute = (path: string) => path === '/dashboard' || path.startsWith('/dashboard/');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const inactivityTimer = useRef<number>();
  const lastActivityTime = useRef<number>(Date.now());

  const resetInactivityTimer = () => {
    lastActivityTime.current = Date.now();
    window.clearTimeout(inactivityTimer.current);
    
    // Only set a new timer if the user is logged in
    if (session) {
      inactivityTimer.current = window.setTimeout(async () => {
        const timeSinceLastActivity = Date.now() - lastActivityTime.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          console.log('User inactive for 10 minutes, logging out');
          try {
            await supabase.auth.signOut();
            navigate('/login', { 
              replace: true,
              state: { 
                from: location.pathname,
                message: 'You have been logged out due to inactivity'
              }
            });
          } catch (error) {
            console.error('Error during auto-logout:', error);
          }
        }
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Track user activity
  useEffect(() => {
    const events = [
      'mousedown',
      'keydown',
      'touchstart',
      'mousemove',
      'scroll',
      'click'
    ];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      window.clearTimeout(inactivityTimer.current);
    };
  }, [session]); // Reset when session changes

  useEffect(() => {
    let mounted = true;
    
    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Only redirect if profile completion is needed
          if (!initialSession.user.user_metadata?.full_name) {
            navigate('/complete-profile', { replace: true });
          } else if (initialLoad && PUBLIC_ROUTES.includes(location.pathname)) {
            // Only redirect to dashboard from public pages on initial load
            navigate('/dashboard', { replace: true });
          }
          // No redirect if already on a dashboard route or subpath
        } else {
          // Only redirect to login if on a protected route
          const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
          if (!isPublicRoute) {
            navigate('/login', { replace: true, state: { from: location.pathname } });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    }
    
    initializeAuth();
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      switch (event) {
        case 'SIGNED_IN': {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // Handle profile completion check
          if (!currentSession?.user.user_metadata?.full_name) {
            navigate('/complete-profile', { replace: true });
            return;
          }
          
          // Only redirect to dashboard if explicitly on login, signup, or home page
          // This prevents redirects when refreshing on dashboard subpaths or other pages
          const isPublicOrAuthPage = PUBLIC_ROUTES.includes(location.pathname);
          if (isPublicOrAuthPage) {
            navigate('/dashboard', { replace: true });
          }
          break;
        }
        case 'SIGNED_OUT': {
          // Clear auth state first
          setSession(null);
          setUser(null);
          
          // Clear local storage
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          
          // Clear inactivity timer
          window.clearTimeout(inactivityTimer.current);
          
          // Then redirect to login
          navigate('/login', { replace: true });
          break;
        }
        case 'TOKEN_REFRESHED':
          setSession(currentSession);
          resetInactivityTimer(); // Reset timer when token is refreshed
          break;
        case 'USER_UPDATED':
          setUser(currentSession?.user ?? null);
          break;
      }
    });
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.clearTimeout(inactivityTimer.current);
    };
  }, [navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}