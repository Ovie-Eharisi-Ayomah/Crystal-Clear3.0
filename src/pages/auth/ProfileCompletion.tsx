/**
 * ProfileCompletion Component
 * 
 * Allows users to complete their profile after initial signup.
 * Different fields are shown based on user type:
 * - Homeowners: Contact details
 * - Cleaners: Contact details, service area, business details
 * 
 * Features:
 * - Conditional form fields based on user type
 * - Phone number validation
 * - Service area selection for cleaners
 * - Business information for cleaners
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function ProfileCompletion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userType = user?.user_metadata?.user_type;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const profileData: Record<string, any> = {
      phone: formData.get('phone'),
      contact_address: formData.get('address'),
    };

    // Add cleaner-specific fields
    if (userType === 'cleaner') {
      profileData.business_name = formData.get('business_name');
      profileData.service_radius = parseInt(formData.get('service_radius') as string, 10);
      profileData.hourly_rate = parseFloat(formData.get('hourly_rate') as string);
      profileData.insurance_number = formData.get('insurance_number');
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">
            {userType === 'homeowner'
              ? 'Add your contact details to get started'
              : 'Add your business information to start receiving job requests'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common fields for both user types */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            {/* Cleaner-specific fields */}
            {userType === 'cleaner' && (
              <>
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="business_name"
                    name="business_name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="service_radius" className="block text-sm font-medium text-gray-700">
                    Service Radius (miles)
                  </label>
                  <input
                    type="number"
                    id="service_radius"
                    name="service_radius"
                    min="1"
                    max="100"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                    Hourly Rate (£)
                  </label>
                  <input
                    type="number"
                    id="hourly_rate"
                    name="hourly_rate"
                    min="1"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="insurance_number" className="block text-sm font-medium text-gray-700">
                    Insurance Policy Number
                  </label>
                  <input
                    type="text"
                    id="insurance_number"
                    name="insurance_number"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Complete Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}