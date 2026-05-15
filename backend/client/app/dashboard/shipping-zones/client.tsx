'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Truck,
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
    isActive: true,
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
    isActive: true,
  });

  const fetchZones = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BACKEND_URL}/shipping/zones`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
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
      countries: zoneForm.countries
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      regions: zoneForm.regions
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
      priority: Number(zoneForm.priority),
    };

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const method = editingZone ? 'PUT' : 'POST';
      const url = editingZone
        ? `${BACKEND_URL}/shipping/zones/${editingZone.id}`
        : `${BACKEND_URL}/shipping/zones`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    if (
      !(await confirm({
        title: 'Delete Shipping Zone',
        message:
          'Are you sure you want to delete this zone? All rates will be removed and this action cannot be undone.',
        type: 'danger',
        confirmText: 'Delete Zone',
      }))
    )
      return;
    if (!session?.accessToken) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BACKEND_URL}/shipping/zones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
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
      minOrderValue: Number(rateForm.minOrderValue),
    };

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const method = editingRate ? 'PUT' : 'POST';
      const url = editingRate
        ? `${BACKEND_URL}/shipping/rates/${editingRate.id}`
        : `${BACKEND_URL}/shipping/zones/${selectedZone.id}/rates`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    if (
      !(await confirm({
        title: 'Delete Shipping Rate',
        message:
          'Are you sure you want to delete this shipping rate? This will immediately affect checkout calculations.',
        type: 'danger',
        confirmText: 'Delete Rate',
      }))
    )
      return;
    if (!session?.accessToken) return;

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      await fetch(`${BACKEND_URL}/shipping/rates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
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
        isActive: zone.isActive,
      });
    } else {
      setEditingZone(null);
      setZoneForm({
        name: '',
        countries: '',
        regions: '',
        priority: 0,
        isActive: true,
      });
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
        isActive: rate.isActive,
      });
    } else {
      setEditingRate(null);
      setRateForm({
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
        isActive: true,
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Shipping Zones
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure delivery regions and shipping rates for your store.
          </p>
        </div>
        <Button
          onClick={() => openZoneModal()}
          className="rounded-lg shadow-sm gap-2"
        >
          <Plus className="w-4 h-4" /> Add Shipping Zone
        </Button>
      </div>

      {/* Zones Grid */}
      <div className="grid gap-6">
        {zones.length === 0 ? (
          <Card className="border-dashed bg-slate-50/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No shipping zones found</h3>
              <p className="text-sm text-muted-foreground max-w-[280px] mt-1 mb-6">
                Define geographic areas where you want to offer shipping services.
              </p>
              <Button onClick={() => openZoneModal()} variant="outline">
                Create first zone
              </Button>
            </CardContent>
          </Card>
        ) : (
          zones.map((zone) => (
            <Card
              key={zone.id}
              className={`overflow-hidden border-slate-200 transition-all hover:shadow-md ${!zone.isActive ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Zone Info Left Panel */}
                <div className="p-6 lg:w-[320px] bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
                  <div className="flex-1 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {zone.name}
                          </h3>
                          <Badge 
                            variant={zone.isActive ? "default" : "secondary"} 
                            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 ${zone.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                          >
                            {zone.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          Priority: {zone.priority}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openZoneModal(zone)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRateModal(zone)} className="text-primary font-medium">
                            <Plus className="w-4 h-4 mr-2" /> Add Shipping Rate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteZone(zone.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Zone
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Countries</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {zone.countries.map((c) => (
                            <Badge key={c} variant="outline" className="bg-white text-xs font-medium text-slate-600 border-slate-200">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Regions</Label>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {zone.regions.length > 0 ? zone.regions.join(', ') : 'All Regions'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRateModal(zone)}
                      className="w-full text-xs font-semibold bg-white"
                    >
                      New Shipping Method
                    </Button>
                  </div>
                </div>

                {/* Shipping Rates Right Panel */}
                <div className="p-6 flex-1 bg-white">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Shipping Methods
                    </h4>
                    <span className="text-xs font-medium text-slate-400">
                      {zone.rates.length} method{zone.rates.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {zone.rates.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                        <p className="text-sm text-muted-foreground italic">
                          No rates configured for this zone.
                        </p>
                      </div>
                    ) : (
                      zone.rates.map((rate) => (
                        <div
                          key={rate.id}
                          className="group p-4 border border-slate-100 rounded-xl hover:border-primary/20 hover:bg-slate-50/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                              <Truck className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                {rate.method}
                                {!rate.isActive && (
                                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter px-1 py-0 border-slate-200 text-slate-400">
                                    Disabled
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                <span className="font-medium text-slate-500">
                                  {rate.carrier || 'Standard Courier'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  {rate.estimatedDays || 'N/A'} days
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-3 sm:pt-0">
                            <div className="text-right">
                              <div className="text-base font-bold text-slate-900 leading-tight">
                                {rate.calculationType === 'FLAT' && `${rate.flatRate?.toLocaleString()} ৳`}
                                {rate.calculationType === 'WEIGHT_BASED' && `${rate.baseRate?.toLocaleString()} ৳ + ${rate.perKgRate} ৳/kg`}
                                {rate.calculationType === 'ORDER_VALUE' && (
                                  rate.freeShippingThreshold 
                                    ? <span className="flex flex-col items-end">
                                        <span>{rate.flatRate?.toLocaleString()} ৳</span>
                                        <span className="text-[10px] text-emerald-600 font-medium leading-none mt-1 uppercase tracking-tight">Free over {rate.freeShippingThreshold.toLocaleString()} ৳</span>
                                      </span>
                                    : `${rate.flatRate?.toLocaleString()} ৳`
                                )}
                              </div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {rate.calculationType.replace('_', ' ')}
                              </div>
                            </div>
                            
                            <div className="flex gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-900"
                                onClick={() => openRateModal(zone, rate)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-destructive/5"
                                onClick={() => handleDeleteRate(rate.id)}
                              >
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
            <DialogTitle>
              {editingZone ? 'Edit Shipping Zone' : 'New Shipping Zone'}
            </DialogTitle>
            <DialogDescription>
              Define a geographic area where specific rates apply.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUpdateZone} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Zone Name</Label>
              <Input
                id="name"
                placeholder="e.g. Dhaka Metro, Europe, Rest of World"
                value={zoneForm.name}
                onChange={(e) =>
                  setZoneForm({ ...zoneForm, name: e.target.value })
                }
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
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, countries: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Sorting Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={zoneForm.priority}
                  onChange={(e) =>
                    setZoneForm({
                      ...zoneForm,
                      priority: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regions">Regions (Divisions/States/Cities)</Label>
              <Input
                id="regions"
                placeholder="Dhaka, Chittagong, Sylhet"
                value={zoneForm.regions}
                onChange={(e) =>
                  setZoneForm({ ...zoneForm, regions: e.target.value })
                }
              />
              <p className="text-[10px] text-muted-foreground">
                Comma separated. Leave empty to cover all regions in the
                country.
              </p>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Zone Visibility</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable this zone from checkout logic.
                </p>
              </div>
              <Switch
                checked={zoneForm.isActive}
                onCheckedChange={(checked) =>
                  setZoneForm({ ...zoneForm, isActive: checked })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsZoneModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingZone ? 'Save Changes' : 'Create Zone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRate
                ? 'Edit Shipping Rate'
                : `Add Rate to ${selectedZone?.name}`}
            </DialogTitle>
            <DialogDescription>
              Set pricing rules for deliveries in this zone.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUpdateRate} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Method Name</Label>
                <Input
                  id="method"
                  placeholder="Standard Delivery, Express"
                  value={rateForm.method}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, method: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carrier">Courier/Carrier</Label>
                <Input
                  id="carrier"
                  placeholder="DHL, RedX, Pathao"
                  value={rateForm.carrier}
                  onChange={(e) =>
                    setRateForm({ ...rateForm, carrier: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pricing Strategy</Label>
              <Select
                value={rateForm.calculationType}
                onValueChange={(val) =>
                  setRateForm({ ...rateForm, calculationType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FLAT">Flat Rate (Fixed Cost)</SelectItem>
                  <SelectItem value="WEIGHT_BASED">
                    Weight Based (Base + Per Kg)
                  </SelectItem>
                  <SelectItem value="ORDER_VALUE">
                    Order Total (Threshold Based)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-xl border">
              {rateForm.calculationType === 'FLAT' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="flatRate">Shipping Cost (৳)</Label>
                  <Input
                    id="flatRate"
                    type="number"
                    value={rateForm.flatRate}
                    onChange={(e) =>
                      setRateForm({
                        ...rateForm,
                        flatRate: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}

              {rateForm.calculationType === 'WEIGHT_BASED' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="baseRate">Base Handling Cost (৳)</Label>
                    <Input
                      id="baseRate"
                      type="number"
                      value={rateForm.baseRate}
                      onChange={(e) =>
                        setRateForm({
                          ...rateForm,
                          baseRate: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perKgRate">Charge Per KG (৳)</Label>
                    <Input
                      id="perKgRate"
                      type="number"
                      value={rateForm.perKgRate}
                      onChange={(e) =>
                        setRateForm({
                          ...rateForm,
                          perKgRate: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </>
              )}

              {rateForm.calculationType === 'ORDER_VALUE' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="flatRate">Default Cost (৳)</Label>
                    <Input
                      id="flatRate"
                      type="number"
                      value={rateForm.flatRate}
                      onChange={(e) =>
                        setRateForm({
                          ...rateForm,
                          flatRate: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">
                      Free Shipping Over (৳)
                    </Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      value={rateForm.freeShippingThreshold}
                      onChange={(e) =>
                        setRateForm({
                          ...rateForm,
                          freeShippingThreshold: Number(e.target.value),
                        })
                      }
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
                  onChange={(e) =>
                    setRateForm({ ...rateForm, estimatedDays: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minWeight">Min Weight (kg)</Label>
                <Input
                  id="minWeight"
                  type="number"
                  step="0.1"
                  value={rateForm.minWeight}
                  onChange={(e) =>
                    setRateForm({
                      ...rateForm,
                      minWeight: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                <Input
                  id="maxWeight"
                  type="number"
                  step="0.1"
                  value={rateForm.maxWeight}
                  onChange={(e) =>
                    setRateForm({
                      ...rateForm,
                      maxWeight: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <Label className="text-sm font-bold text-emerald-900">
                  Active Rate
                </Label>
              </div>
              <Switch
                checked={rateForm.isActive}
                onCheckedChange={(checked) =>
                  setRateForm({ ...rateForm, isActive: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRateModalOpen(false)}
              >
                Cancel
              </Button>
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
