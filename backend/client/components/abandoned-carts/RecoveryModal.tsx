'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cart, CartItem } from '@/lib/api';
import { Loader2, Mail, Send, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface RecoveryModalProps {
  cart: Cart | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (cartId: string) => Promise<void>;
}

export function RecoveryModal({ cart, isOpen, onClose, onSend }: RecoveryModalProps) {
  const [loading, setLoading] = useState(false);

  if (!cart) return null;

  const handleSend = async () => {
    try {
      setLoading(true);
      await onSend(cart.id);
      toast.success('Recovery email sent successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send recovery email');
    } finally {
      setLoading(false);
    }
  };

  const fullName = cart.user ? `${cart.user.firstName} ${cart.user.lastName}` : 'Guest';

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Send Recovery Email
          </DialogTitle>
          <DialogDescription>
            Send a personalized email to <strong>{cart.user?.email}</strong> with their cart items and a checkout link.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col gap-4">
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Cart Items ({cart.items.length})
            </h4>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {cart.items.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between items-start text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.product.name}</span>
                      {item.variant && (
                        <span className="text-xs text-muted-foreground">{item.variant.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-primary">
                      ${((item.variant?.sellingPrice || item.product.sellingPrice || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 pt-2 border-t flex justify-between items-center font-bold">
              <span>Total Value</span>
              <span className="text-lg text-primary">${cart.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-primary/5 space-y-2">
            <p className="text-sm">
              <strong>To:</strong> {fullName} &lt;{cart.user?.email}&gt;
            </p>
            <p className="text-sm">
              <strong>Subject:</strong> Complete your purchase - Items waiting in your cart
            </p>
            <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded border border-border/30">
              <p>Hi {cart.user?.firstName || 'there'},</p>
              <p className="mt-1">We noticed you left some items in your shopping cart. We&apos;ve saved them for you, but they might sell out soon!</p>
              <p className="mt-2 text-primary underline">[Product List & Checkout Link will be inserted here]</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              Note
            </Badge>
            This counts as recovery attempt #{cart.recoveryEmailCount + 1}.
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Recovery Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
