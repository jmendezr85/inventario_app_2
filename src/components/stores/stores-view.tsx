'use client';

import { useState } from 'react';
import { useInventory } from '@/lib/hooks/use-inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StoresView() {
  const { stores, addStore, selectStore, activeStore } = useInventory();
  const [newStoreName, setNewStoreName] = useState('');
  const { toast } = useToast();

  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStoreName.trim()) {
      addStore({ id: Date.now().toString(), name: newStoreName.trim() });
      setNewStoreName('');
      toast({
        title: 'Almacén agregado',
        description: `Se creó el almacén "${newStoreName.trim()}".`,
      });
    }
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
                  <button
                    key={store.id}
                    onClick={() => selectStore(store.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border flex justify-between items-center transition-colors',
                      activeStore?.id === store.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <span className="font-medium">{store.name}</span>
                    {activeStore?.id === store.id && (
                      <Check className="h-5 w-5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
