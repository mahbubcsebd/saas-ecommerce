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
import { PurchaseReturnService } from "@/services/purchaseReturn.service";
import { format } from "date-fns";
import { ArrowLeft, History, Loader2, Plus, Truck } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PurchaseReturnsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<any[]>([]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await PurchaseReturnService.getPurchaseReturns(token);
      if (res.success) {
        setReturns(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch returns", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchReturns();
    }
  }, [session]);

  if (loading && returns.length === 0) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <Link href="/dashboard/purchases" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Purchases
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-8 w-8 text-red-600" />
                Purchase Returns
            </h1>
        </div>
        <Button asChild className="bg-red-600 hover:bg-red-700">
            <Link href="/dashboard/purchases/returns/create">
                <Plus className="mr-2 h-4 w-4" /> Create Return
            </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Return Number</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length > 0 ? (
                returns.map((ret) => (
                  <TableRow key={ret.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium font-mono text-red-600">{ret.returnNumber}</TableCell>
                    <TableCell>
                        <Link href={`/dashboard/purchases`} className="hover:underline font-mono text-sm">
                            {ret.purchase?.purchaseNumber || "Manual Return"}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            {ret.supplier?.name}
                        </div>
                    </TableCell>
                    <TableCell>{format(new Date(ret.createdAt), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-bold text-red-600">
                        -{ret.totalAmount?.toLocaleString()} BDT
                    </TableCell>
                    <TableCell>
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                            {ret.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                            <History className="h-10 w-10 opacity-20" />
                            <p>No purchase returns found.</p>
                        </div>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
