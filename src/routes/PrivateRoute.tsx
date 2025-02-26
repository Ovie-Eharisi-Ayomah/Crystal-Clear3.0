import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}