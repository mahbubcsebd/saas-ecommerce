import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalized(data: any, locale: string, field: string = 'name') {
    if (!data) return '';

    // 1. Check direct field (if current locale matches default or source)
    // This is tricky if we don't know default. Assuming 'en' is default.
    // If locale is 'en', return data[field]

    // 2. Check translations array
    if (data.translations && Array.isArray(data.translations)) {
        const translation = data.translations.find((t: any) => t.langCode === locale);
        if (translation && translation[field]) {
            return translation[field];
        }
    }

    // 3. Fallback to main field
    return data[field] || '';
}
