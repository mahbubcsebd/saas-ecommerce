'use client';

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
    startOfMonth,
    subDays,
    subMonths
} from 'date-fns';
import {
    Activity,
    Calendar,
    Compass,
    Globe,
    Globe2,
    Layout,
    Loader2,
    Monitor,
    Smartphone,
    Tablet,
    TrendingUp,
    Zap
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SiteAnalyticsClient() {
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

            const response = await fetch(`${BACKEND_URL}/analytics/site?startDate=${startStr}&endDate=${endStr}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const res = await response.json();
            if (res.success) {
                setData(res.data);
            } else {
                toast.error(res.message || 'Failed to fetch analytics data');
            }
        } catch (error) {
            console.error('Analytics fetch error:', error);
            toast.error('Connection to analytics service failed');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) {
            fetchAnalytics();
        }
    }, [session?.accessToken, dateRange]);

    // Polling for real-time visitors
    useEffect(() => {
        const interval = setInterval(() => {
            if (session?.accessToken && !isLoading) {
                fetchAnalytics();
            }
        }, 15000); // Pulse every 15s
        return () => clearInterval(interval);
    }, [session?.accessToken, isLoading, dateRange]);

    if (isLoading && !data) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const funnelData = data?.funnel?.map((item: any) => ({
        stage: item.stage.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        count: item.count
    })) || [];

    const getDeviceIcon = (device: string) => {
        switch (device.toLowerCase()) {
            case 'mobile': return <Smartphone className="w-4 h-4" />;
            case 'tablet': return <Tablet className="w-4 h-4" />;
            default: return <Monitor className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header / Real-time Pulse */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wide uppercase">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        Live Traffic Pulse
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        {data?.realTime?.activeVisitors || 0}
                    </h1>
                    <p className="text-muted-foreground font-medium">Active visitors in the last 5 minutes</p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <Select value={datePreset} onValueChange={handlePresetChange}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                            <SelectItem value="thisMonth">This Month</SelectItem>
                            <SelectItem value="lastMonth">Last Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <Compass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.totalSessions || 0}</div>
                        <div className="flex items-center text-xs text-emerald-500 mt-1 font-medium">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            General traffic trend
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
                        <Layout className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.totalPageViews || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                           {data?.kpi?.avgPageViews || 0} views per session
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.kpi?.bounceRate || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            Sessions with only 1 page view
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">E-commerce CR</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {/* Simple CR calc: purchase / sessions */}
                        <div className="text-2xl font-bold">
                            {((data?.funnel?.find((f: any) => f.stage === 'purchase')?.count / (data?.kpi?.totalSessions || 1)) * 100).toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">Session to Purchase</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Conversion Funnel */}
                <Card className="lg:col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Conversion Funnel
                        </CardTitle>
                        <CardDescription>Visualizing user drop-off at each stage of the journey</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const prevCount = funnelData[0].count;
                                                const currentCount = payload[0].value as number;
                                                const conversion = ((currentCount / prevCount) * 100).toFixed(1);
                                                return (
                                                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                        <p className="font-bold text-sm">{payload[0].payload.stage}</p>
                                                        <p className="text-primary font-bold">{currentCount} users</p>
                                                        <p className="text-xs text-muted-foreground">{conversion}% of total</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={60}>
                                        {funnelData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card className="lg:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe2 className="w-5 h-5 text-primary" />
                            Traffic Sources
                        </CardTitle>
                        <CardDescription>Top channels bringing users to your shop</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.trafficSources || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(data?.trafficSources || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                             {(data?.trafficSources || []).slice(0, 3).map((source: any, idx: number) => (
                                <div key={source.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 font-medium">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                                        {source.name}
                                    </div>
                                    <span className="text-muted-foreground">{source.value} sessions</span>
                                </div>
                             ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Geo Distribution */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <Globe className="w-5 h-5" />
                            Top Countries
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(data?.geoDistribution || []).slice(0, 5).map((country: any) => (
                                <div key={country.name} className="space-y-1">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>{country.name}</span>
                                        <span>{country.value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000"
                                            style={{ width: `${(country.value / (data?.kpi?.totalSessions || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tech Stack */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <Monitor className="w-5 h-5" />
                            Device & Technology
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-xl space-y-3 bg-slate-50/50">
                                <h4 className="text-sm font-bold opacity-60 uppercase tracking-tighter">Device Types</h4>
                                <div className="space-y-2">
                                    {(data?.deviceDistribution || []).map((device: any) => (
                                        <div key={device.name} className="flex items-center justify-between text-xs font-semibold">
                                            <div className="flex items-center gap-2">
                                                {getDeviceIcon(device.name)}
                                                {device.name}
                                            </div>
                                            <span>{device.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border rounded-xl space-y-3 bg-slate-50/50">
                                <h4 className="text-sm font-bold opacity-60 uppercase tracking-tighter flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Insights
                                </h4>
                                <div className="space-y-2 text-xs">
                                     <p className="text-muted-foreground leading-relaxed">
                                        Traffic is mainly from <strong>{data?.geoDistribution?.[0]?.name || 'direct'}</strong> via <strong>{data?.deviceDistribution?.[0]?.name || 'desktop'}</strong> devices.
                                     </p>
                                     <div className="p-2 bg-primary/10 rounded-md border border-primary/20 text-primary font-bold">
                                         Conv. Rate: {((data?.funnel?.find((f: any) => f.stage === 'purchase')?.count / (data?.kpi?.totalSessions || 1)) * 100).toFixed(1)}%
                                     </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
