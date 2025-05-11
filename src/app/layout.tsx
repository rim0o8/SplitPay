import GoogleAnalytics from '@/lib/analytics';
import { cn } from '@/lib/utils';
import VercelAnalytics from '@/lib/vercel-analytics';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SplitPay',
  description: 'SplitPayは、支払いを分割するためのサービスです。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-background flex flex-col')}>
        <GoogleAnalytics />
        <VercelAnalytics />
        <div className="flex-grow">{children}</div>
      </body>
    </html>
  );
}
