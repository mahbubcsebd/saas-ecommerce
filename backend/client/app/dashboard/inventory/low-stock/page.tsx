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
import { AlertCircle, ArrowLeft, Loader2, RefreshCw, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LowStockPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/reports/low-stock`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch low stock items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchLowStock();
    }
  }, [session]);

  const handleQuickReorder = (item: any) => {
      // In a real app, we might redirect to Create PO with params
      // For now, let's just store the intent or navigate
      router.push(`/dashboard/purchases/create?reorderId=${item.id}${item.variantId ? `&variantId=${item.variantId}` : ""}`);
  };

  if (loading && items.length === 0) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
            <Link href="/dashboard/inventory" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Inventory
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <AlertCircle className="h-8 w-8 text-red-600" />
                Low Stock Alerts
            </h1>
            <p className="text-muted-foreground">Items falling below their minimum stock threshold.</p>
        </div>
        <Button onClick={fetchLowStock} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Product / Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-center">Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? (
                items.map((item, index) => (
                  <TableRow key={`${item.id}-${item.variantId || index}`}>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{item.type}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell className="text-center">
                        <span className={`font-bold ${item.stock === 0 ? "text-red-600" : "text-orange-600"}`}>
                            {item.stock}
                        </span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{item.minStockLevel}</TableCell>
                    <TableCell>
                        <Badge variant={item.stock === 0 ? "destructive" : "default"} className={item.stock > 0 ? "bg-orange-500 hover:bg-orange-600" : ""}>
                            {item.stock === 0 ? "Out of Stock" : "Low Stock"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleQuickReorder(item)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                        >
                            <ShoppingCart className="mr-2 h-3.5 w-3.5" /> Quick Reorder
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        Great! All products are well-stocked.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
