import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalized(data: any, locale: string, field: string = 'name') {
  if (!data) return '';

  // 1. Check current locale translation
  if (data.translations && Array.isArray(data.translations)) {
    const translation = data.translations.find((t: any) => t.langCode === locale);
    if (translation && translation[field]) {
      return translation[field];
    }
  }

  // 2. Check fallback to 'en' translation
  if (locale !== 'en' && data.translations && Array.isArray(data.translations)) {
    const enTranslation = data.translations.find((t: any) => t.langCode === 'en');
    if (enTranslation && enTranslation[field]) {
      return enTranslation[field];
    }
  }

  // 3. Fallback to main field
  return data[field] || '';
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '/placeholder.jpg';
  
  // If it's already an absolute URL or data URI, return it as is
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  
  // If it has a leading slash, Next.js can resolve it locally
  if (path.startsWith('/')) {
    return path;
  }
  
  // Fallback settings matches backend's default environment values
  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://res.cloudinary.com/dfigg4e5e/image/upload';
  const prefix = process.env.NEXT_PUBLIC_IMAGE_FOLDER_PREFIX || 'ecommerce';
  
  // 1. Clean the path from any versioning patterns (e.g. v1716.../)
  let cleanedPath = path.replace(/^v\d+\//, '');
  
  // 2. Clean the path from redundant/duplicated prefix patterns
  if (prefix) {
    if (cleanedPath.startsWith(prefix + '/')) {
      cleanedPath = cleanedPath.substring(prefix.length + 1);
    }
    cleanedPath = cleanedPath.replace(/^v\d+\//, '');
    if (cleanedPath.startsWith(prefix + '/')) {
      cleanedPath = cleanedPath.substring(prefix.length + 1);
    }
  }
  
  const cleanBase = imageBaseUrl.endsWith('/') ? imageBaseUrl.slice(0, -1) : imageBaseUrl;
  const relativePath = prefix ? `${prefix}/${cleanedPath}` : cleanedPath;
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  
  return `${cleanBase}${cleanPath}`;
}

