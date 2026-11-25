import * as React from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage, type SupportedLanguage } from '../i18n/language';

type LanguageSwitcherProps = {
  variant: 'menu' | 'settings';
  onLanguageChanged?: () => void;
};

const languageOptions: Array<{ value: SupportedLanguage; labelKey: 'language.chinese' | 'language.english' }> = [
  { value: 'zh-CN', labelKey: 'language.chinese' },
  { value: 'en', labelKey: 'language.english' },
];

function LanguageSwitcher({ variant, onLanguageChanged }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common');
  const selectId = `language-${variant}`;
  const currentLanguage = React.useMemo(
    () => normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
    [i18n.language, i18n.resolvedLanguage],
  );

  async function handleLanguageChange(language: SupportedLanguage): Promise<void> {
    if (language === currentLanguage) return;

    await i18n.changeLanguage(language);
    onLanguageChanged?.();
  }

  if (variant === 'menu') {
    return (
      <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" aria-hidden="true" />
          <label htmlFor={selectId} className="flex-1 text-sm text-gray-700 dark:text-gray-300">
            {t('language.label')}
          </label>
          <div className="relative max-w-36">
            <select
              id={selectId}
              value={currentLanguage}
              onChange={(event) => void handleLanguageChange(event.target.value as SupportedLanguage)}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value} lang={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={selectId}
        className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <Languages className="h-5 w-5" aria-hidden="true" />
        <span>{t('language.label')}</span>
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={currentLanguage}
          onChange={(event) => void handleLanguageChange(event.target.value as SupportedLanguage)}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-11 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
        >
          {languageOptions.map((option) => {
            return (
              <option key={option.value} value={option.value} lang={option.value}>
                {t(option.labelKey)}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default LanguageSwitcher;
