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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-transparent text-slate-900 antialiased transition-colors dark:text-white">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
