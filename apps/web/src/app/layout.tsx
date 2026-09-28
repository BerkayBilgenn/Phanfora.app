import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Phanfora — Piyasa Kontrol Merkezi",
  description:
    "Küresel varlıkları izle, Phanfora skoruyla analiz et ve fırsatları karşılaştır.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
