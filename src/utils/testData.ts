import { supabase } from '@/lib/supabase';

/**
 * Creates a test job request in the database
 * This is useful for testing the job display functionality
 */
export async function createTestJob(cleanerProfile: {
  id: string;
  email: string;
}) {
  try {
    // 1. First, create a test property
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          owner_id: cleanerProfile.id, // We're using the cleaner as the owner for testing
          address_line1: '123 Test Street',
          city: 'Test City',
          postcode: 'TE1 1ST',
          property_type: 'House',
          num_floors: 2,
          num_windows: 10,
          window_types: ['sliding', 'casement']
        }
      ])
      .select()
      .single();

    if (propertyError) throw propertyError;
    
    console.log('Created test property:', propertyData);
    
    // 2. Then create a job request using that property
    const { data: jobData, error: jobError } = await supabase
      .from('job_requests')
      .insert([
        {
          property_id: propertyData.id,
          owner_id: cleanerProfile.id, // We're using the cleaner as the owner for testing
          status: 'new',
          description: 'This is a test job request',
          preferred_date: new Date().toISOString().split('T')[0], // Today's date
          preferred_time: 'Morning'
        }
      ])
      .select()
      .single();
      
    if (jobError) throw jobError;
    
    console.log('Created test job request:', jobData);
    return { propertyData, jobData };
    
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}