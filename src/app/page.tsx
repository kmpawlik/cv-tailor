import Link from 'next/link';
import { tryGetDb } from '@/lib/db';
import { Shell } from '@/components/Shell';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await requireAuth();

  const db = tryGetDb();
  if (!db) {
    return (
      <Shell>
        <div className="max-w-xl">
          <h1 className="font-serif text-4xl italic mb-2">Storage unavailable</h1>
          <p className="text-neutral-600 mb-4">
            This host does not have persistent filesystem access. CV Tailor needs a real server with a writable disk (Hetzner, Railway, Fly, DigitalOcean).
          </p>
          <p className="text-sm text-neutral-500">Login works. Profile, jobs and CV generation do not.</p>
        </div>
      </Shell>
    );
  }

  const profile = db.prepare('SELECT data_json FROM profile WHERE id = 1').get() as any;
  const jobs = db.prepare(`
    SELECT j.id, j.company_name, j.role_title, j.source_url, j.language, j.created_at,
      (SELECT COUNT(*) FROM cvs c WHERE c.job_id = j.id) AS cv_count
    FROM jobs j ORDER BY j.created_at DESC
  `).all() as any[];

  if (!profile) {
    return (
      <Shell>
        <div className="max-w-xl">
          <h1 className="font-serif text-4xl italic mb-2">Welcome.</h1>
          <p className="text-neutral-600 mb-6">Start by building your profile. This is the source of truth every tailored CV pulls from.</p>
          <Link href="/onboarding" className="inline-block bg-black text-white px-6 py-3">Build profile</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-4xl italic">Jobs</h1>
        <Link href="/jobs/new" className="bg-black text-white px-4 py-2">+ New job</Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-neutral-600">No jobs yet. Add a job to generate your first tailored CV.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {jobs.map(j => (
            <li key={j.id} className="py-4">
              <Link href={`/jobs/${j.id}`} className="flex justify-between items-baseline gap-4 hover:bg-neutral-50 -mx-2 px-2 py-1">
                <div>
                  <div className="font-semibold">{j.role_title} <span className="text-neutral-400 font-normal">at</span> {j.company_name}</div>
                  <div className="text-sm text-neutral-500 mt-1">{new Date(j.created_at).toLocaleString()} · {j.language.toUpperCase()} · {j.cv_count} CV{j.cv_count === 1 ? '' : 's'}</div>
                </div>
                <span className="text-neutral-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
