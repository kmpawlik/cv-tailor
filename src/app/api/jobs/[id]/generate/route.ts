import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db, DATA_DIR } from '@/lib/db';
import { tailorCV } from '@/lib/tailor';
import { renderCvHtml } from '@/lib/cv-html';
import { htmlToPdf } from '@/lib/pdf';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id: jobId } = await params;
  const body = await req.json().catch(() => ({}));
  const languageOverride: 'pl' | 'en' | undefined = body.language;

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
  if (!job) return NextResponse.json({ error: 'job not found' }, { status: 404 });
  const profileRow = db.prepare('SELECT data_json FROM profile WHERE id = 1').get() as any;
  if (!profileRow) return NextResponse.json({ error: 'profile missing' }, { status: 400 });

  const language = languageOverride || (job.language as 'pl' | 'en');

  const cv = await tailorCV({
    profile: JSON.parse(profileRow.data_json),
    job: JSON.parse(job.requirements_json),
    research: JSON.parse(job.research_json),
    language
  });

  const html = renderCvHtml(cv);
  const pdf = await htmlToPdf(html);

  const cvId = randomUUID();
  const nextVersion = (db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM cvs WHERE job_id = ?').get(jobId) as any).v + 1;
  const pdfPath = path.join(DATA_DIR, 'pdfs', `${cvId}.pdf`);
  await fs.writeFile(pdfPath, pdf);

  db.prepare(`
    INSERT INTO cvs (id, job_id, version, cv_json, pdf_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(cvId, jobId, nextVersion, JSON.stringify(cv), pdfPath, Date.now());

  return NextResponse.json({ cvId, version: nextVersion, match_report: cv.match_report });
}
