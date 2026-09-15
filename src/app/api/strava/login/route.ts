import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: 'STRAVA_CLIENT_ID is not set' }, { status: 500 });
  }

  // Use headers to handle Cloud Run's proxy correctly (TLS termination)
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  let protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  if (protocol.includes(',')) protocol = protocol.split(',')[0]; // e.g. "https,http"
  
  const redirectUri = `${protocol}://${host}/api/strava/callback`;

  const returnTo = url.searchParams.get('returnTo') || '/test-strava';
  
  const scope = 'activity:read_all';
  const stravaLoginUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`;

  const response = NextResponse.redirect(stravaLoginUrl);
  
  // Set a secure HTTP-only cookie to remember where to return the user
  response.cookies.set('strava_return_to', returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
  });

  return response;
}
