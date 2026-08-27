import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getDb } from '@/lib/db';
import { scrapeUrl } from '@/lib/scrape';
import { parseJob, researchCompany } from '@/lib/job';
import { randomUUID } from 'node:crypto';

export const maxDuration = 300;

export async function GET() {
  await requireAuth();
  const db = getDb();
  const rows = db.prepare(`
    SELECT j.id, j.source_url, j.company_name, j.role_title, j.language, j.created_at,
      (SELECT COUNT(*) FROM cvs c WHERE c.job_id = j.id) AS cv_count
    FROM jobs j ORDER BY j.created_at DESC
  `).all();
  return NextResponse.json({ jobs: rows });
}

export async function POST(req: Request) {
  await requireAuth();
  const { url, pasted, language } = await req.json();
  if (!url && !pasted) return NextResponse.json({ error: 'need url or pasted' }, { status: 400 });
  const lang: 'pl' | 'en' = language === 'pl' ? 'pl' : 'en';

  const raw = url ? await scrapeUrl(url) : String(pasted);
  const parsed = await parseJob(raw);
  const research = await researchCompany(parsed.companyName, raw);

  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO jobs (id, source_url, raw_text, company_name, role_title, research_json, requirements_json, language, created_at)
    VALUES (@id, @url, @raw, @co, @role, @research, @req, @lang, @ts)
  `).run({
    id,
    url: url || null,
    raw,
    co: parsed.companyName,
    role: parsed.roleTitle,
    research: JSON.stringify(research),
    req: JSON.stringify(parsed),
    lang,
    ts: Date.now()
  });

  return NextResponse.json({ id, parsed, research });
}
