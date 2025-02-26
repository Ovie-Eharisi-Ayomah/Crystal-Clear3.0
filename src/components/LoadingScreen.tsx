import { Droplets } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Droplets className="h-12 w-12 text-sky-600 mx-auto animate-pulse" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Loading...</h2>
      </div>
    </div>
  );
}