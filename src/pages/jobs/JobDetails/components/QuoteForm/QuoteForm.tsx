import React from 'react';
import { Button } from '@/components/ui/button';
import './QuoteForm.css';

interface QuoteFormProps {
  jobId: string;
  onQuoteSubmit: (e: React.FormEvent) => void;
  amount: string;
  setAmount: (amount: string) => void;
  message: string;
  setMessage: (message: string) => void;
  submitError: string | null;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ 
  onQuoteSubmit, 
  amount, 
  setAmount, 
  message, 
  setMessage, 
  submitError 
}) => {
  return (
    <form onSubmit={onQuoteSubmit} className="quote-form space-y-4">
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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

      <Button type="submit" className="w-full">
        Submit Quote
      </Button>
    </form>
  );
};