import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import './DeleteConfirmation.css';

interface DeleteConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ 
  onConfirm, 
  onCancel, 
  isDeleting 
}) => {
  return (
    <div className="delete-confirmation bg-red-50 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
        <p className="text-red-700">
          Are you sure you want to delete this cleaning request? This action cannot be undone.
        </p>
      </div>
      <div className="flex gap-4">
        <Button
          variant="destructive"
          onClick={onConfirm}
          isLoading={isDeleting}
        >
          Yes, Delete Request
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};