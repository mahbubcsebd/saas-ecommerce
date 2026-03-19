'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  format,
  startOfMonth,
  startOfToday,
  subDays,
  subMonths,
} from 'date-fns';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Layers,
  Loader2,
  Package,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

export default function SalesReportClient() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters
  const [datePreset, setDatePreset] = useState('30d');
  const [groupBy, setGroupBy] = useState('day');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const handlePresetChange = (val: string) => {
    setDatePreset(val);
    let start = new Date();
    const end = new Date();

    switch (val) {
      case 'today':
        start = startOfToday();
        break;
      case '7d':
        start = subDays(new Date(), 7);
        break;
      case '30d':
        start = subDays(new Date(), 30);
        break;
      case '90d':
        start = subDays(new Date(), 90);
        break;
      case 'thisMonth':
        start = startOfMonth(new Date());
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(new Date(), 1));
        const lastMonthEnd = new Date(start);
        lastMonthEnd.setMonth(start.getMonth() + 1);
        lastMonthEnd.setDate(0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        setDateRange({ start, end: lastMonthEnd });
        return;
    }
    setDateRange({ start, end });
  };

  const fetchAnalytics = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const startStr = dateRange.start.toISOString();
      const endStr = dateRange.end.toISOString();
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      const response = await fetch(
        `${BACKEND_URL}/analytics/advanced?startDate=${startStr}&endDate=${endStr}&groupBy=${groupBy}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );
      const res = await response.json();
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.message || 'Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Sales reports fetch error:', error);
      toast.error('Could not connect to analytics service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!session?.accessToken) return;
    try {
      const startStr = dateRange.start.toISOString();
      const endStr = dateRange.end.toISOString();
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      const response = await fetch(
        `${BACKEND_URL}/analytics/export?startDate=${startStr}&endDate=${endStr}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchAnalytics();
    }
  }, [session?.accessToken, dateRange, groupBy]);

  const formatCurrency = (amount: any) => {
    const value = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground mt-1">
            Detailed breakdown of your store performance from{' '}
            {format(dateRange.start, 'PP')} to {format(dateRange.end, 'PP')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={datePreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="w-[180px] bg-background">
              <Calendar className="w-4 h-4 mr-2 opacity-50" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[140px] bg-background">
              <Layers className="w-4 h-4 mr-2 opacity-50" />
              <SelectValue placeholder="Group BY" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/5"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg text-white">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.kpi?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {data?.kpi?.totalRevenue > 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                  Active period growth
                </>
              ) : (
                'No revenue recorded'
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.kpi?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <div className="p-2 bg-amber-500 rounded-lg text-white">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.kpi?.averageOrderValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue per order
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg text-white">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.kpi?.totalItemsSold || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products shipped
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trend Area Chart */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Revenue Trend
            </CardTitle>
            <CardDescription>
              Visualizing revenue growth over the selected interval
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.timeSeriesData || []}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(val) => {
                      if (groupBy === 'day')
                        return format(new Date(val), 'MMM d');
                      if (groupBy === 'hour')
                        return format(new Date(val), 'HH:mm');
                      return val;
                    }}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(val) =>
                      `৳${val > 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
                    }
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                    labelFormatter={(label) =>
                      format(new Date(label), 'PPP HH:mm')
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Share Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Category Share
            </CardTitle>
            <CardDescription>
              Revenue distribution by product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categories || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                  >
                    {data?.categories.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {data?.categories?.slice(0, 3).map((cat: any, i: number) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrency(cat.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Products & Payment Methods */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Products Table */}
        <Card className="lg:col-span-2 shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Top Performing Products</CardTitle>
            <CardDescription>
              Best sellers ranked by total revenue generated
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Rank</th>
                    <th className="px-6 py-3 text-left font-medium">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-right font-medium">Sales</th>
                    <th className="px-6 py-3 text-right font-medium">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.topProducts?.map((product: any, idx: number) => (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-muted-foreground">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4 font-medium">{product.name}</td>
                      <td className="px-6 py-4 text-right">
                        {product.sales} units
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-primary">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.topProducts || data.topProducts.length === 0) && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-muted-foreground"
                      >
                        No product data available for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Bar Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Volume handled by each payment channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.paymentMethods || []} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="method"
                    type="category"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Bar
                    dataKey="amount"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t space-y-3">
              {Object.entries(data?.statusStats || {}).map(
                ([status, count]: any) => (
                  <div
                    key={status}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground capitalize">
                      {status.toLowerCase()} Orders
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
