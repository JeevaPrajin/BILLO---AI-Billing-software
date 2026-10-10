import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { differenceInDays, subDays } from 'date-fns';

export default function Insights() {
  const { sales, products } = useAppContext();

  const todayTotal = useMemo(() => {
    const today = new Date();
    return sales
      .filter(s => new Date(s.timestamp).toDateString() === today.toDateString())
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const avgBillingTime = useMemo(() => {
    const timedSales = sales.filter(s => s.billingDurationMs !== undefined && s.billingDurationMs > 0);
    if (timedSales.length === 0) return null;
    const sum = timedSales.reduce((acc, s) => acc + s.billingDurationMs!, 0);
    const avgMs = sum / timedSales.length;
    return {
      timeStr: `${Math.round(avgMs / 1000)}s`,
      count: timedSales.length
    };
  }, [sales]);

  const restockPredictions = useMemo(() => {
    const predictions: { name: string; daysLeft: number | 'N/A'; stock: number; icon: string }[] = [];
    const today = new Date();

    products.forEach(p => {
      // Find daily sales for this product
      const dailySales = Array(14).fill(0); // index 0 is today, 1 is yesterday, etc.
      let firstSaleDay = -1;

      sales.forEach(sale => {
        const daysAgo = differenceInDays(today, new Date(sale.timestamp));
        if (daysAgo < 14) {
          const item = sale.items.find(i => i.product.id === p.id);
          if (item) {
            dailySales[daysAgo] += item.quantity;
            if (firstSaleDay === -1 || daysAgo > firstSaleDay) {
              firstSaleDay = daysAgo;
            }
          }
        }
      });

      let velocity = 0;

      if (firstSaleDay === -1) {
        // No sales data
        predictions.push({ name: p.name, daysLeft: 'N/A', stock: p.stock, icon: p.image || '📦' });
        return;
      }

      if (firstSaleDay < 14) {
        // Flat average fallback if less than 14 days of data
        const totalSold = dailySales.reduce((a, b) => a + b, 0);
        velocity = totalSold / (firstSaleDay + 1);
      } else {
        // Weighted average: recent 7 days (70% weight), prior 7 days (30% weight)
        const recentSum = dailySales.slice(0, 7).reduce((a, b) => a + b, 0);
        const priorSum = dailySales.slice(7, 14).reduce((a, b) => a + b, 0);
        const recentAvg = recentSum / 7;
        const priorAvg = priorSum / 7;
        velocity = (recentAvg * 0.7) + (priorAvg * 0.3);
      }

      const daysLeft = velocity > 0 ? Math.round(p.stock / velocity) : 'N/A';
      predictions.push({ name: p.name, daysLeft, stock: p.stock, icon: p.image || '📦' });
    });

    return predictions.sort((a, b) => {
      if (a.daysLeft === 'N/A') return 1;
      if (b.daysLeft === 'N/A') return -1;
      return (a.daysLeft as number) - (b.daysLeft as number);
    });
  }, [sales, products]);

  return (
    <div className="px-screen-margin-mobile pt-space-md pb-32">
      <h2 className="text-headline-sm text-primary mb-space-md">Today's Overview</h2>
      
      <div className="grid grid-cols-2 gap-3 mb-space-lg">
        <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm flex flex-col justify-center">
          <p className="text-label-sm text-on-surface-variant">Sales Total</p>
          <p className="text-headline-lg font-extrabold text-primary">₹{todayTotal}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm flex flex-col justify-center">
          <p className="text-label-sm text-on-surface-variant">Bills Cleared</p>
          <p className="text-headline-lg font-extrabold text-primary">{sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      {avgBillingTime && (
        <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm mb-space-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">timer</span>
            <span className="font-label-lg">Avg. Billing Time</span>
          </div>
          <p className="text-body-sm text-on-surface-variant font-medium">
            {avgBillingTime.timeStr} <span className="opacity-75">(over {avgBillingTime.count} sales)</span>
          </p>
        </div>
      )}

      <h2 className="text-headline-sm text-primary mb-space-sm flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">auto_awesome</span>
        AI Restock Alerts
      </h2>
      <p className="text-body-sm text-on-surface-variant mb-space-md">Based on recent 14-day sales velocity trend.</p>

      <div className="space-y-3">
        {restockPredictions.map((pred, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-xl">
                {pred.icon}
              </div>
              <div>
                <h3 className="font-label-lg text-primary">{pred.name}</h3>
                <p className="text-label-sm text-on-surface-variant">Current stock: {pred.stock}</p>
              </div>
            </div>
            <div className="text-right">
              {pred.daysLeft === 'N/A' ? (
                <span className="text-label-sm text-on-surface-variant">No Data</span>
              ) : (
                <span className={`font-bold px-2 py-1 rounded-md text-label-sm ${
                  (pred.daysLeft as number) <= 2 ? 'bg-error-container text-error' : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                }`}>
                  Runs out in ~{pred.daysLeft}d
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
