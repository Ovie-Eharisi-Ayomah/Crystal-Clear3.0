import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { usePaymentMethods } from '@/hooks/usePayments';

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ 
  onSuccess, 
  onCancel
}) => {
  const { addPaymentMethod, isLoading } = usePaymentMethods();
  const [paymentType, setPaymentType] = useState<'bank_account' | 'paypal'>('bank_account');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError(null);
    console.log('Submitting payment method form');

    try {
      // Validate form
      if (paymentType === 'bank_account') {
        if (!accountName || !bankName || !accountNumber || !sortCode) {
          setError('Please fill in all bank account fields');
          return;
        }
        
        // Very basic sort code validation (UK format: 00-00-00)
        const sortCodePattern = /^\d{2}-\d{2}-\d{2}$|^\d{6}$/;
        if (!sortCodePattern.test(sortCode)) {
          setError('Sort code should be in format 00-00-00 or 000000');
          return;
        }
        
        // Basic account number validation (UK: 8 digits)
        const accountNumberPattern = /^\d{8}$/;
        if (!accountNumberPattern.test(accountNumber)) {
          setError('Account number should be 8 digits');
          return;
        }
      } else if (paymentType === 'paypal') {
        if (!paypalEmail) {
          setError('Please enter your PayPal email address');
          return;
        }
        
        // Basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(paypalEmail)) {
          setError('Please enter a valid email address');
          return;
        }
      }

      // Prepare data based on payment type
      const paymentMethodData = {
        payment_type: paymentType,
        is_default: isDefault,
        ...(paymentType === 'bank_account' ? {
          account_name: accountName,
          bank_name: bankName,
          account_number: accountNumber,
          sort_code: sortCode
        } : {
          paypal_email: paypalEmail
        })
      };

      console.log('Payment method data to be added:', paymentMethodData);
      
      // Call the addPaymentMethod function
      const result = await addPaymentMethod(paymentMethodData);
      console.log('Payment method added successfully:', result);
      
      // Call onSuccess to close the form
      onSuccess();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Add Payment Method</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Payment Type</Label>
          <RadioGroup 
            defaultValue={paymentType} 
            onValueChange={(value) => setPaymentType(value as 'bank_account' | 'paypal')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bank_account" id="bank_account" />
              <Label htmlFor="bank_account">Bank Account</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal">PayPal</Label>
            </div>
          </RadioGroup>
        </div>
        
        {paymentType === 'bank_account' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Holder Name</Label>
              <Input
                id="account_name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Santander, HSBC, etc."
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="12345678"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sort_code">Sort Code</Label>
                <Input
                  id="sort_code"
                  type="text"
                  value={sortCode}
                  onChange={(e) => setSortCode(e.target.value)}
                  placeholder="00-00-00"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="paypal_email">PayPal Email</Label>
            <Input
              id="paypal_email"
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="your-email@example.com"
              required
            />
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_default"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="is_default">Set as default payment method</Label>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            isLoading={isLoading}
            onClick={(e) => {
              e.preventDefault();
              console.log('Button clicked directly');
              handleSubmit(e);
            }}
          >
            Add Payment Method
          </Button>
        </div>
      </form>
    </div>
  );
};