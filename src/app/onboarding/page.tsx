'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LinkRow = { label: string; url: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [cvFiles, setCvFiles] = useState<File[]>([]);
  const [freeText, setFreeText] = useState('');
  const [links, setLinks] = useState<LinkRow[]>([{ label: '', url: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function updateLink(i: number, field: keyof LinkRow, v: string) {
    setLinks(prev => prev.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData();
    if (linkedinFile) fd.append('linkedin', linkedinFile);
    for (const f of cvFiles) fd.append('cv', f);
    fd.append('freeText', freeText);
    fd.append('links', JSON.stringify(links.filter(l => l.label && l.url)));
    const r = await fetch('/api/profile', { method: 'POST', body: fd });
    if (r.ok) router.push('/');
    else {
      setError('Something went wrong. Check server logs.');
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-serif text-4xl italic mb-2">Your profile</h1>
      <p className="text-neutral-600 mb-10">The more you give here, the sharper every tailored CV becomes.</p>

      <form onSubmit={submit} className="space-y-10">
        <section>
          <label className="block font-semibold mb-2">LinkedIn Data Export (ZIP)</label>
          <p className="text-sm text-neutral-600 mb-3">
            Settings & Privacy - Data Privacy - Get a copy of your data. Wait for the email, then upload the ZIP.
          </p>
          <input
            type="file"
            accept=".zip"
            onChange={e => setLinkedinFile(e.target.files?.[0] ?? null)}
            className="block"
          />
        </section>

        <section>
          <label className="block font-semibold mb-2">Previous CVs (PDF)</label>
          <p className="text-sm text-neutral-600 mb-3">Upload any versions you have. Older ones help - even outdated bullets remind of forgotten wins.</p>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={e => setCvFiles(Array.from(e.target.files ?? []))}
            className="block"
          />
        </section>

        <section>
          <label className="block font-semibold mb-2">Useful links</label>
          {links.map((row, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Label (Portfolio, GitHub...)"
                value={row.label}
                onChange={e => updateLink(i, 'label', e.target.value)}
                className="border border-neutral-300 px-3 py-2 flex-1"
              />
              <input
                placeholder="https://..."
                value={row.url}
                onChange={e => updateLink(i, 'url', e.target.value)}
                className="border border-neutral-300 px-3 py-2 flex-[2]"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLinks([...links, { label: '', url: '' }])}
            className="text-sm underline"
          >
            + add link
          </button>
        </section>

        <section>
          <label className="block font-semibold mb-2">Anything else worth knowing</label>
          <p className="text-sm text-neutral-600 mb-3">
            Achievements, quantified results, side projects, languages, career preferences, industries you want or want to avoid. Raw brain dump is fine.
          </p>
          <textarea
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            rows={10}
            className="w-full border border-neutral-300 px-3 py-2"
          />
        </section>

        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-6 py-3 disabled:opacity-50"
        >
          {loading ? 'Building profile...' : 'Save profile'}
        </button>
      </form>
    </main>
  );
}
