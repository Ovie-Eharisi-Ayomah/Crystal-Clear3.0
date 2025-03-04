import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StarRating } from './StarRating';
import { useReviews } from '@/hooks/useReviews';

interface ReviewFormProps {
  jobId: string;
  revieweeId: string;
  revieweeType: 'homeowner' | 'cleaner';
  revieweeName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  jobId,
  revieweeId,
  revieweeType,
  revieweeName,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { submitReview, isLoading, error } = useReviews();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    try {
      // Determine reviewer type (opposite of reviewee type)
      const reviewerType = revieweeType === 'cleaner' ? 'homeowner' : 'cleaner';
      
      const result = await submitReview(
        jobId,
        revieweeId,
        rating,
        comment,
        reviewerType
      );
      
      if (result) {
        setSubmitError(null);
        onReviewSubmitted?.();
      } else {
        setSubmitError('Failed to submit review');
      }
    } catch (err) {
      console.error('Error in ReviewForm:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Review {revieweeType === 'cleaner' ? 'Cleaner' : 'Homeowner'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {(submitError || error) && (
          <div className="text-red-500 bg-red-50 p-3 rounded-md">
            {submitError || (error instanceof Error ? error.message : 'An error occurred')}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How would you rate {revieweeName}'s service?
          </label>
          <StarRating 
            rating={rating} 
            editable={true} 
            onChange={setRating} 
            size="lg"
            className="mb-2"
          />
          {rating > 0 && (
            <p className="text-sm text-gray-500">
              You've selected {rating} {rating === 1 ? 'star' : 'stars'}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
            Comments (optional)
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
          disabled={rating === 0 || isLoading}
        >
          Submit Review
        </Button>
      </form>
    </div>
  );
};