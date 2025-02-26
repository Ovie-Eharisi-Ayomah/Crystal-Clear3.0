/**
 * Custom hooks for managing property-related operations in the application.
 * Provides functionality for fetching, viewing, and adding properties.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Represents a property image in the system
 */
interface PropertyImage {
  id: string;
  image_url: string;
  image_type: 'exterior' | 'interior' | 'other';
  description: string | null;
}

/**
 * Represents a property in the system
 */
interface Property {
  id: string;
  owner_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  property_type: string;
  num_floors: number;
  num_windows: number;
  window_types: string[];
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

/**
 * Input data structure for creating a new property
 */
interface PropertyInput {
  owner_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  property_type: string;
  num_floors: number;
  num_windows: number;
  window_types: string[];
}

/**
 * Hook to fetch and manage a list of properties for the current user
 * @returns Object containing properties array, loading state, and error state
 */
export function useProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Function to load properties from Supabase
    async function loadProperties() {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            images:property_images(
              id,
              image_url,
              image_type,
              description
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load properties'));
      } finally {
        setIsLoading(false);
      }
    }

    // Only load properties if user is authenticated
    if (user) {
      loadProperties();
    }
  }, [user]);

  return { properties, isLoading, error };
}

/**
 * Hook to fetch and manage a single property by ID
 * @param propertyId - The ID of the property to fetch
 * @returns Object containing property data, loading state, and error state
 */
export function useProperty(propertyId: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Function to load a single property from Supabase
    async function loadProperty() {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            images:property_images(
              id,
              image_url,
              image_type,
              description
            )
          `)
          .eq('id', propertyId)
          .single();

        if (error) throw error;
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load property'));
      } finally {
        setIsLoading(false);
      }
    }

    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  return { property, isLoading, error };
}

/**
 * Hook to handle adding a new property
 * @returns Object containing addProperty function, loading state, and error state
 */
export function useAddProperty() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Function to add a new property to the database
   * @param propertyData - The property data to be added
   * @returns The newly created property data
   */
  const addProperty = async (propertyData: PropertyInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add property');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { addProperty, isLoading, error };
}