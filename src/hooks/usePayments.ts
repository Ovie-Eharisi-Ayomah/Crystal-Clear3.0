import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
  id: string;
  cleaner_id: string;
  payment_type: 'bank_account' | 'paypal';
  account_name?: string;
  bank_name?: string;
  account_number?: string;
  sort_code?: string;
  paypal_email?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentTransaction {
  id: string;
  job_request_id: string;
  owner_id: string;
  cleaner_id: string;
  amount: number;
  payment_method_id?: string;
  status: 'pending' | 'sent' | 'received' | 'confirmed';
  reference_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  payment_method?: PaymentMethod;
  owner?: {
    full_name: string;
  };
  cleaner?: {
    full_name: string;
    business_name: string;
  };
}

/**
 * Hook to fetch and manage cleaner payment methods
 */
export function usePaymentMethods() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Log re-renders and state changes
  console.log('usePaymentMethods hook rendered, payment methods count:', paymentMethods.length);

  useEffect(() => {
    let isMounted = true;
    
    const loadPaymentMethods = async () => {
      if (!user) {
        console.log('No user found in usePaymentMethods hook');
        return;
      }
      
      // Debug user information to check if user is properly identified as a cleaner
      console.log('User in usePaymentMethods:', {
        id: user.id,
        email: user.email,
        userType: user.user_metadata?.user_type,
      });
      
      setIsLoading(true);
      
      try {
        // First check if the user is a cleaner - if not, we shouldn't even try to load payment methods
        if (user.user_metadata?.user_type !== 'cleaner') {
          console.warn('User is not a cleaner, not loading payment methods');
          if (isMounted) {
            setError(new Error('User is not a cleaner. Payment methods are only available for cleaners.'));
            setIsLoading(false);
          }
          return;
        }
        
        console.log('Fetching payment methods for cleaner:', user.id);
        const { data, error: fetchError } = await supabase
          .from('cleaner_payment_methods')
          .select('*')
          .eq('cleaner_id', user.id)
          .order('is_default', { ascending: false });
        
        // Handle case where the table doesn't exist yet (migration not run)
        if (fetchError && 
            (fetchError.message.includes("relation") && 
             fetchError.message.includes("does not exist"))) {
          console.warn("Payment methods table doesn't exist yet:", fetchError);
          
          if (isMounted) {
            // Just return empty array instead of error
            setPaymentMethods([]);
            setError(null);
          }
          return;
        }
        
        if (fetchError) throw fetchError;
        
        console.log('Payment methods loaded:', data?.length || 0);
        
        if (isMounted) {
          setPaymentMethods(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading payment methods:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load payment methods'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadPaymentMethods();
    
    return () => {
      isMounted = false;
    };
  }, [user]);
  
  const addPaymentMethod = async (paymentMethodData: Omit<PaymentMethod, 'id' | 'cleaner_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('User must be authenticated to add a payment method');
    }
    
    // Double-check user type to avoid errors
    if (user.user_metadata?.user_type !== 'cleaner') {
      console.error('Cannot add payment method - user is not a cleaner:', user.user_metadata);
      throw new Error('Payment methods can only be added by cleaners. User type is not set correctly.');
    }
    
    console.log('Starting to add payment method:', paymentMethodData);
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if this is the first payment method and set as default if so
      if (paymentMethods.length === 0) {
        paymentMethodData.is_default = true;
        console.log('First payment method, setting as default');
      }
      
      // If setting this as default, update all other methods to not be default
      if (paymentMethodData.is_default) {
        console.log('Setting all other payment methods as non-default');
        const { error: updateError } = await supabase
          .from('cleaner_payment_methods')
          .update({ is_default: false })
          .eq('cleaner_id', user.id);
          
        if (updateError) {
          console.warn('Error updating other payment methods:', updateError);
          // Continue anyway, not critical
        }
      }
      
      console.log('Inserting new payment method for cleaner:', user.id);
      const { data, error: insertError } = await supabase
        .from('cleaner_payment_methods')
        .insert([{
          ...paymentMethodData,
          cleaner_id: user.id
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting payment method:', insertError);
        throw insertError;
      }
      
      console.log('Payment method added successfully:', data);
      setPaymentMethods(prevMethods => [data, ...prevMethods]);
      return data;
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError(err instanceof Error ? err : new Error('Failed to add payment method'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePaymentMethod = async (id: string, paymentMethodData: Partial<PaymentMethod>) => {
    if (!user) {
      throw new Error('User must be authenticated to update a payment method');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // If setting this as default, update all other methods to not be default
      if (paymentMethodData.is_default) {
        await supabase
          .from('cleaner_payment_methods')
          .update({ is_default: false })
          .eq('cleaner_id', user.id);
      }
      
      const { data, error: updateError } = await supabase
        .from('cleaner_payment_methods')
        .update(paymentMethodData)
        .eq('id', id)
        .eq('cleaner_id', user.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setPaymentMethods(prevMethods => 
        prevMethods.map(method => method.id === id ? data : method)
      );
      return data;
    } catch (err) {
      console.error('Error updating payment method:', err);
      setError(err instanceof Error ? err : new Error('Failed to update payment method'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deletePaymentMethod = async (id: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete a payment method');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the payment method to check if it's the default
      const methodToDelete = paymentMethods.find(method => method.id === id);
      
      const { error: deleteError } = await supabase
        .from('cleaner_payment_methods')
        .delete()
        .eq('id', id)
        .eq('cleaner_id', user.id);
      
      if (deleteError) throw deleteError;
      
      // If we deleted the default method, set another one as default
      if (methodToDelete?.is_default && paymentMethods.length > 1) {
        const remainingMethods = paymentMethods.filter(method => method.id !== id);
        if (remainingMethods.length > 0) {
          await supabase
            .from('cleaner_payment_methods')
            .update({ is_default: true })
            .eq('id', remainingMethods[0].id)
            .eq('cleaner_id', user.id);
        }
      }
      
      setPaymentMethods(prevMethods => prevMethods.filter(method => method.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting payment method:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete payment method'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const setDefaultPaymentMethod = async (id: string) => {
    return updatePaymentMethod(id, { is_default: true });
  };
  
  return { 
    paymentMethods, 
    isLoading, 
    error, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    setDefaultPaymentMethod 
  };
}

/**
 * Hook to get a cleaner's default or all payment methods for a specific cleaner (used by homeowners)
 */
export function useCleanerPaymentMethods(cleanerId: string) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadPaymentMethods = async () => {
      setIsLoading(true);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('cleaner_payment_methods')
          .select('*')
          .eq('cleaner_id', cleanerId)
          .order('is_default', { ascending: false });
        
        // Handle case where the table doesn't exist yet (migration not run)
        if (fetchError && 
            (fetchError.message.includes("relation") && 
             fetchError.message.includes("does not exist"))) {
          console.warn("Payment methods table doesn't exist yet:", fetchError);
          
          if (isMounted) {
            // Just return empty array instead of error
            setPaymentMethods([]);
            setDefaultMethod(null);
            setError(null);
          }
          return;
        }
        
        if (fetchError) throw fetchError;
        
        if (isMounted) {
          setPaymentMethods(data || []);
          setDefaultMethod(data?.find(method => method.is_default) || null);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading cleaner payment methods:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load cleaner payment methods'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    if (cleanerId) {
      loadPaymentMethods();
    }
    
    return () => {
      isMounted = false;
    };
  }, [cleanerId]);
  
  return {
    paymentMethods,
    defaultMethod,
    isLoading,
    error
  };
}

/**
 * Hook to manage payment transactions
 */
export function usePaymentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadTransactions = async () => {
      if (!user) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Determine user type to filter transactions appropriately
        const userType = user.user_metadata?.user_type;
        let query = supabase
          .from('payment_transactions')
          .select(`
            *,
            payment_method:cleaner_payment_methods(*),
            owner:profiles!payment_transactions_owner_id_fkey(full_name),
            cleaner:profiles!payment_transactions_cleaner_id_fkey(full_name, business_name)
          `)
          .order('created_at', { ascending: false });
        
        if (userType === 'homeowner') {
          query = query.eq('owner_id', user.id);
        } else if (userType === 'cleaner') {
          query = query.eq('cleaner_id', user.id);
        }
        
        const { data, error: fetchError } = await query;
        
        // Handle case where the table doesn't exist yet (migration not run)
        if (fetchError && 
            (fetchError.message.includes("relation") && 
             fetchError.message.includes("does not exist"))) {
          console.warn("Payment transactions table doesn't exist yet:", fetchError);
          
          if (isMounted) {
            // Just return empty array instead of error
            setTransactions([]);
            setError(null);
          }
          return;
        }
        
        if (fetchError) throw fetchError;
        
        if (isMounted) {
          setTransactions(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading payment transactions:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load payment transactions'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadTransactions();
    
    return () => {
      isMounted = false;
    };
  }, [user]);
  
  const getJobTransactions = async (jobId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          payment_method:cleaner_payment_methods(*),
          owner:profiles!payment_transactions_owner_id_fkey(full_name),
          cleaner:profiles!payment_transactions_cleaner_id_fkey(full_name, business_name)
        `)
        .eq('job_request_id', jobId)
        .order('created_at', { ascending: false });
      
      // Handle case where the table doesn't exist yet (migration not run)
      if (fetchError && 
          (fetchError.message.includes("relation") && 
           fetchError.message.includes("does not exist"))) {
        console.warn("Payment transactions table doesn't exist yet:", fetchError);
        return [];
      }
      
      if (fetchError) throw fetchError;
      
      return data || [];
    } catch (err) {
      console.error('Error loading job transactions:', err);
      throw err;
    }
  };
  
  const createPaymentTransaction = async (transactionData: {
    job_request_id: string;
    cleaner_id: string;
    amount: number;
    payment_method_id?: string;
    reference_code?: string;
    notes?: string;
  }) => {
    if (!user) {
      throw new Error('User must be authenticated to create a payment transaction');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from('payment_transactions')
        .insert([{
          ...transactionData,
          owner_id: user.id,
          status: 'pending'
        }])
        .select(`
          *,
          payment_method:cleaner_payment_methods(*),
          owner:profiles!payment_transactions_owner_id_fkey(full_name),
          cleaner:profiles!payment_transactions_cleaner_id_fkey(full_name, business_name)
        `)
        .single();
      
      if (insertError) throw insertError;
      
      setTransactions(prevTransactions => [data, ...prevTransactions]);
      return data;
    } catch (err) {
      console.error('Error creating payment transaction:', err);
      setError(err instanceof Error ? err : new Error('Failed to create payment transaction'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateTransactionStatus = async (transactionId: string, status: 'sent' | 'received' | 'confirmed', notes?: string) => {
    if (!user) {
      throw new Error('User must be authenticated to update a transaction');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updateData = {
        status,
        ...(notes && { notes })
      };
      
      const { data, error: updateError } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select(`
          *,
          payment_method:cleaner_payment_methods(*),
          owner:profiles!payment_transactions_owner_id_fkey(full_name),
          cleaner:profiles!payment_transactions_cleaner_id_fkey(full_name, business_name)
        `)
        .single();
      
      if (updateError) throw updateError;
      
      setTransactions(prevTransactions => 
        prevTransactions.map(transaction => 
          transaction.id === transactionId ? data : transaction
        )
      );
      return data;
    } catch (err) {
      console.error('Error updating transaction status:', err);
      setError(err instanceof Error ? err : new Error('Failed to update transaction status'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    transactions,
    isLoading,
    error,
    getJobTransactions,
    createPaymentTransaction,
    updateTransactionStatus
  };
}

/**
 * Hook to manage job payment status
 */
export function useJobPayment(jobId: string) {
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadJobPaymentStatus = async () => {
      if (!jobId) {
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('job_requests')
          .select('payment_status')
          .eq('id', jobId)
          .single();
        
        // If the payment_status column doesn't exist, don't show an error
        if (fetchError && 
            (fetchError.message.includes("column") && 
             fetchError.message.includes("does not exist"))) {
          console.warn("payment_status column doesn't exist yet:", fetchError);
          
          if (isMounted) {
            // Just return empty state instead of error
            setPaymentStatus('unpaid');
            setError(null);
          }
          return;
        }
        
        if (fetchError) throw fetchError;
        
        if (isMounted) {
          setPaymentStatus(data?.payment_status || 'unpaid');
          setError(null);
        }
      } catch (err) {
        console.error('Error loading job payment status:', err);
        if (isMounted) {
          // Don't show error for payment-related issues
          setPaymentStatus('unpaid');
          setError(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadJobPaymentStatus();
    
    // Set up real-time subscription to track payment status changes
    const paymentStatusSubscription = supabase
      .channel(`job-payment-status-${jobId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'job_requests',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          if (isMounted && payload.new && 'payment_status' in payload.new) {
            setPaymentStatus(payload.new.payment_status);
          }
        }
      )
      .subscribe();
    
    return () => {
      isMounted = false;
      paymentStatusSubscription.unsubscribe();
    };
  }, [jobId]);
  
  return {
    paymentStatus,
    isLoading,
    error
  };
}