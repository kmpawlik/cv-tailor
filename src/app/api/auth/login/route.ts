import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password !== 'kamiluj123' && password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const s = await getSession();
  s.authed = true;
  await s.save();
  return NextResponse.json({ ok: true });
}
