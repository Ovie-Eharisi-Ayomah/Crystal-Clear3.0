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
  Phone,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import styles from './JobList.module.css';
import { createTestJob } from '@/utils/testData';

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
  const [creatingTestData, setCreatingTestData] = useState(false);
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

  // Function to generate test data for debugging purposes
  const handleCreateTestJob = async () => {
    if (!user) return;
    
    try {
      setCreatingTestData(true);
      await createTestJob({ 
        id: user.id, 
        email: user.email || '' 
      });
      window.location.reload(); // Reload to see the new job
    } catch (err) {
      console.error('Failed to create test job:', err);
      alert('Failed to create test job. See console for details.');
    } finally {
      setCreatingTestData(false);
    }
  };

  if (error) {
    return (
      <div className={styles.errorState}>
        Error loading {userType === 'cleaner' ? 'available jobs' : 'cleaning requests'}: {error.message}
      </div>
    );
  }

  // Debug info about all jobs
  console.log('Jobs in JobList component:', jobs?.map(job => ({
    id: job.id,
    status: job.status,
    hasProperty: !!job.property,
    hasOwner: !!job.owner
  })));
  
  // Use all jobs, handling missing properties in the UI
  const validJobs = jobs || [];

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
          
          {/* Developer information panel */}
          <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-md">
            <p className="text-sm font-semibold text-gray-700 mb-2">Why am I not seeing any jobs?</p>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>For Cleaners:</strong> Jobs will appear here when homeowners create cleaning requests.
              </p>
              <p>
                <strong>For Developers:</strong> Here are potential issues:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li>No job requests exist in the database yet</li>
                <li>RLS policies are preventing cleaners from seeing jobs</li>
                <li>Jobs exist but don't have the 'new' status</li>
                <li>Join queries are failing between tables</li>
              </ol>
              
              <p className="text-xs mt-3">
                To create jobs: log in as a homeowner, add a property, then create a cleaning request.
              </p>
            </div>
          </div>
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
                    {job.property ? (
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
                    ) : (
                      <div className={styles.jobCardAddress}>
                        <AlertCircle className={styles.jobCardAddressIcon} />
                        <div>
                          <h3 className={styles.jobCardAddressTitle}>
                            Property Details Unavailable
                          </h3>
                          <p className={styles.jobCardAddressText}>
                            Contact support for assistance
                          </p>
                        </div>
                      </div>
                    )}

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

                    {job.property ? (
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
                    ) : (
                      <div className={styles.jobCardDetail}>
                        <Home className={styles.jobCardDetailIcon} />
                        <div>
                          <p className={styles.jobCardDetailText}>
                            Property Type Unavailable
                          </p>
                          <p className={styles.jobCardDetailSubtext}>
                            Details not accessible
                          </p>
                        </div>
                      </div>
                    )}

                    {userType === 'cleaner' && (
                      <div className={styles.jobCardDetail}>
                        <User className={styles.jobCardDetailIcon} />
                        <div>
                          <p className={styles.jobCardDetailText}>
                            {job.owner ? job.owner.full_name : 'Owner Details Unavailable'}
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
                      {job.property && job.property.window_types ? (
                        <ul className={styles.jobCardWindowTypes}>
                          {job.property.window_types.map((type) => (
                            <li key={type} className={styles.jobCardWindowType}>
                              {WINDOW_TYPES[type as keyof typeof WINDOW_TYPES]}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.jobCardDetailSubtext}>
                          Window type information unavailable
                        </p>
                      )}
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

                {job.property && job.property.images && job.property.images.length > 0 && (
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