import { cookies } from 'next/headers';

export async function getLocale() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('next-locale')?.value || 'en';
  return locale;
}

export async function getTranslations(locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  try {
    const res = await fetch(`${apiUrl}/translations/${locale}`, {
      next: {
        revalidate: 3600,
        tags: [`translations_${locale}`],
      },
    });
    const data = await res.json();
    return data.success ? data.data : {};
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
