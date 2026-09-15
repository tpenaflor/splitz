import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPwd = process.env.ADMIN_PASSWORD || 'splitz2026';

    if (user === validUser && pwd === validPwd) {
      return NextResponse.next();
    }
  }
  
  const url = new URL(req.url);
  
  // Return a 401 response with WWW-Authenticate header
  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="Secure Area"`,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
