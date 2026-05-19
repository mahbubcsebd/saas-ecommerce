'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Heart,
  Loader2,
  PackageX,
  Search,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);
}

type WishlistEntry = {
  id: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    images: string[];
    stock: number;
    sellingPrice: number;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type PopularProduct = {
  id: string;
  name: string;
  sku?: string;
  images: string[];
  stock: number;
  sellingPrice: number;
  wishlistCount: number;
  category?: { name: string };
};

type StockAlertProduct = {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  images: string[];
};

type Summary = {
  totalWishlistItems: number;
  uniqueCustomers: number;
  outOfStockCount: number;
};

export default function WishlistAdminPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || '';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    totalWishlistItems: 0,
    uniqueCustomers: 0,
    outOfStockCount: 0,
  });
  const [popular, setPopular] = useState<PopularProduct[]>([]);
  const [alerts, setAlerts] = useState<StockAlertProduct[]>([]);
  const [wishlists, setWishlists] = useState<WishlistEntry[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 15,
  });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/wishlist/admin/analytics?page=${page}&limit=15`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (data.success) {
          setSummary(data.summary);
          setPopular(data.popularProducts || []);
          setAlerts(data.outOfStockAlerts || []);
          setWishlists(data.data || []);
          setPagination(data.pagination);
        } else {
          toast.error(data.message || 'Failed to load wishlist data');
        }
      } catch {
        toast.error('Network error loading wishlist data');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // Client-side search filter for wishlist entries
  const filteredWishlists = search.trim()
    ? wishlists.filter(
        (w) =>
          w.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          w.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          `${w.user?.firstName} ${w.user?.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : wishlists;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Wishlist Analytics</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wishlist Items</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                summary.totalWishlistItems.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Gross customer interest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                summary.uniqueCustomers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Customers with wishlists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Fulfillment</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${summary.outOfStockCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.outOfStockCount > 0 ? 'text-amber-600' : ''}`}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                summary.outOfStockCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">Wishlisted items low on stock</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Popular Wishlist Items */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Top Wishlisted Products
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : popular.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                No wishlist data yet.
              </div>
            ) : (
              <div className="divide-y">
                {popular.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="font-bold text-muted-foreground w-4">{idx + 1}.</div>
                    <div className="w-12 h-12 flex-shrink-0 rounded border bg-white p-1 overflow-hidden">
                      {p.images?.[0] ? (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          width={48}
                          height={48}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <PackageX className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 line-clamp-1">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-muted-foreground">
                           {p.category?.name || 'Uncategorized'}
                         </span>
                         <span className="text-slate-300">•</span>
                         <span className="text-xs font-semibold">
                           {formatCurrency(p.sellingPrice)}
                         </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-6">
                      <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1">
                           <Heart
                             className="h-3 w-3 text-rose-500 fill-current"
                           />
                           <span className="text-lg font-bold">
                             {p.wishlistCount}
                           </span>
                         </div>
                         <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Saves</p>
                      </div>
                      <Badge
                        variant={
                          p.stock <= 0
                            ? 'destructive'
                            : p.stock <= 10
                              ? 'outline'
                              : 'secondary'
                        }
                        className="h-5 text-[10px]"
                      >
                        {p.stock <= 0
                          ? 'Out'
                          : p.stock <= 10
                            ? `${p.stock} Left`
                            : 'Stock'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts for Wishlisted Items */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Urgent Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-primary" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Star className="h-10 w-10 text-green-100 fill-current" />
                <p className="text-sm text-muted-foreground">All hot items are well-stocked</p>
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-red-50/30"
                  >
                    <div className="w-10 h-10 flex-shrink-0 rounded border bg-white p-1 overflow-hidden">
                      {p.images?.[0] ? (
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          width={40}
                          height={40}
                          className="object-contain w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        SKU: {p.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="destructive" className="font-bold">
                        {p.stock} Units
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer List Tracking Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <CardTitle>Customer Engagement</CardTitle>
             </div>
             <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or customers..."
                  className="pl-9"
                />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="pr-6">Added Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredWishlists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                      No matching records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWishlists.map((w) => (
                    <TableRow key={w.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex-shrink-0 rounded border bg-white p-1 overflow-hidden">
                            {w.product?.images?.[0] ? (
                              <Image
                                src={w.product.images[0]}
                                alt={w.product.name}
                                width={40}
                                height={40}
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <PackageX className="h-4 w-4 text-slate-100 m-auto" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium line-clamp-1">
                              {w.product?.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-mono">
                              {w.product?.sku || '—'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <p className="text-sm font-medium">
                             {w.user?.firstName} {w.user?.lastName}
                           </p>
                           <p className="text-xs text-muted-foreground">{w.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(w.product?.sellingPrice || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            w.product?.stock <= 0
                              ? 'destructive'
                              : w.product?.stock <= 10
                                ? 'outline'
                                : 'secondary'
                          }
                          className="h-5 text-[10px]"
                        >
                          {w.product?.stock <= 0
                            ? 'Empty'
                            : `${w.product?.stock}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <span className="text-xs text-muted-foreground">
                           {w.createdAt ? format(new Date(w.createdAt), 'dd MMM yyyy') : '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
              <div className="text-xs text-muted-foreground">
                Showing <b>{(pagination.page - 1) * pagination.limit + 1}</b>–
                <b>{Math.min(pagination.page * pagination.limit, pagination.total)}</b>{' '}
                of <b>{pagination.total}</b>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchData(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchData(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
