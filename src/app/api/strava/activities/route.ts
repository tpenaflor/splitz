import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 400 });
  }

  try {
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
