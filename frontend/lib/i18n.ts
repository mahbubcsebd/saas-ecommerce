import { cookies } from 'next/headers';
import { api } from './api-client';

export async function getLocale() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('next-locale')?.value || 'en';
  return locale;
}

export async function getTranslations(locale: string) {
  try {
    return await api.get<any>(`/translations/${locale}`, {
      revalidate: 3600,
      tags: [`translations_${locale}`],
    });
  } catch (error) {
    console.error('Failed to fetch translations on server', error);
    return {};
  }
}

export function createT(translations: any) {
  return (namespace: string, key: string, defaultValue?: string) => {
    return translations[namespace]?.[key] || defaultValue || key;
  };
}
