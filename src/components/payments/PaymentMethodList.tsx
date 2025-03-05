import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaymentMethods } from '@/hooks/usePayments';
import { PaymentMethodForm } from './PaymentMethodForm';
import { CreditCard, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export const PaymentMethodList: React.FC = () => {
  const { 
    paymentMethods, 
    isLoading, 
    error, 
    deletePaymentMethod,
    setDefaultPaymentMethod 
  } = usePaymentMethods();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAdd = () => {
    setShowAddForm(true);
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  const handleConfirmDelete = async () => {
    if (!methodToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await deletePaymentMethod(methodToDelete);
      setDeleteConfirmOpen(false);
      setMethodToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete payment method');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
    } catch (err) {
      console.error('Error setting default payment method:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
      </div>
    );
  }


  if (error) {
    // For database table not found errors, show empty state
    if (error.message && (
        error.message.includes("relation") && 
        error.message.includes("does not exist") || 
        error.message.includes("cleaner_payment_methods")
      )) {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a payment method so that property owners can pay you for completed jobs.
          </p>
          <div className="mt-6">
            <Button onClick={handleAdd}>Add Payment Method</Button>
          </div>
        </div>
      );
    }
    
    // For other errors, show error message
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading payment methods
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
        <Button onClick={handleAdd}>Add Payment Method</Button>
      </div>
      
      {showAddForm ? (
        <PaymentMethodForm 
          onSuccess={handleAddSuccess} 
          onCancel={() => setShowAddForm(false)} 
        />
      ) : paymentMethods.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a payment method so that property owners can pay you for completed jobs.
          </p>
          <div className="mt-6">
            <Button onClick={handleAdd}>Add Payment Method</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {paymentMethods.map((method) => (
              <li key={method.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-100 rounded-full p-2">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {method.payment_type === 'bank_account' ? (
                            `${method.bank_name} - ${method.account_name}`
                          ) : (
                            `PayPal - ${method.paypal_email}`
                          )}
                        </span>
                        {method.is_default && (
                          <Badge variant="outline" className="ml-2">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {method.payment_type === 'bank_account' ? (
                          <>Account: {method.account_number} • Sort Code: {method.sort_code}</>
                        ) : (
                          <>{method.paypal_email}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setMethodToDelete(method.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md">
              {deleteError}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};