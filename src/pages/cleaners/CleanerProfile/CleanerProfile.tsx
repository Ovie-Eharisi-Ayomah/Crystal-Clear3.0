import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  Clock
} from 'lucide-react';
import './CleanerProfile.css';

interface CleanerProfile {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  bio: string;
  service_radius: number;
  hourly_rate: number;
  years_experience: number;
  created_at: string;
  avatar_url: string;
}

export function CleanerProfile() {
  const { cleanerId } = useParams<{ cleanerId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CleanerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCleanerProfile = async () => {
      if (!cleanerId) return;

      try {
        const { data, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', cleanerId)
          .single();

        if (queryError) throw queryError;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching cleaner profile:', err);
        setError('Failed to load cleaner profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCleanerProfile();
  }, [cleanerId]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading cleaner profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="error-container">
        <p>{error || 'Cleaner profile not found'}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="cleaner-profile-container">
      <div className="cleaner-profile-header">
        <Button
          variant="ghost"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="cleaner-profile-title">Cleaner Profile</h1>
      </div>

      <div className="cleaner-profile-content">
        <div className="profile-card">
          <div className="profile-header">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                <User className="h-12 w-12" />
              </div>
            )}
            <div className="profile-title">
              <h2 className="business-name">{profile.business_name}</h2>
              <p className="cleaner-name">{profile.full_name}</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="info-section">
              <h3 className="section-title">Contact Information</h3>
              
              <div className="info-item">
                <Mail className="info-icon" />
                <div>
                  <div className="info-label">Email</div>
                  <div className="info-value">{profile.email}</div>
                </div>
              </div>

              {profile.phone && (
                <div className="info-item">
                  <Phone className="info-icon" />
                  <div>
                    <div className="info-label">Phone</div>
                    <div className="info-value">{profile.phone}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="info-section">
              <h3 className="section-title">Service Information</h3>
              
              <div className="info-item">
                <MapPin className="info-icon" />
                <div>
                  <div className="info-label">Service Radius</div>
                  <div className="info-value">{profile.service_radius} miles</div>
                </div>
              </div>

              <div className="info-item">
                <Star className="info-icon" />
                <div>
                  <div className="info-label">Hourly Rate</div>
                  <div className="info-value">£{profile.hourly_rate}/hour</div>
                </div>
              </div>

              <div className="info-item">
                <Clock className="info-icon" />
                <div>
                  <div className="info-label">Experience</div>
                  <div className="info-value">{profile.years_experience} years</div>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="bio-section">
                <h3 className="section-title">About</h3>
                <p className="bio-content">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}