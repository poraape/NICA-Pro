import type { Metadata } from "next";
import "../styles/globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "NICA-Pro",
    template: "%s • NICA-Pro"
  },
  description: "Dashboard nutricional inspirado no Apple Health"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
