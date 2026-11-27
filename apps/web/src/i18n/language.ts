export const supportedLanguages = ['en', 'zh-CN'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const LANGUAGE_STORAGE_KEY = 'photos.language';

export function normalizeLanguage(language: string | null | undefined): SupportedLanguage {
  if (language?.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }

  return 'en';
}

export function localeForLanguage(language: string | null | undefined): string {
  return normalizeLanguage(language) === 'zh-CN' ? 'zh-CN' : 'en-US';
}
