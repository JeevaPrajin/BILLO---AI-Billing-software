import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { settingsDB, productsDB, customersDB, salesDB } from '../store/db';

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, sales } = useAppContext();
  const [shopName, setShopName] = useState(settings.shopName);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [staffMembers, setStaffMembers] = useState<string[]>(settings.staffMembers || []);
  const [newStaff, setNewStaff] = useState('');

  const handleReset = async () => {
    if (window.confirm("Are you absolute sure you want to erase all data? This cannot be undone.")) {
      await settingsDB.clear();
      await productsDB.clear();
      await customersDB.clear();
      await salesDB.clear();
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    const exportData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      settings: await settingsDB.getItem('shopSettings'),
      products: [] as any[],
      customers: [] as any[],
      sales: [] as any[],
    };
    await productsDB.iterate((value) => { exportData.products.push(value); });
    await customersDB.iterate((value) => { exportData.customers.push(value); });
    await salesDB.iterate((value) => { exportData.sales.push(value); });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billo_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const salesData: any[] = [];
    await salesDB.iterate((value) => { salesData.push(value); });
    
    const headers = ["Date", "Bill Number", "Customer Name", "Customer Phone", "Payment Method", "Total", "Items", "Staff Name"];
    const rows = salesData.map(sale => {
      const date = new Date(sale.timestamp).toLocaleString().replace(/,/g, '');
      const items = sale.items.map((i: any) => `${i.quantity}x ${i.product.name}`).join('; ');
      return [
        date,
        sale.billNumber || '',
        sale.customerName || '',
        sale.customerPhone || '',
        sale.paymentMethod,
        sale.total,
        `"${items}"`,
        sale.staffName || ''
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billo_sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // 1. Validate Structure
        if (!data || typeof data !== 'object') throw new Error("Invalid backup: Not a JSON object");
        
        // Ensure either schemaVersion is 1 or at least one recognized top-level key exists
        if (data.schemaVersion !== 1 && !('settings' in data) && !('products' in data) && !('customers' in data) && !('sales' in data)) {
          throw new Error("Invalid backup: Unrecognized file format");
        }
        
        const isArray = (arr: any) => Array.isArray(arr);
        if (data.settings && typeof data.settings !== 'object') throw new Error("Invalid backup: settings must be an object");
        if (data.products && !isArray(data.products)) throw new Error("Invalid backup: products must be an array");
        if (data.customers && !isArray(data.customers)) throw new Error("Invalid backup: customers must be an array");
        if (data.sales && !isArray(data.sales)) throw new Error("Invalid backup: sales must be an array");

        const prods = data.products || [];
        const custs = data.customers || [];
        const sals = data.sales || [];
        
        // Reject if absolutely no data exists
        const hasSettings = data.settings && Object.keys(data.settings).length > 0;
        if (!hasSettings && prods.length === 0 && custs.length === 0 && sals.length === 0) {
          throw new Error("This file has no Billo data");
        }

        // Validate items
        for (const p of prods) {
          if (typeof p.id !== 'string') throw new Error("Invalid product: missing string id");
          if (typeof p.price !== 'number') throw new Error("Invalid product: price must be a number");
          if (typeof p.stock !== 'number') throw new Error("Invalid product: stock must be a number");
        }
        for (const c of custs) {
          if (typeof c.id !== 'string') throw new Error("Invalid customer: missing string id");
        }
        for (const s of sals) {
          if (typeof s.id !== 'string') throw new Error("Invalid sale: missing string id");
          if (typeof s.total !== 'number') throw new Error("Invalid sale: total must be a number");
        }

        // 2. Confirm Dialog
        const confirmMsg = `Are you sure you want to restore? This will replace current data with ${prods.length} products, ${custs.length} customers, ${sals.length} sales.`;
        if (!window.confirm(confirmMsg)) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // 3. Snapshot current data
        const snapshot = {
          settings: await settingsDB.getItem('shopSettings'),
          products: [] as any[],
          customers: [] as any[],
          sales: [] as any[],
        };
        await productsDB.iterate((value) => { snapshot.products.push(value); });
        await customersDB.iterate((value) => { snapshot.customers.push(value); });
        await salesDB.iterate((value) => { snapshot.sales.push(value); });

        // 4. Clear and Write
        try {
          await settingsDB.clear();
          await productsDB.clear();
          await customersDB.clear();
          await salesDB.clear();
          
          if (data.settings) await settingsDB.setItem('shopSettings', data.settings);
          for (const p of prods) await productsDB.setItem(p.id, p);
          for (const c of custs) await customersDB.setItem(c.id, c);
          for (const s of sals) await salesDB.setItem(s.id, s);
          
          alert("Backup restored successfully. The app will now reload.");
          window.location.reload();
        } catch (writeErr) {
          // Restore Snapshot
          await settingsDB.clear();
          await productsDB.clear();
          await customersDB.clear();
          await salesDB.clear();
          
          if (snapshot.settings) await settingsDB.setItem('shopSettings', snapshot.settings);
          for (const p of snapshot.products) await productsDB.setItem(p.id, p);
          for (const c of snapshot.customers) await customersDB.setItem(c.id, c);
          for (const s of snapshot.sales) await salesDB.setItem(s.id, s);

          throw new Error("Write failed during restore. Original data was recovered. Details: " + writeErr);
        }

      } catch (err: any) {
        alert("Failed to restore backup: " + err.message);
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };


  const handleSave = async () => {
    await updateSettings({ shopName, upiId, phone, address, staffMembers });
    alert('Settings saved!');
  };

  const addStaff = () => {
    if (newStaff.trim() && !staffMembers.includes(newStaff.trim())) {
      setStaffMembers([...staffMembers, newStaff.trim()]);
      setNewStaff('');
    }
  };

  const removeStaff = (name: string) => {
    setStaffMembers(staffMembers.filter(s => s !== name));
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm flex items-center px-screen-margin-mobile py-space-sm h-16 gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary active:scale-95">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-headline-md font-headline-md text-primary">Shop Profile</h1>
      </header>

      <main className="p-screen-margin-mobile space-y-space-md">
        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">Shop Name</label>
          <input 
            type="text" 
            value={shopName} 
            onChange={e => setShopName(e.target.value)}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-headline-sm focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">Shop Phone</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">Shop Address</label>
          <textarea 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, Market Area"
            rows={2}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none resize-none"
          ></textarea>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">UPI ID for Payments</label>
          <input 
            type="text" 
            value={upiId} 
            onChange={e => setUpiId(e.target.value)}
            placeholder="e.g. 9876543210@ybl"
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <h3 className="text-label-md text-primary mb-2">Staff Members</h3>
          <ul className="space-y-2 mb-3">
            {staffMembers.map(staff => (
              <li key={staff} className="flex justify-between items-center bg-surface-container-low p-2 rounded-lg border border-outline-variant">
                <span className="font-body-md text-primary">{staff}</span>
                <button onClick={() => removeStaff(staff)} className="text-error flex items-center justify-center w-8 h-8 rounded-md active:bg-error-container">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newStaff} 
              onChange={e => setNewStaff(e.target.value)}
              placeholder="Staff Name"
              className="flex-1 p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
            />
            <button onClick={addStaff} className="bg-secondary-container text-on-secondary-fixed px-4 rounded-lg font-bold">Add</button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-label-lg text-primary">Offline Mode</h3>
            <p className="text-body-sm text-on-surface-variant">App works 100% offline</p>
          </div>
          <span className="material-symbols-outlined text-tertiary-container bg-tertiary-fixed-dim rounded-full p-1">wifi_off</span>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-lg font-bold active:scale-95 transition-transform mt-4 mb-4"
        >
          Save Changes
        </button>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <span className="material-symbols-outlined">save</span>
            <h3 className="font-label-lg font-bold">Backup & Export</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-4">
            Billo runs 100% offline. All your data lives only on this device. Create backups to prevent data loss if you clear your browser cache or change devices.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleExportJSON}
              className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Export Full Backup (JSON)
            </button>
            
            <button 
              onClick={handleExportCSV}
              className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">table</span>
              Export Sales History (CSV)
            </button>

            <div className="w-full h-px bg-outline-variant my-1"></div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">upload</span>
              Restore Backup (JSON)
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImportJSON} 
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm mt-4">
          <div className="flex items-center justify-between mb-2 text-primary">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">timer</span>
              <h3 className="font-label-lg font-bold">Benchmark Mode</h3>
            </div>
            <button
              onClick={() => updateSettings({ benchmarkMode: !settings.benchmarkMode })}
              className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${settings.benchmarkMode ? 'bg-primary' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.benchmarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-4">
            Record detailed timing metrics for each sale (time to pay screen, time to save) for UX research.
          </p>
          
          {settings.benchmarkMode && (
            <div className="space-y-4">
              <div className="bg-surface-container p-3 rounded-lg flex gap-2 flex-col text-body-sm">
                <div className="flex justify-between">
                  <span>Small Basket (1-2)</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const s = sales.filter(x => x.itemCount && x.itemCount <= 2 && x.msFirstTapToSaved);
                      if (!s.length) return 'N/A';
                      const avg = s.reduce((sum, x) => sum + x.msFirstTapToSaved!, 0) / s.length;
                      return `${Math.round(avg/1000)}s`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Medium Basket (3-5)</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const s = sales.filter(x => x.itemCount && x.itemCount >= 3 && x.itemCount <= 5 && x.msFirstTapToSaved);
                      if (!s.length) return 'N/A';
                      const avg = s.reduce((sum, x) => sum + x.msFirstTapToSaved!, 0) / s.length;
                      return `${Math.round(avg/1000)}s`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Large Basket (6+)</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const s = sales.filter(x => x.itemCount && x.itemCount >= 6 && x.msFirstTapToSaved);
                      if (!s.length) return 'N/A';
                      const avg = s.reduce((sum, x) => sum + x.msFirstTapToSaved!, 0) / s.length;
                      return `${Math.round(avg/1000)}s`;
                    })()}
                  </span>
                </div>
              </div>

              <button 
                onClick={async () => {
                  const bSales = sales.filter(s => s.msFirstTapToSaved !== undefined);
                  const headers = ["Bill Number", "Items", "Ms to Pay Screen", "Ms to Saved"];
                  const rows = bSales.map(s => [
                    s.billNumber || '', 
                    s.itemCount || 0, 
                    s.msFirstTapToPayScreen || '', 
                    s.msFirstTapToSaved || ''
                  ].join(','));
                  const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `billo_benchmark_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export Benchmark Log (CSV)
              </button>
            </div>
          )}
        </div>

        <div className="bg-error-container rounded-xl p-space-md border border-error shadow-sm mt-4 mb-8">
          <div className="flex items-center gap-2 mb-2 text-error">
            <span className="material-symbols-outlined">warning</span>
            <h3 className="font-label-lg font-bold">Danger Zone</h3>
          </div>
          <p className="text-body-sm text-error mb-4">
            This will permanently delete all sales, products, and customer data and reset the app to its initial state. This action cannot be undone.
          </p>
          <button 
            onClick={handleReset}
            className="w-full bg-error text-on-error py-3 rounded-xl font-label-lg font-bold active:scale-95 transition-transform"
          >
            Factory Reset App
          </button>
        </div>
      </main>
    </div>
  );
}
