"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DamageService } from "@/services/damage.service";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, Download, History, Loader2, RefreshCw, TrendingDown } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DamageLogPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalQuantity: 0, totalLossAmount: 0 });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await DamageService.getDamageReports(token);
      if (res.success) {
        setReports(res.data);
        setSummary(res.summary);
      }
    } catch (error) {
      console.error("Failed to fetch damage reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchReports();
    }
  }, [session]);

  if (loading && reports.length === 0) {
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
            <History className="h-8 w-8 text-orange-600" />
            Damage & Loss Logs
          </h1>
          <p className="text-muted-foreground">Historical records of inventory losses and adjustments.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={fetchReports} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items Lost</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity} Units</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Financial Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{summary.totalLossAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Based on purchase cost price</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 font-semibold uppercase text-[11px]">
              <TableHead>Date</TableHead>
              <TableHead>Product / Variant</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Loss Amount</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length > 0 ? (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {format(new Date(report.reportedAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{report.product?.name}</span>
                      {report.variant && <span className="text-xs text-muted-foreground">{report.variant.name}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold text-[10px] uppercase">
                      {report.reason}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-bold">{report.quantity}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">৳{report.lossAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {report.reportedBy ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}` : "System"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground italic text-xs" title={report.notes}>
                    {report.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No damage reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
