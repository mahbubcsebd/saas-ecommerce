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
    BarChart3,
    Calculator,
    Calendar,
    Download,
    Loader2,
    MapPin,
    PieChart as PieChartIcon,
    Receipt,
    Wallet
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
    YAxis
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function TaxReportClient() {
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

            const response = await fetch(`${BACKEND_URL}/analytics/tax?startDate=${startStr}&endDate=${endStr}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const res = await response.json();
            if (res.success) {
                setData(res.data);
            } else {
                toast.error(res.message || 'Failed to fetch tax data');
            }
        } catch (error) {
            console.error('Tax reports fetch error:', error);
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

    const exportToCSV = () => {
        if (!data?.detailedReport) return;

        const headers = ['Order #', 'Date', 'Taxable Amount', 'Tax %', 'Tax Amount', 'Total'];
        const rows = data.detailedReport.map((o: any) => [
            o.orderNumber,
            format(new Date(o.date), 'yyyy-MM-dd HH:mm'),
            o.taxableAmount,
            o.taxPercent,
            o.taxAmount,
            o.total
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: any) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tax_report_${format(dateRange.start, 'yyyy-MM-dd')}_to_${format(dateRange.end, 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    <h1 className="text-3xl font-bold tracking-tight">Tax Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        VAT and tax collection from {format(dateRange.start, 'PP')} to {format(dateRange.end, 'PP')}
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

                    <Button onClick={exportToCSV} variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-600/10 to-blue-700/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
                        <div className="p-2 bg-blue-600 rounded-lg text-white">
                            <Calculator className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data?.kpi?.totalTaxCollected || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Period total</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-600/10 to-emerald-700/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Taxable Revenue</CardTitle>
                        <div className="p-2 bg-emerald-600 rounded-lg text-white">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data?.kpi?.totalTaxableRevenue || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Net subtotal</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-amber-600/10 to-amber-700/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Effective Tax Rate</CardTitle>
                        <div className="p-2 bg-amber-600 rounded-lg text-white">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.avgTaxRate || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Average across orders</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-600/10 to-purple-700/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Taxable Orders</CardTitle>
                        <div className="p-2 bg-purple-600 rounded-lg text-white">
                            <Receipt className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.orderCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Orders with tax</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Tax Collection Trend</CardTitle>
                        <CardDescription>Daily tax collected over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.taxTrends || []}>
                                    <defs>
                                        <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                        tickFormatter={(val) => `৳${val}`}
                                    />
                                    <Tooltip
                                        formatter={(val: any) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTax)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6">
                    <Card className="shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4 text-primary" />
                                Tax by Rate Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[150px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data?.taxByRate || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="amount"
                                        >
                                            {(data?.taxByRate || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-md flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Tax by Location (Top Cities)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[150px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data?.taxByLocation || []} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tick={{ fontSize: 11 }}
                                            width={80}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                        <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Detailed Table */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">Tax Transaction Detail</CardTitle>
                    <CardDescription>Recent orders with tax breakdowns for accounting</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Order #</th>
                                    <th className="px-6 py-4 text-left font-semibold">Date</th>
                                    <th className="px-6 py-4 text-right font-semibold">Taxable Amount</th>
                                    <th className="px-6 py-4 text-right font-semibold">Tax Rate</th>
                                    <th className="px-6 py-4 text-right font-semibold">Tax Amount</th>
                                    <th className="px-6 py-4 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(data?.detailedReport || []).map((order: any) => (
                                    <tr key={order.orderNumber} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">{order.orderNumber}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {format(new Date(order.date), 'MMM d, yyyy HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(order.taxableAmount)}</td>
                                        <td className="px-6 py-4 text-right">{order.taxPercent}%</td>
                                        <td className="px-6 py-4 text-right font-bold text-amber-600">
                                            {formatCurrency(order.taxAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold">
                                            {formatCurrency(order.total)}
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.detailedReport || data.detailedReport.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground italic">
                                            No tax data found for this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
