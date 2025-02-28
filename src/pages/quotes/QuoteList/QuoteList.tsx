import React, { useState } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { format } from 'date-fns';
import { 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  ArrowLeft,
  Eye
} from 'lucide-react';
import './QuoteList.css';

// Types from useJobs
interface Quote {
  id: string;
  amount: number;
  message: string;
  status: string;
  cleaner: {
    id: string;
    business_name: string;
  };
}

interface JobRequest {
  id: string;
  property_id: string;
  owner_id: string;
  cleaner_id: string | null;
  status: 'new' | 'quoted' | 'accepted' | 'completed' | 'cancelled';
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
  };
  quotes?: Quote[];
}

export function QuoteList() {
  const { user } = useAuth();
  const { jobs, isLoading, error } = useJobs();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteJobId, setSelectedQuoteJobId] = useState<string | null>(null);

  // Only display jobs that have quotes for homeowners
  const jobsWithQuotes = jobs?.filter(job => 
    job.quotes && job.quotes.length > 0 && job.owner_id === user?.id
  ) || [];

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'new': return 'status-badge-new';
      case 'pending': return 'status-badge-pending';
      case 'accepted': return 'status-badge-accepted';
      default: return 'status-badge-default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'pending': return <DollarSign className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleAcceptQuote = (jobId: string, quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setSelectedQuoteJobId(jobId);
    setShowAcceptModal(true);
  };

  const handleDeclineQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setShowDeclineModal(true);
  };
  
  const confirmAcceptQuote = async () => {
    if (!selectedQuoteId || !selectedQuoteJobId) return;
    
    setActionLoading(selectedQuoteId);
    try {
      console.log('Accepting quote:', selectedQuoteId, 'for job:', selectedQuoteJobId);
      
      // Find the cleaner_id for the selected quote
      const { data: quoteData, error: quoteDataError } = await supabase
        .from('quotes')
        .select('cleaner_id')
        .eq('id', selectedQuoteId)
        .single();
        
      if (quoteDataError) {
        console.error('Failed to retrieve quote data:', quoteDataError);
        throw new Error('Failed to retrieve quote data');
      }
      
      console.log('Found cleaner_id:', quoteData.cleaner_id);
      
      // Direct update approach since stored procedure is not available
      console.log('Fallback to direct update approach');
      
      // First update the job status to accepted and set the cleaner_id
      const { error: jobError } = await supabase
        .from('job_requests')
        .update({ 
          status: 'accepted',
          cleaner_id: quoteData.cleaner_id
        })
        .eq('id', selectedQuoteJobId);

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
        .eq('job_request_id', selectedQuoteJobId)
        .neq('id', selectedQuoteId);
        
      if (rejectError) {
        console.error('Error rejecting other quotes:', rejectError);
        // Continue with the process even if rejecting other quotes fails
      }
      
      console.log('Quote accepted successfully via direct update');

      // Close the modal and refresh
      setShowAcceptModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert('Failed to accept the quote. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeclineQuote = async () => {
    if (!selectedQuoteId) return;
    
    setActionLoading(selectedQuoteId);
    try {
      console.log('Declining quote:', selectedQuoteId);
      
      // Update the quote status to rejected
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', selectedQuoteId);

      if (quoteError) {
        console.error('Error updating quote status:', quoteError);
        throw quoteError;
      }
      
      console.log('Quote status updated successfully');

      // Close the modal and refresh
      setShowDeclineModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Error declining quote:', err);
      alert('Failed to decline the quote. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading quotes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading quotes: {error.message}</p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="quotes-list-container">
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
      
      <div className="quotes-list-header">
        <Button 
          variant="ghost" 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="quotes-title">My Quotes</h1>
      </div>

      {jobsWithQuotes.length === 0 ? (
        <div className="empty-state">
          <h3>No Quotes Yet</h3>
          <p>You haven't received any quotes for your cleaning requests yet.</p>
          <Button onClick={() => navigate('/dashboard/jobs')}>View My Cleaning Requests</Button>
        </div>
      ) : (
        <div className="jobs-with-quotes">
          {jobsWithQuotes.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="property-info">
                  <MapPin className="icon" />
                  <div>
                    <h3>{job.property.address_line1}</h3>
                    <p>{job.property.city}, {job.property.postcode}</p>
                  </div>
                </div>
                <div className="job-date">
                  <Calendar className="icon" />
                  <div>
                    <p>Preferred Date: {format(new Date(job.preferred_date), 'MMMM d, yyyy')}</p>
                    <p>Time: {job.preferred_time}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Job
                </Button>
              </div>

              <h4 className="quotes-section-title">Quotes Received ({job.quotes?.length})</h4>
              
              <div className="quotes-grid">
                {job.quotes?.map(quote => {
                  // Hide rejected quotes if at least one quote has been accepted
                  const hasAcceptedQuote = job.quotes?.some(q => q.status === 'accepted');
                  if (hasAcceptedQuote && quote.status === 'rejected') {
                    return null; // Don't show rejected quotes when one is accepted
                  }
                  
                  return (
                    <div 
                      key={quote.id} 
                      className={`quote-card ${quote.status === 'accepted' ? 'accepted-quote' : ''}`}
                    >
                      <div className="quote-header">
                        <div className="quote-amount">£{quote.amount}</div>
                        <div className={`quote-status ${getStatusBadgeClass(quote.status)}`}>
                          {getStatusIcon(quote.status)}
                          <span>{quote.status}</span>
                        </div>
                      </div>
  
                      <div className="quote-cleaner">
                        <span>From: {quote.cleaner.business_name}</span>
                        <Button 
                          size="sm" 
                          variant="link"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/cleaners/${quote.cleaner.id}`);
                          }}
                          className="view-profile-link"
                        >
                          View Profile
                        </Button>
                      </div>
                      
                      {quote.message && (
                        <div className="quote-message">
                          <div className="message-label">Message:</div>
                          <p>{quote.message}</p>
                        </div>
                      )}
  
                      {job.status === 'quoted' && quote.status !== 'accepted' && quote.status !== 'rejected' && !hasAcceptedQuote && (
                        <div className="quote-actions">
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptQuote(job.id, quote.id)}
                            isLoading={actionLoading === quote.id}
                            className="accept-button"
                          >
                            Accept Quote
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeclineQuote(quote.id)}
                            isLoading={actionLoading === quote.id}
                            className="decline-button"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
  
                      {quote.status === 'accepted' && (
                        <div className="accepted-message">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          You've accepted this quote
                        </div>
                      )}
  
                      {quote.status === 'rejected' && (
                        <div className="rejected-message">
                          <XCircle className="h-5 w-5 mr-1" />
                          You've declined this quote
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}