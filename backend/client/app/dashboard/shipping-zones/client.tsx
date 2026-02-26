'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useConfirm } from '@/hooks/use-confirm';
import {
    CheckCircle2,
    Clock,
    Edit2,
    Layers,
    Loader2,
    MapPin,
    MoreVertical,
    Plus,
    Trash2,
    Truck
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ShippingRate {
    id: string;
    method: string;
    carrier: string | null;
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
    countries: string[];
    regions: string[];
    isActive: boolean;
    priority: number;
    rates: ShippingRate[];
}

export default function ShippingZonesClient() {
    const { confirm } = useConfirm();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

    // Form States
    const [zoneForm, setZoneForm] = useState({
        name: '',
        countries: '',
        regions: '',
        priority: 0,
        isActive: true
    });

    const [rateForm, setRateForm] = useState({
        method: '',
        carrier: '',
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

    const fetchZones = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/shipping/zones`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                setZones(data.data);
            }
        } catch (error) {
            toast.error('Failed to load shipping zones');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchZones();
    }, [session?.accessToken]);

    const handleCreateUpdateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.accessToken) return;

        const payload = {
            ...zoneForm,
            countries: zoneForm.countries.split(',').map(c => c.trim()).filter(Boolean),
            regions: zoneForm.regions.split(',').map(r => r.trim()).filter(Boolean),
            priority: Number(zoneForm.priority)
        };

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const method = editingZone ? 'PUT' : 'POST';
            const url = editingZone
                ? `${BACKEND_URL}/shipping/zones/${editingZone.id}`
                : `${BACKEND_URL}/shipping/zones`;

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
                toast.success(editingZone ? 'Zone updated' : 'Zone created');
                setIsZoneModalOpen(false);
                setEditingZone(null);
                fetchZones();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('Network error');
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (!await confirm({
            title: 'Delete Shipping Zone',
            message: 'Are you sure you want to delete this zone? All rates will be removed and this action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Zone'
        })) return;
        if (!session?.accessToken) return;

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/shipping/zones/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (res.ok) {
                toast.success('Zone deleted');
                fetchZones();
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleCreateUpdateRate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.accessToken || !selectedZone) return;

        const payload = {
            ...rateForm,
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
            const method = editingRate ? 'PUT' : 'POST';
            const url = editingRate
                ? `${BACKEND_URL}/shipping/rates/${editingRate.id}`
                : `${BACKEND_URL}/shipping/zones/${selectedZone.id}/rates`;

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
                toast.success(editingRate ? 'Rate updated' : 'Rate added');
                setIsRateModalOpen(false);
                setEditingRate(null);
                fetchZones();
            }
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDeleteRate = async (id: string) => {
        if (!await confirm({
            title: 'Delete Shipping Rate',
            message: 'Are you sure you want to delete this shipping rate? This will immediately affect checkout calculations.',
            type: 'danger',
            confirmText: 'Delete Rate'
        })) return;
        if (!session?.accessToken) return;

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await fetch(`${BACKEND_URL}/shipping/rates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            toast.success('Rate removed');
            fetchZones();
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const openZoneModal = (zone?: ShippingZone) => {
        if (zone) {
            setEditingZone(zone);
            setZoneForm({
                name: zone.name,
                countries: zone.countries.join(', '),
                regions: zone.regions.join(', '),
                priority: zone.priority,
                isActive: zone.isActive
            });
        } else {
            setEditingZone(null);
            setZoneForm({ name: '', countries: '', regions: '', priority: 0, isActive: true });
        }
        setIsZoneModalOpen(true);
    };

    const openRateModal = (zone: ShippingZone, rate?: ShippingRate) => {
        setSelectedZone(zone);
        if (rate) {
            setEditingRate(rate);
            setRateForm({
                method: rate.method,
                carrier: rate.carrier || '',
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
        } else {
            setEditingRate(null);
            setRateForm({
                method: '', carrier: '', calculationType: 'FLAT',
                flatRate: 0, baseRate: 0, perKgRate: 0,
                freeShippingThreshold: 0, minWeight: 0, maxWeight: 0,
                minOrderValue: 0, estimatedDays: '', isActive: true
            });
        }
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm tracking-wide uppercase">
                        <Truck className="w-4 h-4" />
                        Logistics Engine
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Shipping Zones</h1>
                    <p className="text-muted-foreground font-medium">Define regions, couriers, and pricing strategies for your global shop.</p>
                </div>
                <Button onClick={() => openZoneModal()} className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                    <Plus className="w-4 h-4" /> Add Shipping Zone
                </Button>
            </div>

            {/* Zones Grid */}
            <div className="grid gap-6">
                {zones.length === 0 ? (
                    <Card className="border-dashed border-2 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <MapPin className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">No shipping zones defined yet.</p>
                            <Button variant="link" onClick={() => openZoneModal()}>Create your first zone</Button>
                        </CardContent>
                    </Card>
                ) : (
                    zones.map(zone => (
                        <Card key={zone.id} className={`overflow-hidden transition-all hover:shadow-md ${!zone.isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                            <div className="flex flex-col md:flex-row">
                                <div className="p-6 md:w-1/3 bg-slate-50/50 border-r border-slate-100 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    {zone.name}
                                                    {!zone.isActive && <Badge variant="secondary" className="font-normal">Inactive</Badge>}
                                                </h3>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {zone.countries.map(c => (
                                                        <Badge key={c} variant="outline" className="bg-white">{c}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openZoneModal(zone)}>
                                                        <Edit2 className="w-4 h-4 mr-2" /> Edit Zone
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openRateModal(zone)} className="text-primary">
                                                        <Plus className="w-4 h-4 mr-2" /> Add Rate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteZone(zone.id)} className="text-destructive">
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate">{zone.regions.length > 0 ? zone.regions.join(', ') : 'All Regions'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Layers className="w-3.5 h-3.5" />
                                                <span>Priority: {zone.priority}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Quick Actions</div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => openRateModal(zone)} className="w-full text-xs">Manage Rates</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 flex-1">
                                    <h4 className="text-sm font-bold opacity-60 uppercase tracking-tighter mb-4 flex items-center gap-2">
                                        <Truck className="w-4 h-4" /> Shipping Methods
                                    </h4>

                                    <div className="space-y-3">
                                        {zone.rates.length === 0 ? (
                                            <div className="py-8 text-center text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">
                                                No rates configured for this zone.
                                            </div>
                                        ) : (
                                            zone.rates.map(rate => (
                                                <div key={rate.id} className="group p-4 border rounded-xl hover:border-primary/30 transition-colors bg-white shadow-sm flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2.5 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                            <Truck className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold flex items-center gap-2">
                                                                {rate.method}
                                                                {!rate.isActive && <span className="text-[10px] font-normal px-1.5 py-0.5 bg-slate-100 rounded">Hidden</span>}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                                <span>{rate.carrier || 'Standard Courier'}</span>
                                                                <span className="text-slate-200">•</span>
                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rate.estimatedDays || 'N/A'} days</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="text-lg font-black text-primary">
                                                                {rate.calculationType === 'FLAT' && `${rate.flatRate}৳`}
                                                                {rate.calculationType === 'WEIGHT_BASED' && `${rate.baseRate}৳ + ${rate.perKgRate}৳/kg`}
                                                                {rate.calculationType === 'ORDER_VALUE' && (
                                                                    rate.freeShippingThreshold ? `Free over ${rate.freeShippingThreshold}৳` : `${rate.flatRate}৳`
                                                                )}
                                                            </div>
                                                            <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0 leading-tight">
                                                                {rate.calculationType.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRateModal(zone, rate)}>
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDeleteRate(rate.id)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Zone Dialog */}
            <Dialog open={isZoneModalOpen} onOpenChange={setIsZoneModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingZone ? 'Edit Shipping Zone' : 'New Shipping Zone'}</DialogTitle>
                        <DialogDescription>Define a geographic area where specific rates apply.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUpdateZone} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Zone Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Dhaka Metro, Europe, Rest of World"
                                value={zoneForm.name}
                                onChange={e => setZoneForm({...zoneForm, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="countries">Countries (ISO Codes)</Label>
                                <Input
                                    id="countries"
                                    placeholder="BD, US, CA"
                                    value={zoneForm.countries}
                                    onChange={e => setZoneForm({...zoneForm, countries: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Sorting Priority</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    value={zoneForm.priority}
                                    onChange={e => setZoneForm({...zoneForm, priority: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="regions">Regions (Divisions/States/Cities)</Label>
                            <Input
                                id="regions"
                                placeholder="Dhaka, Chittagong, Sylhet"
                                value={zoneForm.regions}
                                onChange={e => setZoneForm({...zoneForm, regions: e.target.value})}
                            />
                            <p className="text-[10px] text-muted-foreground">Comma separated. Leave empty to cover all regions in the country.</p>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-bold">Zone Visibility</Label>
                                <p className="text-xs text-muted-foreground">Enable or disable this zone from checkout logic.</p>
                            </div>
                            <Switch
                                checked={zoneForm.isActive}
                                onCheckedChange={checked => setZoneForm({...zoneForm, isActive: checked})}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsZoneModalOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingZone ? 'Save Changes' : 'Create Zone'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Rate Dialog */}
            <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRate ? 'Edit Shipping Rate' : `Add Rate to ${selectedZone?.name}`}</DialogTitle>
                        <DialogDescription>Set pricing rules for deliveries in this zone.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUpdateRate} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="method">Method Name</Label>
                                <Input
                                    id="method"
                                    placeholder="Standard Delivery, Express"
                                    value={rateForm.method}
                                    onChange={e => setRateForm({...rateForm, method: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="carrier">Courier/Carrier</Label>
                                <Input
                                    id="carrier"
                                    placeholder="DHL, RedX, Pathao"
                                    value={rateForm.carrier}
                                    onChange={e => setRateForm({...rateForm, carrier: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Pricing Strategy</Label>
                            <Select
                                value={rateForm.calculationType}
                                onValueChange={val => setRateForm({...rateForm, calculationType: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FLAT">Flat Rate (Fixed Cost)</SelectItem>
                                    <SelectItem value="WEIGHT_BASED">Weight Based (Base + Per Kg)</SelectItem>
                                    <SelectItem value="ORDER_VALUE">Order Total (Threshold Based)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-xl border">
                            {rateForm.calculationType === 'FLAT' && (
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="flatRate">Shipping Cost (৳)</Label>
                                    <Input
                                        id="flatRate" type="number"
                                        value={rateForm.flatRate}
                                        onChange={e => setRateForm({...rateForm, flatRate: Number(e.target.value)})}
                                    />
                                </div>
                            )}

                            {rateForm.calculationType === 'WEIGHT_BASED' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="baseRate">Base Handling Cost (৳)</Label>
                                        <Input
                                            id="baseRate" type="number"
                                            value={rateForm.baseRate}
                                            onChange={e => setRateForm({...rateForm, baseRate: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="perKgRate">Charge Per KG (৳)</Label>
                                        <Input
                                            id="perKgRate" type="number"
                                            value={rateForm.perKgRate}
                                            onChange={e => setRateForm({...rateForm, perKgRate: Number(e.target.value)})}
                                        />
                                    </div>
                                </>
                            )}

                            {rateForm.calculationType === 'ORDER_VALUE' && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="flatRate">Default Cost (৳)</Label>
                                        <Input
                                            id="flatRate" type="number"
                                            value={rateForm.flatRate}
                                            onChange={e => setRateForm({...rateForm, flatRate: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="freeShippingThreshold">Free Shipping Over (৳)</Label>
                                        <Input
                                            id="freeShippingThreshold" type="number"
                                            value={rateForm.freeShippingThreshold}
                                            onChange={e => setRateForm({...rateForm, freeShippingThreshold: Number(e.target.value)})}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="estimatedDays">Estimated Days</Label>
                                <Input
                                    id="estimatedDays"
                                    placeholder="2-3"
                                    value={rateForm.estimatedDays}
                                    onChange={e => setRateForm({...rateForm, estimatedDays: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minWeight">Min Weight (kg)</Label>
                                <Input
                                    id="minWeight" type="number" step="0.1"
                                    value={rateForm.minWeight}
                                    onChange={e => setRateForm({...rateForm, minWeight: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                                <Input
                                    id="maxWeight" type="number" step="0.1"
                                    value={rateForm.maxWeight}
                                    onChange={e => setRateForm({...rateForm, maxWeight: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <Label className="text-sm font-bold text-emerald-900">Active Rate</Label>
                            </div>
                            <Switch
                                checked={rateForm.isActive}
                                onCheckedChange={checked => setRateForm({...rateForm, isActive: checked})}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsRateModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90">
                                {editingRate ? 'Update Rate' : 'Save Shipping Rate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
