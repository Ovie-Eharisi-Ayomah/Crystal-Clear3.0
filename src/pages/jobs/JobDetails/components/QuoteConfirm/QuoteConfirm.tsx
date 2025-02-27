import React from 'react';
import { Button } from '@/components/ui/button';
import './QuoteConfirm.css';

interface QuoteConfirmProps {
  amount: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const QuoteConfirm: React.FC<QuoteConfirmProps> = ({ 
  amount, 
  message, 
  onConfirm, 
  onCancel, 
  isSubmitting 
}) => {
  return (
    <div className="quote-confirm space-y-4">
      <div className="rounded-md bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Confirm Your Quote</h3>
        <div className="mb-4">
          <p className="text-gray-700 mb-1">Amount: <span className="font-medium">£{amount}</span></p>
          {message && (
            <p className="text-gray-700">Message: <span className="italic">{message}</span></p>
          )}
        </div>
        <p className="text-sm text-blue-700 mb-4">
          Are you sure you want to submit this quote? You can withdraw it later if needed.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="default"
            className="flex-1"
            onClick={onConfirm}
            isLoading={isSubmitting}
          >
            Confirm Quote
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
    </div>
  );
};