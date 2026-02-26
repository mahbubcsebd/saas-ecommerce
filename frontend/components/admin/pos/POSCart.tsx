"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/hooks/useCurrency";
import { Minus, Plus, Trash2 } from "lucide-react";

export interface CartItem {
  id: string; // Product ID (or variant ID if separate)
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface POSCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemove: (id: string) => void;
  subtotal: number;
  discount: number;
  setDiscount: (val: number) => void;
  discountType: "PERCENTAGE" | "FLAT";
  setDiscountType: (type: "PERCENTAGE" | "FLAT") => void;
  vatPercent: number;
  setVatPercent: (val: number) => void;
  total: number;
  onCheckout: () => void;
  isProcessing: boolean;
}

export function POSCart({
  items,
  onUpdateQuantity,
  onRemove,
  subtotal,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  vatPercent,
  setVatPercent,
  total,
  onCheckout,
  isProcessing
}: POSCartProps) {
  const { formatPrice } = useCurrency();
  return (
    <Card className="h-full flex flex-col border-l rounded-none">
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-lg">Current Order</CardTitle>
      </CardHeader>

      {/* Scrollable Cart Items */}
      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Cart is empty
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id + (item.variantId || "")} className="flex gap-2 items-start">
                 <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {formatPrice(item.price)} x {item.quantity}
                    </div>
                 </div>
                 <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-xs" onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}>
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon-xs" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>
                        <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" className="text-destructive ml-1" onClick={() => onRemove(item.id)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Calculations */}
      <div className="p-4 bg-muted/20 border-t space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
           <span className="text-sm w-20">Discount</span>
           <div className="flex flex-1 gap-1">
              <Input
                type="number"
                className="h-8 text-right"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min={0}
              />
              <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="PERCENTAGE">%</SelectItem>
                    <SelectItem value="FLAT">৳</SelectItem>
                </SelectContent>
              </Select>
           </div>
        </div>

        <div className="flex items-center justify-between gap-2">
           <span className="text-sm w-20">VAT (%)</span>
           <Input
             type="number"
             className="h-8 w-20 text-right ml-auto"
             value={vatPercent}
             onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
             min={0}
           />
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <Button className="w-full" size="lg" disabled={items.length === 0 || isProcessing} onClick={onCheckout}>
          {isProcessing ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </Card>
  );
}
