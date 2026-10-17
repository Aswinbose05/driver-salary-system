import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { StorageService, INITIAL_PROFILES } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  availableProfiles: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_KEY = 'driver_mgmt_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    StorageService.initialize();
    const profiles = StorageService.getProfiles();
    setAvailableProfiles(profiles);

    // Check stored user session
    const storedUserId = localStorage.getItem(ACTIVE_USER_KEY);
    if (storedUserId) {
      const found = profiles.find((p) => p.id === storedUserId && p.is_active);
      if (found) {
        setCurrentUser(found);
      } else {
        // Default to admin or first driver
        setCurrentUser(profiles[0] || null);
      }
    } else {
      // Default initial view to Admin
      const defaultUser = profiles.find((p) => p.role === 'admin') || profiles[0] || null;
      setCurrentUser(defaultUser);
      if (defaultUser) {
        localStorage.setItem(ACTIVE_USER_KEY, defaultUser.id);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }
        if (data.user) {
          const profiles = StorageService.getProfiles();
          const profile = profiles.find((p) => p.id === data.user.id || p.email === email);
          if (profile) {
            setCurrentUser(profile);
            localStorage.setItem(ACTIVE_USER_KEY, profile.id);
            setIsLoading(false);
            return { success: true };
          }
        }
      }

      // Local / Offline authentication fallback
      const profiles = StorageService.getProfiles();
      const matched = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase().trim());
      if (!matched) {
        setIsLoading(false);
        return { success: false, error: 'User account not found with this email address.' };
      }

      if (!matched.is_active) {
        setIsLoading(false);
        return { success: false, error: 'This account has been deactivated. Please contact administrator.' };
      }

      setCurrentUser(matched);
      localStorage.setItem(ACTIVE_USER_KEY, matched.id);

      StorageService.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: matched.id,
        actor_name: matched.full_name,
        action: 'LOGIN',
        entity_type: 'auth',
        entity_id: matched.id,
        details: `Successful login as ${matched.role.toUpperCase()}`,
        created_at: new Date().toISOString(),
      });

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  const switchUser = (userId: string) => {
    const profiles = StorageService.getProfiles();
    const target = profiles.find((p) => p.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem(ACTIVE_USER_KEY, target.id);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (currentUser) {
      StorageService.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'LOGIN',
        entity_type: 'auth',
        entity_id: currentUser.id,
        details: `Logged out from session`,
        created_at: new Date().toISOString(),
      });
    }
    setCurrentUser(null);
    localStorage.removeItem(ACTIVE_USER_KEY);
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
    }

    if (currentUser) {
      StorageService.addAuditLog({
        id: `log-${Date.now()}`,
        actor_id: currentUser.id,
        actor_name: currentUser.full_name,
        action: 'PASSWORD_CHANGE',
        entity_type: 'auth',
        entity_id: currentUser.id,
        details: 'Password was securely updated.',
        created_at: new Date().toISOString(),
      });
    }

    return { success: true };
  };

  const role: UserRole = currentUser?.role || 'driver';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAdmin,
        isLoading,
        login,
        switchUser,
        logout,
        changePassword,
        availableProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
