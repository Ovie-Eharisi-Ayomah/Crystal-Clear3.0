import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProperty } from '@/hooks/useProperties';
import { useCreateJobRequest } from '@/hooks/useJobs';
import { ArrowLeft, Home, MapPin } from 'lucide-react';
import styles from './JobRequestForm.module.css';

export function JobRequestForm() {
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();
  const { property, isLoading: propertyLoading } = useProperty(propertyId!);
  const { createJobRequest, isLoading, error } = useCreateJobRequest();
  const [formError, setFormError] = useState<string | null>(null);

  if (propertyLoading || !property) {
    return <div>Loading property details...</div>;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      property_id: propertyId!,
      description: formData.get('description') as string,
      preferred_date: formData.get('date') as string,
      preferred_time: formData.get('time') as string,
    };

    try {
      await createJobRequest(data);
      navigate('/dashboard/jobs');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create job request');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          <ArrowLeft className={styles.backIcon} />
          Back
        </Button>
        <h1 className={styles.title}>
          Request Window Cleaning
        </h1>
      </div>

      <div className={styles.card}>
        <div className={styles.propertyInfo}>
          <div className={styles.infoGroup}>
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
          </div>

          <div className={styles.infoGroup}>
            <div className="flex items-center">
              <Home className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-gray-900">
                  {property.property_type} · {property.num_windows} windows · {property.num_floors} floor
                  {property.num_floors > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Additional Details
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={styles.textarea}
              placeholder="Any specific requirements or instructions for the cleaner?"
            />
          </div>

          <div className={styles.dateTimeGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.label}>
                Preferred Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="time" className={styles.label}>
                Preferred Time
              </label>
              <select
                id="time"
                name="time"
                required
                className={styles.input}
              >
                <option value="">Select a time</option>
                <option value="morning">Morning (8am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 4pm)</option>
                <option value="evening">Evening (4pm - 8pm)</option>
              </select>
            </div>
          </div>

          {(error || formError) && (
            <div className={styles.error}>
              <div className={styles.errorText}>
                {error || formError}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}