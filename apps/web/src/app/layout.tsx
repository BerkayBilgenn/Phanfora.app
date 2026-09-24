import type { Metadata } from 'next';

import { AppShell } from '@/components/app-shell';

import './globals.css';

export const metadata: Metadata = {
  title: 'Phanfora — Küresel fırsat analizi',
  description: 'Küresel piyasaları vade ve risk tercihine göre karşılaştır.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><AppShell>{children}</AppShell></body></html>;
}
