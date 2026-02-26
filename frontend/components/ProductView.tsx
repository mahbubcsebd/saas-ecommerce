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
import { Product } from "@/types/product";
import { LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import ProductCard from "./ProductCard";

interface ProductViewProps {
  products: Product[];
}

export default function ProductView({ products }: ProductViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"grid" | "list">("grid");
  const { locale } = useTranslations();

  // Get current sort from URL or default
  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header: Sort & Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
        <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{products.length}</span> results
        </p>

        <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating_desc">Best Rating</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-none rounded-l-md px-2", view === 'grid' && "bg-secondary")}
                    onClick={() => setView('grid')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <div className="w-[1px] h-8 bg-border" />
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-none rounded-r-md px-2", view === 'list' && "bg-secondary")}
                    onClick={() => setView('list')}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No products found matching your filters.
        </div>
      ) : (
        <div className={cn(
            "grid gap-6",
            view === 'grid'
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
        )}>
          {products.map((product) => (
             <ProductCard key={product.id} product={product} layout={view} />
          ))}
        </div>
      )}
    </div>
  );
}
