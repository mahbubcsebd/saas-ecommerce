"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { PurchaseService } from "@/services/purchase.service";
import { format } from "date-fns";
import { Eye, History, Loader2, Pencil, Plus, ShoppingCart, Trash2, Truck } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ViewPurchaseModal from "./components/ViewPurchaseModal";

export default function PurchasesPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await PurchaseService.getPurchases(token);
      if (res.success) {
        setPurchases(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch purchases", error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPurchases();
    }
  }, [session]);

  const handleView = async (id: string) => {
      const res = await PurchaseService.getPurchase(token, id);
      if (res.success) {
          setSelectedPurchase(res.data);
          setIsViewModalOpen(true);
      } else {
          toast.error("Failed to fetch purchase details");
      }
  };

  const handleDelete = async (id: string) => {
      if (!await confirm({
          title: "Delete Purchase Order",
          message: "Are you sure you want to delete this purchase order? This will roll back inventory changes and cannot be undone.",
          type: "danger",
          confirmText: "Delete"
      })) return;

      const res = await PurchaseService.deletePurchase(token, id);
      if (res.success) {
          toast.success("Purchase deleted successfully");
          fetchPurchases();
      } else {
          toast.error(res.message || "Failed to delete purchase");
      }
  };

  if (loading && purchases.length === 0) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Purchase Orders
        </h1>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/dashboard/purchases/returns">
                    <History className="mr-2 h-4 w-4" /> Returns
                </Link>
            </Button>
            <Button asChild>
                <Link href="/dashboard/purchases/create">
                    <Plus className="mr-2 h-4 w-4" /> Create PO
                </Link>
            </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length > 0 ? (
                purchases.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium font-mono">{po.purchaseNumber}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            {po.supplier?.name}
                        </div>
                    </TableCell>
                    <TableCell>{format(new Date(po.createdAt), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-bold">
                        {po.totalCost?.toLocaleString()} BDT
                    </TableCell>
                    <TableCell>
                        <Badge variant={po.status === "RECEIVED" ? "default" : "outline"}>
                            {po.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        {po._count?.items} items
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                             <Button size="icon" variant="ghost" onClick={() => handleView(po.id)}>
                                <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                             <Button size="icon" variant="ghost" asChild>
                                <Link href={`/dashboard/purchases/edit/${po.id}`}>
                                    <Pencil className="h-4 w-4 text-green-600" />
                                </Link>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(po.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No purchase orders found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ViewPurchaseModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          purchase={selectedPurchase}
      />
    </div>
  );
}
