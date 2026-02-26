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
    subMonths
} from 'date-fns';
import {
    AlertTriangle,
    BarChart2,
    Calendar,
    Download,
    Loader2,
    Package,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
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
    YAxis
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ProductReportClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Filters
    const [datePreset, setDatePreset] = useState('30d');
    const [dateRange, setDateRange] = useState({
        start: subDays(new Date(), 30),
        end: new Date()
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
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

            const response = await fetch(`${BACKEND_URL}/analytics/products?startDate=${startStr}&endDate=${endStr}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const res = await response.json();
            if (res.success) {
                setData(res.data);
            } else {
                toast.error(res.message || 'Failed to fetch product data');
            }
        } catch (error) {
            console.error('Product reports fetch error:', error);
            toast.error('Could not connect to analytics service');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) {
            fetchAnalytics();
        }
    }, [session?.accessToken, dateRange]);

    const formatCurrency = (amount: any) => {
        const value = typeof amount === 'number' ? amount : 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
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
                    <h1 className="text-3xl font-bold tracking-tight">Product Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Performance, turnover, and profitability from {format(dateRange.start, 'PP')} to {format(dateRange.end, 'PP')}
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

                    <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <div className="p-2 bg-blue-500 rounded-lg text-white">
                            <Package className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.totalProducts || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">In your inventory</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <div className="p-2 bg-amber-500 rounded-lg text-white">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.lowStockCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Require restocking</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <div className="p-2 bg-emerald-500 rounded-lg text-white">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data?.kpi?.totalProfit || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Period earnings</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
                        <div className="p-2 bg-purple-500 rounded-lg text-white">
                            <BarChart2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.avgProfitMargin || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all products</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Products by Profit</CardTitle>
                        <CardDescription>Products generating the most net profit</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.topByProfit || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        width={100}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="profit" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Inventory Status Share</CardTitle>
                        <CardDescription>Stock distribution by category revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.topByProfit?.slice(0, 5) || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="revenue"
                                    >
                                        {(data?.topByProfit?.slice(0, 5) || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tables Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Slow Moving Products */}
                <Card className="lg:col-span-1 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-amber-500" />
                            Slow Moving Items
                        </CardTitle>
                        <CardDescription>Created &gt;30 days ago with low sales</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Product</th>
                                        <th className="px-4 py-2 text-right">Sales</th>
                                        <th className="px-4 py-2 text-right">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(data?.slowMoving || []).map((p: any) => (
                                        <tr key={p.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3 font-medium truncate max-w-[150px]">{p.name}</td>
                                            <td className="px-4 py-3 text-right text-amber-600 font-bold">{p.sales}</td>
                                            <td className="px-4 py-3 text-right">{p.stock}</td>
                                        </tr>
                                    ))}
                                    {(!data?.slowMoving || data.slowMoving.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground italic">
                                                No slow moving items found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Full Performance Table */}
                <Card className="lg:col-span-2 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Product Performance Detail</CardTitle>
                        <CardDescription>Comprehensive metrics for all items</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Product / SKU</th>
                                        <th className="px-6 py-3 text-right">Category</th>
                                        <th className="px-6 py-3 text-right">Turnover</th>
                                        <th className="px-6 py-3 text-right">Profit</th>
                                        <th className="px-6 py-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(data?.productPerformance || []).slice(0, 10).map((p: any) => (
                                        <tr key={p.id} className="hover:bg-muted/20">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold">{p.name}</div>
                                                <div className="text-xs text-muted-foreground">{p.sku || 'No SKU'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">{p.category}</td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {p.turnoverRate}x
                                            </td>
                                            <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                                                {formatCurrency(p.profit)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                {formatCurrency(p.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
