"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PurchaseService } from "@/services/purchase.service";
import { PurchaseReturnService } from "@/services/purchaseReturn.service";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreatePurchaseReturnPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (session) {
      loadPurchases();
    }
  }, [session]);

  const loadPurchases = async () => {
    try {
        const res = await PurchaseService.getPurchases(token, { status: 'RECEIVED' });
        if (res.success) setPurchases(res.data);
    } catch (e) {
        console.error("Failed to load purchases", e);
    }
  };

  const handlePurchaseSelect = async (id: string) => {
    setSelectedPurchaseId(id);
    const res = await PurchaseService.getPurchase(token, id);
    if (res.success) {
        setSelectedPurchase(res.data);
        setItems(res.data.items.map((item: any) => ({
            ...item,
            returnQuantity: 0
        })));
    }
  };

  const updateItemQuantity = (index: number, qty: number) => {
      const newItems = [...items];
      const maxQty = newItems[index].quantity;
      if (qty > maxQty) {
          toast.warning(`Cannot return more than purchased (${maxQty})`);
          newItems[index].returnQuantity = maxQty;
      } else {
          newItems[index].returnQuantity = Math.max(0, qty);
      }
      setItems(newItems);
  };

  const totalReturnAmount = items.reduce((acc, item) => acc + (item.returnQuantity * item.unitCost), 0);

  const handleSubmit = async () => {
      const itemsToReturn = items.filter(i => i.returnQuantity > 0);
      if (itemsToReturn.length === 0) {
          toast.error("Please specify items to return");
          return;
      }

      setLoading(true);
      try {
          const payload = {
              purchaseId: selectedPurchaseId,
              supplierId: selectedPurchase.supplierId,
              notes,
              items: itemsToReturn.map(i => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: i.returnQuantity,
                  unitCost: i.unitCost
              }))
          };

          const res = await PurchaseReturnService.createPurchaseReturn(token, payload);
          if (res.success) {
              toast.success("Purchase return created successfully!");
              router.push("/dashboard/purchases/returns");
          } else {
              toast.error(res.message || "Failed to create return");
          }
      } catch (e) {
          toast.error("An error occurred");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/purchases/returns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Create Purchase Return</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Return Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Select Purchase Order</Label>
                <Select value={selectedPurchaseId} onValueChange={handlePurchaseSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a PO to return from" />
                    </SelectTrigger>
                    <SelectContent>
                        {purchases.map(po => (
                            <SelectItem key={po.id} value={po.id}>
                                {po.purchaseNumber} - {po.supplier?.name} ({new Date(po.createdAt).toLocaleDateString()})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedPurchase && (
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Purchased Qty</TableHead>
                                <TableHead>Unit Cost</TableHead>
                                <TableHead className="w-[120px]">Return Qty</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.product?.name}</div>
                                        {item.variant && <div className="text-xs text-muted-foreground">{item.variant.name}</div>}
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.unitCost.toLocaleString()} BDT</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={item.returnQuantity}
                                            min={0}
                                            max={item.quantity}
                                            onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 0)}
                                            className="h-8"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {(item.returnQuantity * item.unitCost).toLocaleString()} BDT
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Return Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-medium">{selectedPurchase?.supplier?.name || "N/A"}</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
                <span>Total Refund:</span>
                <span className="text-red-600">-{totalReturnAmount.toLocaleString()} BDT</span>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Reason for return..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
                disabled={loading || !selectedPurchase || totalReturnAmount === 0}
                onClick={handleSubmit}
              >
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Confirm Return
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
