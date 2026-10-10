import { describe, it, expect } from 'vitest';
import { forecastDaysLeft } from './forecast';
import { SalesHistoryItem, Product } from '../store/types';

describe('forecastDaysLeft', () => {
  const now = new Date('2026-10-10T12:00:00Z');
  
  const dummyProduct: Product = {
    id: 'p1',
    name: 'Test Product',
    price: 10,
    stock: 50,
    category: 'Test'
  };

  const createSale = (daysAgo: number, quantity: number, productId: string = 'p1'): SalesHistoryItem => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - daysAgo);
    return {
      id: Math.random().toString(),
      timestamp: d.toISOString(),
      total: quantity * 10,
      paymentMethod: 'Cash',
      items: [{
        product: { ...dummyProduct, id: productId },
        quantity
      }]
    };
  };

  it('returns N/A when there is no data', () => {
    const result = forecastDaysLeft([], dummyProduct, now);
    expect(result).toEqual({ daysLeft: 'N/A', method: 'none' });
  });

  it('uses flat average when shop history is under 14 days', () => {
    // 5 days of data
    const sales = [
      createSale(4, 5), // Day 1 (age 5 days, so 5 days ago = index 4 if using differenceInCalendarDays, wait. Age=5)
      createSale(2, 5)  // Day 3
    ];
    // Product total = 10 sales over 5 days -> velocity = 2/day
    // Stock = 50 -> daysLeft = 25
    const result = forecastDaysLeft(sales, dummyProduct, now);
    expect(result.method).toBe('flat');
    expect(result.daysLeft).toBe(25);
  });

  it('uses weighted average when shop history is 14+ days', () => {
    // 20 days of data
    const sales = [
      createSale(19, 1, 'p2'), // Old sale to push shop age to 20 days
      // Prior 7 days (days 7-13 ago): 14 items
      createSale(13, 14),
      // Recent 7 days (days 0-6 ago): 7 items
      createSale(6, 7),
    ];
    
    // priorAvg = 14 / 7 = 2
    // recentAvg = 7 / 7 = 1
    // velocity = (1 * 0.7) + (2 * 0.3) = 0.7 + 0.6 = 1.3
    // stock = 50 -> daysLeft = ceil(50 / 1.3) = ceil(38.46) = 39
    const result = forecastDaysLeft(sales, dummyProduct, now);
    expect(result.method).toBe('weighted');
    expect(result.daysLeft).toBe(39);
  });

  it('returns N/A for a product with zero recent sales despite 14+ day shop history', () => {
    const sales = [
      createSale(19, 1, 'p2'), // Shop age 20 days
      createSale(16, 5, 'p1')  // Product sold 16 days ago (outside 14 day window)
    ];
    
    // Product total in 14-day window = 0 -> velocity = 0
    const result = forecastDaysLeft(sales, dummyProduct, now);
    expect(result.method).toBe('weighted');
    expect(result.daysLeft).toBe('N/A');
  });
});
