import { supabase } from './supabase';

/**
 * Initializes the storage bucket for property images if it doesn't exist
 */
export async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const propertyImagesBucket = buckets?.find(b => b.name === 'property-images');

    if (!propertyImagesBucket) {
      // The bucket will be created by the migration
      console.log('Property images bucket not found. It will be created by the migration.');
    }
  } catch (error) {
    console.error('Failed to check storage buckets:', error);
  }
}

/**
 * Uploads a property image to Supabase Storage
 */
export async function uploadPropertyImage(propertyId: string, file: File) {
  try {
    // Validate file size
    if (file.size > 10485760) { // 10MB
      throw new Error('File size must be less than 10MB');
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      throw new Error('File must be a JPEG, PNG, or GIF image');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const filePath = `${propertyId}/${fileName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}