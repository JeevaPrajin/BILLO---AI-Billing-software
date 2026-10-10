import { differenceInCalendarDays } from 'date-fns';
import { SalesHistoryItem, Product } from '../store/types';

export type ForecastMethod = 'weighted' | 'flat' | 'none';

export interface ForecastResult {
  daysLeft: number | 'N/A';
  method: ForecastMethod;
}

export function forecastDaysLeft(
  sales: SalesHistoryItem[],
  product: Product,
  now: Date
): ForecastResult {
  if (sales.length === 0) {
    return { daysLeft: 'N/A', method: 'none' };
  }

  // Calculate shop age in calendar days
  const shopEarliest = sales.reduce(
    (min, s) => Math.min(min, new Date(s.timestamp).getTime()),
    now.getTime()
  );
  const shopAgeDays = differenceInCalendarDays(now, new Date(shopEarliest)) + 1;

  // Filter sales for this product
  let productEarliest = now.getTime();
  let hasProductSales = false;
  let totalProductSales = 0;

  const dailySales = Array(14).fill(0);

  sales.forEach((sale) => {
    const item = sale.items.find((i) => i.product.id === product.id);
    if (item) {
      hasProductSales = true;
      const saleTime = new Date(sale.timestamp).getTime();
      if (saleTime < productEarliest) {
        productEarliest = saleTime;
      }
      totalProductSales += item.quantity;

      const daysAgo = differenceInCalendarDays(now, new Date(sale.timestamp));
      if (daysAgo >= 0 && daysAgo < 14) {
        dailySales[daysAgo] += item.quantity;
      }
    }
  });

  if (!hasProductSales) {
    return { daysLeft: 'N/A', method: 'none' };
  }

  let velocity = 0;
  let method: ForecastMethod = 'flat';

  if (shopAgeDays < 14) {
    // Flat average over the days since this product's first sale
    const productAgeDays = differenceInCalendarDays(now, new Date(productEarliest)) + 1;
    velocity = totalProductSales / Math.max(1, productAgeDays);
    method = 'flat';
  } else {
    // Weighted average
    const recentSum = dailySales.slice(0, 7).reduce((a, b) => a + b, 0);
    const priorSum = dailySales.slice(7, 14).reduce((a, b) => a + b, 0);
    
    const recentAvg = recentSum / 7;
    const priorAvg = priorSum / 7;
    
    velocity = (recentAvg * 0.7) + (priorAvg * 0.3);
    method = 'weighted';
  }

  if (velocity <= 0) {
    return { daysLeft: 'N/A', method };
  }

  const daysLeft = Math.ceil(product.stock / velocity);
  return { daysLeft, method };
}
