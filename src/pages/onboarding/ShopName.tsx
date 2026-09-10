import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';

export default function ShopName() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const [name, setName] = useState(settings.shopName || '');
  const [isListening, setIsListening] = useState(false);

  const appendTag = (tagName: string) => {
    if (!name.trim()) {
      setName(tagName);
    } else {
      setName(name.split(' • ')[0] + ' • ' + tagName);
    }
  };

  const submitShopName = async () => {
    if (!name.trim()) {
      alert("Please enter your shop name");
      return;
    }
    await updateSettings({ shopName: name });
    navigate('/onboarding/step2');
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-fixed">
      {/* Semantic Header */}
      <header className="w-full bg-surface-container-lowest shadow-sm flex flex-col z-10 sticky top-0">
        <div className="flex justify-between items-center w-full px-screen-margin-mobile py-space-xs h-16">
          <div className="flex items-center space-x-space-xs">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-secondary-container shadow-sm">
              <span className="material-symbols-outlined">storefront</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-lg font-headline-lg text-primary tracking-tight leading-none">Billo</span>
              <span className="text-label-sm font-label-sm text-on-surface-variant leading-none mt-1 tracking-wide">DIGITAL LEDGER & POS</span>
            </div>
          </div>
        </div>
        {/* Onboarding Step Indicator */}
        <div className="px-screen-margin-mobile pb-space-sm pt-space-2xs bg-surface-container-lowest">
          <div className="flex items-center justify-between mb-space-2xs">
            <span className="text-label-md font-label-md text-primary font-bold">Step 1 of 3</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">Shop Identity</span>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full h-2">
            <div className="h-full bg-secondary-container rounded-full"></div>
            <div className="h-full bg-surface-container-highest rounded-full"></div>
            <div className="h-full bg-surface-container-highest rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl mx-auto px-screen-margin-mobile py-space-lg flex-1 flex flex-col justify-start">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-space-lg shadow-sm mb-space-lg">
          <div className="inline-flex items-center space-x-2 bg-surface-container-high px-space-sm py-1 rounded-full mb-space-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Business Details</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-primary mb-space-2xs">
            What's your shop called?
          </h1>
        </div>

        <div className="mb-space-lg">
          <label className="block text-label-lg font-label-lg text-primary mb-space-xs flex justify-between items-center" htmlFor="shopNameInput">
            <span>Enter Shop Name</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant font-normal">Required</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-space-md flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <input 
              id="shopNameInput"
              autoComplete="organization"
              className="w-full h-16 pl-14 pr-28 rounded-xl bg-surface-container-lowest border-2 border-primary text-headline-sm font-headline-sm text-primary shadow-sm focus:border-secondary-container focus:ring-2 focus:ring-secondary-container outline-none transition-all placeholder:text-outline" 
              placeholder="e.g., Gupta Kirana, Sharma Tea Stall" 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="absolute right-2 flex items-center space-x-1">
              <button 
                className="w-12 h-12 rounded-xl bg-surface-container-high text-primary hover:bg-secondary-fixed active:scale-95 flex items-center justify-center transition-all border border-outline-variant" 
                onClick={() => setIsListening(!isListening)}
                type="button"
              >
                <span className={`material-symbols-outlined ${isListening ? 'text-error' : 'text-primary'}`}>mic</span>
              </button>
            </div>
          </div>
          {isListening && (
            <p className="text-body-sm font-body-sm text-secondary mt-1 flex items-center space-x-1 animate-pulse">
              <span className="material-symbols-outlined text-base">graphic_eq</span>
              <span>Listening...</span>
            </p>
          )}
        </div>

        {/* Quick Auto-Fill Category Pills */}
        <div className="mb-space-xl">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="text-label-md font-label-md text-on-surface-variant">Tap to append or select type:</span>
            <span className="text-label-sm font-label-sm text-secondary">Quick Tags</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button className="min-h-touch-target-min px-space-md py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-primary shadow-sm hover:border-primary hover:bg-surface-container-low active:scale-95 transition-all flex items-center space-x-2" onClick={() => appendTag('Kirana & General Store')} type="button">
              <span className="material-symbols-outlined text-secondary">shopping_basket</span>
              <span>Kirana & General Store</span>
            </button>
            <button className="min-h-touch-target-min px-space-md py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-primary shadow-sm hover:border-primary hover:bg-surface-container-low active:scale-95 transition-all flex items-center space-x-2" onClick={() => appendTag('Chai & Snacks')} type="button">
              <span className="material-symbols-outlined text-secondary">local_cafe</span>
              <span>Chai & Snacks</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant p-screen-margin-mobile shadow-md sticky bottom-0 z-20">
        <div className="max-w-xl mx-auto flex flex-col space-y-space-2xs">
          <button 
            className="w-full h-14 bg-secondary-container text-on-secondary-fixed rounded-xl text-label-lg font-label-lg flex items-center justify-center space-x-space-xs shadow-sm hover:brightness-105 active:scale-95 transition-all duration-150 focus:outline-none" 
            onClick={submitShopName} 
            type="button"
          >
            <span>Next: Select Products →</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
