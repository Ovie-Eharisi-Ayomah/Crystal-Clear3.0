import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProperty } from '@/hooks/useProperties';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const WINDOW_TYPES = {
  sliding: 'Sliding Windows',
  sash: 'Sash Windows',
  casement: 'Casement Windows',
  bay: 'Bay Windows',
  bow: 'Bow Windows',
  fixed: 'Fixed Windows',
  skylight: 'Skylights'
};

export function PropertyDetails() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { property, isLoading } = useProperty(propertyId!);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !property) {
    return <div>Loading property details...</div>;
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;
      
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleDeleteProperty = async () => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const { error: jobRequestsError } = await supabase
        .from('job_requests')
        .delete()
        .eq('property_id', propertyId);

      if (jobRequestsError) throw jobRequestsError;

      const { error: imagesError } = await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyId);

      if (imagesError) throw imagesError;

      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (propertyError) throw propertyError;

      navigate('/dashboard/properties');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete property');
      setIsDeleting(false);
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
        <h1 className="text-2xl font-semibold text-gray-900 flex-1">
          Property Details
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/properties/${propertyId}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteProperty}
            isLoading={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Property Information
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {property.address_line1}
                  {property.address_line2 && (
                    <>
                      <br />
                      {property.address_line2}
                    </>
                  )}
                  <br />
                  {property.city}, {property.postcode}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {property.property_type}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Floors</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {property.num_floors}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Number of Windows</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {property.num_windows}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Window Types</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {property.window_types?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {property.window_types.map((type) => (
                        <li key={type}>{WINDOW_TYPES[type as keyof typeof WINDOW_TYPES]}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No window types specified</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Button
                onClick={() => navigate(`/dashboard/properties/${propertyId}/request`)}
                className="w-full"
              >
                Request Cleaning
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Property Images
        </h2>
        {property.images && property.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {property.images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.image_url}
                  alt="Property"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No images available</p>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}