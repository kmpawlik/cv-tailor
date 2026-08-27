'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/Shell';

type Job = {
  id: string;
  source_url?: string;
  company_name: string;
  role_title: string;
  language: 'pl' | 'en';
  created_at: number;
  parsed: any;
  research: any;
};

type CvRow = { id: string; version: number; created_at: number; pdf_path: string };

export default function JobPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<{ job: Job; cvs: CvRow[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lastReport, setLastReport] = useState<any>(null);
  const [langOverride, setLangOverride] = useState<'pl' | 'en' | ''>('');

  async function load() {
    const r = await fetch(`/api/jobs/${id}`);
    if (r.ok) setData(await r.json());
  }

  useEffect(() => { load(); }, [id]);

  async function generate() {
    setGenerating(true);
    setError('');
    setLastReport(null);
    try {
      const body: any = {};
      if (langOverride) body.language = langOverride;
      const r = await fetch(`/api/jobs/${id}/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b.error || 'generate failed');
      }
      const b = await r.json();
      setLastReport(b.match_report);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  if (!data) return <Shell><p>Loading...</p></Shell>;
  const { job, cvs } = data;
  const p = job.parsed;
  const r = job.research;

  return (
    <Shell>
      <div className="mb-2 text-sm text-neutral-500">
        <Link href="/" className="underline">← Jobs</Link>
      </div>
      <h1 className="font-serif text-4xl italic mb-1">{job.role_title}</h1>
      <div className="text-lg text-neutral-700 mb-6">{job.company_name}{p?.location ? ` · ${p.location}` : ''}</div>

      {job.source_url && <a className="text-sm underline text-neutral-600" href={job.source_url} target="_blank">{job.source_url}</a>}

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <section>
          <h2 className="font-semibold mb-2">Requirements</h2>
          <div className="text-sm space-y-3">
            {p?.requirements?.must_have?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Must have</div>
                <ul className="list-disc ml-5 space-y-1">
                  {p.requirements.must_have.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {p?.requirements?.nice_to_have?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Nice to have</div>
                <ul className="list-disc ml-5 space-y-1">
                  {p.requirements.nice_to_have.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Company</h2>
          <div className="text-sm space-y-2">
            <p>{r?.what_they_do}</p>
            {r?.size_stage && <p className="text-neutral-600">Size / stage: {r.size_stage}</p>}
            {r?.culture_signals?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1 mt-2">Culture signals</div>
                <ul className="list-disc ml-5 space-y-1">
                  {r.culture_signals.slice(0, 5).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {r?.recent_news?.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1 mt-2">Recent</div>
                <ul className="list-disc ml-5 space-y-1">
                  {r.recent_news.slice(0, 4).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-12 border-t border-neutral-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-xl">Tailored CVs</h2>
          <div className="flex items-center gap-2">
            <select
              value={langOverride}
              onChange={e => setLangOverride(e.target.value as any)}
              className="border border-neutral-300 px-2 py-2 text-sm"
            >
              <option value="">Language: {job.language.toUpperCase()}</option>
              <option value="en">Force English</option>
              <option value="pl">Force Polski</option>
            </select>
            <button onClick={generate} disabled={generating} className="bg-black text-white px-4 py-2 disabled:opacity-50">
              {generating ? 'Generating (30-60s)...' : cvs.length === 0 ? 'Generate CV' : 'Generate new version'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

        {lastReport && (
          <div className="border border-neutral-200 bg-neutral-50 p-4 mb-6 text-sm">
            <div className="font-semibold mb-2">Match report (latest)</div>
            {lastReport.top_achievements_used?.length > 0 && (
              <div className="mb-2">
                <div className="text-xs uppercase text-neutral-500 mb-1">Top achievements used</div>
                <ul className="list-disc ml-5">{lastReport.top_achievements_used.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {lastReport.covered_requirements?.length > 0 && (
              <div className="mb-2">
                <div className="text-xs uppercase text-neutral-500 mb-1">Covered requirements</div>
                <ul className="list-disc ml-5">
                  {lastReport.covered_requirements.map((r: any, i: number) => (
                    <li key={i}><span className="font-medium">{r.requirement}</span> - <span className="text-neutral-600">{r.evidence}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {lastReport.gaps?.length > 0 && (
              <div>
                <div className="text-xs uppercase text-neutral-500 mb-1">Gaps</div>
                <ul className="list-disc ml-5">{lastReport.gaps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {cvs.length === 0 ? (
          <p className="text-neutral-600 text-sm">No CV generated yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {cvs.map(c => (
              <li key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">Version {c.version}</div>
                  <div className="text-xs text-neutral-500">{new Date(c.created_at).toLocaleString()}</div>
                </div>
                <a href={`/api/cvs/${c.id}/pdf`} target="_blank" className="underline text-sm">Open PDF</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
