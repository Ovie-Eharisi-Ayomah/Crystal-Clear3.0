import React from 'react';
import { Button } from '@/components/ui/button';
import './WithdrawConfirm.css';

interface WithdrawConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const WithdrawConfirm: React.FC<WithdrawConfirmProps> = ({ onConfirm, onCancel, isSubmitting }) => {
  return (
    <div className="withdraw-confirm rounded-md bg-red-50 p-4 mb-4">
      <h3 className="text-sm font-medium text-red-800 mb-2">Withdraw Quote?</h3>
      <p className="text-sm text-red-700 mb-4">
        Are you sure you want to withdraw your quote? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <Button 
          variant="destructive"
          className="flex-1"
          onClick={onConfirm}
          isLoading={isSubmitting}
        >
          Yes, Withdraw Quote
        </Button>
        <Button 
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};