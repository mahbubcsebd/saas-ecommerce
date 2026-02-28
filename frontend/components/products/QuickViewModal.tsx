"use client";

import { useTranslations } from '@/context/TranslationContext';
import { useCurrency } from '@/hooks/useCurrency';
import { trackAddToCart } from '@/lib/analytics';
import { cn, getLocalized } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Product } from '@/types/product';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";

interface QuickViewModalProps {
    product: Product;
    children: React.ReactNode;
}

export default function QuickViewModal({ product, children }: QuickViewModalProps) {
    const { t, locale } = useTranslations();
    const { formatPrice } = useCurrency();
    const addToCart = useCartStore((state) => state.addToCart);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isPending, setIsPending] = useState(false);

    const localizedName = getLocalized(product, locale, 'name');
    const localizedDescription = getLocalized(product, locale, 'description');
    const localizedCategory = typeof product.category === 'object' ? getLocalized(product.category, locale, 'name') : product.category;

    const handleAddToCart = async () => {
        setIsPending(true);
        try {
            await addToCart(product.id, quantity);

            // Track AddToCart
            trackAddToCart({
                id: product.id,
                name: localizedName,
                price: product.sellingPrice,
                quantity: quantity,
                category: localizedCategory
            });

            toast.success(t('common', 'addedToCart', { defaultValue: 'Added to cart successfully!' }));
        } catch (error) {
            toast.error(t('common', 'failedToAddToCart', { defaultValue: 'Failed to add to cart' }));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Left: Images */}
                    <div className="relative bg-muted/30 p-4 flex flex-col gap-4">
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-background border">
                            {product.images && product.images.length > 0 ? (
                                <Image
                                    src={product.images[selectedImage]}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    {t('common', 'noImage')}
                                </div>
                            )}
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={cn(
                                            "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                                            selectedImage === idx ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <Image src={img} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Content */}
                    <div className="p-6 md:p-8 flex flex-col">
                        <DialogHeader className="mb-4">
                            <Badge variant="outline" className="w-fit mb-2">
                                {localizedCategory}
                            </Badge>
                            <DialogTitle className="text-2xl font-bold md:text-3xl leading-tight">
                                {localizedName}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-3xl font-bold text-red-600">
                                {formatPrice(product.sellingPrice)}
                            </span>
                            {product.basePrice > product.sellingPrice && (
                                <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                                    {formatPrice(product.basePrice)}
                                </span>
                            )}
                        </div>

                        <div
                            className="text-sm text-muted-foreground mb-8 line-clamp-4 leading-relaxed ProseMirror"
                            dangerouslySetInnerHTML={{ __html: localizedDescription || "" }}
                        />

                        <div className="mt-auto space-y-6">
                            {/* Quantity Selector */}
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium">
                                    {t('common', 'quantity', { defaultValue: 'Quantity' })}
                                </span>
                                <div className="flex items-center gap-3 w-fit border rounded-lg p-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        disabled={quantity >= product.stock}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {product.stock > 0 && product.stock <= 5 && (
                                    <span className="text-xs text-orange-500 font-medium italic">
                                        {t('common', 'onlyLeft', { count: String(product.stock), defaultValue: `Only ${product.stock} left!` })}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20"
                                    size="lg"
                                    onClick={handleAddToCart}
                                    disabled={product.stock <= 0 || isPending}
                                >
                                    {isPending ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                            {t('common', 'adding')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5" />
                                            {t('common', 'addToCart')}
                                        </span>
                                    )}
                                </Button>
                            </div>

                            <div className="flex items-center gap-6 pt-4 border-t text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <div className={cn("h-2 w-2 rounded-full", product.stock > 0 ? "bg-green-500" : "bg-red-500")} />
                                    {product.stock > 0 ? t('common', 'inStock') : t('common', 'outOfStock')}
                                </div>
                                <div>•</div>
                                <div>SKU: {product.sku || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
