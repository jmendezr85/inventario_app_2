'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
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
  getReportData: () => { ean: string, description: string, bodega: number, mueble: number, total: number }[];
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
    setMasterProducts(products);
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
      newInventory[ean] = { Bodega: 0, Mueble: 0 };
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
    if (!newInventory[ean]) return;

    newInventory[ean][location] = quantity;
    setInventory(newInventory);
  };
  
  const deleteInventoryItem = (ean: string) => {
    const inventory = getInventory();
    const newInventory = { ...inventory };
    delete newInventory[ean];
    setInventory(newInventory);
  };

  const getReportData = useCallback(() => {
    const inventory = getInventory();
    return Object.entries(inventory).map(([ean, counts]) => {
      const product = masterProducts.find(p => p.ean === ean);
      return {
        ean,
        description: product?.description || 'Desconocido',
        bodega: counts.Bodega,
        mueble: counts.Mueble,
        total: counts.Bodega + counts.Mueble,
      };
    }).sort((a,b) => b.total - a.total);
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
