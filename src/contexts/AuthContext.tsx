import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, getProfile } from '@/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mealchoice_token';
const USER_KEY = 'mealchoice_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to apply theme
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        console.log('[AuthContext] Loading auth state');
        console.log('[AuthContext] Stored user from localStorage:', storedUser ? JSON.parse(storedUser) : null);

        if (storedToken && storedUser) {
          // Verify token is still valid
          const response = await getProfile(storedToken);

          console.log('[AuthContext] getProfile response:', response);

          if (response.success && response.user) {
            setToken(storedToken);
            setUser(response.user);
            console.log('[AuthContext] User set from API:', response.user);
            
            // Apply saved theme from user settings
            if (response.user.theme) {
              applyTheme(response.user.theme);
              console.log('[AuthContext] Applied theme:', response.user.theme);
            }
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            console.log('[AuthContext] Token invalid, cleared storage');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = (newToken: string, newUser: User) => {
    console.log('[AuthContext] login() called with user:', newUser);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    console.log('[AuthContext] logout() called');
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('ai_recommendations');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      console.log('[AuthContext] updateUser() called');
      console.log('[AuthContext] Current user:', user);
      console.log('[AuthContext] Updates:', updates);
      console.log('[AuthContext] Updated user:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
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
