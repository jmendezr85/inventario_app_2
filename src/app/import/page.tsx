'use client';

import { useState } from 'react';
import { ExcelUploader } from '@/components/import/excel-uploader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useInventory } from '@/lib/hooks/use-inventory';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export default function ImportPage() {
  const { loadMasterProducts, addProduct } = useInventory();
  const [newEan, setNewEan] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const { toast } = useToast();

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEan.trim() && newDescription.trim()) {
        addProduct({ ean: newEan.trim(), description: newDescription.trim() });
        setNewEan('');
        setNewDescription('');
    } else {
        toast({
            variant: 'destructive',
            title: 'Campos requeridos',
            description: 'Por favor, ingresa el EAN y la descripción del producto.',
        })
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Crear Producto Manualmente</CardTitle>
          <CardDescription>
            Agrega un nuevo producto a tu base de datos si no lo tienes en un archivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="ean">Código EAN</label>
                <Input 
                    id="ean"
                    placeholder="Ingresa el código de barras"
                    value={newEan}
                    onChange={(e) => setNewEan(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <label htmlFor="description">Descripción del Producto</label>
                <Input 
                    id="description"
                    placeholder="Ej: Gaseosa 1.5L"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Guardar Producto
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Importar Productos desde Excel</CardTitle>
          <CardDescription>
            Sube un archivo .xlsx con las columnas "EAN" y "DESCRIPCION" para
            cargar la base de datos de productos masivamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExcelUploader onDataLoaded={loadMasterProducts} />
        </CardContent>
      </Card>
    </div>
  );
}
