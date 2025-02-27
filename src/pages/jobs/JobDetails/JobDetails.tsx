import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJob } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
  ImageModal
} from './components';

export function JobDetails() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { job, isLoading, error } = useJob(jobId!);
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

  const userType = user?.user_metadata?.user_type;

  // Check if the cleaner has already submitted a quote when component loads
  useEffect(() => {
    const checkExistingQuote = async () => {
      if (user && jobId && userType === 'cleaner') {
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('amount, message')
            .eq('job_request_id', jobId)
            .eq('cleaner_id', user.id)
            .single();
          
          if (data) {
            setQuoteSubmitted(true);
            setQuoteAmount(data.amount.toString());
            setQuoteMessage(data.message || '');
          }
        } catch (err) {
          // No quote exists, or error occurred
          console.error('Error checking for existing quote:', err);
        }
      }
    };

    checkExistingQuote();
  }, [user, jobId, userType]);

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
      const { error: quoteError } = await supabase
        .from('quotes')
        .insert({
          job_request_id: jobId,
          cleaner_id: user?.id,
          amount: parseFloat(quoteAmount),
          message: quoteMessage,
        });

      if (quoteError) throw quoteError;

      const { error: statusError } = await supabase
        .from('job_requests')
        .update({ status: 'quoted' })
        .eq('id', jobId);

      if (statusError) throw statusError;

      setQuoteSubmitted(true);
      // Stay on the current page instead of navigating away
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
      // Delete the quote
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('job_request_id', jobId)
        .eq('cleaner_id', user?.id);
      
      if (error) throw error;
      
      // Reset the job status to 'new' if no other quotes exist
      const { data: otherQuotes } = await supabase
        .from('quotes')
        .select('id')
        .eq('job_request_id', jobId);
        
      if (!otherQuotes || otherQuotes.length === 0) {
        await supabase
          .from('job_requests')
          .update({ status: 'new' })
          .eq('id', jobId);
      }
      
      // Reset state
      setQuoteSubmitted(false);
      setQuoteAmount('');
      setQuoteMessage('');
      setShowWithdrawConfirm(false);
    } catch (err) {
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
          {userType === 'cleaner' && job.status === 'new' && (
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