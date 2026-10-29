import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { useT } from '../i18n/useT';
import ProductCard from '../components/ProductCard';

export default function Billing() {
  const navigate = useNavigate();
  const { products, cart } = useAppContext();
  const { t } = useT();
  const [activeCategory, setActiveCategory] = useState<string>('All Items');

  const categories = ['All Items', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = activeCategory === 'All Items' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Category Filter Bar */}
      <section className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md px-screen-margin-mobile py-space-sm shadow-sm">
        <div className="flex items-center gap-space-xs overflow-x-auto no-scrollbar py-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 h-10 px-space-md rounded-full font-label-md text-label-md transition-transform active:scale-95 ${
                activeCategory === cat 
                  ? 'bg-primary-container text-on-primary shadow-sm flex items-center gap-1.5' 
                  : 'bg-surface-container-lowest text-primary border border-outline-variant hover:bg-surface-container-low'
              }`}
            >
              <span>{cat === 'All Items' ? t('billing.all_items') : t(cat)}</span>
              {cat === 'All Items' && activeCategory === 'All Items' && (
                <span className="bg-surface-container-highest/20 px-1.5 py-0.5 rounded-full text-label-sm font-label-sm">
                  {products.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Main POS Billing Grid */}
      <main className="px-screen-margin-mobile pt-space-xs pb-32">
        <div className="grid grid-cols-2 gap-space-sm">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>

      {/* Running Cart Bottom Sheet */}
      {cartItemCount > 0 && (
        <section className="fixed bottom-16 left-0 w-full z-40 bg-surface-container-lowest border-t border-outline-variant shadow-[0_-8px_24px_-4px_rgba(15,23,42,0.08)] px-screen-margin-mobile pt-space-sm pb-space-sm">
          <div className="flex items-center justify-between mb-space-xs pb-space-2xs border-b border-outline-variant/40">
            <div className="flex items-center gap-space-xs">
              <span className="text-label-md font-label-md text-primary font-bold">
                {t('billing.items_in_order', { count: cartItemCount })}
              </span>
            </div>
            {/* Quick Tender Buttons - Just visual for now or can add to total */}
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="flex flex-col min-w-[100px]">
              <span className="text-label-sm font-label-sm text-on-surface-variant leading-none">{t('billing.grand_total')}</span>
              <span className="font-display-currency text-display-currency text-primary leading-tight tracking-tight">₹{cartTotal}</span>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              className="flex-1 min-h-[56px] h-14 bg-secondary-container hover:bg-secondary-container/95 text-on-secondary-fixed rounded-xl px-space-md flex items-center justify-between shadow-md active:scale-95 transition-transform duration-100 cursor-pointer"
            >
              <div className="flex items-center gap-space-xs">
                <div className="w-8 h-8 rounded-lg bg-on-secondary-fixed/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">point_of_sale</span>
                </div>
                <span className="font-label-lg text-label-lg font-extrabold tracking-wide">{t('billing.charge')} ₹{cartTotal}</span>
              </div>
              <div className="flex items-center gap-0.5 font-bold">
                <span className="text-label-md font-label-md">{t('billing.cash_upi')}</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
