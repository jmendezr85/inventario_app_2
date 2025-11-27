export interface Store {
  id: string;
  name: string;
  color: string;
}

export interface Product {
  ean: string;
  mat?: string;
  marca?: string;
  familia?: string;
  subfamilia?: string;
  description: string;
  tip?: string;
}

export type Location = 'Bodega' | 'Mueble' | 'Averias' | 'Inactivo';

export interface InventoryItem {
  ean: string;
  quantity: number;
  location: Location;
}

export interface RecentScan extends InventoryItem {
  id: string;
  description: string;
}

export interface InventoryState {
  [ean: string]: {
    Bodega: number;
    Mueble: number;
    Averias: number;
    Inactivo: number;
  };
}
