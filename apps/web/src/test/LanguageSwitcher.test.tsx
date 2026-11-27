import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import i18n from '../i18n';
import { LANGUAGE_STORAGE_KEY } from '../i18n/language';

describe('LanguageSwitcher', () => {
  it('switches both translations and the document language without reloading', async () => {
    render(<LanguageSwitcher variant="settings" />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), {
      target: { value: 'zh-CN' },
    });

    await waitFor(() => {
      expect(i18n.resolvedLanguage).toBe('zh-CN');
      expect(document.documentElement.lang).toBe('zh-CN');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('zh-CN');
      expect(screen.getByText('语言')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: '语言' })).toHaveValue('zh-CN');
    });
  });

  it('keeps menu and settings variants synchronized', async () => {
    render(
      <>
        <LanguageSwitcher variant="menu" />
        <LanguageSwitcher variant="settings" />
      </>,
    );

    const languageSelects = screen.getAllByRole('combobox', { name: 'Language' });
    fireEvent.change(languageSelects[0], { target: { value: 'zh-CN' } });

    await waitFor(() => {
      expect(screen.getAllByRole('combobox', { name: '语言' })).toHaveLength(2);
      for (const select of screen.getAllByRole('combobox', { name: '语言' })) {
        expect(select).toHaveValue('zh-CN');
      }
    });
  });
});
