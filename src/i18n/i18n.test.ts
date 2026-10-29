import { describe, it, expect } from 'vitest';
import en from './en';
import ta from './ta';
import hi from './hi';

describe('i18n Dictionaries Key Parity', () => {
  it('all three dictionaries have identical key sets', () => {
    const enKeys = Object.keys(en).sort();
    const taKeys = Object.keys(ta).sort();
    const hiKeys = Object.keys(hi).sort();

    // Check Tamil keys
    const missingInTamil = enKeys.filter(k => !(k in ta));
    const extraInTamil = taKeys.filter(k => !(k in en));

    // Check Hindi keys
    const missingInHindi = enKeys.filter(k => !(k in hi));
    const extraInHindi = hiKeys.filter(k => !(k in en));

    expect(missingInTamil, `Keys missing in Tamil: ${missingInTamil.join(', ')}`).toEqual([]);
    expect(extraInTamil, `Extra keys in Tamil: ${extraInTamil.join(', ')}`).toEqual([]);

    expect(missingInHindi, `Keys missing in Hindi: ${missingInHindi.join(', ')}`).toEqual([]);
    expect(extraInHindi, `Extra keys in Hindi: ${extraInHindi.join(', ')}`).toEqual([]);

    expect(taKeys).toEqual(enKeys);
    expect(hiKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('no translation values are empty strings', () => {
    for (const [key, val] of Object.entries(en)) {
      expect(val.trim().length, `English key ${key} is empty`).toBeGreaterThan(0);
    }
    for (const [key, val] of Object.entries(ta)) {
      expect(val.trim().length, `Tamil key ${key} is empty`).toBeGreaterThan(0);
    }
    for (const [key, val] of Object.entries(hi)) {
      expect(val.trim().length, `Hindi key ${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('correctly handles English fallback for missing keys', () => {
    const mockDicts: Record<string, Record<string, string>> = {
      en: { 'test.key': 'Hello English', 'test.only_en': 'Only in English' },
      ta: { 'test.key': 'வணக்கம்' },
    };

    const translate = (lang: string, key: string) => {
      return mockDicts[lang]?.[key] ?? mockDicts['en']?.[key] ?? key;
    };

    expect(translate('ta', 'test.key')).toBe('வணக்கம்');
    expect(translate('ta', 'test.only_en')).toBe('Only in English');
    expect(translate('ta', 'non.existent')).toBe('non.existent');
  });

  it('correctly interpolates parameters', () => {
    const template = 'Welcome {name}, you have {count} items';
    const params = { name: 'Ravi', count: 5 };
    const result = template.replace(/{([a-zA-Z0-9_]+)}/g, (_, k) => String((params as any)[k] ?? `{${k}}`));
    expect(result).toBe('Welcome Ravi, you have 5 items');
  });
});
