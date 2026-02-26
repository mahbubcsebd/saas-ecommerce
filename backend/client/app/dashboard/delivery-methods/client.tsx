'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    CheckCircle2,
    Clock,
    Globe,
    Layers,
    Loader2,
    Shield,
    Truck,
    Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Courier {
    id: string;
    name: string;
    code: string;
}

interface ShippingRate {
    id: string;
    zoneId: string;
    zone: { name: string };
    method: string;
    carrier: string | null;
    courierId: string | null;
    courier?: Courier;
    calculationType: 'FLAT' | 'WEIGHT_BASED' | 'ORDER_VALUE' | 'TABLE_RATE';
    flatRate: number | null;
    baseRate: number | null;
    perKgRate: number | null;
    freeShippingThreshold: number | null;
    minWeight: number | null;
    maxWeight: number | null;
    minOrderValue: number | null;
    estimatedDays: string | null;
    isActive: boolean;
}

interface ShippingZone {
    id: string;
    name: string;
}

export default function DeliveryMethodsClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [couriers, setCouriers] = useState<Courier[]>([]);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

    const [rateForm, setRateForm] = useState({
        method: '',
        carrier: '',
        courierId: '',
        calculationType: 'FLAT',
        flatRate: 0,
        baseRate: 0,
        perKgRate: 0,
        freeShippingThreshold: 0,
        minWeight: 0,
        maxWeight: 0,
        minOrderValue: 0,
        estimatedDays: '',
        isActive: true
    });

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

            // Fetch Zones to get rates
            const zonesRes = await fetch(`${BACKEND_URL}/shipping/zones`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const zonesData = await zonesRes.json();

            if (zonesData.success) {
                const allRates: ShippingRate[] = [];
                zonesData.data.forEach((zone: any) => {
                    zone.rates.forEach((rate: any) => {
                        allRates.push({ ...rate, zone: { name: zone.name } });
                    });
                });
                setRates(allRates);
            }

            // Fetch Couriers
            const courierRes = await fetch(`${BACKEND_URL}/couriers`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const courierData = await courierRes.json();
            if (courierData.success) {
                setCouriers(courierData.data);
            }

        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleUpdateRate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.accessToken || !editingRate) return;

        const payload = {
            ...rateForm,
            courierId: rateForm.courierId || null,
            flatRate: Number(rateForm.flatRate),
            baseRate: Number(rateForm.baseRate),
            perKgRate: Number(rateForm.perKgRate),
            freeShippingThreshold: Number(rateForm.freeShippingThreshold),
            minWeight: Number(rateForm.minWeight),
            maxWeight: Number(rateForm.maxWeight),
            minOrderValue: Number(rateForm.minOrderValue)
        };

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/shipping/rates/${editingRate.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Delivery method updated');
                setIsRateModalOpen(false);
                setEditingRate(null);
                fetchData();
            }
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const openRateModal = (rate: ShippingRate) => {
        setEditingRate(rate);
        setRateForm({
            method: rate.method,
            carrier: rate.carrier || '',
            courierId: rate.courierId || '',
            calculationType: rate.calculationType,
            flatRate: rate.flatRate || 0,
            baseRate: rate.baseRate || 0,
            perKgRate: rate.perKgRate || 0,
            freeShippingThreshold: rate.freeShippingThreshold || 0,
            minWeight: rate.minWeight || 0,
            maxWeight: rate.maxWeight || 0,
            minOrderValue: rate.minOrderValue || 0,
            estimatedDays: rate.estimatedDays || '',
            isActive: rate.isActive
        });
        setIsRateModalOpen(true);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs tracking-widest uppercase">
                        <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                        Shipping Strategy
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Delivery Methods</h1>
                    <p className="text-muted-foreground font-medium max-w-xl">
                        Optimize your checkout conversion by offering the right balance of speed and cost across all shipping zones.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
                    <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-xl font-black">{rates.length}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Methods</div>
                    </div>
                </div>
            </div>

            {/* Methods Table/List */}
            <Card className="border shadow-xl rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="bg-white/80 border-b px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold">Shipping Rules & Logic</CardTitle>
                            <CardDescription>Manage your global delivery methods from a single pane of glass.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b italic">
                                    <th className="px-8 py-4">Method & Zone</th>
                                    <th className="px-6 py-4">Strategy</th>
                                    <th className="px-6 py-4">Cost Structure</th>
                                    <th className="px-6 py-4">Courier Link</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rates.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <Layers className="w-12 h-12 mb-4" />
                                                <p className="font-bold">No delivery methods configured.</p>
                                                <p className="text-sm">Add rates to your shipping zones to see them here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rates.map((rate) => (
                                        <tr key={rate.id} className="group hover:bg-emerald-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors group-hover:shadow-sm">
                                                        <Truck className="w-5 h-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800">{rate.method}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                                            <Globe className="w-3 h-3" />
                                                            {rate.zone.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-white rounded-lg border-emerald-100 text-emerald-700 font-bold px-3 py-1">
                                                    {rate.calculationType.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700">
                                                    {rate.calculationType === 'FLAT' && `${rate.flatRate}৳`}
                                                    {rate.calculationType === 'WEIGHT_BASED' && `${rate.baseRate}৳ + ${rate.perKgRate}৳/kg`}
                                                    {rate.calculationType === 'ORDER_VALUE' && (
                                                        rate.freeShippingThreshold ? `Free > ${rate.freeShippingThreshold}৳` : `${rate.flatRate}৳`
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                                                    <Clock className="w-3 h-3" />
                                                    {rate.estimatedDays || 'N/A'} DAYS EST.
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {rate.courierId ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 w-fit">
                                                        <Shield className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-tight">
                                                            {couriers.find(c => c.id === rate.courierId)?.name || 'Direct'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Self Managed</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${rate.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    <span className={`text-xs font-bold ${rate.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                        {rate.isActive ? 'Operational' : 'Disabled'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => openRateModal(rate)}
                                                    className="rounded-xl font-bold text-xs h-9 px-4 border shadow-sm hover:shadow-md transition-all sm:opacity-0 group-hover:opacity-100"
                                                >
                                                    Configure
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Rate Dialog (Same as Shipping Zones but simplified or adapted) */}
            <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-none shadow-2xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-black">Configure Delivery Method</DialogTitle>
                        <DialogDescription className="text-base font-medium">
                            Adjust how <span className="text-slate-900 font-bold underline decoration-emerald-400">{editingRate?.method}</span> works in the {editingRate?.zone.name} zone.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateRate} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="method" className="text-xs font-black uppercase text-slate-500 pl-1">Display Name</Label>
                                <Input
                                    id="method"
                                    className="rounded-2xl h-12 bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                    value={rateForm.method}
                                    onChange={e => setRateForm({...rateForm, method: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="courierId" className="text-xs font-black uppercase text-slate-500 pl-1">Associate Courier</Label>
                                <Select
                                    value={rateForm.courierId}
                                    onValueChange={val => setRateForm({...rateForm, courierId: val})}
                                >
                                    <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Internal/Direct" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border shadow-xl">
                                        <SelectItem value="">No Integration (Direct)</SelectItem>
                                        {couriers.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500 pl-1">Pricing Strategy</Label>
                            <Select
                                value={rateForm.calculationType}
                                onValueChange={(val: any) => setRateForm({...rateForm, calculationType: val})}
                            >
                                <SelectTrigger className="rounded-2xl h-12 bg-emerald-50 border-emerald-100 text-emerald-900 font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border shadow-xl">
                                    <SelectItem value="FLAT">Flat Rate (Fixed Cost)</SelectItem>
                                    <SelectItem value="WEIGHT_BASED">Weight Based (Base + Per Kg)</SelectItem>
                                    <SelectItem value="ORDER_VALUE">Order Total (Threshold Based)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            {rateForm.calculationType === 'FLAT' && (
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="flatRate" className="font-bold">Shipping Cost (৳)</Label>
                                    <Input
                                        id="flatRate" type="number"
                                        className="h-12 rounded-xl bg-white border-none shadow-inner"
                                        value={rateForm.flatRate}
                                        onChange={e => setRateForm({...rateForm, flatRate: Number(e.target.value)})}
                                    />
                                </div>
                            )}

                            {rateForm.calculationType === 'WEIGHT_BASED' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="baseRate" className="font-bold">Base Cost (৳)</Label>
                                        <Input
                                            id="baseRate" type="number"
                                            className="h-12 rounded-xl bg-white border-none shadow-inner"
                                            value={rateForm.baseRate}
                                            onChange={e => setRateForm({...rateForm, baseRate: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="perKgRate" className="font-bold">Charge Per KG (৳)</Label>
                                        <Input
                                            id="perKgRate" type="number"
                                            className="h-12 rounded-xl bg-white border-none shadow-inner"
                                            value={rateForm.perKgRate}
                                            onChange={e => setRateForm({...rateForm, perKgRate: Number(e.target.value)})}
                                        />
                                    </div>
                                </>
                            )}

                            {rateForm.calculationType === 'ORDER_VALUE' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="flatRate" className="font-bold">Default Cost (৳)</Label>
                                        <Input
                                            id="flatRate" type="number"
                                            className="h-12 rounded-xl bg-white border-none shadow-inner"
                                            value={rateForm.flatRate}
                                            onChange={e => setRateForm({...rateForm, flatRate: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="freeShippingThreshold" className="font-bold">Free Over (৳)</Label>
                                        <Input
                                            id="freeShippingThreshold" type="number"
                                            className="h-12 rounded-xl bg-white border-none shadow-inner"
                                            value={rateForm.freeShippingThreshold}
                                            onChange={e => setRateForm({...rateForm, freeShippingThreshold: Number(e.target.value)})}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="estimatedDays" className="text-[10px] font-black uppercase text-slate-400">Est. Days</Label>
                                <Input
                                    id="estimatedDays"
                                    className="rounded-xl bg-slate-50 border-slate-200"
                                    placeholder="2-3"
                                    value={rateForm.estimatedDays}
                                    onChange={e => setRateForm({...rateForm, estimatedDays: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minWeight" className="text-[10px] font-black uppercase text-slate-400">Min KG</Label>
                                <Input
                                    id="minWeight" type="number" step="0.1"
                                    className="rounded-xl bg-slate-50 border-slate-200"
                                    value={rateForm.minWeight}
                                    onChange={e => setRateForm({...rateForm, minWeight: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxWeight" className="text-[10px] font-black uppercase text-slate-400">Max KG</Label>
                                <Input
                                    id="maxWeight" type="number" step="0.1"
                                    className="rounded-xl bg-slate-50 border-slate-200"
                                    value={rateForm.maxWeight}
                                    onChange={e => setRateForm({...rateForm, maxWeight: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <Label className="text-sm font-black text-emerald-900">Active Status</Label>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Show method at checkout</p>
                                </div>
                            </div>
                            <Switch
                                checked={rateForm.isActive}
                                onCheckedChange={checked => setRateForm({...rateForm, isActive: checked})}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>

                        <DialogFooter className="mt-8">
                            <Button type="button" variant="ghost" onClick={() => setIsRateModalOpen(false)} className="rounded-xl font-bold">Discard</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 font-black shadow-lg shadow-emerald-200 transition-all">
                                Update Logistics Method
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
