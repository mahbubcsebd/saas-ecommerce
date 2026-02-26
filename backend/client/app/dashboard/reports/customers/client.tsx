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
    Calendar,
    CreditCard,
    Download,
    Loader2,
    TrendingUp,
    UserCheck,
    UserPlus,
    Users
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { toast } from 'sonner';

export default function CustomerReportClient() {
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

            const response = await fetch(`${BACKEND_URL}/analytics/customers?startDate=${startStr}&endDate=${endStr}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const res = await response.json();
            if (res.success) {
                setData(res.data);
            } else {
                toast.error(res.message || 'Failed to fetch customer data');
            }
        } catch (error) {
            console.error('Customer reports fetch error:', error);
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
                    <h1 className="text-3xl font-bold tracking-tight">Customer Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Growth, retention, and lifetime value from {format(dateRange.start, 'PP')} to {format(dateRange.end, 'PP')}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <div className="p-2 bg-blue-500 rounded-lg text-white">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.totalCustomers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-green-500/10 to-green-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <div className="p-2 bg-green-500 rounded-lg text-white">
                            <UserPlus className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.newCustomers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">In this period</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                        <div className="p-2 bg-amber-500 rounded-lg text-white">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.repeatCustomers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Loyal customers</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Avg CLV</CardTitle>
                        <div className="p-2 bg-purple-500 rounded-lg text-white">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data?.kpi?.clv || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Lifetime value avg</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-rose-500/10 to-rose-600/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Avg CAC</CardTitle>
                        <div className="p-2 bg-rose-500 rounded-lg text-white">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data?.kpi?.cac || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acquisition cost</p>
                    </CardContent>
                </Card>
            </div>

            {/* Growth Chart */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Customer Registration Growth
                    </CardTitle>
                    <CardDescription>Daily new customer registrations over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.customerGrowth || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
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
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelFormatter={(label) => format(new Date(label), 'PPP')}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Top Customers Table */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">Top Customers by Spending</CardTitle>
                    <CardDescription>The most valuable customers based on total completed orders</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Customer</th>
                                    <th className="px-6 py-4 text-left font-semibold">Email</th>
                                    <th className="px-6 py-4 text-right font-semibold">Orders</th>
                                    <th className="px-6 py-4 text-right font-semibold">Total Spent</th>
                                    <th className="px-6 py-4 text-right font-semibold">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(data?.topCustomers || []).map((customer: any) => (
                                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">{customer.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{customer.email}</td>
                                        <td className="px-6 py-4 text-right">{customer.orderCount}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">
                                            {formatCurrency(customer.totalSpent)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground">
                                            {format(new Date(customer.joinedAt), 'MMM yyyy')}
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.topCustomers || data.topCustomers.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
                                            No customer data found for this period.
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
