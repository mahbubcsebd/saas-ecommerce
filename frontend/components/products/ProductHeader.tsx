"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/context/TranslationContext";
import { cn } from "@/lib/utils";
import { LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductHeaderProps {
  total: number;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export default function ProductHeader({ total, view, onViewChange }: ProductHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();

  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t('all_products', 'All Products')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('common', 'showing_results', { count: total.toString() })}
          </p>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('sort_by', 'Sort by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newest', 'Newest')}</SelectItem>
            <SelectItem value="price_asc">{t('price_low_high', 'Price: Low to High')}</SelectItem>
            <SelectItem value="price_desc">{t('price_high_low', 'Price: High to Low')}</SelectItem>
            <SelectItem value="rating_desc">{t('best_rating', 'Best Rating')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-none rounded-l-md px-2", view === 'grid' && "bg-secondary")}
            onClick={() => onViewChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <div className="w-[1px] h-8 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-none rounded-r-md px-2", view === 'list' && "bg-secondary")}
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
