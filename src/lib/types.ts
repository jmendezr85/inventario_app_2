export interface Store {
  id: string;
  name: string;
}

export interface Product {
  ean: string;
  description: string;
}

export type Location = 'Bodega' | 'Mueble';

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
  };
}
