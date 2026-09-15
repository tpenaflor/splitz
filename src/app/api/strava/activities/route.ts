import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const search = url.searchParams.get('search');

  if (!token) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
  }

  try {
    if (search) {
      const searchLower = search.toLowerCase();
      const isNumeric = /^\d+$/.test(search);
      let activities = [];

      // If search is numeric, it might be an activity ID
      if (isNumeric) {
        const response = await fetch(`https://www.strava.com/api/v3/activities/${search}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const activity = await response.json();
          activities.push(activity);
        }
      }

      // Fetch a larger list of recent activities to search by title (if not found by ID or to include title matches)
      const listResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=100', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (listResponse.ok) {
        const listActivities = await listResponse.json();
        
        // Filter by title or ID
        const filteredList = listActivities.filter((act: any) => 
          act.name.toLowerCase().includes(searchLower) || 
          act.id.toString() === search
        );
        
        // Combine and deduplicate
        const existingIds = new Set(activities.map(a => a.id));
        for (const act of filteredList) {
          if (!existingIds.has(act.id)) {
            activities.push(act);
            existingIds.add(act.id);
          }
        }
      }

      return NextResponse.json({ activities });
    }

    // Fetch the last 5 activities
    const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=5', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to fetch activities', details: errorData }, { status: response.status });
    }

    const activities = await response.json();
    return NextResponse.json({ activities });

  } catch (err) {
    console.error('Error fetching activities:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
