'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type {
  Store,
  Product,
  InventoryItem,
  RecentScan,
  Location,
  InventoryState,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type ReportDataItem = {
  ean: string;
  mat?: string;
  marca?: string;
  familia?: string;
  subfamilia?: string;
  description: string;
  tip?: string;
  bodega: number;
  mueble: number;
  inventario: number;
  inactivo: number;
  averias: number;
};

interface InventoryContextType {
  stores: Store[];
  activeStore: Store | null;
  addStore: (storeName: string) => void;
  selectStore: (storeId: string) => void;
  deleteStore: (storeId: string) => void;
  masterProducts: Product[];
  loadMasterProducts: (products: Product[]) => void;
  addProduct: (product: Product) => boolean;
  scanItem: (ean: string, location: Location) => RecentScan | null;
  recentScans: RecentScan[];
  clearRecentScans: () => void;
  getReportData: () => ReportDataItem[];
  updateInventoryItem: (ean: string, location: Location, quantity: number) => void;
  deleteInventoryItem: (ean: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const STORE_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'
];

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useLocalStorage<Store[]>('stores', []);
  const [activeStoreId, setActiveStoreId] = useLocalStorage<string | null>('activeStoreId', null);
  const [masterProducts, setMasterProducts] = useLocalStorage<Product[]>('masterProducts', []);
  const [inventories, setInventories] = useLocalStorage<{ [storeId: string]: InventoryState }>('inventories', {});
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const { toast } = useToast();

  const activeStore = stores.find((s) => s.id === activeStoreId) || null;
  
  const addStore = (storeName: string) => {
    const newStore: Store = {
        id: Date.now().toString(),
        name: storeName,
        color: STORE_COLORS[stores.length % STORE_COLORS.length] || 'bg-gray-500',
    };
    setStores([...stores, newStore]);
    if (!activeStoreId) {
      setActiveStoreId(newStore.id);
    }
  };

  const selectStore = (storeId: string) => {
    setActiveStoreId(storeId);
    setRecentScans([]); // Clear recent scans when changing store
  };

  const deleteStore = (storeId: string) => {
    if (activeStoreId === storeId) {
      setActiveStoreId(null);
    }
    
    setStores(stores.filter(s => s.id !== storeId));

    const newInventories = { ...inventories };
    delete newInventories[storeId];
    setInventories(newInventories);
  };

  const loadMasterProducts = (products: Product[]) => {
    // When loading new master products, preserve existing inventory counts
    // but update product details.
    const productMap = new Map(products.map(p => [p.ean, p]));
    setMasterProducts(Array.from(productMap.values()));
  };

  const addProduct = (product: Product): boolean => {
    // Check if product with same EAN already exists
    if (masterProducts.some(p => p.ean === product.ean)) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Ya existe un producto con este código EAN.',
        });
        return false;
    }
    setMasterProducts([...masterProducts, product]);
    toast({
        title: 'Producto Agregado',
        description: `El producto "${product.description}" ha sido agregado.`,
    });
    return true;
  };
  
  const getInventory = useCallback(() => {
    return activeStoreId ? inventories[activeStoreId] || {} : {};
  }, [inventories, activeStoreId]);

  const setInventory = useCallback((newInventory: InventoryState) => {
    if (activeStoreId) {
      setInventories({
        ...inventories,
        [activeStoreId]: newInventory,
      });
    }
  }, [inventories, activeStoreId, setInventories]);

  const scanItem = (ean: string, location: Location) => {
    const product = masterProducts.find((p) => p.ean === ean);
    
    if (!product) {
      toast({
        variant: 'destructive',
        title: 'Producto Desconocido',
        description: `El EAN "${ean}" no se encontró en la base de datos.`,
      });
      return null;
    }
    
    const inventory = getInventory();
    const description = product.description;
    
    const newInventory = { ...inventory };
    if (!newInventory[ean]) {
      newInventory[ean] = { Bodega: 0, Mueble: 0, Averias: 0, Inactivo: 0 };
    }
    newInventory[ean][location] += 1;
    
    setInventory(newInventory);

    const newScan: RecentScan = {
      id: `${Date.now()}-${ean}`,
      ean,
      description,
      location,
      quantity: newInventory[ean][location],
    };

    setRecentScans([newScan, ...recentScans.slice(0, 9)]);
    
    toast({
        title: `+1 ${description}`,
        description: `Total en ${location}: ${newInventory[ean][location]}`,
    });

    return newScan;
  };

  const clearRecentScans = () => {
    setRecentScans([]);
    toast({
        title: 'Historial borrado',
        description: 'Se han eliminado los escaneos recientes.',
    });
  };
  
  const updateInventoryItem = (ean: string, location: Location, quantity: number) => {
    const inventory = getInventory();
    const newInventory = { ...inventory };
    if (!newInventory[ean]) {
      newInventory[ean] = { Bodega: 0, Mueble: 0, Averias: 0, Inactivo: 0 };
    };

    newInventory[ean][location] = quantity;
    setInventory(newInventory);
  };
  
  const deleteInventoryItem = (ean: string) => {
    const inventory = getInventory();
    const newInventory = { ...inventory };
    delete newInventory[ean];
    setInventory(newInventory);
  };

  const getReportData = useCallback((): ReportDataItem[] => {
    const inventory = getInventory();
    
    const allScannedEans = Object.keys(inventory);
    const allEans = new Set([...masterProducts.map(p => p.ean), ...allScannedEans]);

    const data: ReportDataItem[] = Array.from(allEans).map(ean => {
      const product = masterProducts.find(p => p.ean === ean);
      const counts = inventory[ean] || { Bodega: 0, Mueble: 0, Averias: 0, Inactivo: 0 };
      
      return {
        ean: ean,
        mat: product?.mat,
        marca: product?.marca,
        familia: product?.familia,
        subfamilia: product?.subfamilia,
        description: product?.description || 'Producto no encontrado',
        tip: product?.tip,
        bodega: counts.Bodega,
        mueble: counts.Mueble,
        inventario: counts.Bodega + counts.Mueble,
        inactivo: counts.Inactivo,
        averias: counts.Averias,
      };
    });

    const brandOrder = ['SMART', 'NAILEN', 'SP PRO'];

    return data.sort((a, b) => {
      const brandA = a.marca?.toUpperCase() || '';
      const brandB = b.marca?.toUpperCase() || '';
      const indexA = brandOrder.indexOf(brandA);
      const indexB = brandOrder.indexOf(brandB);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return brandA.localeCompare(brandB);
    });
  }, [getInventory, masterProducts]);

  const value = {
    stores,
    activeStore,
    addStore,
    selectStore,
    deleteStore,
    masterProducts,
    loadMasterProducts,
    addProduct,
    scanItem,
    recentScans,
    clearRecentScans,
    getReportData,
    updateInventoryItem,
    deleteInventoryItem,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
