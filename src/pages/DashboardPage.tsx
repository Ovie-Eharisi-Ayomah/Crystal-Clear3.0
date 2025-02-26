import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.user_metadata?.user_type;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back, {user?.user_metadata?.full_name}!
      </h1>
      <div className="mt-6">
        {userType === 'homeowner' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Cleaning Requests
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => navigate('/dashboard/jobs')}
                    className="font-medium text-sky-700 hover:text-sky-900"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Available Jobs
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <button
                    onClick={() => navigate('/dashboard/jobs')}
                    className="font-medium text-sky-700 hover:text-sky-900"
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}