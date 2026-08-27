'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/Shell';

export default function NewJobPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'url' | 'paste'>('url');
  const [url, setUrl] = useState('');
  const [pasted, setPasted] = useState('');
  const [language, setLanguage] = useState<'en' | 'pl'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProgress(mode === 'url' ? 'Fetching offer, parsing, researching company...' : 'Parsing offer, researching company...');
    try {
      const r = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: mode === 'url' ? url : null, pasted: mode === 'paste' ? pasted : null, language })
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b.error || 'Failed');
      }
      const b = await r.json();
      router.push(`/jobs/${b.id}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <Shell>
      <h1 className="font-serif text-4xl italic mb-8">New job</h1>
      <form onSubmit={submit} className="space-y-8 max-w-2xl">
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('url')} className={`px-4 py-2 border ${mode === 'url' ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>Paste URL</button>
          <button type="button" onClick={() => setMode('paste')} className={`px-4 py-2 border ${mode === 'paste' ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>Paste text</button>
        </div>

        {mode === 'url' ? (
          <div>
            <label className="block font-semibold mb-2">Job offer URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full border border-neutral-300 px-3 py-2"
            />
            <p className="text-xs text-neutral-500 mt-2">Some sites block scraping (LinkedIn, some ATS). If it fails, use the paste option.</p>
          </div>
        ) : (
          <div>
            <label className="block font-semibold mb-2">Job description</label>
            <textarea
              value={pasted}
              onChange={e => setPasted(e.target.value)}
              rows={16}
              required
              className="w-full border border-neutral-300 px-3 py-2 font-mono text-sm"
              placeholder="Paste the full job description..."
            />
          </div>
        )}

        <div>
          <label className="block font-semibold mb-2">CV language</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setLanguage('en')} className={`px-4 py-2 border ${language === 'en' ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>English</button>
            <button type="button" onClick={() => setLanguage('pl')} className={`px-4 py-2 border ${language === 'pl' ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>Polski</button>
          </div>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {loading && progress && <p className="text-sm text-neutral-600">{progress} (30-90 seconds)</p>}
        <button type="submit" disabled={loading} className="bg-black text-white px-6 py-3 disabled:opacity-50">
          {loading ? 'Working...' : 'Analyze offer'}
        </button>
      </form>
    </Shell>
  );
}
