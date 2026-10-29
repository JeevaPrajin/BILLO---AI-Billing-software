import React, { useState } from 'react';
// TODO(L10N): UPI payment method and references to Indian payment apps are currently India-specific. Make configurable for other markets.
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { useT } from '../../i18n/useT';

export default function UPISetup() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppContext();
  const { t } = useT();
  const [upiId, setUpiId] = useState(settings.upiId || '');

  const completeSetup = async () => {
    // Basic validation for UPI ID if provided
    if (upiId && !upiId.includes('@')) {
      alert(t('onboarding.upi_setup.alert_invalid'));
      return;
    }
    await updateSettings({ upiId });
    navigate('/billing'); // Redirect to POS Home
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-between">
      <header className="w-full bg-surface-container-lowest shadow-sm flex flex-col z-10 sticky top-0">
        <div className="px-screen-margin-mobile pb-space-sm pt-space-2xs bg-surface-container-lowest h-16 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-space-2xs">
            <span className="text-label-md font-label-md text-primary font-bold">{t('onboarding.step_3_of_3')}</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">{t('onboarding.payments_setup')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full h-2">
            <div className="h-full bg-secondary-container rounded-full"></div>
            <div className="h-full bg-secondary-container rounded-full"></div>
            <div className="h-full bg-secondary-container rounded-full"></div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-xl mx-auto px-screen-margin-mobile py-space-lg flex-1 flex flex-col justify-start">
        <h1 className="text-headline-lg font-headline-lg text-primary mb-space-2xs">
          {t('onboarding.upi_setup.heading')}
        </h1>
        <p className="text-headline-sm font-headline-sm text-on-surface-variant mb-space-lg font-normal">
          {t('onboarding.upi_setup.subheading')}
        </p>

        <div className="mb-space-lg">
          <label className="block text-label-lg font-label-lg text-primary mb-space-xs flex justify-between items-center" htmlFor="upiInput">
            <span>{t('onboarding.upi_setup.label')}</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant font-normal">{t('onboarding.upi_setup.optional')}</span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-space-md flex items-center pointer-events-none text-primary">
              <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
            </div>
            <input 
              id="upiInput"
              className="w-full h-16 pl-14 pr-4 rounded-xl bg-surface-container-lowest border-2 border-primary text-headline-sm font-headline-sm text-primary shadow-sm focus:border-secondary-container focus:ring-2 focus:ring-secondary-container outline-none transition-all placeholder:text-outline" 
              placeholder={t('onboarding.upi_setup.placeholder')} 
              type="text" 
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </div>
        </div>
        
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-body-sm text-on-surface-variant">
            {t('onboarding.upi_setup.info')}
          </p>
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant p-screen-margin-mobile shadow-md sticky bottom-0 z-20">
        <button 
          className="w-full h-14 bg-secondary-container text-on-secondary-fixed rounded-xl text-label-lg font-label-lg flex items-center justify-center space-x-space-xs shadow-sm active:scale-95 transition-all duration-150" 
          onClick={completeSetup}
        >
          <span className="material-symbols-outlined">check_circle</span>
          <span>{t('onboarding.upi_setup.complete')}</span>
        </button>
      </footer>
    </div>
  );
}
