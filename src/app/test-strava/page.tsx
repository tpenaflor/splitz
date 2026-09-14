'use client';

import { useEffect, useState } from 'react';

export default function TestStravaPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/strava/activities?token=${token}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have an access token in the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const token = new URLSearchParams(hash.substring(1)).get('access_token');
      if (token) {
        fetchActivities(token);
        // Clear the hash for security
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // Check for errors in URL params
    const searchParams = new URLSearchParams(window.location.search);
    const errParam = searchParams.get('error');
    if (errParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(`Authentication failed: ${errParam}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Strava Integration Test</h1>
        
        {!activities.length && !loading && (
          <div className="space-y-4">
            <p className="text-gray-500">Connect your Strava account to see your 5 most recent activities.</p>
            <a 
              href="/api/strava/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 transition-colors w-full"
            >
              Connect with Strava
            </a>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-gray-500 animate-pulse">Fetching activities...</p>
        )}

        {activities.length > 0 && (
          <div className="text-left space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">Recent Activities</h2>
            <ul className="space-y-3">
              {activities.map(activity => (
                <li key={activity.id} className="p-3 bg-gray-50 rounded border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{activity.name}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.start_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-500">{(activity.distance / 1000).toFixed(2)} km</p>
                  </div>
                </li>
              ))}
            </ul>
            <button 
              onClick={() => setActivities([])}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline w-full text-center"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
