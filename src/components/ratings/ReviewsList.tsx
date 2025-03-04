import React, { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { format } from 'date-fns';
import { Review } from '@/hooks/useReviews';
import { User } from 'lucide-react';

interface ReviewsListProps {
  reviews: Review[];
  isLoading?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ 
  reviews, 
  isLoading = false 
}) => {
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, review) => sum + review.rating, 0);
      setAverageRating(total / reviews.length);
    } else {
      setAverageRating(null);
    }
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 rounded-md">
        <p className="text-gray-500">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {averageRating && (
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-medium mr-2">
            {averageRating.toFixed(1)} out of 5
          </h3>
          <StarRating rating={averageRating} />
          <span className="ml-2 text-sm text-gray-500">
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-4 rounded-md border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-full p-2 mr-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{review.reviewer_type === 'homeowner' ? 'Homeowner' : 'Cleaner'}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(review.created_at), 'PPP')}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
            
            {review.comment && (
              <p className="mt-3 text-gray-700">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};