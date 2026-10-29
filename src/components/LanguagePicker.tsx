import React from 'react';
import { useT, SUPPORTED_LANGUAGES } from '../i18n/useT';

interface LanguagePickerProps {
  className?: string;
  variant?: 'compact' | 'segmented';
}

export default function LanguagePicker({ className = '', variant = 'segmented' }: LanguagePickerProps) {
  const { language, setLanguage } = useT();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant ${className}`}>
        <span className="material-symbols-outlined text-primary text-base px-1">translate</span>
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-label-sm font-label-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
              }`}
            >
              {lang.nativeLabel}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 gap-2 w-full p-1 bg-surface-container-low rounded-xl border border-outline-variant ${className}`}>
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`py-2 px-3 rounded-lg text-center transition-all duration-150 flex flex-col items-center justify-center ${
              isActive
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'bg-surface-container-lowest text-primary hover:bg-surface-container-high border border-outline-variant/60'
            }`}
          >
            <span className="text-label-md font-bold leading-tight">{lang.nativeLabel}</span>
            <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
              {lang.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
