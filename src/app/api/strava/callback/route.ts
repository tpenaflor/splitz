import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/test-strava?error=access_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/test-strava?error=no_code', request.url));
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Strava credentials');
    return NextResponse.redirect(new URL('/test-strava?error=server_config', request.url));
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Strava token exchange failed:', data);
      return NextResponse.redirect(new URL('/test-strava?error=token_exchange_failed', request.url));
    }

    // For the MVP test, we will redirect back to the test page with the access token in the hash.
    // In a real app, you would securely store this in a session cookie or your database.
    return NextResponse.redirect(new URL(`/test-strava#access_token=${data.access_token}`, request.url));

  } catch (err) {
    console.error('Error during Strava callback:', err);
    return NextResponse.redirect(new URL('/test-strava?error=server_error', request.url));
  }
}
