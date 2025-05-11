'use client';

import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </div>
    </SessionProvider>
  );
}
