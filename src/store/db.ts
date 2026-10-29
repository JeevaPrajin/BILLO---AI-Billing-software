import localforage from 'localforage';
import { ShopSettings, Product, Customer, SalesHistoryItem } from './types';

export const settingsDB = localforage.createInstance({ name: 'billo', storeName: 'settings' });
export const productsDB = localforage.createInstance({ name: 'billo', storeName: 'products' });
export const customersDB = localforage.createInstance({ name: 'billo', storeName: 'customers' });
export const salesDB = localforage.createInstance({ name: 'billo', storeName: 'sales' });

export const defaultSettings: ShopSettings = {
  shopName: '',
  upiId: '',
  phone: '',
  address: '',
  staffMembers: [],
  language: 'en',
  logo: undefined,
  accentColor: undefined
};
