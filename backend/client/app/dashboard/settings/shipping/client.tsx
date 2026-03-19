'use client';

import { useConfirm } from '@/hooks/use-confirm';
import {
  ArrowLeft,
  Box,
  Globe,
  Loader2,
  MapPin,
  Plus,
  Save,
  Settings2,
  Trash2,
  Truck,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ShippingSettingsClient() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [shippingConfig, setShippingConfig] = useState<any>({
    isShippingEnabled: true,
    defaultShippingZoneId: '',
    freeShippingThreshold: 0,
    calculationMethod: 'ZONE_BASED',
  });

  const [zones, setZones] = useState<any[]>([]);
  const [packagings, setPackagings] = useState<any[]>([]);

  // Dialog States
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isPackagingDialogOpen, setIsPackagingDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [editingPackaging, setEditingPackaging] = useState<any>(null);

  // Form States
  const [zoneForm, setZoneForm] = useState<any>({
    name: '',
    countries: [],
    regions: [],
    isActive: true,
    priority: 0,
  });
  const [packagingForm, setPackagingForm] = useState<any>({
    name: '',
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    maxWeight: 0,
    cost: 0,
    isActive: true,
  });

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      // Fetch General Shipping Config
      const configRes = await fetch(`${BACKEND_URL}/settings/shipping`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const configData = await configRes.json();
      if (configData.success) setShippingConfig(configData.data || {});

      // Fetch Zones
      const zonesRes = await fetch(`${BACKEND_URL}/shipping/zones`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const zonesData = await zonesRes.json();
      if (zonesData.success) setZones(zonesData.data || []);

      // Fetch Packaging
      const pkgRes = await fetch(`${BACKEND_URL}/shipping/packaging`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const pkgData = await pkgRes.json();
      if (pkgData.success) setPackagings(pkgData.data || []);
    } catch (error) {
      toast.error('Failed to sync shipping parameters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchData();
  }, [session?.accessToken]);

  const handleUpdateConfig = async (updateData: any) => {
    if (!session?.accessToken) return;
    setIsSaving(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/settings/shipping`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...shippingConfig, ...updateData }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Shipping configuration updated');
        setShippingConfig(data.data);
      }
    } catch (error) {
      toast.error('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePackagingSubmit = async () => {
    if (!session?.accessToken) return;
    setIsSaving(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const url = editingPackaging
        ? `${BACKEND_URL}/shipping/packaging/${editingPackaging.id}`
        : `${BACKEND_URL}/shipping/packaging`;
      const method = editingPackaging ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packagingForm),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Packaging ${editingPackaging ? 'updated' : 'created'}`);
        setIsPackagingDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePackagingDelete = async (id: string) => {
    if (
      !(await confirm({
        title: 'Delete Packaging',
        message:
          'Are you sure you want to delete this packaging type? This will immediately affect shipping cost calculations for orders using this box.',
        type: 'danger',
        confirmText: 'Delete Packaging',
      }))
    )
      return;
    if (!session?.accessToken) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/shipping/packaging/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Packaging deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading shipping engine...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/settings">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs font-medium -ml-2 text-muted-foreground"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Settings
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
            Shipping Settings
          </h1>
          <p className="text-slate-500 text-sm">
            Configure delivery methods, zones, and logistics parameters.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
          <Truck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Logistics: Active
          </span>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[450px] mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Globe className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    Global Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Main shipping rules for your entire store.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">
                    Enable Shipping
                  </Label>
                  <p className="text-xs text-slate-500">
                    Enable or disable delivery options on checkout.
                  </p>
                </div>
                <Switch
                  checked={shippingConfig.isShippingEnabled}
                  onCheckedChange={(val) =>
                    handleUpdateConfig({ isShippingEnabled: val })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Free Shipping Threshold
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      className="pl-7"
                      value={shippingConfig.freeShippingThreshold}
                      onChange={(e) =>
                        setShippingConfig({
                          ...shippingConfig,
                          freeShippingThreshold: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Orders above this value get free shipping (if enabled in
                    rates).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Calculation Method
                  </Label>
                  <Select
                    value={shippingConfig.calculationMethod}
                    onValueChange={(val: string) =>
                      handleUpdateConfig({ calculationMethod: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZONE_BASED">
                        Zone Based (Static)
                      </SelectItem>
                      <SelectItem value="FLAT_RATE">
                        Fixed Rate (Global)
                      </SelectItem>
                      <SelectItem value="REAL_TIME">Real-time (API)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => handleUpdateConfig(shippingConfig)}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Global Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones & Rates */}
        <TabsContent value="zones" className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Shipping Zones
              </h3>
              <p className="text-xs text-slate-500">
                Geographic areas and their specific delivery rates.
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() =>
                toast.info(
                  'Zone management inherited from core shipping module',
                )
              }
            >
              <Plus className="w-3.5 h-3.5" /> New Zone
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {zones.length === 0 ? (
              <Card className="border-dashed p-12 flex flex-col items-center justify-center text-center space-y-3">
                <MapPin className="w-8 h-8 text-slate-300" />
                <p className="font-bold text-slate-700">
                  No Shipping Zones Configured
                </p>
              </Card>
            ) : (
              zones.map((zone) => (
                <Card
                  key={zone.id}
                  className="shadow-sm hover:border-primary/20 transition-all"
                >
                  <CardHeader className="py-4 border-b bg-slate-50/30 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold">
                        {zone.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-medium">
                        {zone.countries.join(', ') || 'All Countries'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {zone.rates?.map((rate: any) => (
                        <div
                          key={rate.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 border-dashed"
                        >
                          <span className="text-xs font-medium text-slate-700">
                            {rate.method} ({rate.carrier})
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {rate.calculationType === 'FLAT'
                              ? `$${rate.flatRate}`
                              : 'Variable'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Packaging */}
        <TabsContent value="packaging" className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Packaging Inventory
              </h3>
              <p className="text-xs text-slate-500">
                Define standard boxes for shipping calculations.
              </p>
            </div>
            <Dialog
              open={isPackagingDialogOpen}
              onOpenChange={setIsPackagingDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setEditingPackaging(null);
                    setPackagingForm({
                      name: '',
                      length: 0,
                      width: 0,
                      height: 0,
                      weight: 0,
                      maxWeight: 0,
                      cost: 0,
                      isActive: true,
                    });
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Package
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPackaging ? 'Edit' : 'Add'} Packaging
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-slate-500">
                      Package Name
                    </Label>
                    <Input
                      value={packagingForm.name}
                      onChange={(e) =>
                        setPackagingForm({
                          ...packagingForm,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. Medium Corrugated Box"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">
                        Length
                      </Label>
                      <Input
                        type="number"
                        value={packagingForm.length}
                        onChange={(e) =>
                          setPackagingForm({
                            ...packagingForm,
                            length: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">
                        Width
                      </Label>
                      <Input
                        type="number"
                        value={packagingForm.width}
                        onChange={(e) =>
                          setPackagingForm({
                            ...packagingForm,
                            width: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500">
                        Height
                      </Label>
                      <Input
                        type="number"
                        value={packagingForm.height}
                        onChange={(e) =>
                          setPackagingForm({
                            ...packagingForm,
                            height: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase text-slate-500">
                        Base Cost ($)
                      </Label>
                      <Input
                        type="number"
                        value={packagingForm.cost}
                        onChange={(e) =>
                          setPackagingForm({
                            ...packagingForm,
                            cost: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                        <Label className="text-xs">Active</Label>
                        <Switch
                          checked={packagingForm.isActive}
                          onCheckedChange={(val) =>
                            setPackagingForm({
                              ...packagingForm,
                              isActive: val,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handlePackagingSubmit} disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {editingPackaging ? 'Update' : 'Create'} Packaging
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packagings.length === 0 ? (
              <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center space-y-3">
                <Box className="w-8 h-8 text-slate-300" />
                <p className="font-bold text-slate-700">
                  No Packaging Types Found
                </p>
              </Card>
            ) : (
              packagings.map((pkg) => (
                <Card key={pkg.id} className="shadow-sm border-slate-200">
                  <CardHeader className="pb-3 border-b bg-slate-50/30 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white rounded border shadow-xs">
                        <Box className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <CardTitle className="text-sm font-bold">
                        {pkg.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400"
                        onClick={() => {
                          setEditingPackaging(pkg);
                          setPackagingForm({ ...pkg });
                          setIsPackagingDialogOpen(true);
                        }}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600"
                        onClick={() => handlePackagingDelete(pkg.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Dimensions</span>
                      <span className="font-bold text-slate-700">
                        {pkg.length}x{pkg.width}x{pkg.height} cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Base Cost</span>
                      <span className="font-bold text-primary">
                        ${pkg.cost}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
