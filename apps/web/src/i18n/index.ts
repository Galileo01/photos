import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import commonEn from './locales/en/common.json';
import accountEn from './locales/en/account.json';
import eventsEn from './locales/en/events.json';
import photosEn from './locales/en/photos.json';
import adminEn from './locales/en/admin.json';
import legalEn from './locales/en/legal.json';
import commonZhCn from './locales/zh-CN/common.json';
import accountZhCn from './locales/zh-CN/account.json';
import eventsZhCn from './locales/zh-CN/events.json';
import photosZhCn from './locales/zh-CN/photos.json';
import adminZhCn from './locales/zh-CN/admin.json';
import legalZhCn from './locales/zh-CN/legal.json';
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, supportedLanguages } from './language';

export const defaultNamespace = 'common';

export const resources = {
  en: {
    common: commonEn,
    account: accountEn,
    events: eventsEn,
    photos: photosEn,
    admin: adminEn,
    legal: legalEn,
  },
  'zh-CN': {
    common: commonZhCn,
    account: accountZhCn,
    events: eventsZhCn,
    photos: photosZhCn,
    admin: adminZhCn,
    legal: legalZhCn,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: [...supportedLanguages],
    fallbackLng: 'en',
    defaultNS: defaultNamespace,
    ns: ['common', 'account', 'events', 'photos', 'admin', 'legal'],
    returnNull: false,
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeLanguage,
    },
    react: {
      useSuspense: false,
    },
  });

function applyDocumentLanguage(language: string): void {
  document.documentElement.lang = normalizeLanguage(language);
}

applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on('languageChanged', applyDocumentLanguage);

export default i18n;
