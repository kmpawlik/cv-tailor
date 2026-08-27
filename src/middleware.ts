import { NextResponse, type NextRequest } from 'next/server';
import { unsealData } from 'iron-session';

const PUBLIC = ['/login', '/api/auth/login'];
const COOKIE_NAME = 'cv_tailor_session';

export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (PUBLIC.some(x => p.startsWith(x))) return NextResponse.next();
  if (p.startsWith('/_next') || p === '/favicon.ico') return NextResponse.next();

  const raw = req.cookies.get(COOKIE_NAME)?.value;
  let authed = false;
  if (raw) {
    try {
      const data = await unsealData<{ authed?: boolean }>(raw, {
        password: process.env.SESSION_SECRET || 'insecure-dev-secret-32-chars-long-xxxx'
      });
      authed = !!data?.authed;
    } catch { authed = false; }
  }

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
