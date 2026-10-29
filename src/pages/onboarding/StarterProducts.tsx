import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { Product } from '../../store/types';
import { useT } from '../../i18n/useT';

interface StarterItem {
  id: string;
  nameKey: string;
  price: number;
  stock: number;
  categoryKey: string;
  image: string;
}

interface StarterPack {
  key: string;
  items: StarterItem[];
}

const STARTER_PACKS_CONFIG: StarterPack[] = [
  {
    key: 'packs.tea_snacks',
    items: [
      { id: '1', nameKey: 'products.tea', price: 15, stock: 100, categoryKey: 'categories.beverages', image: '☕' },
      { id: '2', nameKey: 'products.pastry', price: 18, stock: 50, categoryKey: 'categories.snacks', image: '🥐' },
      { id: '3', nameKey: 'products.cookies', price: 10, stock: 150, categoryKey: 'categories.snacks', image: '🍪' },
    ],
  },
  {
    key: 'packs.daily_needs',
    items: [
      { id: '4', nameKey: 'products.milk_500ml', price: 27, stock: 40, categoryKey: 'categories.dairy', image: '🥛' },
      { id: '5', nameKey: 'products.bread_roll', price: 25, stock: 20, categoryKey: 'categories.bakery', image: '🍞' },
      { id: '6', nameKey: 'products.eggs_6pcs', price: 40, stock: 60, categoryKey: 'categories.dairy', image: '🥚' },
    ],
  },
  {
    key: 'packs.grocery_essentials',
    items: [
      { id: '7', nameKey: 'products.rice_1kg', price: 85, stock: 30, categoryKey: 'categories.grains', image: '🍚' },
      { id: '8', nameKey: 'products.flour_1kg', price: 52, stock: 25, categoryKey: 'categories.grains', image: '🫓' },
      { id: '9', nameKey: 'products.lentils_1kg', price: 120, stock: 40, categoryKey: 'categories.lentils', image: '🍲' },
    ],
  },
];

export default function StarterProducts() {
  const navigate = useNavigate();
  const { seedProducts } = useAppContext();
  const { t } = useT();
  const [selectedPacks, setSelectedPacks] = useState<string[]>(['packs.tea_snacks']);

  const togglePack = (packKey: string) => {
    setSelectedPacks(prev => 
      prev.includes(packKey) ? prev.filter(p => p !== packKey) : [...prev, packKey]
    );
  };

  const submitProducts = async () => {
    if (selectedPacks.length === 0) {
      alert(t('onboarding.starter_products.alert_empty'));
      return;
    }
    const productsToSeed: Product[] = [];
    selectedPacks.forEach(packKey => {
      const pack = STARTER_PACKS_CONFIG.find(p => p.key === packKey);
      if (pack) {
        pack.items.forEach(item => {
          productsToSeed.push({
            id: item.id,
            name: t(item.nameKey),
            price: item.price,
            stock: item.stock,
            category: t(item.categoryKey),
            image: item.image,
          });
        });
      }
    });
    
    await seedProducts(productsToSeed);
    navigate('/onboarding/step3');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-between">
      <header className="w-full bg-surface-container-lowest shadow-sm flex flex-col z-10 sticky top-0">
        <div className="px-screen-margin-mobile pb-space-sm pt-space-2xs bg-surface-container-lowest h-16 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-space-2xs">
            <span className="text-label-md font-label-md text-primary font-bold">{t('onboarding.step_2_of_3')}</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">{t('onboarding.starter_inventory')}</span>
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
          {t('onboarding.starter_products.heading')}
        </h1>
        <p className="text-headline-sm font-headline-sm text-on-surface-variant mb-space-lg font-normal">
          {t('onboarding.starter_products.subheading')}
        </p>

        <div className="space-y-4">
          {STARTER_PACKS_CONFIG.map(pack => (
            <div 
              key={pack.key}
              onClick={() => togglePack(pack.key)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPacks.includes(pack.key) 
                  ? 'bg-surface-container-lowest border-secondary-container shadow-sm' 
                  : 'bg-surface-container-lowest border-outline-variant hover:border-secondary-container'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-headline-md text-primary">{t(pack.key)}</h3>
                {selectedPacks.includes(pack.key) && (
                  <span className="material-symbols-outlined text-secondary">check_circle</span>
                )}
              </div>
              <p className="text-body-sm text-on-surface-variant">
                {pack.items.map(p => t(p.nameKey)).join(', ')}
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
          <span>{t('onboarding.starter_products.next')}</span>
        </button>
      </footer>
    </div>
  );
}
