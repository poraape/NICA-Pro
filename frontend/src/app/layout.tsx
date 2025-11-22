import type { Metadata } from "next";
import "../styles/globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppProvider } from "@/lib/store";
import { ToastViewport } from "@/components/ui/toast";

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
        <ThemeProvider>
          <AppProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
            <ToastViewport />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
