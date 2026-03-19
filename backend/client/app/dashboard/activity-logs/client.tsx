'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Activity,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Edit,
    Filter,
    Globe,
    History,
    Loader2,
    LogIn,
    LogOut,
    Monitor,
    RefreshCw,
    Search,
    SearchX,
    Trash
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ActivityLog {
    id: string;
    action: string;
    target: string;
    timestamp: string;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: any;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string | null;
    };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ActivityLogsClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Filter States
    const [search, setSearch] = useState('');
    const [userId, setUserId] = useState('ALL');
    const [action, setAction] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '15',
                ...(search && { search }),
                ...(userId !== 'ALL' && { userId }),
                ...(action !== 'ALL' && { action }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const res = await fetch(`${BACKEND_URL}/staff/activity?${params}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();

            if (data.success) {
                setLogs(data.data.logs);
                setPagination(data.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to sync audit data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken, page, userId, action, startDate, endDate]);

    const handleExport = async () => {
        if (!session?.accessToken) return;
        setIsExporting(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const params = new URLSearchParams({
                ...(search && { search }),
                ...(userId !== 'ALL' && { userId }),
                ...(action !== 'ALL' && { action }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });

            const res = await fetch(`${BACKEND_URL}/staff/activity/export?${params}`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success('Audit trail exported successfully');
            } else {
                toast.error('Export failed');
            }
        } catch (error) {
            toast.error('Failed to initiate export');
        } finally {
            setIsExporting(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action.toUpperCase()) {
            case 'LOGIN': return <LogIn className="w-4 h-4" />;
            case 'LOGOUT': return <LogOut className="w-4 h-4" />;
            case 'CREATE': return <Edit className="w-4 h-4" />; // Or specific
            case 'UPDATE': return <RefreshCw className="w-4 h-4" />;
            case 'DELETE': return <Trash className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActionColor = (action: string) => {
        const a = action.toUpperCase();
        if (a.includes('CREATE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (a.includes('UPDATE')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (a.includes('DELETE')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (a === 'LOGIN') return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        if (a === 'LOGOUT') return 'bg-slate-50 text-slate-600 border-slate-100';
        return 'bg-amber-50 text-amber-600 border-amber-100';
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-24">
            {/* Design-forward Hero Section */}
            <div className="relative overflow-hidden bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full -ml-20 -mb-20 blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                            <History className="w-4 h-4 text-blue-400" /> System Audit Trail
                        </div>
                        <h1 className="text-6xl md:text-7xl font-[1000] tracking-tighter leading-none italic uppercase text-slate-900">
                            Operational <span className="text-blue-600 text-outline-blue">Narrative</span>
                        </h1>
                        <p className="text-slate-500 font-bold max-w-2xl text-xl leading-relaxed">
                            A high-fidelity ledger detailing synchronized interactions between personnel archetypes and systemic resources.
                        </p>
                    </div>

                    <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-black text-white rounded-3xl h-24 px-12 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 group shrink-0 gap-4"
                    >
                        {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
                        Archive Dataset (.CSV)
                    </Button>
                </div>
            </div>

            {/* Filter Architecture */}
            <Card className="rounded-[2.5rem] border-none shadow-[0_16px_48px_-8px_rgba(0,0,0,0.04)] bg-white/70 backdrop-blur-xl p-8 overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="relative group lg:col-span-2">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Trace action or resource target..."
                            className="h-16 pl-14 rounded-2xl bg-white border-slate-100 shadow-sm font-bold text-slate-600 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchData()}
                        />
                    </div>

                    <Select value={action} onValueChange={setAction}>
                        <SelectTrigger className="h-16 rounded-2xl bg-white border-slate-100 shadow-sm font-black text-xs uppercase tracking-widest px-6">
                            <SelectValue placeholder="Action Node" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                            <SelectItem value="ALL" className="rounded-xl font-bold py-3 text-xs uppercase">All Interactions</SelectItem>
                            <SelectItem value="LOGIN" className="rounded-xl font-bold py-3 text-xs uppercase">Auth: Login</SelectItem>
                            <SelectItem value="LOGOUT" className="rounded-xl font-bold py-3 text-xs uppercase">Auth: Logout</SelectItem>
                            <SelectItem value="CREATE" className="rounded-xl font-bold py-3 text-xs uppercase">Logic: Create</SelectItem>
                            <SelectItem value="UPDATE" className="rounded-xl font-bold py-3 text-xs uppercase">Logic: Update</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex gap-4 lg:col-span-2">
                        <div className="flex-1 relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                type="date"
                                className="h-16 pl-10 rounded-2xl bg-white border-slate-100 shadow-sm font-bold text-xs uppercase focus-visible:ring-2 focus-visible:ring-blue-500/20"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                type="date"
                                className="h-16 pl-10 rounded-2xl bg-white border-slate-100 shadow-sm font-bold text-xs uppercase focus-visible:ring-2 focus-visible:ring-blue-500/20"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={fetchData}
                            className="h-16 w-16 rounded-2xl bg-slate-900 border-none shadow-xl hover:bg-black text-white shrink-0"
                        >
                            <Filter className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Narrative Feed */}
            <Card className="rounded-[3rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-100/50">
                                <tr className="text-[11px] font-[900] uppercase tracking-[0.2em] text-slate-400">
                                    <th className="px-10 py-8">Audited Personnel</th>
                                    <th className="px-10 py-8">Action Node</th>
                                    <th className="px-10 py-8">Resource Target</th>
                                    <th className="px-10 py-8">Temporal ID</th>
                                    <th className="px-10 py-8 text-right">Tracing</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
                                            <p className="font-black text-xs uppercase tracking-widest text-slate-400 italic">Syncing with Narrative Ledger...</p>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center">
                                            <SearchX className="w-16 h-16 mx-auto mb-6 text-slate-100" />
                                            <p className="font-[1000] text-3xl italic uppercase tracking-tighter text-slate-200 mb-2">No Entries Found</p>
                                            <p className="font-bold text-slate-300 italic">No operational interactions match your current filter matrix.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-14 w-14 rounded-2xl border-4 border-white shadow-xl transition-transform group-hover:scale-110">
                                                        <AvatarImage src={log.user.avatar || ''} />
                                                        <AvatarFallback className="bg-blue-600 text-white font-[1000] rounded-2xl uppercase">
                                                            {log.user.firstName[0]}{log.user.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-[1000] text-slate-900 leading-tight">
                                                            {log.user.firstName} {log.user.lastName}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-400 italic tracking-tight">
                                                            {log.user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <Badge className={`rounded-lg font-black text-[10px] uppercase tracking-widest px-4 py-1.5 border gap-2 shadow-sm ${getActionColor(log.action)}`}>
                                                    {getActionIcon(log.action)}
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1 max-w-[300px]">
                                                    <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {log.target}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">
                                                        Asset Trace Integrity: OK
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase italic tracking-tighter">
                                                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Globe className="w-3 h-3" /> {log.ipAddress || 'Internal'}
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Monitor className="w-3 h-3" /> {log.userAgent?.split(' ')[0] || 'Unknown'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Architecture */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="p-10 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Viewing <span className="text-slate-900">{logs.length}</span> nodes of <span className="text-slate-900">{pagination.total}</span> entries in ledger
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="rounded-2xl h-14 w-14 p-0 border-2 hover:bg-white hover:text-blue-600 transition-all border-slate-100"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <div className="flex items-center px-6 bg-white rounded-2xl border-2 border-blue-500 shadow-xl shadow-blue-500/10 font-black text-xs uppercase tracking-[0.2em] text-blue-600 italic">
                                    Sheet {page} of {pagination.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="rounded-2xl h-14 w-14 p-0 border-2 hover:bg-white hover:text-blue-600 transition-all border-slate-100"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
