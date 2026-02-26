"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { ArrowLeft, ArrowRightLeft, FileSpreadsheet, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InventoryMovementsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const fetchMovements = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString()
      });
      if (typeFilter !== "ALL") params.append("type", typeFilter);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/inventory/movements?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.success) {
        setMovements(data.data);
        setPagination(data.pagination);
      } else {
          toast.error(data.message || "Failed to fetch movements");
      }
    } catch (error) {
      console.error("Failed to fetch inventory movements", error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMovements(1);
    }
  }, [token, typeFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchMovements(newPage);
    }
  };

  const getBadgeVariant = (type: string) => {
      switch (type) {
          case 'PURCHASE': return 'default';
          case 'SALE': return 'secondary';
          case 'RETURN': return 'outline';
          case 'DAMAGE': return 'destructive';
          case 'PURCHASE_RETURN': return 'outline';
          default: return 'outline';
      }
  };

  const getQuantityColor = (qty: number, type: string) => {
      if (qty > 0) return "text-green-600 font-bold";
      if (qty < 0) return "text-red-600 font-bold";
      return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Link href="/dashboard/inventory" className="hover:text-primary transition-colors flex items-center">
                    <ArrowLeft className="h-3 w-3 mr-1" /> Back to Inventory
                </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <ArrowRightLeft className="h-8 w-8 text-blue-600" />
                Movement Logs
            </h1>
            <p className="text-muted-foreground mt-1">
                Track all stock changes including purchases, sales, and manual adjustments.
            </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
             <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Movements</SelectItem>
                    <SelectItem value="PURCHASE">Purchase</SelectItem>
                    <SelectItem value="SALE">Sale</SelectItem>
                    <SelectItem value="RETURN">Customer Return</SelectItem>
                    <SelectItem value="DAMAGE">Damage</SelectItem>
                    <SelectItem value="ADJUSTMENT">Manual Adjustment</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline" className="bg-white">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export
            </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">Previous</TableHead>
              <TableHead className="text-right">New Stock</TableHead>
              <TableHead>Reason / Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && movements.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" />
                    </TableCell>
                </TableRow>
            ) : movements.length > 0 ? (
                movements.map((move) => (
                  <TableRow key={move.id} className="hover:bg-slate-50/50">
                    <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{format(new Date(move.createdAt), "dd MMM yyyy")}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(move.createdAt), "hh:mm a")}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium text-slate-900 line-clamp-1" title={move.product?.name}>
                            {move.product?.name}
                        </div>
                        {move.variant && (
                            <div className="text-xs text-slate-500">Variant: {move.variant.name}</div>
                        )}
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                            SKU: {move.variant?.sku || move.product?.sku || 'N/A'}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getBadgeVariant(move.type)} className="capitalize">
                            {move.type.replace('_', ' ').toLowerCase()}
                        </Badge>
                    </TableCell>
                    <TableCell className={`text-right ${getQuantityColor(move.quantity, move.type)}`}>
                        {move.quantity > 0 ? '+' : ''}{move.quantity}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">
                        {move.previousQty}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                        {move.newQty}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-slate-600" title={move.reason || ""}>
                        {move.reason || <span className="text-slate-400 italic">No notes attached</span>}
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        <ArrowRightLeft className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                        <p className="font-medium text-slate-900">No movements found</p>
                        <p className="text-sm">We couldn't find any stock movements matching your filters.</p>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Details */}
        {!loading && movements.length > 0 && (
            <div className="p-4 border-t bg-slate-50 flex items-center justify-between text-sm text-slate-600">
                <div>
                    Showing <span className="font-medium text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-slate-900">{pagination.total}</span> entries
                </div>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className="bg-white"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className="bg-white"
                    >
                        Next
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
