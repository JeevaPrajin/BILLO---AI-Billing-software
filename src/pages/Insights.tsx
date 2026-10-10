import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { differenceInDays, subDays } from 'date-fns';
import { forecastDaysLeft } from '../lib/forecast';

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
    const now = new Date();
    const predictions = products.map(p => {
      const forecast = forecastDaysLeft(sales, p, now);
      return {
        name: p.name,
        stock: p.stock,
        icon: p.image || '📦',
        daysLeft: forecast.daysLeft,
        method: forecast.method
      };
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
            <div className="text-right flex flex-col items-end gap-1">
              {pred.daysLeft === 'N/A' ? (
                <span className="text-label-sm text-on-surface-variant">No Data</span>
              ) : (
                <span className={`font-bold px-2 py-1 rounded-md text-label-sm ${
                  (pred.daysLeft as number) <= 2 ? 'bg-error-container text-error' : 
                  (pred.daysLeft as number) <= 5 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-secondary-fixed text-on-secondary-fixed-variant'
                }`}>
                  Runs out in ~{pred.daysLeft}d
                </span>
              )}
              {pred.method === 'flat' && pred.daysLeft !== 'N/A' && (
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Early estimate</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
