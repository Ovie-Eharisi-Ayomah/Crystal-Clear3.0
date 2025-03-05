-- Create new payment-related tables

-- Payment methods for cleaners (bank account or PayPal information)
CREATE TABLE cleaner_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleaner_id UUID REFERENCES profiles(id) NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('bank_account', 'paypal')),
  account_name VARCHAR(255),
  bank_name VARCHAR(255),
  account_number VARCHAR(255),
  sort_code VARCHAR(50),
  paypal_email VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add policy for cleaner_payment_methods
ALTER TABLE cleaner_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cleaners can view their own payment methods"
  ON cleaner_payment_methods
  FOR SELECT
  USING (auth.uid() = cleaner_id);

CREATE POLICY "Cleaners can insert their own payment methods"
  ON cleaner_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = cleaner_id);

CREATE POLICY "Cleaners can update their own payment methods"
  ON cleaner_payment_methods
  FOR UPDATE
  USING (auth.uid() = cleaner_id);

CREATE POLICY "Cleaners can delete their own payment methods"
  ON cleaner_payment_methods
  FOR DELETE
  USING (auth.uid() = cleaner_id);

-- Add payment status to job_requests table
ALTER TABLE job_requests ADD COLUMN payment_status VARCHAR(50) CHECK (payment_status IN ('unpaid', 'payment_pending', 'payment_sent', 'payment_received', 'payment_confirmed'));
-- Set default for existing and new records
UPDATE job_requests SET payment_status = 'unpaid' WHERE payment_status IS NULL;
ALTER TABLE job_requests ALTER COLUMN payment_status SET DEFAULT 'unpaid';

-- Modify job_requests status check constraint to include payment status
ALTER TABLE job_requests DROP CONSTRAINT IF EXISTS job_requests_status_check;
ALTER TABLE job_requests ADD CONSTRAINT job_requests_status_check 
  CHECK (status IN ('new', 'quoted', 'accepted', 'cleaner_completed', 'completed', 'cancelled'));

-- Create payment transactions table to track payment history
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_request_id UUID REFERENCES job_requests(id) NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  cleaner_id UUID REFERENCES profiles(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method_id UUID REFERENCES cleaner_payment_methods(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'received', 'confirmed')),
  reference_code VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add policy for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment transactions"
  ON payment_transactions
  FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = cleaner_id);

CREATE POLICY "Owners can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own payment transactions"
  ON payment_transactions
  FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = cleaner_id);

-- Function to update payment status on job_requests based on payment_transactions
CREATE OR REPLACE FUNCTION update_job_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    UPDATE job_requests SET payment_status = 'payment_pending' WHERE id = NEW.job_request_id;
  ELSIF NEW.status = 'sent' THEN
    UPDATE job_requests SET payment_status = 'payment_sent' WHERE id = NEW.job_request_id;
  ELSIF NEW.status = 'received' THEN
    UPDATE job_requests SET payment_status = 'payment_received' WHERE id = NEW.job_request_id;
  ELSIF NEW.status = 'confirmed' THEN
    UPDATE job_requests SET payment_status = 'payment_confirmed' WHERE id = NEW.job_request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job payment status when transaction status changes
CREATE TRIGGER payment_transaction_status_update
AFTER INSERT OR UPDATE OF status ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_job_payment_status();

-- Function to set default payment status for new job requests
CREATE OR REPLACE FUNCTION set_default_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_status := 'unpaid';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set default payment status for new job requests
CREATE TRIGGER set_job_payment_status
BEFORE INSERT ON job_requests
FOR EACH ROW
EXECUTE FUNCTION set_default_payment_status();

-- Fix quotes and profiles tables' RLS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;