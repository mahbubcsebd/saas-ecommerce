'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from '@/context/TranslationContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/hooks/useCurrency';
import { trackAddToCart, trackViewContent } from '@/lib/analytics';
import { cn, getLocalized } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Product, ProductVariant } from '@/types/product';
import { CreditCard, Heart, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Reviews from '../Reviews';
import ProductGallery from './ProductGallery';

interface ProductDetailsClientProps {
  product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const { t, locale } = useTranslations();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [realtimeProduct, setRealtimeProduct] = useState<Product>(product);
  const [qty, setQty] = useState<number | string>(1);
  const router = useRouter();
  const [shippingPolicy, setShippingPolicy] = useState<string | null>(null);
  const [returnPolicy, setReturnPolicy] = useState<string | null>(null);

  // Determine if the product has specifications to show
  const hasSpecifications = Boolean(
    (realtimeProduct.specifications && Object.keys(realtimeProduct.specifications).length > 0) ||
    realtimeProduct.brand ||
    realtimeProduct.weight
  );

  // Fetch real-time data on mount to ensure stock is fresh
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
        const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

        // Fetch product and settings concurrently
        const [productRes, settingsRes] = await Promise.all([
          fetch(`${apiUrl}/products/${product.slug}`),
          fetch(`${apiUrl}/settings/public`),
        ]);

        if (productRes.ok) {
          const data = await productRes.json();
          if (data.success && data.data) {
            setRealtimeProduct(data.data);
          }
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.success && data.data?.legal) {
            if (data.data.legal.shippingPolicy) setShippingPolicy(data.data.legal.shippingPolicy);
            if (data.data.legal.returnPolicy) setReturnPolicy(data.data.legal.returnPolicy);
          }
        }
      } catch (error) {
        console.error('Failed to fetch real-time product data:', error);
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
    const otherSelections = Object.entries(selectedAttributes).filter(
      ([key]) => key !== attributeKey
    );

    const matchingVariants = realtimeProduct.variants.filter((variant) => {
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
    matchingVariants.forEach((variant) => {
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

    return realtimeProduct.variants.find((variant) => {
      if (!variant.attributes) return false;
      return Object.entries(selectedAttributes).every(([key, value]) => {
        if (Array.isArray(variant.attributes)) {
          const attr = variant.attributes.find((a) => a.type === key);
          return attr && attr.value === value;
        }
        return (variant.attributes as Record<string, string>)[key] === value;
      });
    });
  }, [realtimeProduct.variants, selectedAttributes]);

  // Get color-to-image mapping for visual color selector
  const colorVariants = useMemo(() => {
    if (!realtimeProduct.variants) return [];

    const colorKey = Object.keys(attributeOptions).find(
      (key) => key.toLowerCase() === 'color' || key.toLowerCase() === 'colour'
    );

    if (!colorKey) return [];

    // For each color, get one representative variant with images
    const colorMap = new Map<string, ProductVariant>();
    realtimeProduct.variants.forEach((variant) => {
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
    const validVariant = realtimeProduct.variants?.find((variant) => {
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
      const potentialVariant = realtimeProduct.variants?.find((v) => {
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
          const compatible = realtimeProduct.variants?.some((v) => {
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
    setQty(1); // Reset qty when variant changes
  };

  // Separate Color from other attributes
  const colorKey = Object.keys(attributeOptions).find(
    (key) => key.toLowerCase() === 'color' || key.toLowerCase() === 'colour'
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
      const requiredKeys = allKeys.filter((k) => {
        if (k === colorKey && !isColorVisible) return false;
        return true;
      });

      const selectedKeys = Object.keys(selectedAttributes);
      const missingKeys = requiredKeys.filter((k) => !selectedKeys.includes(k));

      if (missingKeys.length > 0) {
        setErrorMessage(
          t('product', 'pleaseSelect', {
            missing: missingKeys.join(', '),
            defaultValue: `Please select ${missingKeys.join(', ')}`,
          })
        );
        return;
      }

      if (!selectedVariant) {
        setErrorMessage(
          t('product', 'combinationUnavailable', {
            defaultValue: 'Selected combination is unavailable.',
          })
        );
        return;
      }
    }

    setLoading(true);
    try {
      await addToCart(realtimeProduct.id, Number(qty) || 1, selectedVariant?.id);

      // Track AddToCart
      trackAddToCart({
        id: realtimeProduct.id,
        name: productName,
        price: currentPrice,
        quantity: Number(qty) || 1,
        category: categoryName,
        variant: selectedVariant?.name,
      });

      setSuccessMessage(
        t('common', 'addedToCart', { defaultValue: 'Added to cart successfully!' })
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(
        error.message ||
          t('common', 'failedToAddToCart', { defaultValue: 'Failed to add to cart.' })
      );
    } finally {
      setLoading(false);
    }
  };

  // Determine current display values
  const currentPrice = selectedVariant?.sellingPrice ?? realtimeProduct.sellingPrice;
  const currentBasePrice = selectedVariant?.basePrice ?? realtimeProduct.basePrice;
  const currentStock = selectedVariant?.stock ?? realtimeProduct.stock;
  const currentImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : realtimeProduct.images;
  const isOutOfStock = currentStock <= 0;

  const otherAttributes = Object.keys(attributeOptions).filter((key) => key !== colorKey);

  // Localized Content
  const productName = getLocalized(realtimeProduct, locale, 'name');
  const productDesc = getLocalized(realtimeProduct, locale, 'description');
  const categoryName =
    typeof realtimeProduct.category === 'object'
      ? getLocalized(realtimeProduct.category, locale, 'name')
      : realtimeProduct.category;

  // Track ViewContent/view_item
  useEffect(() => {
    if (realtimeProduct.id) {
      trackViewContent({
        id: realtimeProduct.id,
        name: productName,
        price: currentPrice,
        category: categoryName,
        variant: selectedVariant?.name,
      });
    }
  }, [realtimeProduct.id, selectedVariant?.id, productName, currentPrice, categoryName]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Left Column: Gallery and Information Tabs */}
      <div className="w-full lg:w-[60%] xl:w-2/3 flex flex-col gap-8">
        <ProductGallery images={currentImages} title={productName} />

        {/* Information Tabs */}
        <div className="mt-4">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent flex-wrap overflow-x-auto no-scrollbar">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-base transition-colors"
              >
                {t('product', 'description', { defaultValue: 'Description' })}
              </TabsTrigger>
              {hasSpecifications && (
                <TabsTrigger
                  value="specifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-base transition-colors"
                >
                  {t('product', 'specifications', { defaultValue: 'Specifications' })}
                </TabsTrigger>
              )}
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-base transition-colors"
              >
                {t('product', 'shipping', { defaultValue: 'Shipping & Returns' })}
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-base transition-colors"
              >
                {t('product', 'reviews', { defaultValue: 'Reviews' })} ({realtimeProduct.numReviews}
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6 animate-in fade-in-50 duration-500">
              <div
                className="prose prose-zinc dark:prose-invert max-w-none text-sm text-muted-foreground leading-relaxed ProseMirror"
                dangerouslySetInnerHTML={{ __html: productDesc || '' }}
              />
            </TabsContent>

            {hasSpecifications && (
              <TabsContent
                value="specifications"
                className="pt-6 animate-in fade-in-50 duration-500"
              >
                {realtimeProduct.specifications &&
                Object.keys(realtimeProduct.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {Object.entries(realtimeProduct.specifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-2 border-b border-border/40"
                      >
                        <span className="text-muted-foreground font-medium">{key}</span>
                        <span className="font-semibold text-right">{value}</span>
                      </div>
                    ))}
                    {realtimeProduct.brand && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground font-medium">
                          {t('product', 'brand', { defaultValue: 'Brand' })}
                        </span>
                        <span className="font-semibold text-right">{realtimeProduct.brand}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/40">
                      <span className="text-muted-foreground font-medium">
                        {t('product', 'sku', { defaultValue: 'SKU' })}
                      </span>
                      <span className="font-semibold text-right">
                        {selectedVariant?.sku || realtimeProduct.sku || 'N/A'}
                      </span>
                    </div>
                    {realtimeProduct.weight && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground font-medium">
                          {t('product', 'weight', { defaultValue: 'Weight' })}
                        </span>
                        <span className="font-semibold text-right">
                          {realtimeProduct.weight} {t('common', 'kg', { defaultValue: 'kg' })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {realtimeProduct.brand && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground font-medium">
                          {t('product', 'brand', { defaultValue: 'Brand' })}
                        </span>
                        <span className="font-semibold text-right">{realtimeProduct.brand}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/40">
                      <span className="text-muted-foreground font-medium">
                        {t('product', 'sku', { defaultValue: 'SKU' })}
                      </span>
                      <span className="font-semibold text-right">
                        {selectedVariant?.sku || realtimeProduct.sku || 'N/A'}
                      </span>
                    </div>
                    {realtimeProduct.weight && (
                      <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground font-medium">
                          {t('product', 'weight', { defaultValue: 'Weight' })}
                        </span>
                        <span className="font-semibold text-right">
                          {realtimeProduct.weight} {t('common', 'kg', { defaultValue: 'kg' })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="shipping" className="pt-6 animate-in fade-in-50 duration-500">
              <div className="space-y-6 text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <Truck className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <strong className="text-foreground block mb-2 text-base">
                      {t('product', 'shippingPolicy', 'Shipping Policy')}
                    </strong>
                    {shippingPolicy ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: shippingPolicy }}
                      />
                    ) : (
                      <p>
                        {t(
                          'product',
                          'shippingPolicyUnavailable',
                          'Information about shipping policies is currently unavailable.'
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex gap-4">
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <strong className="text-foreground block mb-2 text-base">
                      {t('product', 'returnPolicy', 'Return Policy')}
                    </strong>
                    {returnPolicy ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: returnPolicy }}
                      />
                    ) : (
                      <p>
                        {t(
                          'product',
                          'returnPolicyUnavailable',
                          'Information about return policies is currently unavailable.'
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="pt-6 animate-in fade-in-50 duration-500">
              <Reviews productId={realtimeProduct.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column: Sticky Purchase Dashboard */}
      <div className="w-full lg:w-[40%] xl:w-1/3">
        <div className="sticky top-24 flex flex-col gap-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="secondary"
                className="uppercase tracking-wider text-[10px] font-semibold"
              >
                {categoryName}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded border">
                SKU: {selectedVariant?.sku || realtimeProduct.sku || 'N/A'}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight mb-2">
              {productName}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <p className="text-3xl font-extrabold text-red-600">{formatPrice(currentPrice)}</p>
              {currentBasePrice > currentPrice && (
                <p className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                  {formatPrice(currentBasePrice)}
                </p>
              )}
              {realtimeProduct.discount && (
                <Badge variant="destructive" className="ml-2 font-bold px-2 py-0.5 animate-pulse">
                  {realtimeProduct.discount?.type === 'PERCENTAGE'
                    ? `-${realtimeProduct.discount?.value}% ${t('product', 'off', { defaultValue: 'OFF' })}`
                    : realtimeProduct.discount?.type === 'FLAT'
                      ? `-${formatPrice(realtimeProduct.discount?.value || 0)} ${t('product', 'off', { defaultValue: 'OFF' })}`
                      : t('product', 'sale', { defaultValue: 'SALE' })}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Color Selection with Images */}
          {colorKey && colorVariants.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{colorKey}:</h4>
                <span className="text-sm text-muted-foreground">
                  {selectedAttributes[colorKey as string] ||
                    t('product', 'selectColor', { defaultValue: 'Select a color' })}
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

                  const isSelected = selectedAttributes[colorKey as string] === colorValue;
                  const isCompatible = getAvailableOptions(colorKey as string).has(colorValue);

                  return (
                    <button
                      key={variant.id}
                      onClick={() =>
                        handleAttributeSelect(colorKey as string, colorValue as string)
                      }
                      className={cn(
                        'relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all',
                        isSelected && 'ring-2 ring-primary ring-offset-2 border-primary',
                        !isSelected && isCompatible && 'border-muted hover:border-primary/50',
                        !isSelected &&
                          !isCompatible &&
                          'border-muted opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
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
          {otherAttributes.map((attributeKey) => {
            const options = getAvailableOptions(attributeKey);

            return (
              <div key={attributeKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{attributeKey}:</h4>
                  <span className="text-sm text-muted-foreground">
                    {selectedAttributes[attributeKey] ||
                      `${t('product', 'select', { defaultValue: 'Select' })} ${attributeKey.toLowerCase()}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(attributeOptions[attributeKey]).map((value) => {
                    const isSelected = selectedAttributes[attributeKey] === value;
                    const isCompatible = options.has(value);

                    return (
                      <button
                        key={value}
                        onClick={() => handleAttributeSelect(attributeKey, value)}
                        className={cn(
                          'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all min-w-[60px]',
                          isSelected &&
                            'border-primary bg-primary text-primary-foreground shadow-sm',
                          !isSelected &&
                            isCompatible &&
                            'border-input bg-background hover:border-primary hover:bg-accent',
                          !isSelected &&
                            !isCompatible &&
                            'border-input bg-background opacity-50 hover:opacity-100 hover:bg-accent'
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
          {/* Quantity Selection */}
          {!isOutOfStock && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">
                {t('product', 'quantity', { defaultValue: 'Quantity' })}:
              </h4>
              <div className="flex items-center gap-3 w-fit border rounded-lg p-1.5 bg-background shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-muted"
                  onClick={() => setQty(Math.max(1, (Number(qty) || 1) - 1))}
                  disabled={Number(qty) <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={currentStock}
                  value={qty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQty(Math.min(Math.max(1, val), currentStock));
                  }}
                  className="w-16 h-8 text-center px-1 py-1 text-base font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md hover:bg-muted"
                  onClick={() => setQty(Math.min(currentStock, (Number(qty) || 1) + 1))}
                  disabled={Number(qty) >= currentStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm mt-1">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isOutOfStock
                  ? 'bg-destructive'
                  : currentStock < 10
                    ? 'bg-orange-500'
                    : 'bg-green-500'
              )}
            />
            <span className={cn('font-semibold', isOutOfStock && 'text-destructive')}>
              {isOutOfStock
                ? t('product', 'outOfStock', { defaultValue: 'Out of Stock' })
                : currentStock < 10
                  ? t('product', 'onlyLeft', {
                      count: String(currentStock),
                      defaultValue: `Only ${currentStock} left!`,
                    })
                  : t('product', 'inStock', { defaultValue: 'In Stock' })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-2">
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 text-base py-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                disabled={isOutOfStock || loading}
                onClick={handleAddToCart}
              >
                {isOutOfStock
                  ? t('product', 'outOfStock', { defaultValue: 'Out of Stock' })
                  : loading
                    ? t('common', 'loading', { defaultValue: 'Adding...' })
                    : t('product', 'addToCart', { defaultValue: 'Add to Cart' })}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1 text-base py-6 font-bold transition-all active:scale-[0.98]"
                disabled={isOutOfStock || loading}
                onClick={() => {
                  const store = useCartStore.getState();
                  store.setBuyNowItem({
                    id: 'buy_now_temp',
                    productId: realtimeProduct.id,
                    variantId: selectedVariant?.id,
                    quantity: Number(qty) || 1,
                    product: {
                      name: realtimeProduct.name,
                      images: realtimeProduct.images,
                      slug: realtimeProduct.slug,
                      stock: realtimeProduct.stock,
                      sellingPrice: realtimeProduct.sellingPrice,
                      basePrice: realtimeProduct.basePrice,
                    },
                    variant: selectedVariant
                      ? {
                          name: selectedVariant.name,
                          sellingPrice: selectedVariant.sellingPrice,
                          basePrice: selectedVariant.basePrice,
                          images: selectedVariant.images,
                        }
                      : undefined,
                  });
                  router.push('/checkout');
                }}
              >
                {t('product', 'buyNow', 'Buy Now')}
              </Button>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full text-base py-6 gap-2 font-semibold hover:bg-muted transition-colors active:scale-[0.98]"
              onClick={() => toggleWishlist(realtimeProduct.id)}
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  isInWishlist(realtimeProduct.id) && 'fill-current text-red-500'
                )}
              />
              {isInWishlist(realtimeProduct.id)
                ? t('product', 'inWishlist', { defaultValue: 'In Wishlist' })
                : t('product', 'addToWishlist', { defaultValue: 'Add to Wishlist' })}
            </Button>
            {errorMessage && (
              <p className="text-sm text-destructive text-center font-medium animate-in slide-in-from-top-1">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-green-600 text-center font-medium animate-in slide-in-from-top-1">
                {successMessage}
              </p>
            )}
          </div>

          {/* Trust Badges */}
          <Separator className="my-2" />
          <div className="grid grid-cols-1 gap-3 py-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {t('home', 'genuineProduct', 'Genuine Product Quality Guaranteed')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <Truck className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {t('home', 'fastDelivery', 'Fast & Reliable Delivery')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {t('home', 'securePaymentLong', '100% Secure Payment Processing')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
