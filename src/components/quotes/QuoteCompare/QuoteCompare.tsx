import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import './QuoteCompare.css';

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
    full_name: string;
  };
}

interface QuoteCompareProps {
  quotes: Quote[];
  onQuoteAccepted: () => void;
  jobId: string;
}

export const QuoteCompare: React.FC<QuoteCompareProps> = ({ 
  quotes, 
  onQuoteAccepted,
  jobId
}) => {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Sort quotes by amount (lowest first)
  const sortedQuotes = [...quotes].sort((a, b) => a.amount - b.amount);

  const handleAcceptQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setShowAcceptModal(true);
  };
  
  const confirmAcceptQuote = async () => {
    if (!selectedQuoteId) return;
    
    setActionLoading(selectedQuoteId);
    setError(null);
    
    try {
      const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
      if (!selectedQuote) {
        console.error('Selected quote not found:', selectedQuoteId);
        throw new Error('Selected quote not found');
      }
      
      console.log('Accepting quote:', selectedQuoteId, 'for job:', jobId, 'with cleaner:', selectedQuote.cleaner_id);
      
      // Direct update approach since stored procedure is not available
      console.log('Fallback to direct update approach');
      
      // First update the job status to accepted and set the cleaner_id
      const { error: jobError } = await supabase
        .from('job_requests')
        .update({ 
          status: 'accepted',
          cleaner_id: selectedQuote.cleaner_id
        })
        .eq('id', jobId);

      if (jobError) {
        console.error('Error updating job request:', jobError);
        throw jobError;
      }
      
      // Then update the selected quote to accepted
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', selectedQuoteId);

      if (quoteError) {
        console.error('Error updating quote status:', quoteError);
        throw quoteError;
      }
      
      // Reject all other quotes for this job
      const { error: rejectError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('job_request_id', jobId)
        .neq('id', selectedQuoteId);
      
      if (rejectError) {
        console.error('Error rejecting other quotes:', rejectError);
        // Continue with the process even if rejecting other quotes fails
      }
      
      console.log('Quote accepted successfully via direct update');
      
      // Close modal
      setShowAcceptModal(false);

      onQuoteAccepted();
    } catch (err) {
      console.error('Error accepting quote:', err);
      setError('Failed to accept quote. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setShowDeclineModal(true);
  };
  
  const confirmDeclineQuote = async () => {
    if (!selectedQuoteId) return;
    
    setActionLoading(selectedQuoteId);
    setError(null);
    
    try {
      // Update the quote status to rejected
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', selectedQuoteId);

      if (quoteError) throw quoteError;
      
      // Close modal
      setShowDeclineModal(false);

      // Force a refresh of the quotes
      onQuoteAccepted();
    } catch (err) {
      console.error('Error declining quote:', err);
      setError('Failed to decline quote. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="quote-compare-empty">
        <p>No quotes have been received for this job yet.</p>
      </div>
    );
  }

  return (
    <div className="quote-compare-container">
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
        isLoading={actionLoading === selectedQuoteId}
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
        isLoading={actionLoading === selectedQuoteId}
      />
      
      <h3 className="quote-compare-title">Compare Quotes ({quotes.length})</h3>
      
      {error && (
        <div className="quote-compare-error">
          {error}
        </div>
      )}
      
      <div className="quote-compare-grid">
        {sortedQuotes.map((quote) => {
          // Check if any quote is accepted
          const hasAcceptedQuote = sortedQuotes.some(q => q.status === 'accepted');
          
          // Hide rejected quotes if a quote has been accepted
          if (hasAcceptedQuote && quote.status === 'rejected') {
            return null;
          }
          
          return (
            <div 
              key={quote.id} 
              className={`quote-compare-card ${quote.status === 'accepted' ? 'quote-compare-accepted' : ''}`}
            >
              <div className="quote-compare-header">
                <div className="quote-compare-amount">£{quote.amount}</div>
                {quote.status === 'accepted' && (
                  <div className="quote-compare-status accepted">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accepted
                  </div>
                )}
                {quote.status === 'rejected' && (
                  <div className="quote-compare-status rejected">
                    <XCircle className="h-4 w-4 mr-1" />
                    Declined
                  </div>
                )}
              </div>
              
              <div className="quote-compare-cleaner">
                <span>{quote.cleaner.business_name}</span>
                <Button
                  size="sm"
                  variant="link"
                  className="view-profile-link"
                  onClick={() => navigate(`/dashboard/cleaners/${quote.cleaner.id}`)}
                >
                  <User className="h-3 w-3 mr-1" />
                  View Profile
                </Button>
              </div>
              
              {quote.message && (
                <div className="quote-compare-message">
                  <div className="quote-compare-message-label">Message:</div>
                  <p>{quote.message}</p>
                </div>
              )}
              
              {quote.status !== 'accepted' && quote.status !== 'rejected' && !hasAcceptedQuote && (
                <div className="quote-compare-actions">
                  <Button
                    size="sm"
                    className="quote-compare-accept"
                    onClick={() => handleAcceptQuote(quote.id)}
                    isLoading={actionLoading === quote.id}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="quote-compare-decline"
                    onClick={() => handleDeclineQuote(quote.id)}
                    isLoading={actionLoading === quote.id}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};