import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProperty } from '@/hooks/useProperties';
import { Camera, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPropertyImage } from '@/lib/storage';

const WINDOW_TYPES = [
  { id: 'sliding', name: 'Sliding Windows' },
  { id: 'sash', name: 'Sash Windows' },
  { id: 'casement', name: 'Casement Windows' },
  { id: 'bay', name: 'Bay Windows' },
  { id: 'bow', name: 'Bow Windows' },
  { id: 'fixed', name: 'Fixed Windows' },
  { id: 'skylight', name: 'Skylights' }
];

export function PropertyEdit() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { property, isLoading } = useProperty(propertyId!);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedWindowTypes, setSelectedWindowTypes] = useState<string[]>([]);

  React.useEffect(() => {
    async function fetchPropertyTypes() {
      const { data } = await supabase
        .from('property_types')
        .select('*')
        .order('name');
      if (data) setPropertyTypes(data);
    }
    fetchPropertyTypes();

    if (property) {
      setSelectedWindowTypes(property.window_types || []);
    }
  }, [property]);

  if (isLoading || !property) {
    return <div>Loading property details...</div>;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const handleWindowTypeChange = (type: string) => {
    setSelectedWindowTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData(e.currentTarget);
    
    const propertyData = {
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string,
      city: formData.get('city') as string,
      postcode: formData.get('postcode') as string,
      property_type: formData.get('property_type') as string,
      num_floors: parseInt(formData.get('num_floors') as string, 10),
      num_windows: parseInt(formData.get('num_windows') as string, 10),
      window_types: selectedWindowTypes
    };

    try {
      const { error: updateError } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', propertyId);

      if (updateError) throw updateError;

      if (images.length > 0) {
        const totalImages = images.length;
        let uploadedCount = 0;

        for (const image of images) {
          try {
            const publicUrl = await uploadPropertyImage(propertyId!, image);
            await supabase.from('property_images').insert({
              property_id: propertyId,
              image_url: publicUrl,
              image_type: 'exterior'
            });

            uploadedCount++;
            setUploadProgress((uploadedCount / totalImages) * 100);
          } catch (err) {
            console.error('Failed to upload image:', err);
            setError('Failed to upload some images');
          }
        }
      }

      navigate('/dashboard/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Property
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="address_line1"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>
            <input
              type="text"
              id="address_line1"
              name="address_line1"
              defaultValue={property.address_line1}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="address_line2"
              className="block text-sm font-medium text-gray-700"
            >
              Address Line 2
            </label>
            <input
              type="text"
              id="address_line2"
              name="address_line2"
              defaultValue={property.address_line2 || ''}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                defaultValue={property.city}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="postcode"
                className="block text-sm font-medium text-gray-700"
              >
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                name="postcode"
                defaultValue={property.postcode}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="property_type"
                className="block text-sm font-medium text-gray-700"
              >
                Property Type
              </label>
              <select
                id="property_type"
                name="property_type"
                defaultValue={property.property_type}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              >
                {propertyTypes.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="num_floors"
                className="block text-sm font-medium text-gray-700"
              >
                Number of Floors
              </label>
              <input
                type="number"
                id="num_floors"
                name="num_floors"
                defaultValue={property.num_floors}
                min="1"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="num_windows"
                className="block text-sm font-medium text-gray-700"
              >
                Number of Windows
              </label>
              <input
                type="number"
                id="num_windows"
                name="num_windows"
                defaultValue={property.num_windows}
                min="0"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Window Types
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {WINDOW_TYPES.map((type) => (
                <label
                  key={type.id}
                  className={`
                    relative flex items-center justify-center p-4 rounded-lg border cursor-pointer
                    ${
                      selectedWindowTypes.includes(type.id)
                        ? 'bg-sky-50 border-sky-200 ring-2 ring-sky-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedWindowTypes.includes(type.id)}
                    onChange={() => handleWindowTypeChange(type.id)}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {type.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add More Images
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="images"
                    className="relative cursor-pointer rounded-md bg-white font-medium text-sky-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 hover:text-sky-500"
                  >
                    <span>Upload images</span>
                    <input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
            {images.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {images.length} new image{images.length !== 1 ? 's' : ''} selected
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-sky-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Uploading images... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}