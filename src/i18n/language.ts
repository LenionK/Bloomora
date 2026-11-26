import { getLocales } from 'expo-localization';
import { en, Strings } from './en';
import { it } from './it';

export type Language = 'en' | 'it';
// System follows the phone's language.
export type LanguageSetting = 'system' | Language;

const STRINGS: Record<Language, Strings> = { en, it };

// Italian when the phone is in Italian, English for any other language.
export function getPhoneLanguage(): Language {
  try {
    return getLocales()[0]?.languageCode === 'it' ? 'it' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveLanguage(setting: LanguageSetting): Language {
  return setting === 'system' ? getPhoneLanguage() : setting;
}

let currentLanguage: Language = getPhoneLanguage();

export function setCurrentLanguage(language: Language): void {
  currentLanguage = language;
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

// For code outside the screens, such as the notifications. Screens use
// useStrings, so they are drawn again when the language changes.
export function getStrings(language: Language = currentLanguage): Strings {
  return STRINGS[language];
}
