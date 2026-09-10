import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { Product } from '../../store/types';

const STARTER_PACKS = {
  'Tea & Snacks': [
    { id: '1', name: 'Tea', price: 15, stock: 100, category: 'Beverages', image: '☕' },
    { id: '2', name: 'Pastry', price: 18, stock: 50, category: 'Snacks', image: '🥐' },
    { id: '3', name: 'Cookies', price: 10, stock: 150, category: 'Snacks', image: '🍪' },
  ],
  'Daily Needs': [
    { id: '4', name: 'Milk 500ml', price: 27, stock: 40, category: 'Dairy', image: '🥛' },
    { id: '5', name: 'Bread Roll', price: 25, stock: 20, category: 'Bakery', image: '🍞' },
    { id: '6', name: 'Eggs (6 pcs)', price: 40, stock: 60, category: 'Dairy', image: '🥚' },
  ],
  'Grocery Essentials': [
    { id: '7', name: 'Rice 1kg', price: 85, stock: 30, category: 'Grains', image: '🍚' },
    { id: '8', name: 'Flour 1kg', price: 52, stock: 25, category: 'Grains', image: '🫓' },
    { id: '9', name: 'Lentils 1kg', price: 120, stock: 40, category: 'Lentils', image: '🍲' },
  ]
};

export default function StarterProducts() {
  const navigate = useNavigate();
  const { seedProducts } = useAppContext();
  const [selectedPacks, setSelectedPacks] = useState<string[]>(['Tea & Snacks']);

  const togglePack = (pack: string) => {
    setSelectedPacks(prev => 
      prev.includes(pack) ? prev.filter(p => p !== pack) : [...prev, pack]
    );
  };

  const submitProducts = async () => {
    if (selectedPacks.length === 0) {
      alert("Please select at least one starter pack");
      return;
    }
    const productsToSeed: Product[] = [];
    selectedPacks.forEach(pack => {
      productsToSeed.push(...STARTER_PACKS[pack as keyof typeof STARTER_PACKS]);
    });
    
    await seedProducts(productsToSeed);
    navigate('/onboarding/step3');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-between">
      <header className="w-full bg-surface-container-lowest shadow-sm flex flex-col z-10 sticky top-0">
        <div className="px-screen-margin-mobile pb-space-sm pt-space-2xs bg-surface-container-lowest h-16 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-space-2xs">
            <span className="text-label-md font-label-md text-primary font-bold">Step 2 of 3</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">Starter Inventory</span>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full h-2">
            <div className="h-full bg-secondary-container rounded-full"></div>
            <div className="h-full bg-secondary-container rounded-full"></div>
            <div className="h-full bg-surface-container-highest rounded-full"></div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto px-screen-margin-mobile py-space-lg flex-1 flex flex-col justify-start">
        <h1 className="text-headline-lg font-headline-lg text-primary mb-space-2xs">
          Select Starter Packs
        </h1>
        <p className="text-headline-sm font-headline-sm text-on-surface-variant mb-space-lg font-normal">
          Pick what you sell to quickly setup your POS.
        </p>

        <div className="space-y-4">
          {Object.keys(STARTER_PACKS).map(pack => (
            <div 
              key={pack}
              onClick={() => togglePack(pack)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPacks.includes(pack) 
                  ? 'bg-surface-container-lowest border-secondary-container shadow-sm' 
                  : 'bg-surface-container-lowest border-outline-variant hover:border-secondary-container'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-headline-md text-primary">{pack}</h3>
                {selectedPacks.includes(pack) && (
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                )}
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {STARTER_PACKS[pack as keyof typeof STARTER_PACKS].map(p => p.name).join(', ')}
              </p>
            </div>
          ))}
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant p-screen-margin-mobile shadow-md sticky bottom-0 z-20">
        <button 
          className="w-full h-14 bg-secondary-container text-on-secondary-fixed rounded-xl text-label-lg font-label-lg flex items-center justify-center space-x-space-xs shadow-sm active:scale-95 transition-all duration-150" 
          onClick={submitProducts}
        >
          <span>Next: UPI Setup →</span>
        </button>
      </footer>
    </div>
  );
}
