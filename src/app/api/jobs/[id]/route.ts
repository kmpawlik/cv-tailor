import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getDb } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const cvs = db.prepare('SELECT id, version, created_at, pdf_path FROM cvs WHERE job_id = ? ORDER BY version DESC').all(id);
  return NextResponse.json({
    job: {
      id: job.id,
      source_url: job.source_url,
      company_name: job.company_name,
      role_title: job.role_title,
      language: job.language,
      created_at: job.created_at,
      parsed: JSON.parse(job.requirements_json),
      research: JSON.parse(job.research_json)
    },
    cvs
  });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM cvs WHERE job_id = ?').run(id);
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
