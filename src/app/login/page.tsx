'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (r.ok) router.push('/');
    else {
      setError('Wrong password');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="font-serif text-4xl italic">CV Tailor</h1>
          <p className="text-sm text-neutral-600 mt-2">Enter password to continue.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border-b border-neutral-400 bg-transparent py-2 focus:outline-none focus:border-black"
          autoFocus
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 disabled:opacity-50"
        >
          {loading ? '...' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
