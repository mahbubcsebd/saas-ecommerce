'use client';

import { useConfirm } from '@/hooks/use-confirm';
import {
    ArrowLeft,
    Calculator,
    Loader2,
    MapPin,
    Plus,
    Save,
    Settings2,
    Trash2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TaxSettingsClient() {
    const { confirm } = useConfirm();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [taxConfig, setTaxConfig] = useState<any>({
        isTaxEnabled: true,
        taxInclusivePricing: false,
        isVatEnabled: false,
        vatGstNumber: ''
    });

    const [taxRates, setTaxRates] = useState<any[]>([]);
    const [taxClasses, setTaxClasses] = useState<any[]>([]);

    // Dialog States
    const [isRateDialogOpen, setIsRateDialogOpen] = useState(false);
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<any>(null);
    const [editingClass, setEditingClass] = useState<any>(null);

    // Form States
    const [rateForm, setRateForm] = useState<any>({
        name: '', rate: 0, country: 'BD', type: 'PERCENTAGE', isActive: true
    });
    const [classForm, setClassForm] = useState<any>({
        name: '', description: '', taxRateIds: []
    });

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

            // Fetch General Tax Config
            const configRes = await fetch(`${BACKEND_URL}/settings/tax`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const configData = await configRes.json();
            if (configData.success) setTaxConfig(configData.data || {});

            // Fetch Tax Rates
            const ratesRes = await fetch(`${BACKEND_URL}/tax-configurations/rates`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const ratesData = await ratesRes.json();
            if (ratesData.success) setTaxRates(ratesData.data || []);

            // Fetch Tax Classes
            const classesRes = await fetch(`${BACKEND_URL}/tax-configurations/classes`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const classesData = await classesRes.json();
            if (classesData.success) setTaxClasses(classesData.data || []);

        } catch (error) {
            toast.error('Failed to sync tax parameters');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRateSubmit = async () => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const url = editingRate
                ? `${BACKEND_URL}/tax-configurations/rates/${editingRate.id}`
                : `${BACKEND_URL}/tax-configurations/rates`;
            const method = editingRate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rateForm)
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Tax rate ${editingRate ? 'updated' : 'created'}`);
                setIsRateDialogOpen(false);
                fetchData();
            } else {
                toast.error(data.message || 'Action failed');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRateDelete = async (id: string) => {
        if (!await confirm({
            title: 'Delete Tax Rate',
            message: 'Are you sure you want to delete this tax rate? This will permanently affect order calculations for the associated location.',
            type: 'danger',
            confirmText: 'Delete Rate'
        })) return;
        if (!session?.accessToken) return;
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/tax-configurations/rates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Tax rate deleted');
                fetchData();
            }
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    const handleClassSubmit = async () => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const url = editingClass
                ? `${BACKEND_URL}/tax-configurations/classes/${editingClass.id}`
                : `${BACKEND_URL}/tax-configurations/classes`;
            const method = editingClass ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(classForm)
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Tax class ${editingClass ? 'updated' : 'created'}`);
                setIsClassDialogOpen(false);
                fetchData();
            } else {
                toast.error(data.message || 'Action failed');
            }
        } catch (error) {
            toast.error('Network error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClassDelete = async (id: string) => {
        if (!await confirm({
            title: 'Delete Tax Class',
            message: 'Are you sure you want to delete this tax class? Products assigned to this class may have incorrect tax calculations until reassigned.',
            type: 'danger',
            confirmText: 'Delete Class'
        })) return;
        if (!session?.accessToken) return;
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/tax-configurations/classes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Tax class deleted');
                fetchData();
            }
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleUpdateConfig = async (updateData: any) => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/tax`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...taxConfig, ...updateData })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Tax configuration updated');
                setTaxConfig(data.data);
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Infrastructure error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading tax configurations...</p>
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
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium -ml-2 text-muted-foreground">
                                <ArrowLeft className="w-3.5 h-3.5" /> Settings
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Tax Settings</h1>
                    <p className="text-slate-500 text-sm">Manage tax rates, classes, and regional tax compliance rules.</p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Tax Engine: Active</span>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-[400px] mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="classes">Tax Classes</TabsTrigger>
                    <TabsTrigger value="rates">Tax Rates</TabsTrigger>
                </TabsList>

                {/* General Configuration */}
                <TabsContent value="general" className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border shadow-sm">
                                    <Settings2 className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Global Configuration</CardTitle>
                                    <CardDescription className="text-xs">Control how taxes are calculated across your store.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-700">Enable Tax Calculation</Label>
                                    <p className="text-xs text-slate-500">Automatically calculate taxes during checkout.</p>
                                </div>
                                <Switch
                                    checked={taxConfig.isTaxEnabled}
                                    onCheckedChange={val => handleUpdateConfig({ isTaxEnabled: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-700">Tax Inclusive Pricing</Label>
                                    <p className="text-xs text-slate-500">Product prices already include tax (e.g., VAT inclusive).</p>
                                </div>
                                <Switch
                                    checked={taxConfig.taxInclusivePricing}
                                    onCheckedChange={val => handleUpdateConfig({ taxInclusivePricing: val })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">VAT/GST Identification</Label>
                                    <Input
                                        placeholder="e.g. 123456789"
                                        value={taxConfig.vatGstNumber || ''}
                                        onChange={e => setTaxConfig({ ...taxConfig, vatGstNumber: e.target.value })}
                                        className="h-10 text-sm"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Required for business invoices.</p>
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold text-slate-700">Display VAT/GST</Label>
                                        <p className="text-xs text-slate-500">Show VAT labels on store and invoices.</p>
                                    </div>
                                    <Switch
                                        checked={taxConfig.isVatEnabled}
                                        onCheckedChange={val => handleUpdateConfig({ isVatEnabled: val })}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={() => handleUpdateConfig(taxConfig)}
                                disabled={isSaving}
                                className="w-full md:w-auto"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Tax Configuration
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tax Classes */}
                <TabsContent value="classes" className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Tax Classes</h3>
                            <p className="text-xs text-slate-500">Group tax rules for different product types.</p>
                        </div>
                        <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 gap-1.5" onClick={() => {
                                    setEditingClass(null);
                                    setClassForm({ name: '', description: '', taxRateIds: [] });
                                }}>
                                    <Plus className="w-3.5 h-3.5" /> Add Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editingClass ? 'Edit' : 'Add'} Tax Class</DialogTitle>
                                    <DialogDescription>
                                        Define a group of tax rates for specific product categories.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</Label>
                                        <Input
                                            value={classForm.name}
                                            onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                                            placeholder="e.g. Standard, Luxury, Reduced"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</Label>
                                        <Input
                                            value={classForm.description}
                                            onChange={e => setClassForm({ ...classForm, description: e.target.value })}
                                            placeholder="Short description of this class"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Apply Rates</Label>
                                        <div className="grid grid-cols-1 gap-2 border rounded-lg p-3 max-h-[150px] overflow-y-auto">
                                            {taxRates.map(rate => (
                                                <div key={rate.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`rate-${rate.id}`}
                                                        checked={classForm.taxRateIds.includes(rate.id)}
                                                        onChange={e => {
                                                            const ids = e.target.checked
                                                                ? [...classForm.taxRateIds, rate.id]
                                                                : classForm.taxRateIds.filter((id: string) => id !== rate.id);
                                                            setClassForm({ ...classForm, taxRateIds: ids });
                                                        }}
                                                    />
                                                    <label htmlFor={`rate-${rate.id}`} className="text-xs">{rate.name} ({rate.rate}%)</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleClassSubmit} disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        {editingClass ? 'Update' : 'Create'} Class
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {taxClasses.length === 0 ? (
                            <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="p-4 bg-slate-50 rounded-full">
                                    <Calculator className="w-8 h-8 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-700">No Tax Classes Found</p>
                                    <p className="text-sm text-slate-500">Create your first tax class to start applying taxes to products.</p>
                                </div>
                            </Card>
                        ) : (
                            taxClasses.map((tc) => (
                                <Card key={tc.id} className="shadow-sm border-slate-200">
                                    <CardHeader className="pb-3 border-b bg-slate-50/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base font-bold">{tc.name}</CardTitle>
                                                <CardDescription className="text-[10px]">{tc.description || 'No description provided.'}</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400"
                                                    onClick={() => {
                                                        setEditingClass(tc);
                                                        setClassForm({ name: tc.name, description: tc.description, taxRateIds: tc.taxRateIds });
                                                        setIsClassDialogOpen(true);
                                                    }}
                                                >
                                                    <Settings2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-600"
                                                    onClick={() => handleClassDelete(tc.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>Associated Rates</span>
                                                <span className="font-bold text-slate-700">{tc.taxRateIds?.length || 0}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tc.taxRates?.map((rate: any) => (
                                                    <span key={rate.id} className="px-2 py-0.5 bg-slate-100 text-[10px] font-medium text-slate-600 rounded border">
                                                        {rate.name} ({rate.rate}%)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Tax Rates */}
                <TabsContent value="rates" className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Tax Rates</h3>
                            <p className="text-xs text-slate-500">Define location-specific tax percentages.</p>
                        </div>
                        <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 gap-1.5" onClick={() => {
                                    setEditingRate(null);
                                    setRateForm({ name: '', rate: 0, country: 'BD', type: 'PERCENTAGE', isActive: true });
                                }}>
                                    <Plus className="w-3.5 h-3.5" /> Add Rate
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>{editingRate ? 'Edit' : 'Add'} Tax Rate</DialogTitle>
                                    <DialogDescription>
                                        Set a tax percentage for a specific region.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tax Name</Label>
                                        <Input
                                            value={rateForm.name}
                                            onChange={e => setRateForm({ ...rateForm, name: e.target.value })}
                                            placeholder="e.g. VAT 15%, NY Sales Tax"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rate (%)</Label>
                                            <Input
                                                type="number"
                                                value={rateForm.rate}
                                                onChange={e => setRateForm({ ...rateForm, rate: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Type</Label>
                                            <Select value={rateForm.type} onValueChange={(val: string) => setRateForm({ ...rateForm, type: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                                    <SelectItem value="FLAT">Flat Rate</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Country (ISO)</Label>
                                            <Input
                                                value={rateForm.country}
                                                onChange={e => setRateForm({ ...rateForm, country: e.target.value })}
                                                placeholder="e.g. BD, US"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">State/Division</Label>
                                            <Input
                                                value={rateForm.state || ''}
                                                onChange={e => setRateForm({ ...rateForm, state: e.target.value })}
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleRateSubmit} disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        {editingRate ? 'Update' : 'Create'} Rate
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="shadow-sm border-slate-200 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3 font-bold">Tax Name</th>
                                            <th className="px-6 py-3 font-bold">Location</th>
                                            <th className="px-6 py-3 font-bold text-center">Rate</th>
                                            <th className="px-6 py-3 font-bold text-center">Type</th>
                                            <th className="px-6 py-3 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {taxRates.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                                    No tax rates configured yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            taxRates.map((rate) => (
                                                <tr key={rate.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-900">{rate.name}</div>
                                                        <div className="text-[10px] text-slate-400">ID: {rate.id.slice(-8)}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3 text-slate-400" />
                                                            <span className="font-medium">{rate.country}</span>
                                                            {rate.state && <span className="text-slate-400">/ {rate.state}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-primary">
                                                        {rate.rate}%
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-tighter">
                                                            {rate.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400"
                                                                onClick={() => {
                                                                    setEditingRate(rate);
                                                                    setRateForm({ ...rate });
                                                                    setIsRateDialogOpen(true);
                                                                }}
                                                            >
                                                                <Settings2 className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                                onClick={() => handleRateDelete(rate.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
