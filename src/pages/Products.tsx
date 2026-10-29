import React, { useState, useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { useT } from '../i18n/useT';
import { Product } from '../store/types';
import { parseProductCSV, PRODUCT_CSV_TEMPLATE, ParseResult } from '../lib/csvProducts';

export default function Products() {
  const { products, updateProduct, deleteProduct, addProduct } = useAppContext();
  const { t } = useT();
  const [isAdding, setIsAdding] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, category: 'General', image: '📦' });
  const [previewResult, setPreviewResult] = useState<ParseResult | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!newProd.name || newProd.price === undefined) return;
    await addProduct({
      id: Date.now().toString(),
      name: newProd.name,
      price: Number(newProd.price),
      stock: Number(newProd.stock),
      category: newProd.category || 'General',
      image: newProd.image || '📦'
    });
    setIsAdding(false);
    setNewProd({ name: '', price: 0, stock: 0, category: 'General', image: '📦' });
  };

  const handleStockChange = async (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stock + delta);
    await updateProduct({ ...p, stock: newStock });
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([PRODUCT_CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseProductCSV(text);
      setPreviewResult(result);
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.validRows.length === 0) {
      alert(t('products.csv_no_valid'));
      return;
    }

    // Duplicate names (case-insensitive) update price and stock; products not in file stay untouched
    const currentProducts = [...products];
    for (const row of previewResult.validRows) {
      const existing = currentProducts.find(
        p => p.name.trim().toLowerCase() === row.name.trim().toLowerCase()
      );
      if (existing) {
        const updated = {
          ...existing,
          price: row.price,
          stock: row.stock,
          category: row.category || existing.category
        };
        await updateProduct(updated);
        const idx = currentProducts.findIndex(p => p.id === existing.id);
        if (idx !== -1) currentProducts[idx] = updated;
      } else {
        const newProduct: Product = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
          name: row.name,
          price: row.price,
          stock: row.stock,
          category: row.category || 'General',
          image: '📦'
        };
        await addProduct(newProduct);
        currentProducts.push(newProduct);
      }
    }

    alert(t('products.csv_success', { count: previewResult.validRows.length }));
    setPreviewResult(null);
  };

  return (
    <div className="px-screen-margin-mobile pt-space-md pb-32">
      <div className="flex flex-col gap-3 mb-space-md">
        <div className="flex justify-between items-center">
          <h2 className="text-headline-sm text-primary">{t('products.title')}</h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-secondary-container text-on-secondary-fixed px-3 py-1.5 rounded-lg text-label-sm font-bold flex items-center gap-1 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t('products.new_item')}
          </button>
        </div>

        {/* CSV Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => csvInputRef.current?.click()}
            className="flex-1 bg-surface-container-high text-primary px-3 py-2 rounded-xl text-label-sm font-bold flex items-center justify-center gap-1.5 border border-outline-variant active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            {t('products.import_csv')}
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex-1 bg-surface-container-lowest text-primary px-3 py-2 rounded-xl text-label-sm font-bold flex items-center justify-center gap-1.5 border border-outline-variant hover:bg-surface-container-low active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-base">download</span>
            {t('products.download_template')}
          </button>
          <input
            type="file"
            accept=".csv"
            ref={csvInputRef}
            style={{ display: 'none' }}
            onChange={handleCSVFileSelect}
          />
        </div>
      </div>

      {/* CSV Import Preview Modal / Sheet */}
      {previewResult && (
        <div className="bg-surface-container-lowest p-space-md rounded-2xl border-2 border-primary shadow-lg mb-space-md">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-headline-sm text-primary">{t('products.csv_preview_title')}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full text-label-sm font-bold">
                  {t('products.csv_valid_count', { count: previewResult.validRows.length })}
                </span>
                {previewResult.invalidRows.length > 0 && (
                  <span className="bg-error-container text-error px-2 py-0.5 rounded-full text-label-sm font-bold">
                    {t('products.csv_invalid_count', { count: previewResult.invalidRows.length })}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setPreviewResult(null)}
              className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {previewResult.headerError ? (
            <p className="text-body-sm text-error p-3 bg-error-container/40 rounded-lg mb-3">
              {previewResult.headerError}
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto rounded-lg border border-outline-variant mb-4 divide-y divide-outline-variant">
              {previewResult.rows.map((row) => (
                <div
                  key={row.rowNumber}
                  className={`p-2.5 text-body-sm flex items-start justify-between ${
                    row.isValid ? 'bg-surface-container-lowest' : 'bg-error-container/20'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className={`material-symbols-outlined text-base ${
                          row.isValid ? 'text-on-tertiary-container' : 'text-error'
                        }`}
                      >
                        {row.isValid ? 'check_circle' : 'error'}
                      </span>
                      <span className="text-primary truncate">{row.name || `(Row ${row.rowNumber}: Empty name)`}</span>
                    </div>
                    {row.isValid ? (
                      <p className="text-xs text-on-surface-variant ml-6">
                        ₹{row.price} • {row.stock} in stock • {row.category}
                      </p>
                    ) : (
                      <p className="text-xs text-error ml-6 mt-0.5">
                        {row.errors.join('; ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant font-mono shrink-0">
                    #{row.rowNumber}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={previewResult.validRows.length === 0}
              onClick={handleConfirmImport}
              className={`flex-1 py-3 rounded-xl font-label-lg font-bold flex items-center justify-center gap-1.5 ${
                previewResult.validRows.length > 0
                  ? 'bg-secondary-container text-on-secondary-fixed active:scale-95 shadow-sm'
                  : 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-base">check</span>
              {t('products.csv_confirm_btn', { count: previewResult.validRows.length })}
            </button>
            <button
              onClick={() => setPreviewResult(null)}
              className="px-4 py-3 bg-surface-container-high text-primary rounded-xl font-label-lg font-bold border border-outline-variant active:scale-95"
            >
              {t('products.csv_cancel_btn')}
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-secondary-container mb-space-md shadow-sm">
          <input 
            type="text" placeholder={t('products.item_name_placeholder')} 
            value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})}
            className="w-full mb-2 p-2 border border-outline-variant rounded bg-surface-container-low" 
          />
          <div className="flex gap-2 mb-3">
            <input 
              type="number" placeholder={t('products.price_placeholder')} 
              value={newProd.price || ''} onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
              className="w-1/2 p-2 border border-outline-variant rounded bg-surface-container-low" 
            />
            <input 
              type="number" placeholder={t('products.stock_placeholder')} 
              value={newProd.stock || ''} onChange={e => setNewProd({...newProd, stock: Number(e.target.value)})}
              className="w-1/2 p-2 border border-outline-variant rounded bg-surface-container-low" 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-secondary-container text-on-secondary-fixed py-2 rounded font-bold">{t('common.save')}</button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-surface-container-high text-primary py-2 rounded font-bold border border-outline-variant">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      <div className="space-y-space-sm">
        {products.map(p => (
          <div key={p.id} className="bg-surface-container-lowest p-space-sm rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center text-2xl">
                {p.image}
              </div>
              <div>
                <h3 className="font-headline-sm text-primary">{t(p.name)}</h3>
                <p className="text-body-sm text-on-surface-variant">₹{p.price} • {t(p.category)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-surface-container-low rounded-lg p-1 border border-outline-variant">
              <button onClick={() => handleStockChange(p, -1)} className="w-8 h-8 flex items-center justify-center text-primary active:scale-95 bg-surface-container-lowest rounded shadow-sm">
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-label-md w-6 text-center">{p.stock}</span>
              <button onClick={() => handleStockChange(p, 1)} className="w-8 h-8 flex items-center justify-center text-primary active:scale-95 bg-surface-container-lowest rounded shadow-sm">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
