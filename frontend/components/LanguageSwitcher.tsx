'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/context/TranslationContext';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLanguages } from '@/lib/fetchers';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations();
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const data = await getLanguages();
        if (data) {
          setLanguages(data);
        }
      } catch (error) {
        console.error('Failed to fetch languages');
      }
    };
    fetchLanguages();
  }, []);

  const currentLang = languages.find((l) => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="sr-only">Toggle language</span>
          {currentLang?.flag ? (
            <span className="text-lg">{currentLang.flag}</span>
          ) : (
            <Globe className="h-[1.2rem] w-[1.2rem]" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => setLocale(lang.code)}>
            <span className="mr-2 text-lg">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
