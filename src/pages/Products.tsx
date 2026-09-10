import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Product } from '../store/types';

export default function Products() {
  const { products, updateProduct, deleteProduct, addProduct } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({ name: '', price: 0, stock: 0, category: 'General', image: '📦' });

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

  return (
    <div className="px-screen-margin-mobile pt-space-md pb-32">
      <div className="flex justify-between items-center mb-space-md">
        <h2 className="text-headline-sm text-primary">Inventory</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-secondary-container text-on-secondary-fixed px-3 py-1.5 rounded-lg text-label-sm font-bold flex items-center gap-1 active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Item
        </button>
      </div>

      {isAdding && (
        <div className="bg-surface-container-lowest p-space-sm rounded-xl border border-secondary-container mb-space-md shadow-sm">
          <input 
            type="text" placeholder="Item Name" 
            value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})}
            className="w-full mb-2 p-2 border border-outline-variant rounded bg-surface-container-low" 
          />
          <div className="flex gap-2 mb-3">
            <input 
              type="number" placeholder="Price" 
              value={newProd.price || ''} onChange={e => setNewProd({...newProd, price: Number(e.target.value)})}
              className="w-1/2 p-2 border border-outline-variant rounded bg-surface-container-low" 
            />
            <input 
              type="number" placeholder="Stock" 
              value={newProd.stock || ''} onChange={e => setNewProd({...newProd, stock: Number(e.target.value)})}
              className="w-1/2 p-2 border border-outline-variant rounded bg-surface-container-low" 
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-secondary-container text-on-secondary-fixed py-2 rounded font-bold">Save</button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-surface-container-high text-primary py-2 rounded font-bold border border-outline-variant">Cancel</button>
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
                <h3 className="font-headline-sm text-primary">{p.name}</h3>
                <p className="text-body-sm text-on-surface-variant">₹{p.price} • {p.category}</p>
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
