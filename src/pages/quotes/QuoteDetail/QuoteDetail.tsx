import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  MessageCircle
} from 'lucide-react';
import './QuoteDetail.css';

interface Quote {
  id: string;
  job_request_id: string;
  cleaner_id: string;
  amount: number;
  message: string;
  status: string;
  created_at: string;
  cleaner: {
    id: string;
    business_name: string;
    email: string;
    phone: string;
    full_name: string;
  };
  job_request: {
    id: string;
    property_id: string;
    preferred_date: string;
    preferred_time: string;
    status: string;
    description: string;
    property: {
      id: string;
      address_line1: string;
      address_line2: string | null;
      city: string;
      postcode: string;
    };
  };
}

export function QuoteDetail() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    const fetchQuoteDetails = async () => {
      if (!user || !quoteId) return;

      try {
        const { data, error: queryError } = await supabase
          .from('quotes')
          .select(`
            *,
            cleaner:profiles!quotes_cleaner_id_fkey (
              id, 
              business_name, 
              email, 
              phone, 
              full_name
            ),
            job_request:job_requests (
              id,
              property_id,
              preferred_date,
              preferred_time,
              status,
              description,
              property:properties (
                id,
                address_line1,
                address_line2,
                city,
                postcode
              )
            )
          `)
          .eq('id', quoteId)
          .single();

        if (queryError) throw queryError;
        setQuote(data);
      } catch (err) {
        console.error('Error fetching quote details:', err);
        setError('Failed to load quote details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuoteDetails();
  }, [quoteId, user]);

  const handleAcceptQuote = async () => {
    if (!quote) return;
    setShowAcceptModal(true);
  };

  const handleDeclineQuote = async () => {
    if (!quote) return;
    setShowDeclineModal(true);
  };
  
  const confirmAcceptQuote = async () => {
    if (!quote) return;

    setActionLoading(true);
    try {
      console.log('Accepting quote:', quote.id, 'for job:', quote.job_request.id, 'with cleaner:', quote.cleaner_id);
      
      // Direct update approach since stored procedure is not available
      console.log('Fallback to direct update approach');
      
      // First update the job status to accepted and set the cleaner_id
      const { error: jobError } = await supabase
        .from('job_requests')
        .update({ 
          status: 'accepted',
          cleaner_id: quote.cleaner_id 
        })
        .eq('id', quote.job_request.id);

      if (jobError) {
        console.error('Error updating job request:', jobError);
        throw jobError;
      }
      
      console.log('Job request updated successfully');
      
      // Then update the quote status
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quote.id);

      if (quoteError) {
        console.error('Error updating quote status:', quoteError);
        throw quoteError;
      }
      
      console.log('Quote status updated successfully');
      
      // Reject all other quotes for this job
      const { error: rejectError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('job_request_id', quote.job_request.id)
        .neq('id', quote.id);
        
      if (rejectError) {
        console.error('Error rejecting other quotes:', rejectError);
        // Continue with the process even if rejecting other quotes fails
      }
      
      console.log('Quote accepted successfully via direct update');

      // Update the local state
      setQuote({
        ...quote,
        status: 'accepted',
        job_request: {
          ...quote.job_request,
          status: 'accepted'
        }
      });
      
      // Close the modal
      setShowAcceptModal(false);
    } catch (err) {
      console.error('Error accepting quote:', err);
      setError('Failed to accept quote. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeclineQuote = async () => {
    if (!quote) return;

    setActionLoading(true);
    try {
      console.log('Declining quote:', quote.id);
      
      // Update the quote status
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quote.id);

      if (quoteError) {
        console.error('Error updating quote status:', quoteError);
        throw quoteError;
      }
      
      console.log('Quote status updated successfully');

      // Update the local state
      setQuote({
        ...quote,
        status: 'rejected'
      });
      
      // Close the modal
      setShowDeclineModal(false);
    } catch (err) {
      console.error('Error declining quote:', err);
      setError('Failed to decline quote. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading quote details...</p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="error-container">
        <p>{error || 'Quote not found'}</p>
        <Button onClick={() => navigate('/dashboard/quotes')}>Back to Quotes</Button>
      </div>
    );
  }

  return (
    <div className="quote-detail-container">
      {/* Accept Quote Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={confirmAcceptQuote}
        title="Accept Quote"
        message="Are you sure you want to accept this quote? Once accepted, all other quotes for this job will be automatically declined."
        type="success"
        confirmText="Yes, Accept Quote"
        cancelText="Cancel"
        isLoading={actionLoading}
      />
      
      {/* Decline Quote Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onConfirm={confirmDeclineQuote}
        title="Decline Quote"
        message="Are you sure you want to decline this quote? This action cannot be undone."
        type="warning"
        confirmText="Yes, Decline Quote"
        cancelText="Cancel"
        isLoading={actionLoading}
      />
      
      <div className="quote-detail-header">
        <Button
          variant="ghost"
          className="back-button"
          onClick={() => navigate('/dashboard/quotes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>
        <h1 className="quote-detail-title">Quote Details</h1>
      </div>

      <div className="quote-detail-grid">
        {/* Quote information */}
        <div className="quote-info-card">
          <div className="quote-status-header">
            <h2 className="section-title">Quote Information</h2>
            <div className={`quote-status-badge ${quote.status}`}>
              {quote.status === 'accepted' ? (
                <CheckCircle className="h-4 w-4 mr-1" />
              ) : quote.status === 'rejected' ? (
                <XCircle className="h-4 w-4 mr-1" />
              ) : null}
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </div>
          </div>

          <div className="amount-section">
            <span className="amount-label">Amount:</span>
            <span className="amount-value">£{quote.amount}</span>
          </div>

          <div className="quote-date">
            Submitted on {format(new Date(quote.created_at), 'MMM d, yyyy')}
          </div>

          {quote.message && (
            <div className="message-section">
              <div className="message-header">
                <MessageCircle className="h-4 w-4 mr-1" />
                Message from Cleaner:
              </div>
              <p className="message-content">{quote.message}</p>
            </div>
          )}

          {quote.status !== 'accepted' && quote.status !== 'rejected' && (
            <div className="quote-actions">
              <Button
                onClick={handleAcceptQuote}
                isLoading={actionLoading}
                className="accept-button"
              >
                Accept Quote
              </Button>
              <Button
                variant="outline"
                onClick={handleDeclineQuote}
                isLoading={actionLoading}
                className="decline-button"
              >
                Decline Quote
              </Button>
            </div>
          )}

          {quote.status === 'accepted' && (
            <div className="status-message accepted">
              <CheckCircle className="h-5 w-5 mr-2" />
              You've accepted this quote
            </div>
          )}

          {quote.status === 'rejected' && (
            <div className="status-message rejected">
              <XCircle className="h-5 w-5 mr-2" />
              You've declined this quote
            </div>
          )}
        </div>

        {/* Cleaner information */}
        <div className="cleaner-info-card">
          <h2 className="section-title">Cleaner Information</h2>
          
          <div className="info-item">
            <User className="info-icon" />
            <div>
              <div className="info-label">Business Name</div>
              <div className="info-value">{quote.cleaner.business_name}</div>
            </div>
          </div>
          
          <div className="info-item">
            <User className="info-icon" />
            <div>
              <div className="info-label">Contact Name</div>
              <div className="info-value">{quote.cleaner.full_name}</div>
            </div>
          </div>

          <div className="info-item">
            <Mail className="info-icon" />
            <div>
              <div className="info-label">Email</div>
              <div className="info-value">{quote.cleaner.email}</div>
            </div>
          </div>

          {quote.cleaner.phone && (
            <div className="info-item">
              <Phone className="info-icon" />
              <div>
                <div className="info-label">Phone</div>
                <div className="info-value">{quote.cleaner.phone}</div>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/cleaners/${quote.cleaner_id}`)}
            className="view-profile-button mt-4"
          >
            View Cleaner Profile
          </Button>
        </div>

        {/* Job information */}
        <div className="job-info-card">
          <h2 className="section-title">Job Information</h2>
          
          <div className="info-item">
            <MapPin className="info-icon" />
            <div>
              <div className="info-label">Property Address</div>
              <div className="info-value">
                {quote.job_request.property.address_line1}
                {quote.job_request.property.address_line2 && (
                  <>, {quote.job_request.property.address_line2}</>
                )}
                <br />
                {quote.job_request.property.city}, {quote.job_request.property.postcode}
              </div>
            </div>
          </div>
          
          <div className="info-item">
            <Calendar className="info-icon" />
            <div>
              <div className="info-label">Preferred Date & Time</div>
              <div className="info-value">
                {format(new Date(quote.job_request.preferred_date), 'MMMM d, yyyy')}
                <br />
                {quote.job_request.preferred_time}
              </div>
            </div>
          </div>

          {quote.job_request.description && (
            <div className="job-description">
              <div className="description-label">Job Description:</div>
              <p className="description-content">{quote.job_request.description}</p>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/jobs/${quote.job_request.id}`)}
            className="view-job-button"
          >
            View Full Job Details
          </Button>
        </div>
      </div>
    </div>
  );
}