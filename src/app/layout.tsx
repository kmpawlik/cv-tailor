import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CV Tailor',
  description: 'Tailored CVs, no bullshit'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
