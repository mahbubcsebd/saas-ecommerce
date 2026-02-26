"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InventoryService } from "@/services/inventory.service";
import { useState } from "react";
import { toast } from "sonner";

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  token: string;
  onSuccess: () => void;
}

export function StockAdjustmentModal({
  open,
  onOpenChange,
  product,
  token,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "ADJUSTMENT",
    quantity: "",
    reason: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity || !formData.reason) {
      toast.error("Quantity and Reason are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productId: product.id,
        variantId: product.variantId, // If passed product is a variant
        type: formData.type,
        quantity: ["DAMAGE", "SALE", "THEFT"].includes(formData.type) ? -Math.abs(parseInt(formData.quantity)) : parseInt(formData.quantity),
        reason: formData.reason,
        notes: formData.notes
      };

      const res = await InventoryService.adjustStock(token, payload);
      if (res.success) {
        toast.success("Stock adjusted successfully");
        onSuccess();
        onOpenChange(false);
        setFormData({ type: "ADJUSTMENT", quantity: "", reason: "", notes: "" });
      } else {
        toast.error(res.message || "Failed");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product?.name} {product?.sku ? `(${product.sku})` : ""}
            <br />
            Current Stock: <span className="font-mono font-bold">{product?.stock}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Adjustment Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Manual Adjustment (Add/Sub)</SelectItem>
                  <SelectItem value="PURCHASE">Purchase (Add)</SelectItem>
                  <SelectItem value="RETURN">Customer Return (Add)</SelectItem>
                  <SelectItem value="DAMAGE">Damage (Remove)</SelectItem>
                  <SelectItem value="THEFT">Loss/Theft (Remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity (Positive for Add, Negative for Remove)</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="e.g. 10 or -5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                If selecting Damage/Theft, positive number will be automatically negated.
                For "Adjustment", use +/- as needed.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g. Monthly Audit"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
