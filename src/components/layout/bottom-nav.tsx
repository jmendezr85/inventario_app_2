'use client';

import { cn } from '@/lib/utils';
import {
  FileUp,
  ScanLine,
  Store,
  BarChartBig,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Escanear', icon: ScanLine },
  { href: '/report', label: 'Reporte', icon: BarChartBig },
  { href: '/stores', label: 'Almacenes', icon: Store },
  { href: '/import', label: 'Importar', icon: FileUp },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center gap-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground',
                isActive && 'bg-primary/10 text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
