'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/lib/hooks/use-inventory';
import type { Location } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Camera, Boxes, Warehouse, CheckCircle, AlertCircle, Loader2, Trash2, ShieldX, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScannerDialog } from './scanner-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

export function ScanView() {
  const { activeStore, scanItem, recentScans, masterProducts, clearRecentScans } = useInventory();
  const [location, setLocation] = useState<Location>('Mueble');
  const [manualEan, setManualEan] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [highlightedScanId, setHighlightedScanId] = useState<string | null>(null);
  const isHandlingScanRef = useRef(false);
  const isHandlingSuccessRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleScan = useCallback((decodedText: string) => {
    if (!decodedText || isHandlingSuccessRef.current) return;
    
    isHandlingSuccessRef.current = true;

    if (!activeStore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, selecciona un almacén primero.',
      });
      isHandlingSuccessRef.current = false;
      return;
    }
    
    const product = masterProducts.find((p) => p.ean === decodedText);
    
    if (!product) {
      toast({
        variant: 'destructive',
        title: 'Producto Desconocido',
        description: `El EAN "${decodedText}" no se encontró en la base de datos.`,
      });
       setTimeout(() => { isHandlingSuccessRef.current = false; }, 300);
      return;
    }

    startTransition(() => {
      const newScan = scanItem(decodedText, location);
      if (newScan) {
        setHighlightedScanId(newScan.id);
        const timer = setTimeout(() => setHighlightedScanId(null), 1000);
        return () => clearTimeout(timer);
      }
    });
    
    setManualEan(''); // Clear manual input after scan
    setTimeout(() => { isHandlingSuccessRef.current = false; }, 300);
  }, [activeStore, location, scanItem, toast, masterProducts]);
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualEan);
  };

  if (!hydrated) {
    return (
        <div className="flex h-full items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

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
                onClick={() => setLocation('Bodega')}
                className={cn(
                  'h-16 text-lg border',
                  location === 'Bodega'
                    ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                    : 'bg-white text-gray-800 border-gray-300'
                )}
              >
                <Warehouse className="mr-2 h-6 w-6" /> Bodega
              </Button>
              <Button
                onClick={() => setLocation('Mueble')}
                className={cn(
                  'h-16 text-lg border',
                   location === 'Mueble'
                    ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                    : 'bg-white text-gray-800 border-gray-300'
                )}
              >
                <Boxes className="mr-2 h-6 w-6" /> Mueble
              </Button>
              <Button
                onClick={() => setLocation('Averias')}
                className={cn(
                  'h-16 text-lg border',
                  location === 'Averias'
                    ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                    : 'bg-white text-gray-800 border-gray-300'
                )}
              >
                <ShieldX className="mr-2 h-6 w-6" /> Averías
              </Button>
              <Button
                onClick={() => setLocation('Inactivo')}
                className={cn(
                  'h-16 text-lg border',
                  location === 'Inactivo'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                    : 'bg-white text-gray-800 border-gray-300'
                )}
              >
                <Ban className="mr-2 h-6 w-6" /> Inactivo
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
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Últimos Escaneos</h3>
            {recentScans.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Borrar historial?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción eliminará la lista de escaneos recientes. No afectará el inventario.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={clearRecentScans}>
                                Borrar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
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
