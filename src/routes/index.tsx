import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage/LandingPage';
import { LoginPage } from '@/pages/auth/Login/Login';
import { SignUpPage } from '@/pages/auth/SignUp/SignUp';
import { ProfileCompletion } from '@/pages/auth/ProfileCompletion';
import { DashboardRoutes } from './DashboardRoutes';
import { PrivateRoute } from './PrivateRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        path="/complete-profile"
        element={
          <PrivateRoute>
            <ProfileCompletion />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <DashboardRoutes />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}