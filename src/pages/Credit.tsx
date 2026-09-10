import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Customer } from '../store/types';

export default function Credit() {
  const { customers, addCustomer, updateCustomer, sales } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', due: 0 });

  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const totalCredit = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const handleSaveCustomer = async () => {
    if (!newCust.name) return;
    await addCustomer({
      id: Date.now().toString(),
      name: newCust.name,
      phone: newCust.phone,
      outstandingBalance: Number(newCust.due),
      lastTransactionDate: new Date().toISOString(),
    });
    setIsAdding(false);
    setNewCust({ name: '', phone: '', due: 0 });
  };

  const handlePayment = async (c: Customer) => {
    const amountStr = prompt(`Enter payment amount received from ${c.name}:`);
    const amount = Number(amountStr);
    if (amount > 0) {
      await updateCustomer({
        ...c,
        outstandingBalance: Math.max(0, c.outstandingBalance - amount),
        lastTransactionDate: new Date().toISOString()
      });
    }
  };

  return (
    <div className="px-screen-margin-mobile pt-space-md pb-32">
      <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm mb-space-lg text-center">
        <p className="text-label-md text-on-surface-variant">Total Outstanding Credit</p>
        <p className="text-display-currency-sm text-error font-extrabold mt-1">₹{totalCredit}</p>
      </div>

      <div className="flex justify-between items-center mb-space-md">
        <h2 className="text-headline-sm text-primary">Credit Ledger</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary-container text-on-primary px-3 py-1.5 rounded-lg text-label-sm font-bold flex items-center gap-1 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          New
        </button>
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-secondary-container mb-space-md shadow-sm">
          <input 
            type="text" placeholder="Customer Name" 
            value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})}
            className="w-full mb-2 p-2 border border-outline-variant rounded bg-surface-container-low" 
          />
          <div className="flex gap-2 mb-3">
            <input 
              type="tel" placeholder="Phone" 
              value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})}
              className="w-1/2 p-2 border border-outline-variant rounded bg-surface-container-low" 
            />
            <input 
              type="number" placeholder="Due Amount" 
              value={newCust.due || ''} onChange={e => setNewCust({...newCust, due: Number(e.target.value)})}
              className="w-1/2 p-2 border border-outline-variant rounded bg-surface-container-low" 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveCustomer} className="flex-1 bg-secondary-container text-on-secondary-fixed py-2 rounded font-bold">Add</button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-surface-container-high text-primary py-2 rounded font-bold border border-outline-variant">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-space-sm">
        {[...customers].sort((a, b) => {
          if (a.outstandingBalance > 0 && b.outstandingBalance > 0) return b.outstandingBalance - a.outstandingBalance;
          if (a.outstandingBalance > 0 && b.outstandingBalance === 0) return -1;
          if (b.outstandingBalance > 0 && a.outstandingBalance === 0) return 1;
          return new Date(b.lastTransactionDate).getTime() - new Date(a.lastTransactionDate).getTime();
        }).map(c => {
          const isSettled = c.outstandingBalance <= 0;
          const customerSales = sales.filter(s => s.customerId === c.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          const lifetimeSpend = customerSales.reduce((sum, s) => sum + s.total, 0);
          const isExpanded = expandedCustomerId === c.id;

          return (
            <div 
              key={c.id} 
              className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant shadow-sm flex flex-col gap-3 transition-all cursor-pointer select-none"
              onClick={() => setExpandedCustomerId(isExpanded ? null : c.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-lg">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-primary">{c.name}</h3>
                    <p className="text-label-sm text-on-surface-variant">Last active: {new Date(c.lastTransactionDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    {isSettled ? (
                      <>
                        <p className="text-label-sm text-on-surface-variant">Total Spent</p>
                        <p className="font-headline-sm text-on-surface">₹{lifetimeSpend}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-label-sm text-on-surface-variant">Due</p>
                        <p className="font-headline-sm text-error">₹{c.outstandingBalance}</p>
                      </>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>
              </div>
              
              {!isSettled && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePayment(c); }}
                  className="w-full bg-surface-container-low text-primary border border-outline-variant rounded-lg py-2 font-label-md active:scale-95 transition-transform"
                >
                  Record Payment
                </button>
              )}

              {isExpanded && (
                <div 
                  className="border-t border-outline-variant pt-3 mt-1 flex flex-col gap-3 cursor-default" 
                  onClick={e => e.stopPropagation()}
                >
                  <div className="text-label-sm text-on-surface-variant">
                    <span className="mr-2">Phone:</span>
                    <span className="text-on-surface font-body-md">{c.phone || 'N/A'}</span>
                  </div>
                  
                  <h4 className="font-label-md text-primary mt-2">Order History</h4>
                  
                  {customerSales.length === 0 ? (
                    <p className="text-body-sm text-on-surface-variant italic">No order history available</p>
                  ) : (
                    <div className="space-y-3">
                      {customerSales.map(sale => (
                        <div key={sale.id} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant text-sm">
                           <div className="flex justify-between items-start mb-2 border-b border-outline-variant pb-2">
                              <div>
                                <p className="font-bold text-on-surface">{sale.billNumber || 'Unknown Bill'}</p>
                                <p className="text-xs text-on-surface-variant">{new Date(sale.timestamp).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-primary">₹{sale.total}</p>
                                <p className="text-[10px] uppercase bg-secondary-container text-on-secondary-fixed px-1.5 py-0.5 rounded inline-block mt-1">{sale.paymentMethod}</p>
                              </div>
                           </div>
                           
                           <div className="mb-2">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-on-surface-variant py-0.5">
                                  <span>{item.quantity}x {item.product.name}</span>
                                  <span>₹{(item.quantity * item.product.price).toFixed(2)}</span>
                                </div>
                              ))}
                           </div>

                           {sale.staffName && (
                             <p className="text-xs text-on-surface-variant border-t border-outline-variant pt-2 mt-1">
                               Processed by: <span className="font-medium text-on-surface">{sale.staffName}</span>
                             </p>
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
