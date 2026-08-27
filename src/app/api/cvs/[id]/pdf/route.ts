import { requireAuth } from '@/lib/session';
import { getDb } from '@/lib/db';
import fs from 'node:fs/promises';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const db = getDb();
  const row = db.prepare('SELECT pdf_path, cv_json FROM cvs WHERE id = ?').get(id) as any;
  if (!row) return new Response('not found', { status: 404 });
  const cv = JSON.parse(row.cv_json);
  const buf = await fs.readFile(row.pdf_path);
  const name = `${cv.fullName.replace(/[^a-zA-Z0-9]+/g, '_')}_CV.pdf`;
  return new Response(buf, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${name}"`
    }
  });
}
