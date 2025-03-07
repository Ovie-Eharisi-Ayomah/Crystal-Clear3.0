import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Quote {
  id: string;
  job_request_id: string;
  cleaner_id: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

/**
 * Hook to manage quote operations
 */
export function useQuotes() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Check if a cleaner has submitted a quote for a specific job
   */
  // Keep a cache of checked quotes to avoid redundant API calls
  const checkedQuotes = new Map<string, Quote | null>();

  const checkExistingQuote = async (jobId: string): Promise<Quote | null> => {
    if (!user || !jobId) return null;
    
    // Check cache first to avoid unnecessary API calls
    const cacheKey = `${jobId}_${user.id}`;
    if (checkedQuotes.has(cacheKey)) {
      return checkedQuotes.get(cacheKey) || null;
    }
    
    try {
      console.log('Checking for existing quote for job:', jobId);
      
      // Use a different approach to avoid the 406 error
      const { data, error } = await supabase
        .from('quotes')
        .select('id, job_request_id, cleaner_id, amount, message, status, created_at')
        .filter('job_request_id', 'eq', jobId)
        .filter('cleaner_id', 'eq', user.id)
        .limit(1)
        .maybeSingle();
      
      // Cache the result
      const result = data as Quote || null;
      checkedQuotes.set(cacheKey, result);
      
      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        throw error;
      }
      
      return result;
    } catch (err) {
      console.error('Error checking for existing quote:', err);
      setError(err instanceof Error ? err : new Error('Failed to check for existing quote'));
      return null;
    }
  };

  /**
   * Submit a new quote
   */
  const submitQuote = async (
    jobId: string, 
    amount: number, 
    message: string
  ): Promise<Quote | null> => {
    if (!user || !jobId) {
      setError(new Error('User must be authenticated to submit a quote'));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Insert new quote
      const { data, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          job_request_id: jobId,
          cleaner_id: user.id,
          amount: amount,
          message: message,
          status: 'pending'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Update job status to 'quoted'
      const { error: statusError } = await supabase
        .from('job_requests')
        .update({ status: 'quoted' })
        .eq('id', jobId);

      if (statusError) throw statusError;

      return data as Quote;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit quote'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Withdraw a quote
   */
  const withdrawQuote = async (jobId: string): Promise<boolean> => {
    if (!user || !jobId) {
      setError(new Error('User must be authenticated to withdraw a quote'));
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Find the quote to delete
      const { data: quoteData, error: findError } = await supabase
        .from('quotes')
        .select('id')
        .eq('job_request_id', jobId)
        .eq('cleaner_id', user.id)
        .single();

      if (findError) throw findError;
      if (!quoteData || !quoteData.id) throw new Error('No quote found to withdraw');

      // Delete the quote
      const { error: deleteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteData.id);

      if (deleteError) throw deleteError;

      // Check if other quotes exist for this job
      const { data: otherQuotes, error: countError } = await supabase
        .from('quotes')
        .select('id')
        .eq('job_request_id', jobId);

      if (countError) throw countError;

      // If no other quotes, reset job status to 'new'
      if (!otherQuotes || otherQuotes.length === 0) {
        const { error: updateError } = await supabase
          .from('job_requests')
          .update({ status: 'new' })
          .eq('id', jobId);

        if (updateError) throw updateError;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to withdraw quote'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkExistingQuote,
    submitQuote,
    withdrawQuote,
    isLoading,
    error
  };
}