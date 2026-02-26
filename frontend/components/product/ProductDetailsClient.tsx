"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/context/TranslationContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/lib/cart-context";
import { cn, getLocalized } from "@/lib/utils";
import { Product, ProductVariant } from "@/types/product";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Reviews from "../Reviews";
import ProductGallery from "./ProductGallery";

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { t, locale } = useTranslations();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realtimeProduct, setRealtimeProduct] = useState<Product>(product);

  // Fetch real-time data on mount to ensure stock is fresh
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
        const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

        const res = await fetch(`${apiUrl}/products/${product.slug}`);
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
                setRealtimeProduct(data.data);
            }
        }
      } catch (error) {
        console.error("Failed to fetch real-time product data:", error);
      }
    };
    fetchProduct();
  }, [product.slug]);

  // Extract all unique attribute keys and their values
  const attributeOptions = useMemo(() => {
    if (!realtimeProduct.variants || realtimeProduct.variants.length === 0) return {};

    const options: Record<string, Set<string>> = {};

    realtimeProduct.variants.forEach((variant) => {
      if (Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          const key = attr.type;
          const value = attr.value;
          if (!options[key]) options[key] = new Set();
          options[key].add(value);
        });
      } else if (variant.attributes && typeof variant.attributes === 'object') {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!options[key]) options[key] = new Set();
          options[key].add(value as string);
        });
      }
    });

    return options;
  }, [realtimeProduct.variants]);

  // Get available options for a specific attribute based on current selections
  // Returns Set if valid, but we won't use it to disable buttons anymore
  const getAvailableOptions = (attributeKey: string): Set<string> => {
    if (!realtimeProduct.variants) return new Set();

    // Filter variants that match currently selected attributes (except the one we're checking)
    const otherSelections = Object.entries(selectedAttributes)
      .filter(([key]) => key !== attributeKey);

    const matchingVariants = realtimeProduct.variants.filter(variant => {
      if (!variant.attributes) return false;
      return otherSelections.every(([key, value]) => {
        if (Array.isArray(variant.attributes)) {
           const attr = variant.attributes.find((a) => a.type === key);
           return attr && attr.value === value;
        }
        return (variant.attributes as Record<string, string>)[key] === value;
      });
    });

    // Return unique values for this attribute from matching variants
    const available = new Set<string>();
    matchingVariants.forEach(variant => {
      let val: string | undefined;
      if (Array.isArray(variant.attributes)) {
         val = variant.attributes.find((a) => a.type === attributeKey)?.value;
      } else {
         val = (variant.attributes as Record<string, string>)?.[attributeKey];
      }

      if (val) available.add(val);
    });

    return available;
  };

  // Find variant that matches current selections
  const selectedVariant = useMemo(() => {
    if (!realtimeProduct.variants || Object.keys(selectedAttributes).length === 0) return null;

    return realtimeProduct.variants.find(variant => {
      if (!variant.attributes) return false;
      return Object.entries(selectedAttributes).every(
        ([key, value]) => {
           if (Array.isArray(variant.attributes)) {
               const attr = variant.attributes.find((a) => a.type === key);
               return attr && attr.value === value;
           }
           return (variant.attributes as Record<string, string>)[key] === value;
        }
      );
    });
  }, [realtimeProduct.variants, selectedAttributes]);

  // Get color-to-image mapping for visual color selector
  const colorVariants = useMemo(() => {
    if (!realtimeProduct.variants) return [];

    const colorKey = Object.keys(attributeOptions).find(key =>
      key.toLowerCase() === 'color' || key.toLowerCase() === 'colour'
    );

    if (!colorKey) return [];

    // For each color, get one representative variant with images
    const colorMap = new Map<string, ProductVariant>();
    realtimeProduct.variants.forEach(variant => {
      let color: string | undefined;
      if (Array.isArray(variant.attributes)) {
          color = variant.attributes.find((a) => a.type === colorKey)?.value;
      } else {
          color = (variant.attributes as Record<string, string>)?.[colorKey];
      }

      if (color && variant.images?.length > 0 && !colorMap.has(color)) {
        colorMap.set(color, variant);
      }
    });

    return Array.from(colorMap.values());
  }, [realtimeProduct.variants, attributeOptions]);

  const handleAttributeSelect = (key: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [key]: value };

    // Check if this new combination exists
    const validVariant = realtimeProduct.variants?.find(variant => {
        if (!variant.attributes) return false;
        return Object.entries(newAttributes).every(([attrKey, attrValue]) => {
             if (Array.isArray(variant.attributes)) {
                 const attr = variant.attributes.find((a) => a.type === attrKey);
                 return attr && attr.value === attrValue;
             }
             return (variant.attributes as Record<string, string>)[attrKey] === attrValue;
        });
    });

    if (validVariant) {
        // Valid combination, just update
        setSelectedAttributes(newAttributes);
    } else {
        // ... (logic comment) ...
        const potentialVariant = realtimeProduct.variants?.find(v => {
             if (Array.isArray(v.attributes)) {
                 const attr = v.attributes.find((a) => a.type === key);
                 return attr && attr.value === value;
             }
             return (v.attributes as Record<string, string>)?.[key] === value;
        });

        if (potentialVariant && potentialVariant.attributes) {
            // ... (logic comment) ...

            const adjustedAttributes: Record<string, string> = { [key]: value };

            // Try to keep others if they exist in SOME variant with the new selection
            Object.entries(selectedAttributes).forEach(([existingKey, existingValue]) => {
                if (existingKey === key) return;

                // Check if there is a variant that has BOTH (New Key=Value) AND (Existing Key=Value)
                const compatible = realtimeProduct.variants?.some(v => {
                    let val1, val2;
                     if (Array.isArray(v.attributes)) {
                         val1 = v.attributes.find((a) => a.type === key)?.value;
                         val2 = v.attributes.find((a) => a.type === existingKey)?.value;
                     } else {
                         val1 = (v.attributes as Record<string, string>)?.[key];
                         val2 = (v.attributes as Record<string, string>)?.[existingKey];
                     }
                    return val1 === value && val2 === existingValue;
                });

                if (compatible) {
                    adjustedAttributes[existingKey] = existingValue;
                }
                // If not compatible, we effectively "deselect" it (don't add to adjustedAttributes)
            });

            setSelectedAttributes(adjustedAttributes);
        } else {
            // Should not happen if the option came from the list
            setSelectedAttributes(newAttributes);
        }
    }

    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Separate Color from other attributes
  const colorKey = Object.keys(attributeOptions).find(key =>
    key.toLowerCase() === 'color' || key.toLowerCase() === 'colour'
  );

  const isColorVisible = colorKey && colorVariants.length > 0;

  const handleAddToCart = async () => {
    // ... (rest of function)
    setErrorMessage(null);
    setSuccessMessage(null);

    // Check if product has variants but none selected
    if (realtimeProduct.variants && realtimeProduct.variants.length > 0) {
       // Check if all attributes are selected
       const allKeys = Object.keys(attributeOptions);

       // Filter out Color if it's not visible
       const requiredKeys = allKeys.filter(k => {
           if (k === colorKey && !isColorVisible) return false;
           return true;
       });

       const selectedKeys = Object.keys(selectedAttributes);
       const missingKeys = requiredKeys.filter(k => !selectedKeys.includes(k));

       if (missingKeys.length > 0) {
           setErrorMessage(`Please select ${missingKeys.join(', ')}`);
           return;
       }

       if (!selectedVariant) {
           setErrorMessage("Selected combination is unavailable.");
           return;
       }
    }

    setLoading(true);
    try {
        await addToCart(realtimeProduct.id, 1, selectedVariant?.id);
        setSuccessMessage("Added to cart successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
        console.error(error);
        setErrorMessage("Failed to add to cart.");
    } finally {
        setLoading(false);
    }
  };

  // Determine current display values
  const currentPrice = selectedVariant?.sellingPrice ?? realtimeProduct.sellingPrice;
  const currentBasePrice = selectedVariant?.basePrice ?? realtimeProduct.basePrice;
  const currentStock = selectedVariant?.stock ?? realtimeProduct.stock;
  const currentImages = selectedVariant?.images?.length ? selectedVariant.images : realtimeProduct.images;
  const isOutOfStock = currentStock <= 0;

  const otherAttributes = Object.keys(attributeOptions).filter(key => key !== colorKey);

  // Localized Content
  const productName = getLocalized(realtimeProduct, locale, 'name');
  const productDesc = getLocalized(realtimeProduct, locale, 'description');
  const categoryName = typeof realtimeProduct.category === 'object' ? getLocalized(realtimeProduct.category, locale, 'name') : realtimeProduct.category;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <ProductGallery images={currentImages} title={productName} />

      {/* Details */}
      <div className="flex flex-col gap-6">
        <div>
          <Badge variant="secondary" className="mb-2">
              {categoryName}
          </Badge>
          <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{productName}</h1>
              {realtimeProduct.discount && (
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                      {realtimeProduct.discount.type === 'PERCENTAGE'
                        ? `-${realtimeProduct.discount.value}% ${t('product', 'off', { defaultValue: 'OFF' })}`
                        : realtimeProduct.discount.type === 'FLAT'
                            ? `${formatPrice(realtimeProduct.discount.value)} ${t('product', 'off', { defaultValue: 'OFF' })}`
                            : t('product', 'sale', { defaultValue: 'SALE' })}
                  </Badge>
              )}
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</p>
            {currentBasePrice > currentPrice && (
              <p className="text-lg text-muted-foreground line-through">
                {formatPrice(currentBasePrice)}
              </p>
            )}
          </div>
        </div>

        <div
          className="prose prose-zinc dark:prose-invert max-w-none text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: productDesc }}
        />

        {/* Color Selection with Images */}
        {colorKey && colorVariants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{colorKey}:</h4>
              <span className="text-sm text-muted-foreground">
                {selectedAttributes[colorKey] || t('product', 'selectColor', { defaultValue: 'Select a color' })}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {colorVariants.map((variant) => {
                let colorValue: string | undefined;
                if (Array.isArray(variant.attributes)) {
                    colorValue = variant.attributes.find((a) => a.type === colorKey)?.value;
                } else {
                    colorValue = (variant.attributes as Record<string, string>)?.[colorKey];
                }

                if (!colorValue) return null;

                const isSelected = selectedAttributes[colorKey] === colorValue;
                const isCompatible = getAvailableOptions(colorKey).has(colorValue);

                return (
                  <button
                    key={variant.id}
                    onClick={() => handleAttributeSelect(colorKey, colorValue)}
                    className={cn(
                      "relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all",
                      isSelected && "ring-2 ring-primary ring-offset-2 border-primary",
                      !isSelected && isCompatible && "border-muted hover:border-primary/50",
                      !isSelected && !isCompatible && "border-muted opacity-50 grayscale hover:opacity-100 hover:grayscale-0"
                    )}
                    title={colorValue}
                  >
                    {variant.images?.[0] ? (
                      <Image
                        src={variant.images[0]}
                        alt={colorValue}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs bg-muted">
                        {colorValue}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Attributes (Size, Storage, etc) */}
        {otherAttributes.map(attributeKey => {
          const options = getAvailableOptions(attributeKey);

          return (
            <div key={attributeKey} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{attributeKey}:</h4>
                <span className="text-sm text-muted-foreground">
                  {selectedAttributes[attributeKey] || `${t('product', 'select', { defaultValue: 'Select' })} ${attributeKey.toLowerCase()}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(attributeOptions[attributeKey]).map(value => {
                  const isSelected = selectedAttributes[attributeKey] === value;
                  const isCompatible = options.has(value);

                  return (
                    <button
                      key={value}
                      onClick={() => handleAttributeSelect(attributeKey, value)}
                      className={cn(
                        "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-w-[60px]",
                        isSelected && "border-primary bg-primary text-primary-foreground shadow-sm",
                        !isSelected && isCompatible && "border-input bg-background hover:border-primary hover:bg-accent",
                        !isSelected && !isCompatible && "border-input bg-background opacity-50 hover:opacity-100 hover:bg-accent"
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Stock Status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isOutOfStock ? "bg-destructive" : currentStock < 10 ? "bg-yellow-500" : "bg-green-500"
          )} />
          <span className={cn(
            "font-medium",
            isOutOfStock && "text-destructive"
          )}>
            {isOutOfStock ? t('product', 'outOfStock', { defaultValue: 'Out of Stock' }) : currentStock < 10 ? t('product', 'onlyLeft', { defaultValue: `Only ${currentStock} left` }).replace('{{count}}', String(currentStock)) : t('product', 'inStock', { defaultValue: 'In Stock' })}
          </span>
        </div>

        {/* Add to Cart */}
        <div className="space-y-2">
            <Button
                size="lg"
                className="w-full text-base py-6"
                disabled={isOutOfStock || loading}
                onClick={handleAddToCart}
            >
                {isOutOfStock ? t('product', 'outOfStock', { defaultValue: 'Out of Stock' }) : loading ? t('common', 'loading', { defaultValue: 'Adding...' }) : t('product', 'addToCart', { defaultValue: 'Add to Cart' })}
            </Button>
            <Button
                variant="outline"
                size="lg"
                className="w-full text-base py-6 gap-2"
                onClick={() => toggleWishlist(realtimeProduct.id)}
            >
                <Heart className={cn("h-5 w-5", isInWishlist(realtimeProduct.id) && "fill-current text-red-500")} />
                {isInWishlist(realtimeProduct.id) ? t('product', 'inWishlist', { defaultValue: 'In Wishlist' }) : t('product', 'addToWishlist', { defaultValue: 'Add to Wishlist' })}
            </Button>
            {errorMessage && (
                <p className="text-sm text-destructive text-center font-medium">{errorMessage}</p>
            )}
            {successMessage && (
                <p className="text-sm text-green-600 text-center font-medium">{successMessage}</p>
            )}
        </div>

        {/* Product Details */}
        <div className="mt-4 border-t pt-6 space-y-2">
          <h3 className="font-semibold text-sm">{t('product', 'productDetails', { defaultValue: 'Product Details' })}</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            {realtimeProduct.brand && <li>{t('product', 'brand', { defaultValue: 'Brand' })}: <span className="text-foreground">{realtimeProduct.brand}</span></li>}
            <li>{t('product', 'sku', { defaultValue: 'SKU' })}: <span className="text-foreground">{selectedVariant?.sku || realtimeProduct.slug}</span></li>
            {realtimeProduct.tags.length > 0 && (
              <li>{t('product', 'tags', { defaultValue: 'Tags' })}: <span className="text-foreground">{realtimeProduct.tags.join(', ')}</span></li>
            )}
          </ul>
        </div>

        {/* Specifications */}
        {realtimeProduct.specifications && Object.keys(realtimeProduct.specifications).length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-sm mb-3">{t('product', 'specifications', { defaultValue: 'Specifications' })}</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {Object.entries(realtimeProduct.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8 border-t pt-8">
          <Reviews productId={realtimeProduct.id} />
        </div>
      </div>
    </div>
  );
}
