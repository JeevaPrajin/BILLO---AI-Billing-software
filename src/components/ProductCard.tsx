import React from 'react';
import { Product } from '../store/types';
import { cn } from '../lib/utils';
import { useAppContext } from '../store/AppContext';
import { useT } from '../i18n/useT';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useAppContext();
  const { t } = useT();
  
  const cartItem = cart.find(i => i.product.id === product.id);
  const inCartCount = cartItem?.quantity || 0;
  
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCartCount > 0) {
      removeFromCart(product);
    }
  };

  const isLowStock = product.stock <= 5;
  const isSelected = inCartCount > 0;

  return (
    <article 
      onClick={() => addToCart(product)}
      className={cn(
        "relative rounded-xl p-space-sm shadow-sm flex flex-col justify-between active:scale-[0.98] transition-transform select-none cursor-pointer",
        isSelected 
          ? "bg-surface-container-lowest border-2 border-secondary-container" 
          : "bg-surface-container-lowest border border-outline-variant hover:border-secondary-container"
      )}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-secondary-container text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 font-bold">
          <span className="material-symbols-outlined text-xs">check</span>
          <span>{t('product.in_cart', { count: inCartCount })}</span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center text-3xl shadow-inner">
          {product.image || '📦'}
        </div>
        
        {isLowStock ? (
          <span className="bg-error-container/40 text-error font-label-sm text-label-sm px-2 py-1 rounded-md font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">warning</span> {t('product.left', { count: product.stock })}
          </span>
        ) : (
          <span className="bg-surface-container-low text-on-tertiary-container font-label-sm text-label-sm px-2 py-1 rounded-md font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span> {t('product.left', { count: product.stock })}
          </span>
        )}
      </div>

      <div className="mt-space-sm">
        <h2 className="font-headline-sm text-headline-sm text-primary leading-tight line-clamp-1">{t(product.name)}</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{t(product.category)}</p>
      </div>

      <div className="mt-space-sm pt-space-2xs flex items-center justify-between border-t border-outline-variant/40">
        <span className="font-display-currency-sm text-display-currency-sm text-primary">₹{product.price}</span>
        
        {inCartCount > 0 ? (
          <div className="flex items-center gap-2">
            <button onClick={handleRemove} className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">remove</span>
            </button>
            <span className="font-label-lg">{inCartCount}</span>
            <button onClick={handleAdd} className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-base">add</span>
            </button>
          </div>
        ) : (
          <button onClick={handleAdd} className="w-9 h-9 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-base">add</span>
          </button>
        )}
      </div>
    </article>
  );
}
