import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJob } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Home, 
  Trash2, 
  AlertTriangle,
  User,
  Mail,
  Phone,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import styles from './JobDetails.module.css';

const WINDOW_TYPES = {
  sliding: 'Sliding Windows',
  sash: 'Sash Windows',
  casement: 'Casement Windows',
  bay: 'Bay Windows',
  bow: 'Bow Windows',
  fixed: 'Fixed Windows',
  skylight: 'Skylights'
};

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

  const userType = user?.user_metadata?.user_type;

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

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
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

      navigate('/dashboard/jobs');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
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

  const canDelete = userType === 'homeowner' && job.owner_id === user?.id && job.status === 'new';

  return (
    <div className="space-y-6">
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

      {showDeleteConfirm && (
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">
              Are you sure you want to delete this cleaning request? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Yes, Delete Request
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Property Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Property Details
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-2" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {job.property.address_line1}
                </h3>
                {job.property.address_line2 && (
                  <p className="text-gray-500">{job.property.address_line2}</p>
                )}
                <p className="text-gray-500">
                  {job.property.city}, {job.property.postcode}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <Home className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-gray-900">
                  {job.property.property_type}
                </p>
                <p className="text-gray-500">
                  {job.property.num_windows} windows · {job.property.num_floors} floor
                  {job.property.num_floors > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Window Types</h4>
              <ul className="list-disc list-inside text-gray-700">
                {job.property.window_types.map((type) => (
                  <li key={type}>{WINDOW_TYPES[type as keyof typeof WINDOW_TYPES]}</li>
                ))}
              </ul>
            </div>

            {job.property.images && job.property.images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Property Images
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {job.property.images.map((image) => (
                    <div
                      key={image.id}
                      className="relative cursor-pointer group"
                      onClick={() => setSelectedImage(image.image_url)}
                    >
                      <img
                        src={image.image_url}
                        alt="Property"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Details and Contact Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Request Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-gray-900">
                    Preferred Date: {format(new Date(job.preferred_date), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-500">
                    Preferred Time: {job.preferred_time}
                  </p>
                </div>
              </div>

              {job.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Additional Details
                  </h4>
                  <p className="text-gray-700">{job.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Contact Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-gray-900">{job.owner.full_name}</p>
                  <p className="text-sm text-gray-500">Property Owner</p>
                </div>
              </div>

              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <p className="text-gray-900">{job.owner.email}</p>
              </div>

              {job.owner.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-2" />
                  <p className="text-gray-900">{job.owner.phone}</p>
                </div>
              )}
            </div>
          </div>

          {userType === 'cleaner' && job.status === 'new' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Submit a Quote
              </h2>
              
              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Quote Amount (£)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    placeholder="Add any notes or details about your quote"
                  />
                </div>

                {submitError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{submitError}</div>
                  </div>
                )}

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Submit Quote
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={selectedImage}
              alt="Property"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}