import { Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout';
import { DashboardPage } from '@/pages/DashboardPage/DashboardPage';
import { PropertyList } from '@/pages/properties/PropertyList';
import { PropertyForm } from '@/pages/properties/PropertyForm';
import { PropertyDetails } from '@/pages/properties/PropertyDetails';
import { PropertyEdit } from '@/pages/properties/PropertyEdit';
import { JobRequestForm } from '@/pages/jobs/JobRequestForm';
import { JobList } from '@/pages/jobs/JobList';
import { JobDetails } from '@/pages/jobs/JobDetails';
import { SessionManagement } from '@/pages/auth/SessionManagement';
import { Settings } from '@/pages/settings/Settings';
import { QuoteList } from '@/pages/quotes/QuoteList';
import { QuoteDetail } from '@/pages/quotes/QuoteDetail';
import { CleanerProfile } from '@/pages/cleaners/CleanerProfile/CleanerProfile';

export function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/properties" element={<PropertyList />} />
        <Route path="/properties/new" element={<PropertyForm />} />
        <Route path="/properties/:propertyId" element={<PropertyDetails />} />
        <Route path="/properties/:propertyId/edit" element={<PropertyEdit />} />
        <Route path="/properties/:propertyId/request" element={<JobRequestForm />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />
        <Route path="/quotes" element={<QuoteList />} />
        <Route path="/quotes/:quoteId" element={<QuoteDetail />} />
        <Route path="/cleaners/:cleanerId" element={<CleanerProfile />} />
        <Route path="/sessions" element={<SessionManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<div>Coming soon...</div>} />
      </Routes>
    </DashboardLayout>
  );
}