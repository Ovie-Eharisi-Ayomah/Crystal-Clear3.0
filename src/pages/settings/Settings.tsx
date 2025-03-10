import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethodList } from '@/components/payments/PaymentMethodList';
import {
  Camera,
  Mail,
  Phone,
  Bell,
  Trash2,
  AlertTriangle,
  Building2,
  MapPin,
  DollarSign,
  Shield,
  CreditCard
} from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, updateProfile, uploadAvatar, deleteAccount } = useProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      email_notifications: formData.get('email_notifications') === 'on',
      sms_notifications: formData.get('sms_notifications') === 'on',
      ...(profile?.user_type === 'cleaner' && {
        business_name: formData.get('business_name') as string,
        service_radius: parseInt(formData.get('service_radius') as string),
        hourly_rate: parseFloat(formData.get('hourly_rate') as string),
        insurance_number: formData.get('insurance_number') as string
      })
    };

    try {
      await updateProfile(updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      await uploadAvatar(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      // The AuthContext will handle the navigation after sign out
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Account Settings
      </h1>

      <div className="space-y-6">
        {/* Profile Photo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Profile Photo
          </h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-sky-100 flex items-center justify-center">
                  <span className="text-2xl font-medium text-sky-900">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-sky-600 p-2 text-white hover:bg-sky-700"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Upload a new profile photo. Images should be at least 400x400px.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Profile Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={user?.email}
                    disabled
                    className="block w-full rounded-none rounded-r-md border-gray-300 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  defaultValue={profile?.full_name}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    defaultValue={profile?.phone || ''}
                    className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cleaner-specific fields */}
          {profile?.user_type === 'cleaner' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Business Information
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="business_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Business Name
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="business_name"
                      name="business_name"
                      defaultValue={profile?.business_name}
                      required
                      className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="service_radius"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Service Radius (miles)
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      id="service_radius"
                      name="service_radius"
                      defaultValue={profile?.service_radius}
                      required
                      min="1"
                      className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="hourly_rate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Hourly Rate (£)
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                      <DollarSign className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      id="hourly_rate"
                      name="hourly_rate"
                      defaultValue={profile?.hourly_rate}
                      required
                      min="1"
                      step="0.01"
                      className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="insurance_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Insurance Policy Number
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                      <Shield className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="insurance_number"
                      name="insurance_number"
                      defaultValue={profile?.insurance_number}
                      required
                      className="block w-full rounded-none rounded-r-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Methods section for cleaners */}
          {profile?.user_type === 'cleaner' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <CreditCard className="inline-block h-5 w-5 mr-2 text-gray-500" />
                Payment Methods
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Add your payment details so homeowners can pay you for completed jobs.
              </p>
              
              {/* Debug info - make this clearer for debugging */}
              <div className="mb-4 text-xs bg-gray-50 p-3 rounded">
                <p><strong>Debugging:</strong> User ID: {user?.id}</p>
                <p><strong>User Metadata Type:</strong> {user?.user_metadata?.user_type || 'Not set'}</p>
                <p><strong>Profile Type:</strong> {profile?.user_type}</p>
                {user?.user_metadata?.user_type !== 'cleaner' && (
                  <div className="mt-2">
                    <p className="text-orange-600 font-medium">Your user account is not properly set as a cleaner in user metadata.</p>
                    <Button 
                      onClick={async () => {
                        try {
                          // Update user metadata
                          const { error: updateError } = await supabase.auth.updateUser({
                            data: { user_type: 'cleaner' }
                          });
                          
                          if (updateError) throw updateError;
                          
                          alert('User type fixed! Page will reload.');
                          window.location.reload();
                        } catch (err) {
                          alert(`Error fixing user type: ${err instanceof Error ? err.message : String(err)}`);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-1"
                    >
                      Fix User Type
                    </Button>
                  </div>
                )}
              </div>
              
              <PaymentMethodList />
            </div>
          )}

          {/* Notification Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Notification Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email_notifications"
                  name="email_notifications"
                  defaultChecked={profile?.email_notifications}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <label
                  htmlFor="email_notifications"
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  Email Notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms_notifications"
                  name="sms_notifications"
                  defaultChecked={profile?.sms_notifications}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <label
                  htmlFor="sms_notifications"
                  className="ml-3 block text-sm font-medium text-gray-700"
                >
                  SMS Notifications
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-red-900 mb-4">
            Danger Zone
          </h2>
          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          {showDeleteConfirm ? (
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-900">
                  Are you sure you want to delete your account? This action cannot be undone.
                </p>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirm Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}