"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
    AlertTriangle,
    Heart,
    Loader2,
    PackageX,
    Search,
    Star,
    TrendingUp,
    Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);
}

type WishlistEntry = {
  id: string;
  createdAt: string;
  product: {
    id: string; name: string; sku?: string; images: string[]; stock: number; sellingPrice: number;
  };
  user: {
    id: string; firstName: string; lastName: string; email: string;
  };
};

type PopularProduct = {
  id: string; name: string; sku?: string; images: string[]; stock: number; sellingPrice: number;
  wishlistCount: number;
  category?: { name: string };
};

type StockAlertProduct = {
  id: string; name: string; sku?: string; stock: number; images: string[];
};

type Summary = { totalWishlistItems: number; uniqueCustomers: number; outOfStockCount: number };

export default function WishlistAdminPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ totalWishlistItems: 0, uniqueCustomers: 0, outOfStockCount: 0 });
  const [popular, setPopular] = useState<PopularProduct[]>([]);
  const [alerts, setAlerts] = useState<StockAlertProduct[]>([]);
  const [wishlists, setWishlists] = useState<WishlistEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1, limit: 15 });
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/wishlist/admin/analytics?page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setPopular(data.popularProducts || []);
        setAlerts(data.outOfStockAlerts || []);
        setWishlists(data.data || []);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || "Failed to load wishlist data");
      }
    } catch {
      toast.error("Network error loading wishlist data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  // Client-side search filter for wishlist entries
  const filteredWishlists = search.trim()
    ? wishlists.filter((w) =>
        w.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        `${w.user?.firstName} ${w.user?.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : wishlists;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-8 w-8 text-rose-500" />
          Wishlist Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track customer wish lists, popular products, and low-stock alerts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Wishlist Items</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">
                {loading ? <Loader2 className="h-6 w-6 animate-spin inline" /> : summary.totalWishlistItems.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-rose-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Customers with Wishlists</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {loading ? <Loader2 className="h-6 w-6 animate-spin inline" /> : summary.uniqueCustomers.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={`${summary.outOfStockCount > 0 ? "border-red-200" : "border-green-100"}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Low Stock Alerts</p>
              <p className={`text-3xl font-bold mt-1 ${summary.outOfStockCount > 0 ? "text-red-600" : "text-green-600"}`}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin inline" /> : summary.outOfStockCount}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${summary.outOfStockCount > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <AlertTriangle className={`h-6 w-6 ${summary.outOfStockCount > 0 ? "text-red-500" : "text-green-500"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Popular Wishlist Items */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Most Wishlisted Products (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
              ) : popular.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">No wishlist data yet.</div>
              ) : (
                <div className="divide-y">
                  {popular.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? "bg-yellow-400 text-yellow-900" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-orange-300 text-orange-900" : "bg-slate-100 text-slate-600"}`}>
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 flex-shrink-0 rounded border bg-slate-50 overflow-hidden">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><PackageX className="h-4 w-4" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category?.name || "Uncategorized"} · {formatCurrency(p.sellingPrice)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                          <span className="font-bold text-rose-600">{p.wishlistCount}</span>
                        </div>
                        <Badge variant={p.stock <= 0 ? "destructive" : p.stock <= 10 ? "outline" : "secondary"} className="text-[10px] px-1.5 mt-1">
                          {p.stock <= 0 ? "Out of Stock" : p.stock <= 10 ? `${p.stock} left` : "In Stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stock Alerts for Wishlisted Items */}
        <div>
          <Card className="border-red-100">
            <CardHeader className="pb-3 border-b bg-red-50/50">
              <CardTitle className="text-base text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Stock Alerts
              </CardTitle>
              <p className="text-xs text-red-600/80 mt-1">Wishlisted items with stock ≤ 5</p>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-auto">
              {loading ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-5 w-5 text-red-500" /></div>
              ) : alerts.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  <Star className="h-8 w-8 mx-auto text-green-300 mb-2" />
                  All wishlisted products are well stocked!
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 flex-shrink-0 rounded border bg-slate-50 overflow-hidden">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} width={36} height={36} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">?</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.sku || "No SKU"}</p>
                      </div>
                      <div className={`text-right flex-shrink-0 text-sm font-bold ${p.stock <= 0 ? "text-red-600" : "text-orange-500"}`}>
                        {p.stock}
                        <p className="text-[10px] font-normal text-slate-400">in stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Customer Wishlists Table */}
      <Card>
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">All Customer Wishlists</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product or customer..."
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Added On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" /></TableCell></TableRow>
              ) : filteredWishlists.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No wishlist entries found.</TableCell></TableRow>
              ) : (
                filteredWishlists.map((w) => (
                  <TableRow key={w.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex-shrink-0 rounded border bg-slate-50 overflow-hidden">
                          {w.product?.images?.[0] ? (
                            <Image src={w.product.images[0]} alt={w.product.name} width={32} height={32} className="object-cover w-full h-full" />
                          ) : <PackageX className="h-4 w-4 text-slate-300 m-auto" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">{w.product?.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{w.product?.sku || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{w.user?.firstName} {w.user?.lastName}</p>
                      <p className="text-xs text-slate-400">{w.user?.email}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatCurrency(w.product?.sellingPrice || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={w.product?.stock <= 0 ? "destructive" : w.product?.stock <= 10 ? "outline" : "secondary"}>
                        {w.product?.stock <= 0 ? "Out of Stock" : `${w.product?.stock}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {w.createdAt ? format(new Date(w.createdAt), "dd MMM yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50 text-sm text-slate-600">
              <span>
                Showing <b>{(pagination.page - 1) * pagination.limit + 1}</b>–<b>{Math.min(pagination.page * pagination.limit, pagination.total)}</b> of <b>{pagination.total}</b>
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="bg-white" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" className="bg-white" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchData(pagination.page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
