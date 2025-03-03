import React from 'react';
import { Button } from '@/components/ui/button';
import './QuoteView.css';

interface QuoteViewProps {
  amount: string;
  message: string;
  onWithdrawClick: () => void;
}

export const QuoteView: React.FC<QuoteViewProps> = ({ amount, message, onWithdrawClick }) => {
  return (
    <div className="quote-view space-y-4">
      <div className="rounded-md bg-green-50 p-4 text-center mb-4">
        <div className="text-sm text-green-700 mb-2">
          Your quote has been successfully submitted!
        </div>
        <p className="text-gray-600 text-sm font-medium">
          Quote Amount: £{amount}
        </p>
        {message && (
          <p className="text-gray-600 text-sm mt-2">
            Message: {message}
          </p>
        )}
      </div>
      
      <Button 
        variant="destructive" 
        className="w-full"
        onClick={onWithdrawClick}
      >
        Withdraw Quote
      </Button>
    </div>
  );
};