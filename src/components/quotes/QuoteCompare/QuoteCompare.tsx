import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sort quotes by amount (lowest first)
  const sortedQuotes = [...quotes].sort((a, b) => a.amount - b.amount);

  const handleAcceptQuote = async (quoteId: string) => {
    if (!window.confirm('Are you sure you want to accept this quote?')) {
      return;
    }

    setActionLoading(quoteId);
    setError(null);
    
    try {
      // Update the selected quote to accepted
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Update the job status to accepted
      const { error: jobError } = await supabase
        .from('job_requests')
        .update({ status: 'accepted' })
        .eq('id', jobId);

      if (jobError) throw jobError;

      onQuoteAccepted();
    } catch (err) {
      console.error('Error accepting quote:', err);
      setError('Failed to accept quote. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineQuote = async (quoteId: string) => {
    if (!window.confirm('Are you sure you want to decline this quote?')) {
      return;
    }

    setActionLoading(quoteId);
    setError(null);
    
    try {
      // Update the quote status to rejected
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

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
      <h3 className="quote-compare-title">Compare Quotes ({quotes.length})</h3>
      
      {error && (
        <div className="quote-compare-error">
          {error}
        </div>
      )}
      
      <div className="quote-compare-grid">
        {sortedQuotes.map((quote) => (
          <div key={quote.id} className="quote-compare-card">
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
              {quote.cleaner.business_name}
            </div>
            
            {quote.message && (
              <div className="quote-compare-message">
                <div className="quote-compare-message-label">Message:</div>
                <p>{quote.message}</p>
              </div>
            )}
            
            {quote.status !== 'accepted' && quote.status !== 'rejected' && (
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
        ))}
      </div>
    </div>
  );
};