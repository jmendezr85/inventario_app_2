'use client';

import { useState, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/lib/hooks/use-inventory';
import type { Location } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Camera, Boxes, Warehouse, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScannerDialog } from './scanner-dialog';

export function ScanView() {
  const { activeStore, scanItem, recentScans, masterProducts } = useInventory();
  const [location, setLocation] = useState<Location>('Mueble');
  const [manualEan, setManualEan] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [highlightedScanId, setHighlightedScanId] = useState<string | null>(null);

  const handleScan = useCallback((ean: string) => {
    if (!ean) return;
    if (!activeStore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona un almacén primero.',
      });
      return;
    }
    
    const product = masterProducts.find((p) => p.ean === ean);
    
    if (!product) {
      toast({
        variant: 'destructive',
        title: 'Producto Desconocido',
        description: `El EAN "${ean}" no se encontró en la base de datos.`,
      });
      return;
    }

    startTransition(() => {
      const newScan = scanItem(ean, location);
      if (newScan) {
        setHighlightedScanId(newScan.id);
        setTimeout(() => setHighlightedScanId(null), 1000); // Highlight for 1 sec
      }
    });
    
    setManualEan(''); // Clear manual input after scan
  }, [activeStore, location, scanItem, toast, masterProducts]);
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualEan);
  };

  if (!activeStore) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <Card>
            <CardContent className="p-6">
                <p className="text-lg">Por favor, ve a la pestaña de "Almacenes" para crear o seleccionar uno.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Ubicación</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                variant={location === 'Bodega' ? 'default' : 'outline'}
                onClick={() => setLocation('Bodega')}
                className="h-16 text-lg"
              >
                <Warehouse className="mr-2 h-6 w-6" /> Bodega
              </Button>
              <Button
                variant={location === 'Mueble' ? 'default' : 'outline'}
                onClick={() => setLocation('Mueble')}
                className="h-16 text-lg"
              >
                <Boxes className="mr-2 h-6 w-6" /> Mueble
              </Button>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2">
             <label htmlFor="manual-ean" className="text-sm font-medium">Entrada Manual o Lector Bluetooth</label>
            <Input
              id="manual-ean"
              placeholder="Ingresar EAN manualmente"
              value={manualEan}
              onChange={(e) => setManualEan(e.target.value)}
              className="h-12 text-center text-lg"
              disabled={isPending}
            />
          </form>

          <Button onClick={() => setScannerOpen(true)} className="w-full h-20 text-xl" disabled={isPending}>
            <Camera className="mr-4 h-8 w-8" /> Escanear con Cámara
          </Button>
        </CardContent>
      </Card>
      
      <ScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScanSuccess={handleScan} />

      <div>
        <h3 className="text-lg font-semibold mb-2">Últimos Escaneos</h3>
        <div className="space-y-2">
            {recentScans.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay escaneos recientes.</p>
            ) : (
                recentScans.map((scan) => {
                    const isHighlighted = scan.id === highlightedScanId;
                    const isKnown = scan.description !== 'Desconocido';
                    return (
                        <Card key={scan.id} className={cn(
                            'transition-all duration-500', 
                            isHighlighted && isKnown && 'bg-green-100 dark:bg-green-900 border-green-500',
                             isHighlighted && !isKnown && 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500'
                        )}>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isKnown ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-yellow-600" />}
                                    <div>
                                        <p className="font-bold">{scan.description}</p>
                                        <p className="text-sm text-muted-foreground">{scan.ean}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg">x{scan.quantity}</div>
                                    <div className="text-xs text-muted-foreground">{scan.location}</div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
}
