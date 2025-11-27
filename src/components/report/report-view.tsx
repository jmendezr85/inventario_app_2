'use client';

import { useMemo, useState } from 'react';
import { useInventory } from '@/lib/hooks/use-inventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Trash2, Pencil, Search, X, Warehouse, Boxes, Package, ShieldX, Ban } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import type { Location } from '@/lib/types';


export function ReportView() {
  const { activeStore, getReportData, updateInventoryItem, deleteInventoryItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editCounts, setEditCounts] = useState({
    Bodega: 0,
    Mueble: 0,
    Averias: 0,
    Inactivo: 0
  });


  const reportData = useMemo(() => {
    if (!activeStore) return [];
    return getReportData();
  }, [activeStore, getReportData]);
  
  const totals = useMemo(() => {
    return reportData.reduce(
        (acc, item) => {
            acc.bodega += item.bodega;
            acc.mueble += item.mueble;
            acc.inventario += item.inventario;
            acc.averias += item.averias;
            acc.inactivo += item.inactivo;
            return acc;
        },
        { bodega: 0, mueble: 0, inventario: 0, averias: 0, inactivo: 0 }
    );
  }, [reportData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return reportData;
    return reportData.filter(
      (item) =>
        item.ean.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportData, searchTerm]);

  const handleExport = () => {
    const dataToExport = filteredData.map(item => {
        const upperCaseItem: { [key: string]: any } = {};
        for (const key in item) {
            const value = (item as any)[key];
            upperCaseItem[key.toUpperCase()] = typeof value === 'string' ? value.toUpperCase() : value;
        }
        return {
            'EAN': upperCaseItem['EAN'],
            'MAT': upperCaseItem['MAT'] ?? '',
            'MARCA': upperCaseItem['MARCA'] ?? '',
            'FAMILIA': upperCaseItem['FAMILIA'] ?? '',
            'SUBFAMILIA': upperCaseItem['SUBFAMILIA'] ?? '',
            'DESCRIPCION': upperCaseItem['DESCRIPCION'] ?? '',
            'TIP': upperCaseItem['TIP'] ?? '',
            'BODEGA': upperCaseItem['BODEGA'],
            'MUEBLE': upperCaseItem['MUEBLE'],
            'INVENTARIO': upperCaseItem['INVENTARIO'],
            'INACTIVO': upperCaseItem['INACTIVO'],
            'AVERIAS': upperCaseItem['AVERIAS'],
        };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    XLSX.writeFile(workbook, `Reporte_${activeStore?.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const startEditing = (item: any) => {
    setEditingItem(item);
    setEditCounts({
        Bodega: item.bodega,
        Mueble: item.mueble,
        Averias: item.averias,
        Inactivo: item.inactivo
    });
  };
  
  const handleSaveChanges = () => {
    if (editingItem) {
      updateInventoryItem(editingItem.ean, 'Bodega', editCounts.Bodega);
      updateInventoryItem(editingItem.ean, 'Mueble', editCounts.Mueble);
      updateInventoryItem(editingItem.ean, 'Averias', editCounts.Averias);
      updateInventoryItem(editingItem.ean, 'Inactivo', editCounts.Inactivo);
      setEditingItem(null);
    }
  };

  const handleEditCountChange = (location: Location, value: string) => {
    setEditCounts(prev => ({ ...prev, [location]: Math.max(0, parseInt(value) || 0) }));
  }

  if (!activeStore) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <Card>
            <CardContent className="p-6">
                <p className="text-lg">Selecciona un almacén para ver el reporte.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-blue-100 text-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bodega</CardTitle>
                  <Warehouse className="h-4 w-4 text-blue-700" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.bodega}</div>
                  <p className="text-xs text-blue-600">unidades</p>
              </CardContent>
          </Card>
          <Card className="bg-green-100 text-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mueble</CardTitle>
                  <Boxes className="h-4 w-4 text-green-700" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.mueble}</div>
                   <p className="text-xs text-green-600">unidades</p>
              </CardContent>
          </Card>
           <Card className="bg-red-100 text-red-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Averías</CardTitle>
                  <ShieldX className="h-4 w-4 text-red-700" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.averias}</div>
                   <p className="text-xs text-red-600">unidades</p>
              </CardContent>
          </Card>
           <Card className="bg-yellow-100 text-yellow-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inactivo</CardTitle>
                  <Ban className="h-4 w-4 text-yellow-700" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.inactivo}</div>
                   <p className="text-xs text-yellow-600">unidades</p>
              </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inventario</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.inventario}</div>
                   <p className="text-xs text-muted-foreground">Bodega + Mueble</p>
              </CardContent>
          </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por EAN, descripción, marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && <X onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />}
        </div>
        <Button onClick={handleExport} disabled={filteredData.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <Card key={item.ean}>
              <CardHeader className="p-4">
                <CardTitle className="text-base">{item.description}</CardTitle>
                <p className="text-xs text-muted-foreground">{item.ean} - {item.marca}</p>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Bodega:</span> <span className="font-bold">{item.bodega}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mueble:</span> <span className="font-bold">{item.mueble}</span></div>
                <div className="flex justify-between col-span-2 text-base"><span className="text-muted-foreground">Inventario:</span> <span className="font-bold">{item.inventario}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Averías:</span> <span className="font-bold">{item.averias}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Inactivo:</span> <span className="font-bold">{item.inactivo}</span></div>
              </CardContent>
              <CardFooter className="p-2 flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEditing(item)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el artículo "{item.description}" del inventario de este almacén.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteInventoryItem(item.ean)}>
                        Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        ) : (
             <Card>
                <CardContent className="h-24 flex items-center justify-center">
                    <p className="text-muted-foreground">No se encontraron resultados.</p>
                </CardContent>
             </Card>
        )}
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block">
        <ScrollArea className="h-[calc(100vh-27rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Bodega</TableHead>
                <TableHead className="text-center">Mueble</TableHead>
                <TableHead className="text-center">Inventario</TableHead>
                <TableHead className="text-center">Averías</TableHead>
                <TableHead className="text-center">Inactivo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.ean}>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-xs text-muted-foreground">{item.ean} - {item.marca}</div>
                    </TableCell>
                    <TableCell className="text-center">{item.bodega}</TableCell>
                    <TableCell className="text-center">{item.mueble}</TableCell>
                    <TableCell className="text-center font-bold">{item.inventario}</TableCell>
                    <TableCell className="text-center">{item.averias}</TableCell>
                    <TableCell className="text-center">{item.inactivo}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => startEditing(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el artículo "{item.description}" del inventario de este almacén.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteInventoryItem(item.ean)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
      
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Cantidades</DialogTitle>
                    <DialogDescription>{editingItem.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="bodega-qty" className="w-24 text-right">Bodega</label>
                        <Input id="bodega-qty" type="number" value={editCounts.Bodega} onChange={e => handleEditCountChange('Bodega', e.target.value)} />
                    </div>
                     <div className="flex items-center gap-4">
                        <label htmlFor="mueble-qty" className="w-24 text-right">Mueble</label>
                        <Input id="mueble-qty" type="number" value={editCounts.Mueble} onChange={e => handleEditCountChange('Mueble', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="averias-qty" className="w-24 text-right">Averías</label>
                        <Input id="averias-qty" type="number" value={editCounts.Averias} onChange={e => handleEditCountChange('Averias', e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="inactivo-qty" className="w-24 text-right">Inactivo</label>
                        <Input id="inactivo-qty" type="number" value={editCounts.Inactivo} onChange={e => handleEditCountChange('Inactivo', e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
