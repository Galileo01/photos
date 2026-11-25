import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface EventPasswordFormProps {
  eventName: string;
  onSubmit: (password: string) => Promise<void>;
}

/**
 * Password-protected event login form
 */
export function EventPasswordForm({ eventName, onSubmit }: EventPasswordFormProps) {
  const { t } = useTranslation('events');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(false);

    try {
      await onSubmit(password);
    } catch (err) {
      setLoginError(true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{eventName}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('passwordForm.description')}
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('passwordForm.placeholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
            disabled={isSubmitting}
          />
          
          {loginError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
              {t('passwordForm.invalid')}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('passwordForm.unlocking') : t('passwordForm.unlock')}
          </button>
        </form>
        
        <Link to="/events" className="block mt-4 text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          {t('passwordForm.back')}
        </Link>
      </div>
    </div>
  );
}
