'use client';

import React from 'react';
import { InventoryProvider } from '@/lib/hooks/use-inventory';
import { BottomNav } from './bottom-nav';
import { Logo } from '../icons/logo';
import { usePathname } from 'next/navigation';

const pageTitles: { [key: string]: string } = {
  '/': 'Escanear',
  '/report': 'Reporte',
  '/stores': 'Almacenes',
  '/import': 'Importar',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'StockFlow';

  return (
    <InventoryProvider>
      <div className="flex h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-primary px-4 text-primary-foreground shadow-md">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">{children}</main>

        <BottomNav />
      </div>
    </InventoryProvider>
  );
}
