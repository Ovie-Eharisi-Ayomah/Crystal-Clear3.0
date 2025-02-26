import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Calendar, 
  MapPin, 
  Home,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Trash2,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import styles from './JobList.module.css';

const WINDOW_TYPES = {
  sliding: 'Sliding Windows',
  sash: 'Sash Windows',
  casement: 'Casement Windows',
  bay: 'Bay Windows',
  bow: 'Bow Windows',
  fixed: 'Fixed Windows',
  skylight: 'Skylights'
};

export function JobList() {
  const { user } = useAuth();
  const { jobs, isLoading, error } = useJobs();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const userType = user?.user_metadata?.user_type;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return styles.statusNew;
      case 'quoted':
        return styles.statusQuoted;
      case 'accepted':
        return styles.statusAccepted;
      case 'completed':
        return styles.statusCompleted;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusCompleted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4" />;
      case 'quoted':
        return <DollarSign className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    setActionLoading(jobId);
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

      // Refresh the page to update the list
      window.location.reload();
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete the cleaning request. Please try again.');
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleAcceptQuote = async (jobId: string, quoteId: string) => {
    if (!window.confirm('Are you sure you want to accept this quote?')) {
      return;
    }

    setActionLoading(jobId);
    try {
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      const { error: jobError } = await supabase
        .from('job_requests')
        .update({ status: 'accepted' })
        .eq('id', jobId);

      if (jobError) throw jobError;

      window.location.reload();
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert('Failed to accept the quote. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>
            {userType === 'cleaner' ? 'Loading available jobs...' : 'Loading cleaning requests...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        Error loading {userType === 'cleaner' ? 'available jobs' : 'cleaning requests'}: {error.message}
      </div>
    );
  }

  const validJobs = jobs?.filter(job => job && job.property) || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            {userType === 'cleaner' ? 'Available Jobs' : 'My Cleaning Requests'}
          </h1>
          <p className={styles.headerSubtitle}>
            {userType === 'cleaner' 
              ? 'Browse and quote on available window cleaning jobs'
              : 'Manage your window cleaning service requests'
            }
          </p>
        </div>
      </div>

      {!validJobs || validJobs.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>
            {userType === 'cleaner'
              ? 'No available jobs'
              : 'No cleaning requests yet'
            }
          </h3>
          <p className={styles.emptyStateText}>
            {userType === 'cleaner'
              ? 'Check back later for new job opportunities'
              : 'Start by requesting a cleaning service for one of your properties'
            }
          </p>
          {userType === 'homeowner' && (
            <Button onClick={() => navigate('/dashboard/properties')}>
              View My Properties
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {validJobs.map((job) => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobCardContent}>
                <div className={styles.jobCardHeader}>
                  <div className={styles.jobCardStatus}>
                    <span className={`${styles.jobCardStatusBadge} ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <span className={styles.jobCardDate}>
                      Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className={styles.jobCardActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {userType === 'homeowner' && job.status === 'new' && (
                      showDeleteConfirm === job.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            isLoading={actionLoading === job.id}
                          >
                            Confirm Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(job.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Request
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className={styles.jobCardGrid}>
                  <div className={styles.jobCardSection}>
                    <div className={styles.jobCardAddress}>
                      <MapPin className={styles.jobCardAddressIcon} />
                      <div>
                        <h3 className={styles.jobCardAddressTitle}>
                          {job.property.address_line1}
                        </h3>
                        {job.property.address_line2 && (
                          <p className={styles.jobCardAddressText}>{job.property.address_line2}</p>
                        )}
                        <p className={styles.jobCardAddressText}>
                          {job.property.city}, {job.property.postcode}
                        </p>
                      </div>
                    </div>

                    <div className={styles.jobCardDetail}>
                      <Calendar className={styles.jobCardDetailIcon} />
                      <div>
                        <p className={styles.jobCardDetailText}>
                          Preferred Date: {format(new Date(job.preferred_date), 'MMMM d, yyyy')}
                        </p>
                        <p className={styles.jobCardDetailSubtext}>
                          Preferred Time: {job.preferred_time}
                        </p>
                      </div>
                    </div>

                    <div className={styles.jobCardDetail}>
                      <Home className={styles.jobCardDetailIcon} />
                      <div>
                        <p className={styles.jobCardDetailText}>
                          {job.property.property_type}
                        </p>
                        <p className={styles.jobCardDetailSubtext}>
                          {job.property.num_windows} windows · {job.property.num_floors} floor
                          {job.property.num_floors > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {userType === 'cleaner' && (
                      <div className={styles.jobCardDetail}>
                        <User className={styles.jobCardDetailIcon} />
                        <div>
                          <p className={styles.jobCardDetailText}>
                            {job.owner.full_name}
                          </p>
                          <p className={styles.jobCardDetailSubtext}>
                            Property Owner
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.jobCardSection}>
                    <div>
                      <h4 className={styles.jobCardSectionTitle}>Window Types</h4>
                      <ul className={styles.jobCardWindowTypes}>
                        {job.property.window_types.map((type) => (
                          <li key={type} className={styles.jobCardWindowType}>
                            {WINDOW_TYPES[type as keyof typeof WINDOW_TYPES]}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {job.description && (
                      <div className={styles.jobCardDescription}>
                        <h4 className={styles.jobCardSectionTitle}>Additional Details</h4>
                        <p>{job.description}</p>
                      </div>
                    )}

                    {userType === 'homeowner' && job.quotes && job.quotes.length > 0 && (
                      <div className={styles.jobCardQuotes}>
                        <h4 className={styles.jobCardQuotesTitle}>
                          Quotes Received
                        </h4>
                        <div className={styles.jobCardQuotesList}>
                          {job.quotes.map((quote) => (
                            <div
                              key={quote.id}
                              className={styles.jobCardQuoteItem}
                            >
                              <div>
                                <p className={styles.jobCardQuoteAmount}>
                                  £{quote.amount}
                                </p>
                                <p className={styles.jobCardQuoteBusiness}>
                                  from {quote.cleaner.business_name}
                                </p>
                              </div>
                              {job.status === 'quoted' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptQuote(job.id, quote.id)}
                                  isLoading={actionLoading === job.id}
                                >
                                  Accept Quote
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {job.property.images && job.property.images.length > 0 && (
                  <div className={styles.jobCardImages}>
                    <h4 className={styles.jobCardSectionTitle}>Property Images</h4>
                    <div className={styles.jobCardImageGrid}>
                      {job.property.images.slice(0, 4).map((image) => (
                        <img
                          key={image.id}
                          src={image.image_url}
                          alt="Property"
                          className={styles.jobCardImage}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}