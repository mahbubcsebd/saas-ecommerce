"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SupplierService } from "@/services/supplier.service";
import { SupplierPaymentService } from "@/services/supplierPayment.service";
import { format } from "date-fns";
import { ArrowLeft, History, Loader2, Printer, TrendingDown, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SupplierLedgerPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supRes, transRes] = await Promise.all([
        SupplierService.getSupplier(token, id as string),
        SupplierPaymentService.getLedger(token, id as string)
      ]);

      if (supRes.success) setSupplier(supRes.data);
      if (transRes.success) setTransactions(transRes.data);
    } catch (error) {
      console.error("Failed to fetch ledger data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && id) {
      fetchData();
    }
  }, [session, id]);

  if (loading) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <Link href="/dashboard/suppliers" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Suppliers
            </Link>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-8 w-8 text-indigo-600" />
                Ledger: {supplier?.name}
            </h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Ledger Postings</p>
              <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Current Due Balance</p>
              <p className="text-2xl font-bold text-red-600">{supplier?.dueBalance?.toLocaleString()} BDT</p>
          </div>
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Last Activity</p>
              <p className="text-2xl font-bold">
                  {transactions.length > 0 ? format(new Date(transactions[0].createdAt), "dd MMM") : "-"}
              </p>
          </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Debit (-)</TableHead>
              <TableHead className="text-right">Credit (+)</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
                transactions.map((tr) => (
                  <TableRow key={tr.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-muted-foreground">{format(new Date(tr.createdAt), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                            {tr.type === 'PURCHASE' ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />}
                            {tr.type}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-mono text-xs">
                                {tr.purchase?.purchaseNumber || tr.purchaseReturn?.returnNumber || tr.payment?.paymentNumber || "N/A"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{tr.notes}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                        {tr.amount < 0 ? Math.abs(tr.amount).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                        {tr.amount > 0 ? tr.amount.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                        {tr.balanceAfter?.toLocaleString()} BDT
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No transactions found for this supplier.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
