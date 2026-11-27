import { useForm, ValidationError } from '@formspree/react';
import { useTranslation } from 'react-i18next';

interface ContactFormProps {
  formId: string;
}

export default function ContactForm({ formId }: ContactFormProps) {
  const [state, handleSubmit] = useForm(formId);
  const { t } = useTranslation('common');

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto space-y-6"
    >
      {state.succeeded ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-center">
          <p className="font-medium">{t('contact.thanks')}</p>
          <p className="text-sm mt-1">{t('contact.replySoon')}</p>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('contact.name')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              disabled={state.submitting}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <ValidationError 
              prefix={t('contact.name')}
              field="name"
              errors={state.errors}
              className="text-red-600 text-sm mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('contact.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              disabled={state.submitting}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <ValidationError 
              prefix={t('contact.email')}
              field="email"
              errors={state.errors}
              className="text-red-600 text-sm mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('contact.message')}
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              disabled={state.submitting}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <ValidationError 
              prefix={t('contact.message')}
              field="message"
              errors={state.errors}
              className="text-red-600 text-sm mt-1"
            />
          </div>
          
          <button
            type="submit"
            disabled={state.submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.submitting ? t('states.sending') : t('contact.send')}
          </button>
        </>
      )}
    </form>
  );
}
