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

        // For debugging - get ALL jobs regardless of user role
        console.log('DEBUG MODE: Getting all jobs without filtering');
        
        // First, make an unfiltered query to see if ANY jobs exist
        const { data: allJobs, error: allJobsError } = await supabase
          .from('job_requests')
          .select('id, status, owner_id, property_id');
          
        console.log('All jobs in database (unfiltered):', allJobs);
        
        if (allJobsError) {
          console.error('Error getting all jobs:', allJobsError);
        }
        
        // Normal filtering logic (temporarily disabled for debugging)
        /*
        if (user.user_metadata?.user_type === 'cleaner') {
          console.log('User is a cleaner:', user.id);
          query = query.or('status.eq.new');
          
          if (user.id) {
            console.log('Adding cleaner_id condition for:', user.id);
            query = query.or('cleaner_id.eq.' + user.id);
          }
        } else {
          console.log('User is a homeowner:', user.id);
          query = query.eq('owner_id', user.id);
        }
        */

        // For debugging - don't apply any filters to the main query either
        const { data, error: queryError } = await query;

        // Log the query results for debugging
        console.log('Jobs query results:', {
          userType: user.user_metadata?.user_type,
          jobsReturned: data?.length || 0,
          error: queryError
        });

        if (queryError) throw queryError;
        
        if (isMounted) {
          // Use all jobs regardless of whether property data is available
          const allJobs = data || [];
          console.log('All jobs from database:', allJobs.length);
          
          // Log the details of each job to debug missing property data
          allJobs.forEach(job => {
            console.log(`Job ${job.id}: status=${job.status}, has property=${!!job.property}, has owner=${!!job.owner}`);
            
            // If property or owner is missing, add placeholders so the UI can still render
            if (!job.property) {
              console.log(`Adding placeholder property data for job ${job.id}`);
              job.property = {
                id: job.property_id || 'unknown',
                address_line1: 'Property details unavailable',
                city: 'Unknown',
                postcode: 'Unknown',
                property_type: 'Unknown',
                num_floors: 1,
                num_windows: 0,
                window_types: []
              };
            }
            
            if (!job.owner) {
              console.log(`Adding placeholder owner data for job ${job.id}`);
              job.owner = {
                id: job.owner_id || 'unknown',
                full_name: 'Owner details unavailable',
                email: 'unavailable@example.com',
                phone: 'unavailable'
              };
            }
          });
          
          // Set all jobs with placeholder data where needed
          setJobs(allJobs);
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
              cleaner:profiles (
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
          hasOwner: !!data?.owner,
          error: queryError
        });

        if (queryError) throw queryError;
        if (!data) throw new Error('Job not found');
        
        // Log a warning instead of throwing an error if property data is missing
        if (!data.property) {
          console.warn('Job property data not found', { jobId, data });
        }
        
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