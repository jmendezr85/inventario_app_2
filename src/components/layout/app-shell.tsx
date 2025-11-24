'use client';

import React from 'react';
import { InventoryProvider, useInventory } from '@/lib/hooks/use-inventory';
import { BottomNav } from './bottom-nav';
import { Logo } from '../icons/logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const pageTitles: { [key: string]: string } = {
  '/': 'Escanear',
  '/report': 'Reporte',
  '/stores': 'Almacenes',
  '/import': 'Importar',
};

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { activeStore } = useInventory();
  const title = pageTitles[pathname] ?? 'StockFlow';

  const headerColorClass = activeStore?.color ? activeStore.color : 'bg-primary';

  return (
    <div className="flex h-screen flex-col">
      <header className={cn(
        "flex h-16 items-center justify-between border-b px-4 text-primary-foreground shadow-md transition-colors",
        headerColorClass
      )}>
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary-foreground" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      <BottomNav />
    </div>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <InventoryProvider>
      <AppShellContent>{children}</AppShellContent>
    </InventoryProvider>
  );
}
