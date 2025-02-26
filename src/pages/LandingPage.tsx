import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Droplets className="h-8 w-8 text-sky-600" />
                <span className="ml-2 text-xl font-bold text-sky-900">
                  CrystalClear
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                Log in
              </Button>
              <Button onClick={() => window.location.href = '/signup'}>
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-sky-900 sm:text-6xl">
                Professional Window Cleaning,
                <br />
                Made Simple
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Connect with trusted window cleaners in your area.
                Book appointments, manage services, and enjoy crystal clear views.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button size="lg" onClick={() => window.location.href = '/signup'}>
                  Get Started
                </Button>
                <Button variant="outline" size="lg">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}