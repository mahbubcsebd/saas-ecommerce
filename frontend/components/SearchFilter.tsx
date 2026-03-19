'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SearchFilterProps {
  initialSearch?: string;
  initialCategory?: string;
}

export default function SearchFilter({ initialSearch, initialCategory }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || searchParams.get('search') || '');
  const [category, setCategory] = useState(initialCategory || searchParams.get('category') || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, category]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    router.push(`/?${params.toString()}`);
  };

  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Lifestyle'];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
      <div className="flex-1 w-full">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <Button
          variant={category === '' ? 'default' : 'outline'}
          onClick={() => setCategory('')}
          size="sm"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            onClick={() => setCategory(cat)}
            size="sm"
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
