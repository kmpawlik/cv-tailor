import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.APP_PASSWORD || 'kamiluj123';
  if (password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const s = await getSession();
  s.authed = true;
  await s.save();
  return NextResponse.json({ ok: true });
}
