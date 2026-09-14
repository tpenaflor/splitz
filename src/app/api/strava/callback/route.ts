import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  let protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  if (protocol.includes(',')) protocol = protocol.split(',')[0];
  const baseUrl = `${protocol}://${host}`;

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/test-strava?error=access_denied', baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/test-strava?error=no_code', baseUrl));
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Strava credentials');
    return NextResponse.redirect(new URL('/test-strava?error=server_config', baseUrl));
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
      return NextResponse.redirect(new URL('/test-strava?error=token_exchange_failed', baseUrl));
    }

    // For the MVP test, we will redirect back to the test page with the access token in the hash.
    // In a real app, you would securely store this in a session cookie or your database.
    return NextResponse.redirect(new URL(`/test-strava#access_token=${data.access_token}`, baseUrl));

  } catch (err) {
    console.error('Error during Strava callback:', err);
    return NextResponse.redirect(new URL('/test-strava?error=server_error', baseUrl));
  }
}
