'use client';

import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';
import { Suspense } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="relative min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="group transition-all duration-300 hover:scale-105">
                <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-blue-600">
                  SplitPay
                </h1>
              </Link>
            </div>
            <div className="flex-1" />
          </div>
        </header>

        <main className="container mx-auto pt-4 pb-10">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
                <div className="animate-pulse text-foreground">Loading...</div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  );
}
