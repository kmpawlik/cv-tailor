import Link from 'next/link';

export function Shell({ children, hideNav }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen">
      {!hideNav && (
        <nav className="border-b border-neutral-200 px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="font-serif italic text-xl">CV Tailor</Link>
          <div className="flex gap-4 text-sm">
            <Link href="/">Jobs</Link>
            <Link href="/onboarding">Profile</Link>
            <form action="/api/auth/logout" method="post">
              <button className="text-neutral-500">Log out</button>
            </form>
          </div>
        </nav>
      )}
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
