import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

    // Read the returnTo cookie to figure out where to redirect the user
    const cookieStore = await cookies();
    const returnToPath = cookieStore.get('strava_return_to')?.value || '/test-strava';
    
    // Check if returnToPath already has a hash or query params and append accordingly
    const hashPrefix = returnToPath.includes('#') ? '&' : '#';
    const finalRedirectUrl = new URL(`${returnToPath}${hashPrefix}access_token=${data.access_token}`, baseUrl);
    
    const res = NextResponse.redirect(finalRedirectUrl);
    
    // Clear the cookie
    res.cookies.delete('strava_return_to');
    
    return res;

  } catch (err) {
    console.error('Error during Strava callback:', err);
    return NextResponse.redirect(new URL('/test-strava?error=server_error', baseUrl));
  }
}
