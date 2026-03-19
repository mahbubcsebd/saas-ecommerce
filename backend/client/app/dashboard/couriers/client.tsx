'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/hooks/use-confirm';
import {
    Activity,
    AlertTriangle,
    Compass,
    DollarSign,
    Edit2,
    ExternalLink,
    Globe,
    Loader2,
    MoreVertical,
    Plus,
    Shield,
    Trash2,
    Truck
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ShippingRate {
    id: string;
    method: string;
    zone: { name: string };
    calculationType: string;
    flatRate: number | null;
}

interface Courier {
    id: string;
    name: string;
    code: string;
    description: string | null;
    logo: string | null;
    website: string | null;
    trackingUrl: string | null;
    trackingType: 'POLLING' | 'WEBHOOK' | 'MANUAL';
    supportedCountries: string[];
    supportedRegions: string[];
    serviceLevels: string[];
    apiConfig: any;
    isActive: boolean;
    shippingRates?: ShippingRate[];
    _count?: {
        shippingRates: number;
    };
}

export default function CouriersClient() {
    const { confirm } = useConfirm();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourier, setEditingCourier] = useState<Courier | null>(null);

    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        logo: '',
        website: '',
        trackingUrl: '',
        trackingType: 'POLLING' as 'POLLING' | 'WEBHOOK' | 'MANUAL',
        supportedCountries: '',
        supportedRegions: '',
        serviceLevels: '',
        apiConfig: '{}',
        isActive: true
    });

    const fetchCouriers = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const res = await fetch(`${BACKEND_URL}/couriers`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                setCouriers(data.data);
            }
        } catch (error) {
            toast.error('Failed to load couriers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchCouriers();
    }, [session?.accessToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.accessToken) return;

        let apiConfigObj = {};
        try {
            apiConfigObj = JSON.parse(form.apiConfig);
        } catch (e) {
            toast.error('Invalid API Config JSON');
            return;
        }

        const payload = {
            ...form,
            apiConfig: apiConfigObj,
            supportedCountries: form.supportedCountries.split(',').map(s => s.trim()).filter(Boolean),
            supportedRegions: form.supportedRegions.split(',').map(s => s.trim()).filter(Boolean),
            serviceLevels: form.serviceLevels.split(',').map(s => s.trim()).filter(Boolean)
        };

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const method = editingCourier ? 'PUT' : 'POST';
            const url = editingCourier
                ? `${BACKEND_URL}/couriers/${editingCourier.id}`
                : `${BACKEND_URL}/couriers`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                toast.success(editingCourier ? 'Courier updated' : 'Courier created');
                setIsModalOpen(false);
                fetchCouriers();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({
            title: 'Terminate Courier Link',
            message: 'Are you sure you want to terminate this courier link? This partner might be actively servicing several delivery methods. Checkout rates will be affected immediately.',
            type: 'danger',
            confirmText: 'Terminate Link'
        })) return;
        if (!session?.accessToken) return;

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const res = await fetch(`${BACKEND_URL}/couriers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Courier removed');
                fetchCouriers();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const openModal = async (courierId?: string) => {
        if (courierId) {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
            const res = await fetch(`${BACKEND_URL}/couriers/${courierId}`, {
                headers: { 'Authorization': `Bearer ${session?.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                const courier = data.data;
                setEditingCourier(courier);
                setForm({
                    name: courier.name,
                    code: courier.code,
                    description: courier.description || '',
                    logo: courier.logo || '',
                    website: courier.website || '',
                    trackingUrl: courier.trackingUrl || '',
                    trackingType: courier.trackingType || 'POLLING',
                    supportedCountries: courier.supportedCountries?.join(', ') || '',
                    supportedRegions: courier.supportedRegions?.join(', ') || '',
                    serviceLevels: courier.serviceLevels?.join(', ') || '',
                    apiConfig: JSON.stringify(courier.apiConfig, null, 2),
                    isActive: courier.isActive
                });
            }
        } else {
            setEditingCourier(null);
            setForm({
                name: '',
                code: '',
                description: '',
                logo: '',
                website: '',
                trackingUrl: '',
                trackingType: 'POLLING',
                supportedCountries: '',
                supportedRegions: '',
                serviceLevels: '',
                apiConfig: '{}',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-blue-600/5 p-8 rounded-[2rem] border border-blue-600/10 backdrop-blur-sm">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs tracking-widest uppercase">
                        <Compass className="w-3.5 h-3.5 fill-blue-600" />
                        Logistics Network
                    </div>
                    <h1 className="text-4xl font-[900] tracking-tight text-slate-900 italic">Courier Partners</h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        Optimize your global reach by managing carrier integrations, service areas, and real-time tracking sync.
                    </p>
                </div>
                <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black shadow-lg shadow-blue-200 transition-all gap-2 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add Courier
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {couriers.length === 0 ? (
                    <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                        <Truck className="w-20 h-20 mx-auto mb-6 text-slate-300 animate-bounce" />
                        <h3 className="text-2xl font-black text-slate-400">No Courier Partners</h3>
                        <p className="text-muted-foreground font-medium mb-6">Start by integrating your first logistics partner.</p>
                        <Button variant="outline" onClick={() => openModal()} className="rounded-xl border-2 font-bold px-8 h-12">
                            Connect Courier
                        </Button>
                    </div>
                ) : (
                    couriers.map(courier => (
                        <Card key={courier.id} className="group relative overflow-hidden border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] rounded-[2.5rem] bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                            {/* Card Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[5rem] -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors" />

                            <CardHeader className="p-8 pb-4 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="h-20 w-20 bg-slate-50 rounded-3xl overflow-hidden border-2 border-slate-100 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-white transition-all shadow-sm">
                                        {courier.logo ? (
                                            <img src={courier.logo} alt={courier.name} className="h-[70%] w-[70%] object-contain" />
                                        ) : (
                                            <Truck className="w-10 h-10 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={`rounded-lg font-black text-[10px] uppercase px-2 py-0.5 ${courier.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                            {courier.isActive ? 'Active' : 'Offline'}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-slate-100 border">
                                                    <MoreVertical className="w-5 h-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
                                                <DropdownMenuItem onClick={() => openModal(courier.id)} className="rounded-xl font-bold py-3">
                                                    <Edit2 className="w-4 h-4 mr-3 text-blue-500" /> Configure Partner
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl font-bold py-3">
                                                    <Activity className="w-4 h-4 mr-3 text-emerald-500" /> Integration Logs
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(courier.id)}
                                                    className="rounded-xl font-bold py-3 text-rose-500 focus:bg-rose-50 focus:text-rose-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-3" /> Terminate Link
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">{courier.name}</h3>
                                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">{courier.code}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-400 line-clamp-2 italic leading-relaxed">
                                        {courier.description || 'Global logistics and fulfillment partner.'}
                                    </p>
                                </div>
                            </CardHeader>

                            <CardContent className="p-8 pt-4 space-y-6 relative z-10">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50/80 rounded-[1.5rem] border border-slate-100/50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <div className="text-[10px] font-[900] text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Activity className="w-3 h-3 text-blue-500" /> SYNC TYPE
                                        </div>
                                        <div className="text-xs font-black text-slate-700">{courier.trackingType}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50/80 rounded-[1.5rem] border border-slate-100/50 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <div className="text-[10px] font-[900] text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <DollarSign className="w-3 h-3 text-emerald-500" /> RATES
                                        </div>
                                        <div className="text-xs font-black text-slate-700">{courier._count?.shippingRates || 0} ACTIVE</div>
                                    </div>
                                </div>

                                {/* Coverage Tags */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {courier.supportedCountries?.length > 0 ? (
                                            courier.supportedCountries.map(c => (
                                                <Badge key={c} className="bg-blue-50 text-blue-600 border-blue-100/50 rounded-lg font-black text-[10px] px-2">
                                                    {c}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-bold uppercase italic">Global Coverage</span>
                                        )}
                                    </div>

                                    {courier.website && (
                                        <a
                                            href={courier.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-tight"
                                        >
                                            <Globe className="w-3.5 h-3.5" />
                                            Direct Connect
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    )}
                                </div>

                                <Button
                                    variant="secondary"
                                    className="w-full rounded-2xl h-14 font-black uppercase text-xs tracking-widest border-2 border-transparent bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg hover:shadow-black/20"
                                    onClick={() => openModal(courier.id)}
                                >
                                    Logistics Management
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Expanded Courier Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[750px] max-h-[92vh] overflow-y-auto rounded-[2.5rem] p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-3xl font-[900] tracking-tight italic">
                            {editingCourier ? 'Configure Logistics Node' : 'Initialize Carrier'}
                        </DialogTitle>
                        <DialogDescription className="text-lg font-medium text-slate-400">
                            Fine-tune integration parameters, service coverage, and tracking protocols.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-14 w-full justify-start mb-8 border border-slate-200/50">
                            <TabsTrigger value="general" className="rounded-xl flex-1 h-11 font-black text-xs uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">General</TabsTrigger>
                            <TabsTrigger value="coverage" className="rounded-xl flex-1 h-11 font-black text-xs uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Availability</TabsTrigger>
                            <TabsTrigger value="tracking" className="rounded-xl flex-1 h-11 font-black text-xs uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">vAPI Tracking</TabsTrigger>
                            <TabsTrigger value="rates" className="rounded-xl flex-1 h-11 font-black text-xs uppercase transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Rates & Zones</TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit}>
                            <TabsContent value="general" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Public Partner Name</Label>
                                        <Input
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-blue-500 font-bold"
                                            value={form.name}
                                            onChange={e => setForm({...form, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">System Identifier (Code)</Label>
                                        <Input
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus:ring-blue-500 font-mono text-blue-600 font-bold"
                                            value={form.code}
                                            placeholder="e.g. pathao-bd"
                                            onChange={e => setForm({...form, code: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Partner Credential Profile (JSON)</Label>
                                    <Textarea
                                        className="min-h-[160px] rounded-3xl bg-slate-900 text-emerald-400 font-mono text-[11px] border-none shadow-inner p-6"
                                        value={form.apiConfig}
                                        onChange={e => setForm({...form, apiConfig: e.target.value})}
                                    />
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight leading-relaxed">
                                            Store API keys, secrets, and environment flags here. Credentials are encrypted at rest during fulfillment requests.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="coverage" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Supported Countries (CSV)</Label>
                                    <Input
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                                        placeholder="BD, IN, US"
                                        value={form.supportedCountries}
                                        onChange={e => setForm({...form, supportedCountries: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Regional Hubs / States (CSV)</Label>
                                    <Textarea
                                        className="min-h-[100px] rounded-2xl bg-slate-50 border-slate-200 font-bold"
                                        placeholder="Dhaka, Chittagong, Sylhet"
                                        value={form.supportedRegions}
                                        onChange={e => setForm({...form, supportedRegions: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Service Level Capabilities (CSV)</Label>
                                    <Input
                                        className="h-14 rounded-2xl bg-blue-50 border-blue-100 text-blue-900 font-bold"
                                        placeholder="COD, NEXT_DAY, FRAGILE, DOOR_TO_DOOR"
                                        value={form.serviceLevels}
                                        onChange={e => setForm({...form, serviceLevels: e.target.value})}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="tracking" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Tracking Sync Strategy</Label>
                                        <select
                                            className="w-full h-14 rounded-2xl bg-slate-50 border-slate-200 font-black text-xs uppercase px-4 focus:ring-blue-500"
                                            value={form.trackingType}
                                            onChange={e => setForm({...form, trackingType: e.target.value as any})}
                                        >
                                            <option value="POLLING">Automated Polling</option>
                                            <option value="WEBHOOK">Real-time Webhooks</option>
                                            <option value="MANUAL">Manual Updates</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 pl-1 tracking-widest">Tracking Template URL</Label>
                                        <Input
                                            className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                                            placeholder="https://track.it/{{id}}"
                                            value={form.trackingUrl}
                                            onChange={e => setForm({...form, trackingUrl: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Card className="border-none bg-blue-900 p-8 rounded-[2rem] text-white">
                                    <div className="flex items-start gap-6">
                                        <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                                            <Shield className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black mb-1">Secure vAPI Engine</h4>
                                            <p className="text-blue-200 text-sm font-medium leading-relaxed italic">
                                                Our middleware platform automatically translates generic courier status codes into standard internal milestones (Pending, In Transit, Delivered).
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="rates" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                {editingCourier?.shippingRates && editingCourier.shippingRates.length > 0 ? (
                                    <div className="rounded-3xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b">
                                                <tr className="text-[10px] font-black uppercase text-slate-400">
                                                    <th className="px-6 py-4">Method Name</th>
                                                    <th className="px-6 py-4">Zone coverage</th>
                                                    <th className="px-6 py-4">Pricing</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y italic">
                                                {editingCourier.shippingRates.map(rate => (
                                                    <tr key={rate.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-slate-900 font-black">{rate.method}</td>
                                                        <td className="px-6 py-4">{rate.zone.name}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5 text-blue-600 font-black">
                                                                <DollarSign className="w-3 h-3" />
                                                                {rate.calculationType === 'FLAT' ? `${rate.flatRate}৳` : 'Formula'}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300 opacity-50" />
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No active rates linked to this carrier</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">Visit Shipping Zones to assign this courier to a delivery method.</p>
                                    </div>
                                )}
                            </TabsContent>

                            <div className="flex items-center justify-between mt-12 p-6 bg-slate-50/80 rounded-3xl border border-slate-200/50">
                                <div className="flex items-center gap-4">
                                    <div className={`h-4 w-4 rounded-full ${form.isActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                    <div>
                                        <Label className="text-sm font-black text-slate-800">Operational Integrity</Label>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Carrier availability across checkout services</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.isActive}
                                    onCheckedChange={checked => setForm({...form, isActive: checked})}
                                    className="scale-110 data-[state=checked]:bg-emerald-500"
                                />
                            </div>

                            <DialogFooter className="mt-10 pt-6 border-t">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl font-black text-xs uppercase tracking-widest px-8">Discard Changes</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-12 h-16 font-[900] shadow-2xl shadow-blue-200 transition-all text-xs uppercase tracking-[0.2em]">
                                    {editingCourier ? 'Commit Integration' : 'Initialize Partner Link'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Placeholder to avoid import error if Layers is used (it was used in my thought process but let's be sure it's in imports)
import { Layers } from 'lucide-react';
