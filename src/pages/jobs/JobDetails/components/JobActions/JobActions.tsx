import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import { useUpdateJobStatus } from '@/hooks/useJobs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface JobActionsProps {
  jobId: string;
  ownerEmail: string;
  ownerPhone: string | null;
  jobStatus: 'new' | 'quoted' | 'accepted' | 'cleaner_completed' | 'completed' | 'cancelled';
  onStatusChange: () => void;
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  phone: string | null;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, email, phone }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Information</DialogTitle>
          <DialogDescription>
            You can contact the property owner using the following information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-medium">Email:</div>
            <div className="col-span-3">
              <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                {email}
              </a>
            </div>
          </div>
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

export const JobActions: React.FC<JobActionsProps> = ({
  jobId,
  ownerEmail,
  ownerPhone,
  jobStatus,
  onStatusChange
}) => {
  const { completeJob, cancelJob, isLoading, error } = useUpdateJobStatus();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCompleteJob = async () => {
    try {
      await completeJob(jobId);
      setShowCompleteModal(false);
      onStatusChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to complete job');
    }
  };

  const handleCancelJob = async () => {
    try {
      await cancelJob(jobId);
      setShowCancelModal(false);
      onStatusChange();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel job');
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
          Contact Owner
        </Button>
        
        {jobStatus === 'accepted' ? (
          <Button
            onClick={() => setShowCompleteModal(true)}
            className="w-full"
            variant="default"
            size="default"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Job as Complete
          </Button>
        ) : jobStatus === 'cleaner_completed' ? (
          <Button
            className="w-full"
            variant="outline"
            size="default"
            disabled
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Waiting for Owner Confirmation
          </Button>
        ) : null}
        
        {(jobStatus === 'accepted' || jobStatus === 'cleaner_completed') && (
          <Button
            onClick={() => setShowCancelModal(true)}
            className="w-full"
            variant="destructive"
            size="default"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Job
          </Button>
        )}
      </div>
      
      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        email={ownerEmail}
        phone={ownerPhone}
      />
      
      {/* Complete Job Modal */}
      <ConfirmationModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleCompleteJob}
        title="Mark Job as Complete"
        description="By marking this job as complete, you indicate that the work has been done. The homeowner will need to confirm completion before the job is finalized and reviews can be left."
        confirmText="Mark as Complete"
        isLoading={isLoading}
      />
      
      {/* Cancel Job Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelJob}
        title="Cancel Job"
        description="Are you sure you want to cancel this job? The job will return to 'new' status for other cleaners to quote on."
        confirmText="Cancel Job"
        isLoading={isLoading}
      />
    </div>
  );
};