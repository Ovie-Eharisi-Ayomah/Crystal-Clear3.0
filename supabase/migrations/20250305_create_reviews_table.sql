-- Create the reviews table to track homeowner and cleaner reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Define reviewer type (homeowner or cleaner)
  reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('homeowner', 'cleaner')),
  
  -- Enforce that a job can only have one review from each party
  CONSTRAINT unique_review_per_job_per_reviewer UNIQUE (job_request_id, reviewer_id)
);

-- Create RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON reviews FOR SELECT USING (true);

-- Only the reviewer can insert their own review
CREATE POLICY "Users can insert their own reviews" 
ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Only the reviewer can update their own review
CREATE POLICY "Users can update their own reviews" 
ON reviews FOR UPDATE USING (reviewer_id = auth.uid());

-- Only the reviewer can delete their own review
CREATE POLICY "Users can delete their own reviews" 
ON reviews FOR DELETE USING (reviewer_id = auth.uid());