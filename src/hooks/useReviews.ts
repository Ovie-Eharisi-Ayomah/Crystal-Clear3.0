import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  job_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_type: 'homeowner' | 'cleaner';
}

/**
 * Hook to manage review operations
 */
export function useReviews() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Check if the user has already submitted a review for a job
   */
  const checkExistingReview = async (jobId: string): Promise<Review | null> => {
    if (!user || !jobId) return null;
    
    try {
      console.log('Checking for existing review for job:', jobId);
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('job_request_id', jobId)
        .eq('reviewer_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      return data as Review;
    } catch (err) {
      console.error('Error checking for existing review:', err);
      setError(err instanceof Error ? err : new Error('Failed to check for existing review'));
      return null;
    }
  };

  /**
   * Submit a new review
   */
  const submitReview = async (
    jobId: string,
    revieweeId: string,
    rating: number,
    comment: string = '',
    reviewerType: 'homeowner' | 'cleaner'
  ): Promise<Review | null> => {
    if (!user || !jobId) {
      setError(new Error('User must be authenticated to submit a review'));
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if job is completed
      const { data: job, error: jobError } = await supabase
        .from('job_requests')
        .select('status')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      
      if (!job || job.status !== 'completed') {
        throw new Error('Only completed jobs can be reviewed');
      }

      // Check for existing review
      const existingReview = await checkExistingReview(jobId);
      
      if (existingReview) {
        throw new Error('You have already submitted a review for this job');
      }

      // Insert new review
      const { data, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          job_request_id: jobId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          comment,
          reviewer_type: reviewerType
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      return data as Review;
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err : new Error('Failed to submit review'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get all reviews for a user
   */
  const getUserReviews = async (userId: string): Promise<Review[]> => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as Review[];
    } catch (err) {
      console.error('Error fetching user reviews:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch user reviews'));
      return [];
    }
  };

  /**
   * Get the average rating for a user
   */
  const getUserAverageRating = async (userId: string): Promise<number | null> => {
    try {
      const reviews = await getUserReviews(userId);
      
      if (reviews.length === 0) {
        return null;
      }
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      return totalRating / reviews.length;
    } catch (err) {
      console.error('Error calculating average rating:', err);
      setError(err instanceof Error ? err : new Error('Failed to calculate average rating'));
      return null;
    }
  };

  return {
    checkExistingReview,
    submitReview,
    getUserReviews,
    getUserAverageRating,
    isLoading,
    error
  };
}