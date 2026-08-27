import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getDb } from '@/lib/db';
import { parseLinkedInZip } from '@/lib/linkedin';
import { buildProfile, Profile } from '@/lib/profile';

export const maxDuration = 300;

export async function GET() {
  await requireAuth();
  const db = getDb();
  const row = db.prepare('SELECT data_json, free_text, links_json, updated_at FROM profile WHERE id = 1').get() as any;
  if (!row) return NextResponse.json({ profile: null });
  return NextResponse.json({
    profile: JSON.parse(row.data_json) as Profile,
    free_text: row.free_text,
    links: row.links_json ? JSON.parse(row.links_json) : [],
    updated_at: row.updated_at
  });
}

export async function POST(req: Request) {
  await requireAuth();
  const form = await req.formData();

  const freeText = (form.get('freeText') as string) || '';
  const linksRaw = (form.get('links') as string) || '[]';
  const links = JSON.parse(linksRaw) as { label: string; url: string }[];

  const zipFile = form.get('linkedin') as File | null;
  const cvFiles = form.getAll('cv') as File[];

  const linkedin = zipFile && zipFile.size > 0
    ? await parseLinkedInZip(Buffer.from(await zipFile.arrayBuffer()))
    : undefined;

  const cvPdfs = await Promise.all(
    cvFiles.filter(f => f && f.size > 0).map(async f => ({
      name: f.name,
      base64: Buffer.from(await f.arrayBuffer()).toString('base64')
    }))
  );

  const profile = await buildProfile({ linkedin, cvPdfs, freeText, links });

  const db = getDb();
  db.prepare(`
    INSERT INTO profile (id, data_json, raw_linkedin_json, free_text, links_json, updated_at)
    VALUES (1, @data, @linkedin, @free, @links, @ts)
    ON CONFLICT(id) DO UPDATE SET
      data_json = excluded.data_json,
      raw_linkedin_json = excluded.raw_linkedin_json,
      free_text = excluded.free_text,
      links_json = excluded.links_json,
      updated_at = excluded.updated_at
  `).run({
    data: JSON.stringify(profile),
    linkedin: linkedin ? JSON.stringify(linkedin) : null,
    free: freeText,
    links: JSON.stringify(links),
    ts: Date.now()
  });

  return NextResponse.json({ profile });
}
