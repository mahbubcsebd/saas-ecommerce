"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProductService } from "@/services/product.service";
import { Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  images: string[];
  category?: { name: string };
  variants: any[];
}

interface POSProductListProps {
  onAddToCart: (product: any, variant?: any) => void;
}

export function POSProductList({ onAddToCart }: POSProductListProps) {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const limit = 12;

  const lastProductElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchProducts(page);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, (session as any)?.accessToken]);

  const fetchProducts = async (currentPage: number) => {
    setLoading(true);
    try {
      const data = await ProductService.getProducts((session as any)?.accessToken as string, {
        search,
        limit: limit.toString(),
        page: currentPage.toString(),
        status: "PUBLISHED"
      });
      if (data.success) {
        if (currentPage === 1) {
            setProducts(data.data);
        } else {
            setProducts(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === limit);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
      if (product.variants && product.variants.length > 0) {
          setSelectedProduct(product);
      } else {
          onAddToCart(product);
      }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-9 bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-1 p-1 items-start content-start">
        {loading ? (
             <p className="text-center col-span-full">Loading...</p>
        ) : products.length === 0 ? (
            <p className="text-center col-span-full text-muted-foreground">No products found</p>
        ) : (
          products.map((product, index) => (
            <Card
              key={product.id}
              ref={index === products.length - 1 ? lastProductElementRef : null}
              className="cursor-pointer hover:border-primary transition-all hover:shadow-md group h-full flex flex-col"
              onClick={() => handleProductClick(product)}
            >
              <CardContent className="p-3 flex flex-col flex-1">
                <div className="relative aspect-square mb-2 bg-muted rounded-md overflow-hidden shrink-0">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No Image</div>
                  )}
                  {product.variants?.length > 0 && (
                      <div className="absolute top-1 right-1">
                          <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-background/80 backdrop-blur-xs font-semibold">
                              {product.variants.length} Vars
                          </Badge>
                      </div>
                  )}
                  {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <Badge variant="destructive" className="font-semibold shadow-sm">Out of Stock</Badge>
                      </div>
                  )}
                </div>

                <div className="flex flex-col flex-1 justify-between gap-1">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate" title={product.sku}>
                      {product.sku}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-primary text-sm sm:text-base">৳{product.sellingPrice}</span>
                    <span className={`text-[11px] sm:text-xs font-medium px-1.5 py-0.5 rounded-sm ${
                      product.stock > 10 
                        ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20" 
                        : product.stock > 0 
                          ? "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20"
                          : "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20"
                    }`}>
                      {product.stock > 0 ? `${product.stock} left` : '0 left'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Variant Selection Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Select Variant: {selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
                {selectedProduct?.variants.map((variant: any) => (
                    <div
                        key={variant.id}
                        className={`
                            flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-accent
                            ${variant.stock <= 0 ? 'opacity-50 pointer-events-none' : ''}
                        `}
                        onClick={() => {
                            if(variant.stock > 0) {
                                onAddToCart(selectedProduct, variant);
                                setSelectedProduct(null);
                            }
                        }}
                    >
                        <div>
                            <p className="font-medium">{variant.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold">৳{variant.sellingPrice || selectedProduct?.sellingPrice}</p>
                             <p className="text-xs text-muted-foreground">Stock: {variant.stock}</p>
                        </div>
                    </div>
                ))}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
