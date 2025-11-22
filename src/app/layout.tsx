import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'StockFlow',
  description: 'Inventory management and barcode scanning app.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StockFlow',
  },
};

export const viewport: Viewport = {
  themeColor: '#2962FF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
