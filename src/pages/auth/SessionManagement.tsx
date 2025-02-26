import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { getUserSessions, deleteSession, deleteOtherSessions } from '@/lib/session';
import { formatDistanceToNow } from 'date-fns';
import { Laptop, Smartphone, Monitor, Trash2 } from 'lucide-react';

export function SessionManagement() {
  const { user } = useAuth();
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      const data = await getUserSessions(user.id);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleDeleteOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out of all other devices?')) {
      return;
    }

    try {
      const currentSession = sessions[0];
      await deleteOtherSessions(currentSession.id);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete other sessions');
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-5 w-5" />;
    } else if (userAgent.toLowerCase().includes('tablet')) {
      return <Monitor className="h-5 w-5" />;
    }
    return <Laptop className="h-5 w-5" />;
  };

  if (loading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Active Sessions</h2>
        {sessions.length > 1 && (
          <Button variant="outline" onClick={handleDeleteOtherSessions}>
            Sign out other devices
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              {getDeviceIcon(session.user_agent || '')}
              <div>
                <p className="font-medium text-gray-900">
                  {session.user_agent ? (
                    session.user_agent.split(' ')[0]
                  ) : (
                    'Unknown Device'
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  Last active {formatDistanceToNow(new Date(session.last_activity_at))} ago
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSession(session.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  );
}