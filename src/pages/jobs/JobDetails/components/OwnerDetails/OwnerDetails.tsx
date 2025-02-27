import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import './OwnerDetails.css';

type OwnerType = {
  full_name: string;
  email: string;
  phone?: string;
};

interface OwnerDetailsProps {
  owner: OwnerType;
}

export const OwnerDetails: React.FC<OwnerDetailsProps> = ({ owner }) => {
  return (
    <div className="owner-details">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Contact Information
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <User className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-gray-900">{owner.full_name}</p>
            <p className="text-sm text-gray-500">Property Owner</p>
          </div>
        </div>

        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 mr-2" />
          <p className="text-gray-900">{owner.email}</p>
        </div>

        {owner.phone && (
          <div className="flex items-center">
            <Phone className="h-5 w-5 text-gray-400 mr-2" />
            <p className="text-gray-900">{owner.phone}</p>
          </div>
        )}
      </div>
    </div>
  );
};