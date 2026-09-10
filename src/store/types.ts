export interface ShopSettings {
  shopName: string;
  upiId: string;
  phone?: string;
  address?: string;
  staffMembers?: string[];
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
}
