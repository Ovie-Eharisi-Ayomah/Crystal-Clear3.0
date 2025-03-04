import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  sms_notifications: boolean;
  user_type: 'homeowner' | 'cleaner';
  business_name?: string;
  service_radius?: number;
  hourly_rate?: number;
  insurance_number?: string;
  contact_address?: string;
}

interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  business_name?: string;
  service_radius?: number;
  hourly_rate?: number;
  insurance_number?: string;
  contact_address?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (queryError) throw queryError;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load profile'));
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);
  
  const getProfileById = async (profileId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();
        
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user) throw new Error('No authenticated user');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update profile');
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('No authenticated user');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });
      return publicUrl;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to upload avatar');
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('No authenticated user');

    try {
      // Sign out the user which will trigger the auth state change
      // and redirect to login
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return true;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete account');
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadAvatar,
    deleteAccount,
    getProfileById
  };
}