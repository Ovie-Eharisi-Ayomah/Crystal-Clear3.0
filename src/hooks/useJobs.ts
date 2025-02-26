import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Represents a job request in the system
 */
interface JobRequest {
  id: string;
  property_id: string;
  owner_id: string;
  cleaner_id: string | null;
  status: 'new' | 'quoted' | 'accepted' | 'completed' | 'cancelled';
  description: string;
  preferred_date: string;
  preferred_time: string;
  created_at: string;
  property: {
    id: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    postcode: string;
    property_type: string;
    num_floors: number;
    num_windows: number;
    window_types: string[];
    images?: Array<{
      id: string;
      image_url: string;
      image_type: string;
    }>;
  };
  owner: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  quotes?: Array<{
    id: string;
    amount: number;
    message: string;
    status: string;
    cleaner: {
      id: string;
      business_name: string;
    };
  }>;
}

/**
 * Hook to fetch and manage job requests
 */
export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      if (!user) {
        console.log('No user found, skipping job fetch');
        return;
      }

      try {
        console.log('Loading jobs for user type:', user.user_metadata?.user_type);
        let query = supabase
          .from('job_requests')
          .select(`
            *,
            property:properties (
              id,
              address_line1,
              address_line2,
              city,
              postcode,
              property_type,
              num_floors,
              num_windows,
              window_types,
              images:property_images (
                id,
                image_url,
                image_type
              )
            ),
            owner:profiles!job_requests_owner_id_fkey (
              id,
              full_name,
              email,
              phone
            ),
            quotes (
              id,
              amount,
              message,
              status,
              cleaner:profiles!quotes_cleaner_id_fkey (
                id,
                business_name
              )
            )
          `)
          .order('created_at', { ascending: false });

        // If user is a cleaner, show new jobs
        if (user.user_metadata?.user_type === 'cleaner') {
          // Only show jobs with 'new' status
          query = query.eq('status', 'new');
        } else {
          // If user is a homeowner, show their own jobs
          query = query.eq('owner_id', user.id);
        }

        const { data, error: queryError } = await query;

        // Log the query results for debugging
        console.log('Jobs query results:', {
          userType: user.user_metadata?.user_type,
          jobsReturned: data?.length || 0,
          error: queryError
        });

        if (queryError) throw queryError;
        
        if (isMounted) {
          // Filter out any jobs without property data
          const validJobs = data?.filter(job => job.property) || [];
          console.log('Valid jobs after filtering:', validJobs.length);
          
          if (validJobs.length === 0 && data && data.length > 0) {
            console.warn('Jobs were found but filtered out due to missing property data:', data);
          }
          
          setJobs(validJobs);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading jobs:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load jobs'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { jobs, isLoading, error };
}

/**
 * Hook to fetch a single job request
 */
export function useJob(jobId: string) {
  const { user } = useAuth();
  const [job, setJob] = useState<JobRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      if (!user) {
        console.log('No user found, skipping job fetch');
        return;
      }

      try {
        console.log(`Loading job details for ID: ${jobId}`);
        const { data, error: queryError } = await supabase
          .from('job_requests')
          .select(`
            *,
            property:properties (
              id,
              address_line1,
              address_line2,
              city,
              postcode,
              property_type,
              num_floors,
              num_windows,
              window_types,
              images:property_images (
                id,
                image_url,
                image_type
              )
            ),
            owner:profiles!job_requests_owner_id_fkey (
              id,
              full_name,
              email,
              phone
            ),
            quotes (
              id,
              amount,
              message,
              status,
              cleaner:profiles!quotes_cleaner_id_fkey (
                id,
                business_name
              )
            )
          `)
          .eq('id', jobId)
          .single();

        console.log('Job query result:', {
          found: !!data,
          hasProperty: !!data?.property,
          error: queryError
        });

        if (queryError) throw queryError;
        if (!data) throw new Error('Job not found');
        if (!data.property) throw new Error('Job property data not found');
        
        if (isMounted) {
          setJob(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading job:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load job'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    loadJob();

    return () => {
      isMounted = false;
    };
  }, [jobId, user]);

  return { job, isLoading, error };
}

/**
 * Hook to handle creating new job requests
 */
export function useCreateJobRequest() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJobRequest = async (jobData: {
    property_id: string;
    description: string;
    preferred_date: string;
    preferred_time: string;
  }) => {
    if (!user) {
      throw new Error('User must be authenticated to create a job request');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newJobRequest = {
        ...jobData,
        owner_id: user.id,
        status: 'new' // Ensure status is explicitly set to 'new'
      };
      
      console.log('Creating new job request:', newJobRequest);
      
      const { data, error: queryError } = await supabase
        .from('job_requests')
        .insert([newJobRequest])
        .select()
        .single();

      if (queryError) throw queryError;
      console.log('Job request created successfully:', data);
      return data;
    } catch (err) {
      console.error('Error creating job request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job request');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createJobRequest, isLoading, error };
}