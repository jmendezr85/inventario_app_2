'use client';

import { ExcelUploader } from '@/components/import/excel-uploader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useInventory } from '@/lib/hooks/use-inventory';

export default function ImportPage() {
  const { loadMasterProducts } = useInventory();

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Importar Productos</CardTitle>
          <CardDescription>
            Sube un archivo .xlsx con las columnas "EAN" y "DESCRIPCION" para
            cargar la base de datos de productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExcelUploader onDataLoaded={loadMasterProducts} />
        </CardContent>
      </Card>
    </div>
  );
}
