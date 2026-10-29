export type Language = 'en' | 'ta' | 'hi';

export interface ShopSettings {
  shopName: string;
  upiId: string;
  phone?: string;
  address?: string;
  staffMembers?: string[];
  benchmarkMode?: boolean;
  language?: Language;
  logo?: string;
  accentColor?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string; // Icon or emoji for simplicity
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  lastTransactionDate: string;
}

export interface SalesHistoryItem {
  id: string;
  timestamp: string;
  total: number;
  items: CartItem[];
  paymentMethod: 'UPI' | 'Cash' | 'Credit';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  staffName?: string;
  billNumber?: string;
  billingDurationMs?: number;
  itemCount?: number;
  msFirstTapToPayScreen?: number;
  msFirstTapToSaved?: number;
}
