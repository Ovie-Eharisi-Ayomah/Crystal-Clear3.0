import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJob } from '@/hooks/useJobs';
import { useQuotes } from '@/hooks/useQuotes';
import { useReviews } from '@/hooks/useReviews';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import './JobDetails.css';

// Import all components
import {
  PropertyDetails,
  JobRequestDetails,
  OwnerDetails,
  QuoteForm,
  QuoteConfirm,
  QuoteView,
  WithdrawConfirm,
  DeleteConfirmation,
  ImageModal,
  JobActions
} from './components';

// Import QuoteCompare component
import { QuoteCompare } from '@/components/quotes/QuoteCompare';

// Import rating components
import { ReviewForm, ReviewsList } from '@/components/ratings';

export function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { job, isLoading, error } = useJob(jobId!);
  const { 
    checkExistingQuote, 
    submitQuote, 
    withdrawQuote, 
    isLoading: quoteLoading, 
    error: quoteError 
  } = useQuotes();
  const {
    checkExistingReview,
    getUserReviews,
    isLoading: reviewLoading,
    error: reviewError
  } = useReviews();
  const { user } = useAuth();
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [showQuoteConfirm, setShowQuoteConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const userType = user?.user_metadata?.user_type;

  // Check if the cleaner has already submitted a quote when component loads
  // Only check for existing quote once when the component loads
  useEffect(() => {
    let isMounted = true;
    
    const checkForExistingQuote = async () => {
      if (user && jobId && userType === 'cleaner') {
        // Only perform the check if we're mounted and haven't already submitted a quote
        if (!quoteSubmitted) {
          const existingQuote = await checkExistingQuote(jobId);
          
          // Make sure we're still mounted before updating state
          if (!isMounted) return;
          
          if (existingQuote) {
            setQuoteSubmitted(true);
            setQuoteAmount(existingQuote.amount.toString());
            setQuoteMessage(existingQuote.message || '');
          } else {
            // Explicitly reset state if no quote exists
            setQuoteSubmitted(false);
            setQuoteAmount('');
            setQuoteMessage('');
          }
        }
      }
    };

    checkForExistingQuote();
    
    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
    };
  // Only run this effect once when the component mounts or when user/jobId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jobId, userType]);
  
  // Check if the user has already submitted a review for this job
  useEffect(() => {
    let isMounted = true;
    
    const checkForExistingReview = async () => {
      if (user && jobId && job?.status === 'completed') {
        const existingReview = await checkExistingReview(jobId);
        
        if (!isMounted) return;
        
        setHasSubmittedReview(!!existingReview);
      }
    };
    
    const loadReviews = async () => {
      if (jobId && job?.status === 'completed') {
        setLoadingReviews(true);
        
        // Determine whose reviews to show
        // For homeowners, show reviews of the cleaner
        // For cleaners, show reviews of the homeowner
        const revieweeId = userType === 'homeowner' ? 
          job.quotes?.find(q => q.status === 'accepted')?.cleaner.id : 
          job.owner_id;
        
        if (revieweeId) {
          const reviewsData = await getUserReviews(revieweeId);
          
          if (!isMounted) return;
          
          setReviews(reviewsData);
        }
        
        setLoadingReviews(false);
      }
    };
    
    if (job) {
      checkForExistingReview();
      loadReviews();
    }
    
    return () => {
      isMounted = false;
    };
  }, [job, jobId, user, checkExistingReview, getUserReviews, userType]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-500">{error?.message || 'Job not found'}</p>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    // Show confirmation dialog instead of immediately submitting
    setShowQuoteConfirm(true);
  };

  const confirmAndSubmitQuote = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const quote = await submitQuote(jobId!, parseFloat(quoteAmount), quoteMessage);
      
      if (quote) {
        setQuoteSubmitted(true);
        // Stay on the current page instead of navigating away
      } else {
        throw new Error('Failed to submit quote');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
      setShowQuoteConfirm(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setSubmitError(null);

    try {
      // Delete associated quotes first
      const { error: quotesError } = await supabase
        .from('quotes')
        .delete()
        .eq('job_request_id', jobId);

      if (quotesError) throw quotesError;

      // Then delete the job request
      const { error: deleteError } = await supabase
        .from('job_requests')
        .delete()
        .eq('id', jobId);

      if (deleteError) throw deleteError;

      navigate('/dashboard/jobs');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete job request');
      setIsDeleting(false);
    }
  };

  const handleWithdrawQuote = async () => {
    setIsSubmitting(true);
    try {
      const success = await withdrawQuote(jobId!);
      
      if (success) {
        // Reset state
        setQuoteSubmitted(false);
        setQuoteAmount('');
        setQuoteMessage('');
        setShowWithdrawConfirm(false);
        
        // Show success message and reload the page after a brief delay
        alert('Quote withdrawn successfully');
        window.location.reload();
      } else {
        throw new Error('Failed to withdraw quote');
      }
    } catch (err) {
      console.error('Failed to withdraw quote:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to withdraw quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDelete = userType === 'homeowner' && job.owner_id === user?.id && job.status === 'new';

  return (
    <div className="job-details-container space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 flex-1">
          Job Details
        </h1>
        {canDelete && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            isLoading={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Request
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmation 
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Property Information */}
        <PropertyDetails 
          property={job.property} 
          onImageClick={(url) => setSelectedImage(url)} 
        />

        {/* Job Details and Contact Information */}
        <div className="space-y-6">
          <JobRequestDetails job={job} />
          <OwnerDetails owner={job.owner} />

          {/* Quote section for cleaners */}
          {userType === 'cleaner' && (
            <>
              {/* Show job actions for accepted jobs where the cleaner's quote was accepted */}
              {job.status === 'accepted' && job.quotes && job.quotes.some(quote => 
                quote.cleaner.id === user?.id && quote.status === 'accepted'
              ) ? (
                <JobActions 
                  jobId={jobId!}
                  ownerEmail={job.owner.email}
                  ownerPhone={job.owner.phone}
                  onStatusChange={() => window.location.reload()}
                />
              ) : (
                <div className="quote-section bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {quoteSubmitted ? 'Quote Submitted' : 'Submit a Quote'}
                  </h2>
                  
                  {quoteSubmitted ? (
                    <>
                      {showWithdrawConfirm ? (
                        <WithdrawConfirm 
                          onConfirm={handleWithdrawQuote}
                          onCancel={() => setShowWithdrawConfirm(false)}
                          isSubmitting={isSubmitting}
                        />
                      ) : (
                        <QuoteView 
                          amount={quoteAmount}
                          message={quoteMessage}
                          onWithdrawClick={() => setShowWithdrawConfirm(true)}
                        />
                      )}
                    </>
                  ) : (
                    job.status === 'new' ? (
                      <>
                        {showQuoteConfirm ? (
                          <QuoteConfirm 
                            amount={quoteAmount}
                            message={quoteMessage}
                            onConfirm={confirmAndSubmitQuote}
                            onCancel={() => setShowQuoteConfirm(false)}
                            isSubmitting={isSubmitting}
                          />
                        ) : (
                          <QuoteForm 
                            jobId={jobId!}
                            onQuoteSubmit={handleSubmitQuote}
                            amount={quoteAmount}
                            setAmount={setQuoteAmount}
                            message={quoteMessage}
                            setMessage={setQuoteMessage}
                            submitError={submitError}
                          />
                        )}
                      </>
                    ) : (
                      <div className="text-center p-4 bg-gray-50 rounded-md">
                        <p className="text-gray-600">
                          {job.status === 'accepted' 
                            ? 'This job has already been accepted by another cleaner.'
                            : 'You cannot quote on this job at this time.'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Quote comparison for homeowners */}
          {userType === 'homeowner' && job.quotes && job.quotes.length > 0 && job.status === 'new' && (
            <div className="quote-section bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quotes Received
              </h2>
              <QuoteCompare 
                quotes={job.quotes} 
                onQuoteAccepted={() => window.location.reload()}
                jobId={jobId!}
              />
            </div>
          )}
          
          {/* Review section for completed jobs */}
          {job.status === 'completed' && (
            <div className="space-y-6">
              {/* Homeowner review section */}
              {userType === 'homeowner' && (
                <>
                  {/* Show "Waiting for review" message if review not submitted */}
                  {!hasSubmittedReview && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-center py-3 bg-amber-50 rounded-md mb-4">
                        <p className="text-amber-600 font-medium">
                          Waiting for your review
                        </p>
                      </div>
                      
                      {job.quotes && job.quotes.some(q => q.status === 'accepted') && (
                        <ReviewForm 
                          jobId={jobId!}
                          revieweeId={job.quotes.find(q => q.status === 'accepted')!.cleaner.id}
                          revieweeType="cleaner"
                          revieweeName={job.quotes.find(q => q.status === 'accepted')!.cleaner.business_name}
                          onReviewSubmitted={() => window.location.reload()}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* If review submitted, show success message */}
                  {hasSubmittedReview && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-center py-4 bg-green-50 rounded-md">
                        <p className="text-green-600">
                          Thank you for submitting your review.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Cleaner review section */}
              {userType === 'cleaner' && (
                <>
                  {/* Show review form if not submitted */}
                  {!hasSubmittedReview && 
                   job.quotes && job.quotes.some(q => q.cleaner.id === user?.id && q.status === 'accepted') && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-center py-3 bg-amber-50 rounded-md mb-4">
                        <p className="text-amber-600 font-medium">
                          Waiting for your review
                        </p>
                      </div>
                      
                      <ReviewForm 
                        jobId={jobId!}
                        revieweeId={job.owner.id}
                        revieweeType="homeowner"
                        revieweeName={job.owner.full_name}
                        onReviewSubmitted={() => window.location.reload()}
                      />
                    </div>
                  )}
                  
                  {/* If review submitted, show success message */}
                  {hasSubmittedReview && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-center py-4 bg-green-50 rounded-md">
                        <p className="text-green-600">
                          Thank you for submitting your review.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Display reviews - but only show comments, not ratings */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {userType === 'homeowner' ? "Cleaner Feedback" : "Homeowner Feedback"}
                  </h2>
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
                        </div>
                        
                        {review.comment ? (
                          <p className="mt-3 text-gray-700">{review.comment}</p>
                        ) : (
                          <p className="mt-3 text-gray-500 italic">No written feedback provided.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal 
          imageUrl={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  );
}