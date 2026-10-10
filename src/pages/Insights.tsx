import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { differenceInDays, subDays, isToday, isThisWeek, isThisMonth, isSameDay, format } from 'date-fns';
import { forecastDaysLeft } from '../lib/forecast';

type TimeRange = 'today' | 'week' | 'month';

export default function Insights() {
  const { sales, products } = useAppContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.timestamp);
      if (timeRange === 'today') return isToday(d);
      if (timeRange === 'week') return isThisWeek(d, { weekStartsOn: 1 });
      if (timeRange === 'month') return isThisMonth(d);
      return true;
    });
  }, [sales, timeRange]);

  const { totalSales, billCount, avgBill } = useMemo(() => {
    const total = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const count = filteredSales.length;
    return {
      totalSales: total,
      billCount: count,
      avgBill: count > 0 ? Math.round(total / count) : 0
    };
  }, [filteredSales]);

  const chartData = useMemo(() => {
    const today = new Date();
    // 7 days ending today, from oldest to newest (i.e. 6 days ago to today)
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dayTotal = sales
        .filter(s => isSameDay(new Date(s.timestamp), date))
        .reduce((sum, s) => sum + s.total, 0);
      return {
        label: format(date, 'EEE'), // e.g. Mon, Tue
        total: dayTotal
      };
    });
  }, [sales]);

  const maxChartValue = Math.max(...chartData.map(d => d.total), 1);

  const topProducts = useMemo(() => {
    const revenueMap: Record<string, { name: string; revenue: number; quantity: number }> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!revenueMap[item.product.id]) {
          revenueMap[item.product.id] = { name: item.product.name, revenue: 0, quantity: 0 };
        }
        revenueMap[item.product.id].revenue += (item.quantity * item.product.price);
        revenueMap[item.product.id].quantity += item.quantity;
      });
    });
    return Object.values(revenueMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

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
      <div className="flex justify-between items-center mb-space-md">
        <h2 className="text-headline-sm text-primary">Sales Overview</h2>
      </div>
      
      {/* Time Range Toggle */}
      <div className="flex bg-surface-container-low p-1 rounded-xl mb-space-md">
        {(['today', 'week', 'month'] as TimeRange[]).map(t => (
          <button
            key={t}
            onClick={() => setTimeRange(t)}
            className={`flex-1 py-2 text-label-md rounded-lg capitalize transition-colors ${
              timeRange === t ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm flex flex-col justify-center">
          <p className="text-label-sm text-on-surface-variant">Sales Total</p>
          <p className="text-headline-lg font-extrabold text-primary">₹{totalSales}</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm flex flex-col justify-center flex-1">
            <p className="text-label-sm text-on-surface-variant">Bills Cleared</p>
            <p className="text-headline-sm font-extrabold text-primary">{billCount}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm flex flex-col justify-center flex-1">
            <p className="text-label-sm text-on-surface-variant">Avg. Bill</p>
            <p className="text-headline-sm font-extrabold text-primary">₹{avgBill}</p>
          </div>
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

      {/* 7-Day Chart */}
      <h2 className="text-headline-sm text-primary mb-space-sm">Last 7 Days</h2>
      <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm mb-space-lg flex items-end justify-between h-48 gap-2">
        {chartData.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 gap-2 h-full justify-end">
            <div className="w-full bg-surface-container rounded-t-sm flex items-end justify-center h-32 relative">
               <div
                 className="w-full bg-primary rounded-t-sm transition-all duration-500 max-h-full"
                 style={{ height: `${(d.total / maxChartValue) * 100}%` }}
               ></div>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase">{d.label}</span>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <h2 className="text-headline-sm text-primary mb-space-sm">Top 5 Products</h2>
      <div className="bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant shadow-sm mb-space-lg">
        {topProducts.length > 0 ? (
          <div className="flex flex-col divide-y divide-outline-variant">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center">
                <span className="text-label-md text-primary truncate pr-2">{idx + 1}. {p.name}</span>
                <div className="text-right flex flex-col">
                  <span className="text-label-md font-bold text-primary">₹{p.revenue}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase">{p.quantity} sold</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant text-center py-4">No sales in this period.</p>
        )}
      </div>

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
