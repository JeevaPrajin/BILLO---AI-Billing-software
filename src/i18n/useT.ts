import { useCallback } from 'react';
import { useAppContext } from '../store/AppContext';
import { Language } from '../store/types';
import en from './en';
import ta from './ta';
import hi from './hi';

export type { Language };

const dictionaries: Record<Language, Record<string, string>> = {
  en,
  ta,
  hi,
};

export interface SupportedLanguage {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export function useT() {
  const context = useAppContext();
  const language: Language = (context?.settings?.language as Language) || 'en';

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = dictionaries[language] || en;
      let text = activeDict[key];

      // Fallback to English if key is missing in active language
      if (text === undefined) {
        text = en[key];
      }

      // Fallback to key itself if missing everywhere
      if (text === undefined) {
        text = key;
      }

      // Replace {param} placeholders if parameters are provided
      if (params) {
        return text.replace(/{([a-zA-Z0-9_]+)}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? String(params[paramKey]) : match;
        });
      }

      return text;
    },
    [language]
  );

  const setLanguage = useCallback(
    async (newLang: Language) => {
      if (context?.updateSettings) {
        await context.updateSettings({ language: newLang });
      }
    },
    [context]
  );

  return {
    t,
    language,
    setLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}

export default useT;
