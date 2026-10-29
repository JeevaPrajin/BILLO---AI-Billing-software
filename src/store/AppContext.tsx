import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ShopSettings, Product, Customer, SalesHistoryItem, CartItem } from './types';
import { settingsDB, productsDB, customersDB, salesDB, defaultSettings } from './db';

interface AppState {
  settings: ShopSettings;
  products: Product[];
  customers: Customer[];
  sales: SalesHistoryItem[];
  cart: CartItem[];
  
  // Actions
  updateSettings: (s: Partial<ShopSettings>) => Promise<void>;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCustomer: (c: Customer) => Promise<void>;
  updateCustomer: (c: Customer) => Promise<void>;
  addSale: (s: SalesHistoryItem) => Promise<void>;
  
  // Cart Actions
  addToCart: (p: Product) => void;
  removeFromCart: (p: Product) => void;
  clearCart: () => void;
  
  // Seeding
  seedProducts: (products: Product[]) => Promise<void>;
  
  // Session
  activeStaff: string;
  updateActiveStaff: (name: string) => void;

  billingStartTime: number | null;
  setBillingStartTime: (time: number | null) => void;
  billingPayScreenTime: number | null;
  setBillingPayScreenTime: (time: number | null) => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<SalesHistoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeStaff, setActiveStaff] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [billingStartTime, setBillingStartTime] = useState<number | null>(null);
  const [billingPayScreenTime, setBillingPayScreenTime] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedSettings = await settingsDB.getItem<ShopSettings>('shopSettings');
      if (storedSettings) setSettings({ ...defaultSettings, ...storedSettings });
      
      const savedStaff = localStorage.getItem('activeStaff');
      if (savedStaff) setActiveStaff(savedStaff);

      const p: Product[] = [];
      await productsDB.iterate<Product, void>((value) => { p.push(value); });
      setProducts(p);

      const c: Customer[] = [];
      await customersDB.iterate<Customer, void>((value) => { c.push(value); });
      setCustomers(c);

      const s: SalesHistoryItem[] = [];
      await salesDB.iterate<SalesHistoryItem, void>((value) => { s.push(value); });
      setSales(s.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--billo-accent', settings.accentColor);
      const hex = settings.accentColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      const textColor = yiq >= 160 ? '#1e293b' : '#ffffff';
      document.documentElement.style.setProperty('--billo-accent-text', textColor);
    } else {
      document.documentElement.style.removeProperty('--billo-accent');
      document.documentElement.style.removeProperty('--billo-accent-text');
    }
  }, [settings.accentColor]);

  const updateSettings = async (s: Partial<ShopSettings>) => {
    const newSettings = { ...settings, ...s };
    await settingsDB.setItem('shopSettings', newSettings);
    setSettings(newSettings);
  };

  const addProduct = async (p: Product) => {
    await productsDB.setItem(p.id, p);
    setProducts(prev => [...prev, p]);
  };

  const updateProduct = async (p: Product) => {
    await productsDB.setItem(p.id, p);
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
  };

  const deleteProduct = async (id: string) => {
    await productsDB.removeItem(id);
    setProducts(prev => prev.filter(item => item.id !== id));
  };

  const seedProducts = async (newProducts: Product[]) => {
    for (const p of newProducts) {
      await productsDB.setItem(p.id, p);
    }
    const pList: Product[] = [];
    await productsDB.iterate<Product, void>((value) => { pList.push(value); });
    setProducts(pList);
  };

  const addCustomer = async (c: Customer) => {
    await customersDB.setItem(c.id, c);
    setCustomers(prev => [...prev, c]);
  };

  const updateCustomer = async (c: Customer) => {
    await customersDB.setItem(c.id, c);
    setCustomers(prev => prev.map(item => item.id === c.id ? c : item));
  };

  const addSale = async (s: SalesHistoryItem) => {
    await salesDB.setItem(s.id, s);
    setSales(prev => [s, ...prev]);
  };

  const addToCart = (p: Product) => {
    setCart(prev => {
      if (prev.length === 0) setBillingStartTime(Date.now());
      const existing = prev.find(i => i.product.id === p.id);
      if (existing) {
        return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const removeFromCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === p.id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.product.id !== p.id);
    });
  };

  const clearCart = () => {
    setCart([]);
    setBillingStartTime(null);
    setBillingPayScreenTime(null);
  };

  const updateActiveStaff = (name: string) => {
    setActiveStaff(name);
    localStorage.setItem('activeStaff', name);
  };

  if (loading) return null; // Or a loading spinner

  return (
    <AppContext.Provider value={{
      settings, products, customers, sales, cart, activeStaff,
      updateSettings, addProduct, updateProduct, deleteProduct, seedProducts,
      addCustomer, updateCustomer, addSale,
      addToCart, removeFromCart, clearCart, updateActiveStaff,
      billingStartTime, setBillingStartTime,
      billingPayScreenTime, setBillingPayScreenTime
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
