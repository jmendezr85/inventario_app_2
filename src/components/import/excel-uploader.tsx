'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { Upload } from 'lucide-react';

interface ExcelUploaderProps {
  onDataLoaded: (products: Product[]) => void;
}

export function ExcelUploader({ onDataLoaded }: ExcelUploaderProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null }) as (string | null)[][];

          if (json.length === 0) {
            throw new Error('El archivo Excel está vacío.');
          }
          
          const header = json[0].map(h => String(h || '').toUpperCase().trim());
          
          const findIndex = (aliases: string[]) => {
            for (const alias of aliases) {
              const index = header.findIndex(h => h.includes(alias.toUpperCase()));
              if (index !== -1) return index;
            }
            return -1;
          };

          const eanIndex = findIndex(['EAN']);
          const descIndex = findIndex(['DESCRIPCION']);
          const matIndex = findIndex(['MAT']);
          const marcaIndex = findIndex(['MARCA']);
          const familiaIndex = findIndex(['FAMILIA']);
          const subfamiliaIndex = findIndex(['SUBFAMILIA']);
          const tipIndex = findIndex(['TIP']);

          if (eanIndex === -1 || descIndex === -1) {
            throw new Error('El archivo debe contener al menos las columnas "EAN" y "DESCRIPCION".');
          }

          const products: Product[] = json.slice(1).map((row) => {
            const ean = row[eanIndex] ? String(row[eanIndex]).trim() : null;
            if (!ean) {
                return null;
            }
            return {
              ean: ean,
              description: String(row[descIndex] || 'Sin descripción').trim(),
              mat: row[matIndex] ? String(row[matIndex]).trim() : undefined,
              marca: row[marcaIndex] ? String(row[marcaIndex]).trim() : undefined,
              familia: row[familiaIndex] ? String(row[familiaIndex]).trim() : undefined,
              subfamilia: row[subfamiliaIndex] ? String(row[subfamiliaIndex]).trim() : undefined,
              tip: row[tipIndex] ? String(row[tipIndex]).trim() : undefined,
            }
          }).filter((p): p is Product => p !== null);

          onDataLoaded(products);
          toast({
            title: 'Éxito',
            description: `${products.length} productos importados correctamente.`,
          });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Error de importación',
            description: error.message || 'No se pudo procesar el archivo.',
          });
        } finally {
          setLoading(false);
          // Reset file input
          event.target.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center">
      <Upload className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">
        Arrastra un archivo aquí o haz clic para seleccionar.
      </p>
      <Button asChild variant="outline">
        <label htmlFor="file-upload">
          {loading ? 'Procesando...' : 'Seleccionar Archivo'}
        </label>
      </Button>
      <Input
        id="file-upload"
        type="file"
        className="hidden"
        accept=".xlsx"
        onChange={handleFileChange}
        disabled={loading}
      />
    </div>
  );
}
