import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useT } from '../i18n/useT';
import LanguagePicker from '../components/LanguagePicker';
import { settingsDB, productsDB, customersDB, salesDB } from '../store/db';

export const ACCENT_PRESETS = [
  { id: 'slate', name: 'Navy Slate', color: '#091426' },
  { id: 'amber', name: 'Amber Gold', color: '#fea619' },
  { id: 'emerald', name: 'Emerald Green', color: '#059669' },
  { id: 'blue', name: 'Royal Blue', color: '#2563eb' },
  { id: 'crimson', name: 'Crimson Red', color: '#dc2626' },
  { id: 'purple', name: 'Deep Purple', color: '#7c3aed' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, sales } = useAppContext();
  const { t } = useT();
  const [shopName, setShopName] = useState(settings.shopName);
  const [upiId, setUpiId] = useState(settings.upiId);
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [staffMembers, setStaffMembers] = useState<string[]>(settings.staffMembers || []);
  const [newStaff, setNewStaff] = useState('');
  const [logo, setLogo] = useState<string | undefined>(settings.logo);
  const [logoError, setLogoError] = useState<string>('');
  const [accentColor, setAccentColor] = useState<string | undefined>(settings.accentColor || '#091426');
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setShopName(settings.shopName);
    setUpiId(settings.upiId);
    setPhone(settings.phone || '');
    setAddress(settings.address || '');
    setStaffMembers(settings.staffMembers || []);
    setLogo(settings.logo);
    setAccentColor(settings.accentColor || '#091426');
  }, [settings]);

  const handleReset = async () => {
    if (window.confirm(t('settings.confirm_reset'))) {
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
        const confirmMsg = t('settings.confirm_restore', { products: prods.length, customers: custs.length, sales: sals.length });
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
          
          alert(t('settings.restore_success'));
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
        alert(t('settings.restore_failed') + err.message);
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Reject non-images
    if (!file.type.startsWith('image/')) {
      setLogoError(t('settings.logo_err_type'));
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    // 2. Reject files over 5MB before processing
    if (file.size > 5 * 1024 * 1024) {
      setLogoError(t('settings.logo_err_size'));
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 128;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setLogoError('Canvas rendering failed');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Encode as WebP (fall back to PNG)
        let dataUrl = canvas.toDataURL('image/webp', 0.85);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/png');
        }

        // Reject with a visible message if the result is over 100KB
        const base64Data = dataUrl.split(',')[1] || '';
        const sizeInBytes = Math.round((base64Data.length * 3) / 4);
        if (sizeInBytes > 100 * 1024) {
          setLogoError(t('settings.logo_err_100kb'));
          if (logoInputRef.current) logoInputRef.current.value = '';
          return;
        }

        setLogo(dataUrl);
        setLogoError('');
      };
      img.onerror = () => {
        setLogoError(t('settings.logo_err_type'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(undefined);
    setLogoError('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSave = async () => {
    await updateSettings({ shopName, upiId, phone, address, staffMembers, logo, accentColor });
    alert(t('settings.saved_alert'));
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
        <h1 className="text-headline-md font-headline-md text-primary">{t('settings.title')}</h1>
      </header>

      <main className="p-screen-margin-mobile space-y-space-md">
        {/* Language Picker */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-primary">
            <span className="material-symbols-outlined">translate</span>
            <h3 className="font-label-lg font-bold">{t('settings.language')}</h3>
          </div>
          <LanguagePicker variant="segmented" />
        </div>

        {/* Shop Logo */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-primary">
            <span className="material-symbols-outlined">image</span>
            <h3 className="font-label-lg font-bold">{t('settings.logo')}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <img src={logo} alt="Logo Preview" className="w-full h-full object-contain" />
              ) : (
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">storefront</span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-surface-container-high text-primary px-3 py-2 rounded-lg text-label-sm font-bold flex items-center gap-1.5 border border-outline-variant active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">upload</span>
                  {t('settings.logo_upload')}
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="bg-error-container text-error px-3 py-2 rounded-lg text-label-sm font-bold flex items-center gap-1.5 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {t('settings.logo_remove')}
                  </button>
                )}
              </div>
              <p className="text-body-sm text-on-surface-variant">{t('settings.logo_help')}</p>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={logoInputRef}
            style={{ display: 'none' }}
            onChange={handleLogoChange}
          />
          {logoError && (
            <div className="mt-3 p-2.5 rounded-lg bg-error-container/60 border border-error text-error text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{logoError}</span>
            </div>
          )}
        </div>

        {/* Accent Color Picker */}
        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <span className="material-symbols-outlined">palette</span>
            <h3 className="font-label-lg font-bold">{t('settings.accent_color')}</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-3">{t('settings.accent_desc')}</p>
          <div className="grid grid-cols-6 gap-2">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = accentColor?.toLowerCase() === preset.color.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAccentColor(preset.color)}
                  title={preset.name}
                  className={`h-11 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'hover:scale-105 opacity-90'
                  }`}
                  style={{ backgroundColor: preset.color }}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-white text-base">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">{t('settings.shop_name')}</label>
          <input 
            type="text" 
            value={shopName} 
            onChange={e => setShopName(e.target.value)}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-headline-sm focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">{t('settings.shop_phone')}</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            placeholder={t('settings.phone_placeholder')}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">{t('settings.shop_address')}</label>
          <textarea 
            value={address} 
            onChange={e => setAddress(e.target.value)}
            placeholder={t('settings.address_placeholder')}
            rows={2}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none resize-none"
          ></textarea>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <label className="block text-label-md text-primary mb-1">{t('settings.upi_id')}</label>
          <input 
            type="text" 
            value={upiId} 
            onChange={e => setUpiId(e.target.value)}
            placeholder={t('settings.upi_placeholder')}
            className="w-full p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
          />
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm">
          <h3 className="text-label-md text-primary mb-2">{t('settings.staff_members')}</h3>
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
              placeholder={t('settings.staff_name_placeholder')}
              className="flex-1 p-3 border border-outline-variant rounded-lg bg-surface-container-low text-primary font-body-lg focus:border-secondary-container outline-none"
            />
            <button onClick={addStaff} className="bg-secondary-container text-on-secondary-fixed px-4 rounded-lg font-bold">{t('common.add')}</button>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-label-lg text-primary">{t('settings.offline_mode')}</h3>
            <p className="text-body-sm text-on-surface-variant">{t('settings.offline_mode_desc')}</p>
          </div>
          <span className="material-symbols-outlined text-tertiary-container bg-tertiary-fixed-dim rounded-full p-1">wifi_off</span>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-lg font-bold active:scale-95 transition-transform mt-4 mb-4"
        >
          {t('settings.save_changes')}
        </button>

        <div className="bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant shadow-sm mt-4">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <span className="material-symbols-outlined">save</span>
            <h3 className="font-label-lg font-bold">{t('settings.backup_export')}</h3>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-4">
            {t('settings.backup_desc')}
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleExportJSON}
              className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">download</span>
              {t('settings.export_json')}
            </button>
            
            <button 
              onClick={handleExportCSV}
              className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">table</span>
              {t('settings.export_csv')}
            </button>

            <div className="w-full h-px bg-outline-variant my-1"></div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-2 border border-outline-variant active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-base">upload</span>
              {t('settings.restore_json')}
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
              <h3 className="font-label-lg font-bold">{t('settings.benchmark_mode')}</h3>
            </div>
            <button
              onClick={() => updateSettings({ benchmarkMode: !settings.benchmarkMode })}
              className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${settings.benchmarkMode ? 'bg-primary' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.benchmarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <p className="text-body-sm text-on-surface-variant mb-4">
            {t('settings.benchmark_desc')}
          </p>
          
          {settings.benchmarkMode && (
            <div className="space-y-4">
              <div className="bg-surface-container p-3 rounded-lg flex gap-2 flex-col text-body-sm">
                <div className="flex justify-between">
                  <span>{t('settings.basket_small')}</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const s = sales.filter(x => x.itemCount && x.itemCount <= 2 && x.msFirstTapToSaved);
                      if (!s.length) return t('common.na');
                      const avg = s.reduce((sum, x) => sum + x.msFirstTapToSaved!, 0) / s.length;
                      return `${Math.round(avg/1000)}s`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('settings.basket_medium')}</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const s = sales.filter(x => x.itemCount && x.itemCount >= 3 && x.itemCount <= 5 && x.msFirstTapToSaved);
                      if (!s.length) return t('common.na');
                      const avg = s.reduce((sum, x) => sum + x.msFirstTapToSaved!, 0) / s.length;
                      return `${Math.round(avg/1000)}s`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('settings.basket_large')}</span>
                  <span className="font-bold text-primary">
                    {(() => {
                      const s = sales.filter(x => x.itemCount && x.itemCount >= 6 && x.msFirstTapToSaved);
                      if (!s.length) return t('common.na');
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
                {t('settings.export_benchmark')}
              </button>
            </div>
          )}
        </div>

        <div className="bg-error-container rounded-xl p-space-md border border-error shadow-sm mt-4 mb-8">
          <div className="flex items-center gap-2 mb-2 text-error">
            <span className="material-symbols-outlined">warning</span>
            <h3 className="font-label-lg font-bold">{t('settings.danger_zone')}</h3>
          </div>
          <p className="text-body-sm text-error mb-4">
            {t('settings.danger_desc')}
          </p>
          <button 
            onClick={handleReset}
            className="w-full bg-error text-on-error py-3 rounded-xl font-label-lg font-bold active:scale-95 transition-transform"
          >
            {t('settings.reset_app')}
          </button>
        </div>
      </main>
    </div>
  );
}
