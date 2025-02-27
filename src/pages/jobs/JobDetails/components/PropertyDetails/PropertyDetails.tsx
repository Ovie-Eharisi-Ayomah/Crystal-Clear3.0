import React from 'react';
import { MapPin, Home, Image as ImageIcon } from 'lucide-react';
import './PropertyDetails.css';

type PropertyType = {
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  property_type: string;
  num_windows: number;
  num_floors: number;
  window_types: string[];
  images?: Array<{id: string; image_url: string}>;
};

const WINDOW_TYPES = {
  sliding: 'Sliding Windows',
  sash: 'Sash Windows',
  casement: 'Casement Windows',
  bay: 'Bay Windows',
  bow: 'Bow Windows',
  fixed: 'Fixed Windows',
  skylight: 'Skylights'
};

interface PropertyDetailsProps {
  property: PropertyType;
  onImageClick: (url: string) => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onImageClick }) => {
  return (
    <div className="property-details">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Property Details
      </h2>
      
      <div className="space-y-6">
        <div className="flex items-start">
          <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-2" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {property.address_line1}
            </h3>
            {property.address_line2 && (
              <p className="text-gray-500">{property.address_line2}</p>
            )}
            <p className="text-gray-500">
              {property.city}, {property.postcode}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <Home className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-gray-900">
              {property.property_type}
            </p>
            <p className="text-gray-500">
              {property.num_windows} windows · {property.num_floors} floor
              {property.num_floors > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Window Types</h4>
          <ul className="list-disc list-inside text-gray-700">
            {property.window_types.map((type) => (
              <li key={type}>{WINDOW_TYPES[type as keyof typeof WINDOW_TYPES]}</li>
            ))}
          </ul>
        </div>

        {property.images && property.images.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Property Images
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {property.images.map((image) => (
                <div
                  key={image.id}
                  className="relative cursor-pointer group property-image"
                  onClick={() => onImageClick(image.image_url)}
                >
                  <img
                    src={image.image_url}
                    alt="Property"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};