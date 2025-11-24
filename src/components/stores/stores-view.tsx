'use client';

import { useState } from 'react';
import { useInventory } from '@/lib/hooks/use-inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StoresView() {
  const { stores, addStore, selectStore, activeStore, deleteStore } =
    useInventory();
  const [newStoreName, setNewStoreName] = useState('');
  const { toast } = useToast();

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStoreName.trim()) {
      addStore(newStoreName.trim());
      toast({
        title: 'Almacén agregado',
        description: `Se creó el almacén "${newStoreName.trim()}".`,
      });
      setNewStoreName('');
    }
  };

  const handleDeleteStore = (
    e: React.MouseEvent,
    storeId: string,
    storeName: string
  ) => {
    e.stopPropagation(); // Prevent store selection when clicking delete
    deleteStore(storeId);
    toast({
      variant: 'destructive',
      title: 'Almacén eliminado',
      description: `Se eliminó el almacén "${storeName}".`,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Almacén</CardTitle>
          <CardDescription>
            Crea una nueva tienda, bodega o punto de venta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStore} className="flex gap-2">
            <Input
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              placeholder="Ej: Tienda Centro"
            />
            <Button type="submit" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Almacén</CardTitle>
          <CardDescription>
            Elige el almacén donde registrarás el inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {stores.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No has creado ningún almacén.
                </p>
              ) : (
                stores.map((store) => (
                  <div
                    key={store.id}
                    onClick={() => selectStore(store.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border flex justify-between items-center transition-colors cursor-pointer',
                      activeStore?.id === store.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-4 w-4 rounded-full", store.color)}></div>
                      <span className="font-medium">{store.name}</span>
                    </div>

                    <div className="flex items-center">
                      {activeStore?.id === store.id && (
                        <Check className="h-5 w-5 mr-2" />
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Eliminar almacén?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción es permanente y eliminará el almacén "
                              {store.name}" junto con todo su inventario
                              asociado. ¿Estás seguro?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={(e) => e.stopPropagation()}
                            >
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) =>
                                handleDeleteStore(e, store.id, store.name)
                              }
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
