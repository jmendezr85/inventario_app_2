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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDown, Trash2, Pencil, Search, X, Warehouse, Boxes, Package } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

export function ReportView() {
  const { activeStore, getReportData, updateInventoryItem, deleteInventoryItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editBodega, setEditBodega] = useState(0);
  const [editMueble, setEditMueble] = useState(0);

  const reportData = useMemo(() => {
    if (!activeStore) return [];
    return getReportData();
  }, [activeStore, getReportData]);
  
  const totals = useMemo(() => {
    return reportData.reduce(
        (acc, item) => {
            acc.bodega += item.bodega;
            acc.mueble += item.mueble;
            acc.total += item.total;
            return acc;
        },
        { bodega: 0, mueble: 0, total: 0 }
    );
  }, [reportData]);

  const filteredData = useMemo(() => {
    return reportData.filter(
      (item) =>
        item.ean.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reportData, searchTerm]);

  const handleExport = () => {
    const dataToExport = filteredData.map(item => ({
        'EAN': item.ean,
        'DESCRIPCION': item.description,
        'Cantidad en BODEGA': item.bodega,
        'Cantidad en MUEBLE': item.mueble,
        'TOTAL': item.total,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    XLSX.writeFile(workbook, `Reporte_${activeStore?.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const startEditing = (item: any) => {
    setEditingItem(item);
    setEditBodega(item.bodega);
    setEditMueble(item.mueble);
  };
  
  const handleSaveChanges = () => {
    if (editingItem) {
      updateInventoryItem(editingItem.ean, 'Bodega', editBodega);
      updateInventoryItem(editingItem.ean, 'Mueble', editMueble);
      setEditingItem(null);
    }
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bodega</CardTitle>
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.bodega}</div>
                  <p className="text-xs text-muted-foreground">unidades</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Mueble</CardTitle>
                  <Boxes className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.mueble}</div>
                   <p className="text-xs text-muted-foreground">unidades</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total General</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totals.total}</div>
                   <p className="text-xs text-muted-foreground">unidades</p>
              </CardContent>
          </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por EAN o descripción..."
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
                <p className="text-xs text-muted-foreground">{item.ean}</p>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-xs text-muted-foreground">Bodega</p>
                    <p className="font-bold">{item.bodega}</p>
                </div>
                 <div>
                    <p className="text-xs text-muted-foreground">Mueble</p>
                    <p className="font-bold">{item.mueble}</p>
                </div>
                 <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold">{item.total}</p>
                </div>
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
                        Esta acción no se puede deshacer. Se eliminará permanentemente el artículo "{item.description}" del inventario.
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
        <ScrollArea className="h-[calc(100vh-25rem)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Bodega</TableHead>
                <TableHead className="text-center">Mueble</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.ean}>
                    <TableCell>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-xs text-muted-foreground">{item.ean}</div>
                    </TableCell>
                    <TableCell className="text-center">{item.bodega}</TableCell>
                    <TableCell className="text-center">{item.mueble}</TableCell>
                    <TableCell className="text-center font-bold">{item.total}</TableCell>
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
                                Esta acción no se puede deshacer. Se eliminará permanentemente el artículo "{item.description}" del inventario.
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
                  <TableCell colSpan={5} className="h-24 text-center">
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
                    <DialogTitle>Editar Cantidades: {editingItem.description}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="bodega-qty" className="w-20">Bodega</label>
                        <Input id="bodega-qty" type="number" value={editBodega} onChange={e => setEditBodega(Math.max(0, parseInt(e.target.value) || 0))} />
                    </div>
                     <div className="flex items-center gap-4">
                        <label htmlFor="mueble-qty" className="w-20">Mueble</label>
                        <Input id="mueble-qty" type="number" value={editMueble} onChange={e => setEditMueble(Math.max(0, parseInt(e.target.value) || 0))} />
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
