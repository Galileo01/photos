import * as React from 'react';
import { useTranslation } from 'react-i18next';

function DevelopmentModeBadge(): React.ReactElement | null {
  const { t } = useTranslation('common');

  if (!import.meta.env.DEV) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-0 z-[80] -translate-x-1/2 rounded-b-md border-x border-b border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-medium leading-4 text-orange-600 shadow-sm dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300">
      {t('states.developmentMode')}
    </div>
  );
}

export default DevelopmentModeBadge;
