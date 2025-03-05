import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface JobActionsOwnerProps {
  jobId: string;
  cleanerId: string;
  cleanerName: string;
  cleanerEmail?: string;
  cleanerPhone?: string;
  jobStatus: 'new' | 'quoted' | 'accepted' | 'cleaner_completed' | 'completed' | 'cancelled';
  onStatusChange: () => void;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  phone?: string;
  name: string;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, email, phone, name }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Cleaner</DialogTitle>
          <DialogDescription>
            You can contact {name} using the following information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {email && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Email:</div>
              <div className="col-span-3">
                <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                  {email}
                </a>
              </div>
            </div>
          )}
          {phone && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="font-medium">Phone:</div>
              <div className="col-span-3">
                <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
                  {phone}
                </a>
              </div>
            </div>
          )}
          {!email && !phone && (
            <div className="text-center py-3 bg-yellow-50 rounded-md">
              <p className="text-yellow-600">
                No contact information available for this cleaner.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  isLoading: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const JobActionsOwner: React.FC<JobActionsOwnerProps> = ({
  jobId,
  cleanerId,
  cleanerName,
  cleanerEmail,
  cleanerPhone,
  jobStatus,
  onStatusChange
}) => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Function to mark a job as complete (only callable after cleaner has marked it as completed)
  const handleConfirmComplete = async () => {
    setIsLoading(true);
    setActionError(null);

    try {
      const { data, error } = await supabase
        .from('job_requests')
        .update({ status: 'completed' })
        .eq('id', jobId)
        .eq('status', 'cleaner_completed') // Only allow completing jobs that cleaners have marked as completed
        .select();

      if (error) throw error;

      setShowCompleteModal(false);
      onStatusChange();
    } catch (err) {
      console.error('Error completing job:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to complete job');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to cancel a job
  const handleCancelJob = async () => {
    setIsLoading(true);
    setActionError(null);

    try {
      // First, update all quotes to pending
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'pending' })
        .eq('job_request_id', jobId)
        .eq('status', 'accepted');

      if (quoteError) throw quoteError;

      // Then update job status to new
      const { data, error } = await supabase
        .from('job_requests')
        .update({ status: 'new' })
        .eq('id', jobId)
        .select();

      if (error) throw error;

      setShowCancelModal(false);
      onStatusChange();
    } catch (err) {
      console.error('Error cancelling job:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to cancel job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Job Actions</h2>
      
      {actionError && (
        <div className="text-red-500 bg-red-50 p-3 rounded-md mb-4">
          {actionError}
        </div>
      )}
      
      <div className="flex flex-col space-y-3">
        <Button
          onClick={() => setShowContactModal(true)}
          className="w-full"
          variant="outline"
          size="default"
        >
          <Mail className="h-4 w-4 mr-2" />
          Contact Cleaner
        </Button>
        
        {jobStatus === 'cleaner_completed' ? (
          <Button
            onClick={() => setShowCompleteModal(true)}
            className="w-full"
            variant="default"
            size="default"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Job as Complete
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="outline"
            size="default"
            disabled
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Waiting for Cleaner to Mark Complete
          </Button>
        )}
        
        <Button
          onClick={() => setShowCancelModal(true)}
          className="w-full"
          variant="destructive"
          size="default"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Job
        </Button>
      </div>
      
      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        email={cleanerEmail}
        phone={cleanerPhone}
        name={cleanerName}
      />
      
      {/* Complete Job Modal */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleConfirmComplete}
        title="Confirm Job Completion"
        description="The cleaner has marked this job as complete. By confirming, you agree that the work has been finished satisfactorily. This will allow both parties to leave reviews."
        confirmText="Confirm Completion"
        isLoading={isLoading}
      />
      
      {/* Cancel Job Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelJob}
        title="Cancel Job"
        description="Are you sure you want to cancel this job? This will allow other cleaners to quote on it again."
        confirmText="Cancel Job"
        isLoading={isLoading}
      />
    </div>
  );
};