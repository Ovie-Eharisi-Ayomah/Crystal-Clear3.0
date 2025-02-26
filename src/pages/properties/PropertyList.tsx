import React from 'react';
import { Plus, Eye, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProperties } from '@/hooks/useProperties';

interface PropertyImage {
  image_url: string;
  image_type: 'exterior' | 'interior' | 'other';
}

export function PropertyList() {
  const navigate = useNavigate();
  const { properties, isLoading, error } = useProperties();

  const handleAddProperty = () => {
    navigate('/dashboard/properties/new');
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading properties...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading properties: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Properties</h1>
        <Button onClick={handleAddProperty}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {properties?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No properties yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first property to start requesting cleaning services
          </p>
          <Button onClick={handleAddProperty}>
            Add Your First Property
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {property.images?.[0] && (
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={property.images[0].image_url}
                    alt={property.address_line1}
                    className="object-cover w-full h-48"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {property.address_line1}
                </h3>
                {property.address_line2 && (
                  <p className="text-gray-500">{property.address_line2}</p>
                )}
                <p className="text-gray-500">
                  {property.city}, {property.postcode}
                </p>
                <p className="text-gray-500 mt-2">
                  {property.property_type} · {property.num_floors} floor
                  {property.num_floors > 1 ? 's' : ''}
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/properties/${property.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/properties/${property.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/dashboard/properties/${property.id}/request`)}
                >
                  Request Cleaning
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}