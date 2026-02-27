"use client";

import { addToCartAction } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Will need to install/copy label
import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/types/product";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export default function AddToCartButton({ product }: { product: Product }) {
  const addToCartLocal = useCartStore((state) => state.addToCart);
  const guestId = useCartStore((state) => state.guestId);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const [state, formAction, isPending] = useActionState(addToCartAction, null);

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product.colors && product.colors.length > 0 ? product.colors[0] : undefined
  );

  const hasSizes = product.variants && typeof product.variants === 'object' && 'size' in (product.variants as any);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
      hasSizes ? (product.variants as any).size[0] : undefined
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      if (guestId) fetchCart(guestId);
    } else if (state?.success === false) {
      toast.error(state.message);
    }
  }, [state, guestId, fetchCart]);

  return (
    <form action={formAction} className="space-y-6">
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="guestId" value={guestId || ""} />

        {/* Color Selection */}
        {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                    {product.colors.map((color: string) => (
                        <button
                            type="button"
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-3 py-1 border rounded-md text-sm ${
                                selectedColor === color
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "hover:bg-accent"
                            }`}
                        >
                            {color}
                        </button>
                    ))}
                    <input type="hidden" name="color" value={selectedColor} />
                </div>
            </div>
        )}

        {/* Size Selection (if exists) */}
        {hasSizes && (
             <div className="space-y-2">
                <Label>Size</Label>
                <div className="flex gap-2">
                    {(product.variants as any).size.map((size: any) => (
                         <button
                            type="button"
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-3 py-1 border rounded-md text-sm ${
                                selectedSize === size
                                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                                : "hover:bg-accent"
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                    <input type="hidden" name="size" value={selectedSize} />
                </div>
            </div>
        )}

        <div className="flex flex-col gap-4 mt-6">
            <div className="w-24">
                <Label className="mb-2 block">Quantity</Label>
                <Input
                    name="quantity"
                    type="number"
                    min={1}
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(val, product.stock));
                    }}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </div>
            <div className="flex gap-4 w-full">
                <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={product.stock <= 0 || isPending}
                >
                    {isPending ? "Adding..." : product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    disabled={product.stock <= 0 || isPending}
                    onClick={() => {
                        const store = useCartStore.getState();
                        store.setBuyNowItem({
                            id: "buy_now_temp",
                            productId: product.id,
                            quantity: quantity,
                            product: {
                                name: product.name,
                                images: product.images,
                                slug: product.slug,
                                stock: product.stock,
                                sellingPrice: product.sellingPrice,
                                basePrice: product.basePrice,
                            },
                        });
                        window.location.href = "/checkout";
                    }}
                >
                    Buy Now
                </Button>
            </div>
        </div>
    </form>
  );
}
