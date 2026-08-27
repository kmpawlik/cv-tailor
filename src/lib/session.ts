import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = { authed?: boolean };

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'insecure-dev-secret-32-chars-long-xxxx',
  cookieName: 'cv_tailor_session',
  cookieOptions: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    sameSite: 'lax'
  }
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAuth() {
  const s = await getSession();
  if (!s.authed) throw new Error('unauthorized');
  return s;
}
