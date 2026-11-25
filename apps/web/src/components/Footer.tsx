import { Link } from 'react-router-dom';
import { config } from '../config';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-4 flex justify-center gap-6">
          <Link 
            to="/usage" 
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            {t('footer.usage')}
          </Link>
          <Link 
            to="/privacy" 
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            {t('footer.privacy')}
          </Link>
        </div>
        <p className="text-gray-400 text-sm">
          {t('footer.copyright', { year: new Date().getFullYear(), holder: config.copyrightHolder })}
        </p>
      </div>
    </footer>
  );
}
