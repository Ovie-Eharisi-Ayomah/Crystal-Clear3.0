-- Payment Policies
-- This implements security policies for the payment-related tables

-- First, enable RLS on the payment tables
ALTER TABLE cleaner_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "payment_methods_select_own" ON cleaner_payment_methods;
DROP POLICY IF EXISTS "payment_methods_insert_own" ON cleaner_payment_methods;
DROP POLICY IF EXISTS "payment_methods_update_own" ON cleaner_payment_methods;
DROP POLICY IF EXISTS "payment_methods_delete_own" ON cleaner_payment_methods;

DROP POLICY IF EXISTS "payment_trans_select_own" ON payment_transactions;
DROP POLICY IF EXISTS "payment_trans_select_for_owner" ON payment_transactions;
DROP POLICY IF EXISTS "payment_trans_insert" ON payment_transactions;
DROP POLICY IF EXISTS "payment_trans_update_by_owner" ON payment_transactions;
DROP POLICY IF EXISTS "payment_trans_update_by_cleaner" ON payment_transactions;

-- CLEANER PAYMENT METHODS POLICIES

-- Create policy: Cleaners can see their own payment methods
CREATE POLICY "payment_methods_select_own" 
ON cleaner_payment_methods 
FOR SELECT 
USING (cleaner_id = auth.uid());

-- Create policy: Cleaners can insert their own payment methods
CREATE POLICY "payment_methods_insert_own" 
ON cleaner_payment_methods 
FOR INSERT 
WITH CHECK (cleaner_id = auth.uid());

-- Create policy: Cleaners can update their own payment methods
CREATE POLICY "payment_methods_update_own" 
ON cleaner_payment_methods 
FOR UPDATE 
USING (cleaner_id = auth.uid());

-- Create policy: Cleaners can delete their own payment methods
CREATE POLICY "payment_methods_delete_own" 
ON cleaner_payment_methods 
FOR DELETE 
USING (cleaner_id = auth.uid());

-- PAYMENT TRANSACTIONS POLICIES

-- Create policy: Cleaners can see payment transactions for jobs assigned to them
CREATE POLICY "payment_trans_select_own" 
ON payment_transactions 
FOR SELECT 
USING (cleaner_id = auth.uid());

-- Create policy: Owners can see payment transactions for their jobs
CREATE POLICY "payment_trans_select_for_owner" 
ON payment_transactions 
FOR SELECT 
USING (owner_id = auth.uid());

-- Create policy: Owners can create payment transactions for their jobs
CREATE POLICY "payment_trans_insert" 
ON payment_transactions 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Create policy: Owners can update payment transactions they created
CREATE POLICY "payment_trans_update_by_owner" 
ON payment_transactions 
FOR UPDATE 
USING (owner_id = auth.uid());

-- Create policy: Cleaners can update payment status for payments to them
CREATE POLICY "payment_trans_update_by_cleaner" 
ON payment_transactions 
FOR UPDATE 
USING (cleaner_id = auth.uid());

-- Output confirmation
SELECT 'Payment policies created successfully' as message;