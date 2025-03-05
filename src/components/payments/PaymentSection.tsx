import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useJobPayment, usePaymentTransactions, useCleanerPaymentMethods } from '@/hooks/usePayments';
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, Send, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentSectionProps {
  jobId: string;
  quoteAmount: number;
  cleanerId: string;
  cleanerName: string;
  onPaymentInitiated?: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  jobId,
  quoteAmount,
  cleanerId,
  cleanerName,
  onPaymentInitiated
}) => {
  const { user } = useAuth();
  const userType = user?.user_metadata?.user_type;
  const { paymentStatus, isLoading: loadingStatus } = useJobPayment(jobId);
  const { paymentMethods, defaultMethod, isLoading: loadingMethods } = useCleanerPaymentMethods(cleanerId);
  const { 
    transactions, 
    getJobTransactions, 
    createPaymentTransaction, 
    updateTransactionStatus,
    isLoading: loadingTransactions
  } = usePaymentTransactions();
  const [jobTransactions, setJobTransactions] = useState<any[]>([]);
  const [showMakePaymentDialog, setShowMakePaymentDialog] = useState(false);
  const [showMarkAsSentDialog, setShowMarkAsSentDialog] = useState(false);
  const [showConfirmReceiptDialog, setShowConfirmReceiptDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [referenceCode, setReferenceCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadTransactions = async () => {
      try {
        const data = await getJobTransactions(jobId);
        if (isMounted) {
          setJobTransactions(data);
        }
      } catch (err) {
        console.error('Error loading job transactions:', err);
      }
    };
    
    loadTransactions();
    
    return () => {
      isMounted = false;
    };
  }, [jobId, getJobTransactions]);

  const handleMakePayment = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!defaultMethod) {
        throw new Error('No payment method available for this cleaner');
      }
      
      const transaction = await createPaymentTransaction({
        job_request_id: jobId,
        cleaner_id: cleanerId,
        amount: quoteAmount,
        payment_method_id: defaultMethod.id,
        notes: notes
      });
      
      setShowMakePaymentDialog(false);
      setNotes('');
      
      // Add the new transaction to the list
      setJobTransactions([transaction, ...jobTransactions]);
      
      if (onPaymentInitiated) {
        onPaymentInitiated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSent = async () => {
    if (!transactionId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updated = await updateTransactionStatus(
        transactionId, 
        'sent', 
        `${notes}\nReference: ${referenceCode}`
      );
      
      setShowMarkAsSentDialog(false);
      setNotes('');
      setReferenceCode('');
      
      // Update the transaction in the list
      setJobTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === transactionId ? updated : transaction
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark payment as sent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!transactionId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const updated = await updateTransactionStatus(transactionId, 'received', notes);
      
      setShowConfirmReceiptDialog(false);
      setNotes('');
      
      // Update the transaction in the list
      setJobTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === transactionId ? updated : transaction
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingStatus || loadingMethods || loadingTransactions) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-2 text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }
  
  // If database tables don't exist yet, show graceful message
  if ((error || !paymentStatus) && userType === 'homeowner') {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
        <div className="flex items-center text-amber-700 bg-amber-50 p-3 rounded-md">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
          <span>Payment feature is not yet available. Please ask the cleaner to contact you to arrange payment directly.</span>
        </div>
      </div>
    );
  }

  const renderPaymentStatus = () => {
    if (paymentStatus === 'unpaid') {
      return (
        <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-md">
          <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
          <span>Payment not yet initiated</span>
        </div>
      );
    } else if (paymentStatus === 'payment_pending') {
      return (
        <div className="flex items-center text-amber-700 bg-amber-50 p-3 rounded-md">
          <Clock className="h-5 w-5 text-amber-500 mr-2" />
          <span>Payment pending</span>
        </div>
      );
    } else if (paymentStatus === 'payment_sent') {
      return (
        <div className="flex items-center text-blue-700 bg-blue-50 p-3 rounded-md">
          <Send className="h-5 w-5 text-blue-500 mr-2" />
          <span>Payment sent by homeowner</span>
        </div>
      );
    } else if (paymentStatus === 'payment_received') {
      return (
        <div className="flex items-center text-green-700 bg-green-50 p-3 rounded-md">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span>Payment received by cleaner</span>
        </div>
      );
    } else if (paymentStatus === 'payment_confirmed') {
      return (
        <div className="flex items-center text-green-700 bg-green-50 p-3 rounded-md">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span>Payment confirmed</span>
        </div>
      );
    }
    
    return null;
  };

  const latestTransaction = jobTransactions.length > 0 ? jobTransactions[0] : null;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Payment Information</h2>
      
      {paymentStatus && renderPaymentStatus()}
      
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <div>
          <p className="text-sm text-gray-500">Quote Amount</p>
          <p className="text-xl font-semibold">£{quoteAmount.toFixed(2)}</p>
        </div>
        
        {userType === 'homeowner' && paymentStatus === 'unpaid' && (
          <Button
            onClick={() => setShowMakePaymentDialog(true)}
            disabled={!defaultMethod || loadingMethods}
          >
            Make Payment
          </Button>
        )}
        
        {userType === 'homeowner' && paymentStatus === 'payment_pending' && latestTransaction && (
          <Button
            onClick={() => {
              setTransactionId(latestTransaction.id);
              setShowMarkAsSentDialog(true);
            }}
          >
            Mark as Sent
          </Button>
        )}
        
        {userType === 'cleaner' && paymentStatus === 'payment_sent' && latestTransaction && (
          <Button
            onClick={() => {
              setTransactionId(latestTransaction.id);
              setShowConfirmReceiptDialog(true);
            }}
          >
            Confirm Receipt
          </Button>
        )}
      </div>
      
      {paymentMethods.length === 0 && userType === 'homeowner' && (
        <div className="bg-amber-50 p-3 rounded-md text-amber-700">
          <AlertCircle className="h-5 w-5 text-amber-500 inline mr-2" />
          <span>{cleanerName} has not added any payment details yet.</span>
        </div>
      )}
      
      {defaultMethod && (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
          
          <div className="flex items-start space-x-3">
            <div className="bg-gray-100 rounded-full p-2">
              <CreditCard className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {defaultMethod.payment_type === 'bank_account' 
                  ? `Bank Transfer - ${defaultMethod.bank_name}` 
                  : 'PayPal'}
              </p>
              {defaultMethod.payment_type === 'bank_account' ? (
                <dl className="text-sm text-gray-500 space-y-1 mt-1">
                  <div className="flex">
                    <dt className="w-32 font-medium">Account Name:</dt>
                    <dd>{defaultMethod.account_name}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium">Account Number:</dt>
                    <dd>{defaultMethod.account_number}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium">Sort Code:</dt>
                    <dd>{defaultMethod.sort_code}</dd>
                  </div>
                </dl>
              ) : (
                <dl className="text-sm text-gray-500 space-y-1 mt-1">
                  <div className="flex">
                    <dt className="w-32 font-medium">PayPal Email:</dt>
                    <dd>{defaultMethod.paypal_email}</dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>
      )}
      
      {jobTransactions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Payment History</h3>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="grid grid-cols-5 gap-4">
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Reference</div>
                <div>Notes</div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {jobTransactions.map((transaction) => {
                // Extract reference code from notes if available
                let displayNotes = transaction.notes || '';
                let reference = '';
                
                if (displayNotes.includes('Reference:')) {
                  const parts = displayNotes.split('Reference:');
                  displayNotes = parts[0].trim();
                  reference = parts[1].trim();
                }
                
                return (
                  <div key={transaction.id} className="px-4 py-3 text-sm">
                    <div className="grid grid-cols-5 gap-4">
                      <div>{format(new Date(transaction.created_at), 'dd MMM yyyy')}</div>
                      <div>£{transaction.amount.toFixed(2)}</div>
                      <div>
                        {transaction.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        )}
                        {transaction.status === 'sent' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Sent
                          </span>
                        )}
                        {transaction.status === 'received' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Received
                          </span>
                        )}
                        {transaction.status === 'confirmed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Confirmed
                          </span>
                        )}
                      </div>
                      <div>{reference || '-'}</div>
                      <div className="truncate">{displayNotes || '-'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Make Payment Dialog */}
      <Dialog open={showMakePaymentDialog} onOpenChange={setShowMakePaymentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
            <DialogDescription>
              Initiate payment to {cleanerName} for the completed job.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Amount:</span>
              <span className="text-lg font-bold">£{quoteAmount.toFixed(2)}</span>
            </div>
            
            {defaultMethod && (
              <div className="border rounded-md p-3 bg-gray-50">
                <h4 className="text-sm font-medium mb-2">Payment Details</h4>
                {defaultMethod.payment_type === 'bank_account' ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Bank:</span> {defaultMethod.bank_name}</p>
                    <p><span className="font-medium">Account Name:</span> {defaultMethod.account_name}</p>
                    <p><span className="font-medium">Account Number:</span> {defaultMethod.account_number}</p>
                    <p><span className="font-medium">Sort Code:</span> {defaultMethod.sort_code}</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">PayPal:</span> {defaultMethod.paypal_email}</p>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the payment..."
                rows={3}
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md text-blue-700 text-sm">
              <p className="font-medium mb-1">Payment Process:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Click "Initiate Payment" to record your intention to pay</li>
                <li>Make the payment through your bank or PayPal</li>
                <li>Come back to mark the payment as "Sent" with a reference</li>
                <li>The cleaner will confirm when they've received your payment</li>
              </ol>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMakePaymentDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMakePayment}
              isLoading={isSubmitting}
            >
              Initiate Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mark as Sent Dialog */}
      <Dialog open={showMarkAsSentDialog} onOpenChange={setShowMarkAsSentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Payment as Sent</DialogTitle>
            <DialogDescription>
              Confirm that you have completed the payment to {cleanerName}.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Amount:</span>
              <span className="text-lg font-bold">£{quoteAmount.toFixed(2)}</span>
            </div>
            
            <div>
              <label htmlFor="referenceCode" className="block text-sm font-medium text-gray-700 mb-1">
                Reference Code / Transaction ID
              </label>
              <input
                type="text"
                id="referenceCode"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., bank reference or PayPal transaction ID"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                This helps the cleaner identify your payment.
              </p>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about the payment..."
                rows={3}
              />
            </div>
            
            <div className="bg-amber-50 p-3 rounded-md text-amber-700 text-sm">
              <p>
                <AlertCircle className="h-4 w-4 inline mr-1" />
                By marking this payment as sent, you confirm that you have completed the payment through your bank or PayPal.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMarkAsSentDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsSent}
              isLoading={isSubmitting}
              disabled={!referenceCode.trim()}
            >
              Mark as Sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Receipt Dialog */}
      <Dialog open={showConfirmReceiptDialog} onOpenChange={setShowConfirmReceiptDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment Receipt</DialogTitle>
            <DialogDescription>
              Confirm that you have received the payment of £{quoteAmount.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the received payment..."
                rows={3}
              />
            </div>
            
            <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm">
              <p>
                <CheckCircle className="h-4 w-4 inline mr-1" />
                By confirming receipt, you acknowledge that you have received the payment for this job.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmReceiptDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReceipt}
              isLoading={isSubmitting}
            >
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};