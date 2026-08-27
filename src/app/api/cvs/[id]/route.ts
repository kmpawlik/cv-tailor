import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const row = db.prepare('SELECT id, job_id, version, cv_json, created_at FROM cvs WHERE id = ?').get(id) as any;
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    id: row.id,
    jobId: row.job_id,
    version: row.version,
    createdAt: row.created_at,
    cv: JSON.parse(row.cv_json)
  });
}
