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
  status: 'new' | 'quoted' | 'accepted' | 'cleaner_completed' | 'completed' | 'cancelled';
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
        // Simplified query to avoid potential recursion in RLS policy
        let query = supabase
          .from('job_requests')
          .select(`
            *
          `)
          .order('created_at', { ascending: false });

        // Apply the appropriate filters based on user role
        if (user.user_metadata?.user_type === 'cleaner') {
          console.log('User is a cleaner:', user.id);
          query = query.or('status.eq.new,cleaner_id.eq.' + user.id);
        } else {
          console.log('User is a homeowner:', user.id);
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
          // Get basic job data first, then load related data separately
          const allJobs = data || [];
          console.log('All jobs from database:', allJobs.length);
          
          // For cleaner users, also fetch jobs they have quoted on
        let extraJobIds = [];
        if (user.user_metadata?.user_type === 'cleaner') {
          try {
            console.log('Fetching additional jobs that cleaner has quoted on');
            const { data: cleanerQuotes } = await supabase
              .from('quotes')
              .select('job_request_id')
              .eq('cleaner_id', user.id);
              
            if (cleanerQuotes && cleanerQuotes.length > 0) {
              // Extract unique job request IDs
              const quotedJobIds = cleanerQuotes.map(q => q.job_request_id);
              console.log('Cleaner has quoted on jobs:', quotedJobIds);
              
              // Fetch those additional jobs
              const { data: quotedJobs } = await supabase
                .from('job_requests')
                .select('*')
                .in('id', quotedJobIds);
                
              if (quotedJobs && quotedJobs.length > 0) {
                console.log('Found additional jobs from quotes:', quotedJobs.length);
                // Add these jobs to our list if they're not already there
                quotedJobs.forEach(job => {
                  if (!allJobs.some(j => j.id === job.id)) {
                    allJobs.push(job);
                    extraJobIds.push(job.id);
                  }
                });
              }
            }
          } catch (err) {
            console.warn('Error fetching cleaner quoted jobs:', err);
          }
        }
        
        console.log('Processing total jobs:', allJobs.length, 'including extra jobs:', extraJobIds.length);
        
        // For each job, fetch property and owner data separately to avoid RLS recursion
        const jobsWithDetails = await Promise.all(allJobs.map(async (job) => {
          console.log(`Loading details for job ${job.id}`);
          
          // First fetch property data
          let property = null;
          try {
            const { data: propertyData } = await supabase
              .from('properties')
              .select(`
                id,
                address_line1,
                address_line2,
                city,
                postcode,
                property_type,
                num_floors,
                num_windows,
                window_types
              `)
              .eq('id', job.property_id)
              .single();
              
            if (propertyData) {
              property = propertyData;
              
              // Now fetch images for the property
              const { data: imageData } = await supabase
                .from('property_images')
                .select('id, image_url, image_type')
                .eq('property_id', job.property_id);
                
              if (imageData && imageData.length > 0) {
                property.images = imageData;
              }
            }
          } catch (err) {
            console.warn(`Could not load property for job ${job.id}:`, err);
          }
          
          // Fetch owner data
          let owner = null;
          try {
            const { data: ownerData } = await supabase
              .from('profiles')
              .select('id, full_name, email, phone')
              .eq('id', job.owner_id)
              .single();
              
            if (ownerData) {
              owner = ownerData;
            }
          } catch (err) {
            console.warn(`Could not load owner for job ${job.id}:`, err);
          }
          
          // Fetch quotes
          let quotes = [];
          try {
            const { data: quotesData } = await supabase
              .from('quotes')
              .select(`
                id, 
                amount, 
                message, 
                status,
                cleaner_id
              `)
              .eq('job_request_id', job.id);
              
            if (quotesData && quotesData.length > 0) {
              // For each quote, fetch cleaner details
              quotes = await Promise.all(quotesData.map(async (quote) => {
                let cleaner = null;
                try {
                  const { data: cleanerData } = await supabase
                    .from('profiles')
                    .select('id, business_name')
                    .eq('id', quote.cleaner_id)
                    .single();
                    
                  if (cleanerData) {
                    cleaner = cleanerData;
                  }
                } catch (err) {
                  console.warn(`Could not load cleaner for quote ${quote.id}:`, err);
                }
                
                return {
                  ...quote,
                  cleaner: cleaner || { 
                    id: quote.cleaner_id || 'unknown',
                    business_name: 'Business details unavailable'
                  }
                };
              }));
              }
            } catch (err) {
              console.warn(`Could not load quotes for job ${job.id}:`, err);
            }
            
            // If property or owner is missing, add placeholders
            if (!property) {
              console.log(`Adding placeholder property data for job ${job.id}`);
              property = {
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
            
            if (!owner) {
              console.log(`Adding placeholder owner data for job ${job.id}`);
              owner = {
                id: job.owner_id || 'unknown',
                full_name: 'Owner details unavailable',
                email: 'unavailable@example.com',
                phone: 'unavailable'
              };
            }
            
            return {
              ...job,
              property,
              owner,
              quotes: quotes.length > 0 ? quotes : undefined
            };
          }));
          
          // Set jobs with all details loaded
          setJobs(jobsWithDetails);
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

/**
 * Hook to handle updating job status (complete or cancel)
 */
export function useUpdateJobStatus() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeJob = async (jobId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to complete a job');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Marking job ${jobId} as ready for completion by cleaner`);
      
      // First check if there's an accepted quote for this job from this cleaner
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('id')
        .eq('job_request_id', jobId)
        .eq('cleaner_id', user.id)
        .eq('status', 'accepted')
        .single();

      if (quoteError) throw quoteError;
      
      if (!quote) {
        throw new Error('You do not have an accepted quote for this job');
      }

      // Update the job status to 'cleaner_completed' instead of 'completed'
      const { data, error: updateError } = await supabase
        .from('job_requests')
        .update({ status: 'cleaner_completed' })
        .eq('id', jobId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      console.log('Job marked as cleaner_completed:', data);
      return data;
    } catch (err) {
      console.error('Error marking job as completed by cleaner:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark job as completed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to cancel a job');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Cancelling accepted job ${jobId}`);
      
      // First check if there's an accepted quote for this job from this cleaner
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('id')
        .eq('job_request_id', jobId)
        .eq('cleaner_id', user.id)
        .eq('status', 'accepted')
        .single();

      if (quoteError) throw quoteError;
      
      if (!quote) {
        throw new Error('You do not have an accepted quote for this job');
      }

      // Update the job status back to 'new'
      const { data, error: updateError } = await supabase
        .from('job_requests')
        .update({ status: 'new' })
        .eq('id', jobId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Update the quote status back to 'pending'
      const { error: quoteUpdateError } = await supabase
        .from('quotes')
        .update({ status: 'pending' })
        .eq('id', quote.id);

      if (quoteUpdateError) throw quoteUpdateError;
      
      console.log('Job cancelled and returned to new status:', data);
      return data;
    } catch (err) {
      console.error('Error cancelling job:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { completeJob, cancelJob, isLoading, error };
}