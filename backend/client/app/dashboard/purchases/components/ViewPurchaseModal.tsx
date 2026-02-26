"use client";

import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Calendar, FileText, Package, Truck, User } from "lucide-react";

interface ViewPurchaseModalProps {
  purchase: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewPurchaseModal({ purchase, isOpen, onClose }: ViewPurchaseModalProps) {
  if (!purchase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Purchase Order Details: {purchase.purchaseNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Truck className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Supplier</p>
                <p className="text-sm text-muted-foreground">{purchase.supplier?.name}</p>
                <p className="text-xs text-muted-foreground">{purchase.supplier?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Dates</p>
                <p className="text-sm text-muted-foreground">Created: {format(new Date(purchase.createdAt), "PPP")}</p>
                {purchase.receivedAt && (
                  <p className="text-sm text-muted-foreground">Received: {format(new Date(purchase.receivedAt), "PPP")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status & Payment</p>
                <div className="flex gap-2 mt-1">
                    <Badge variant={purchase.status === "RECEIVED" ? "default" : "outline"}>
                        {purchase.status}
                    </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Order Total</p>
                <p className="text-xl font-bold">{purchase.totalCost?.toLocaleString()} BDT</p>
              </div>
            </div>
          </div>
        </div>

        {purchase.notes && (
          <div className="bg-muted/30 p-3 rounded-md mb-4 text-sm italic">
            <strong>Notes:</strong> {purchase.notes}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            Order Items ({purchase.items?.length || 0})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchase.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.product?.name}</div>
                    {item.variant && (
                        <div className="text-xs text-muted-foreground">{item.variant.name}</div>
                    )}
                    <div className="text-xs font-mono text-muted-foreground">{item.variant?.sku || item.product?.sku}</div>
                  </TableCell>
                  <TableCell className="text-right">{item.unitCost?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    {(item.quantity * item.unitCost).toLocaleString()} BDT
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
