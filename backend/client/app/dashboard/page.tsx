"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsOverview, DashboardService } from '@/services/dashboard.service';
import { format } from 'date-fns';
import { Activity, AlertTriangle, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();
    } else if (status === "unauthenticated") {
      setError("unauthenticated");
      setLoading(false);
    }
  }, [accessToken, status]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await DashboardService.getOverviewStats(accessToken);
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.message || "Failed to load dashboard data");
      }
    } catch (err: any) {
      console.error("Error fetching overview", err);
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-[60vh]">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-[60vh] text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Dashboard Error</h2>
        <p className="text-muted-foreground">{error || "No data available"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview Dashboard</h2>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpi.totalRevenue.toLocaleString()} BDT</div>
            <p className="text-xs text-muted-foreground">Lifetime successful sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data.kpi.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Active lifetime orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{data.kpi.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered user accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpi.totalProducts}</div>
            <p className="text-xs text-muted-foreground">In product catalog</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* SALES CHART */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salesChart.slice().reverse()}>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: any) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: any) => `${value}৳`}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RECENT ORDERS */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              The latest 5 transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
                {data.recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent orders found.</p>
                ) : (
                    data.recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{order.user?.username || order.user?.email || "Guest"}</p>
                                <p className="text-xs text-muted-foreground">{order.orderNumber} • {format(new Date(order.createdAt), 'dd MMM yyyy')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">{order.total.toLocaleString()} BDT</p>
                                <Badge variant={order.status === 'COMPLETED' || order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px]">
                                    {order.status}
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
              </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {/* TOP PRODUCTS */}
          <Card>
              <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Highest volume items</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                    {data.topProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No sales data yet.</p>
                    ) : (
                        data.topProducts.map((prod, i) => (
                        <div key={prod.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="font-bold text-muted-foreground w-4">{i + 1}.</div>
                                <div>
                                    <p className="text-sm font-medium leading-none line-clamp-1">{prod.name}</p>
                                    <p className="text-xs text-muted-foreground">{prod.sales} sold</p>
                                </div>
                            </div>
                            <div className="font-semibold text-sm">
                                {prod.revenue.toLocaleString()} BDT
                            </div>
                        </div>
                        ))
                    )}
                  </div>
              </CardContent>
          </Card>

          {/* LOW STOCK ALERTS */}
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Items nearing depletion (&le; 10 units)</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {data.lowStockProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Inventory is healthy.</p>
                      ) : (
                          data.lowStockProducts.map(prod => (
                              <div key={prod.id} className="flex items-center justify-between bg-red-50/50 dark:bg-red-950/20 p-2 rounded-md border border-red-100 dark:border-red-900/30">
                                  <div>
                                      <p className="text-sm font-medium text-red-800 dark:text-red-400 leading-none">{prod.name}</p>
                                      <p className="text-xs text-muted-foreground mt-1 text-red-600/70 dark:text-red-400/70">SKU: {prod.sku || 'N/A'}</p>
                                  </div>
                                  <div className="text-right flex flex-col items-end gap-1">
                                      <Badge variant="destructive" className="font-bold">
                                          {prod.stock} Left
                                      </Badge>
                                      <Link href={`/dashboard/products/${prod.id}`} className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center hover:underline">
                                          Update <ArrowUpRight className="h-3 w-3 ml-0.5" />
                                      </Link>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </CardContent>
          </Card>
      </div>

    </div>
  );
}
