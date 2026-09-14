import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_ID is not set' }, { status: 500 });
  }

  // Use the current host to determine the redirect URI dynamically
  const url = new URL(request.url);
  const redirectUri = `${url.protocol}//${url.host}/api/strava/callback`;

  const scope = 'activity:read_all';
  const stravaLoginUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`;

  return NextResponse.redirect(stravaLoginUrl);
}
