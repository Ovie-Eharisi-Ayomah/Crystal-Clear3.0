import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './JobRequestDetails.css';

type JobType = {
  id: string;
  preferred_date: string;
  preferred_time: string;
  description?: string;
  status: string;
};

interface JobRequestDetailsProps {
  job: JobType;
}

export const JobRequestDetails: React.FC<JobRequestDetailsProps> = ({ job }) => {
  return (
    <div className="job-request-details">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Request Details
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-gray-900">
              Preferred Date: {format(new Date(job.preferred_date), 'MMMM d, yyyy')}
            </p>
            <p className="text-gray-500">
              Preferred Time: {job.preferred_time}
            </p>
          </div>
        </div>

        {job.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Additional Details
            </h4>
            <p className="text-gray-700">{job.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};