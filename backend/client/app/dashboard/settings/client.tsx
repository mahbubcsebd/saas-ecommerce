'use client';

import {
    Facebook,
    Globe,
    Image as ImageIcon,
    Instagram,
    Languages,
    LayoutDashboard,
    Loader2,
    Mail,
    MapPin,
    RefreshCw,
    Save,
    Share2,
    Smartphone,
    Store,
    Twitter,
    Youtube
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');

    // Settings States
    const [general, setGeneral] = useState<any>({});
    const [currency, setCurrency] = useState<any>({});
    const [contact, setContact] = useState<any>({});

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

            const [genRes, curRes, conRes] = await Promise.all([
                fetch(`${BACKEND_URL}/settings/general`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }}),
                fetch(`${BACKEND_URL}/settings/currency`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }}),
                fetch(`${BACKEND_URL}/settings/contact`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }})
            ]);

            const [genData, curData, conData] = await Promise.all([
                genRes.json(),
                curRes.json(),
                conRes.json()
            ]);

            if (genData.success) setGeneral(genData.data || {});
            if (curData.success) setCurrency(curData.data || {});
            if (conData.success) setContact(conData.data || {});

        } catch (error) {
            toast.error('Failed to sync settings data matrix');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleUpdate = async (type: string, payload: any) => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/${type}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} settings updated`);
                fetchData();
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Failed to communicate with settings engine');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading system configuration...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="border-b pb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">System Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage your store identity, localization, and contact preferences.</p>
            </div>

            <Tabs defaultValue="identity" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border rounded-lg h-auto flex flex-wrap lg:inline-flex w-full lg:w-auto">
                    <TabsTrigger value="identity" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Store className="w-3.5 h-3.5 mr-2" /> Identity
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Mail className="w-3.5 h-3.5 mr-2" /> Contact
                    </TabsTrigger>
                    <TabsTrigger value="localization" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Languages className="w-3.5 h-3.5 mr-2" /> Localization
                    </TabsTrigger>
                    <TabsTrigger value="social" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Share2 className="w-3.5 h-3.5 mr-2" /> Social
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    {/* Identity Tab */}
                    <TabsContent value="identity" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="border-b bg-slate-50/50">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <LayoutDashboard className="w-4 h-4 text-primary" /> Branding Profile
                                        </CardTitle>
                                        <CardDescription className="text-xs">Define your public brand identity and SEO metadata.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Store Name</Label>
                                                <Input
                                                    value={general.siteName || ''}
                                                    onChange={e => setGeneral({...general, siteName: e.target.value})}
                                                    placeholder="Mahbub Shop"
                                                    className="h-10 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold">Tagline</Label>
                                                <Input
                                                    value={general.tagline || ''}
                                                    onChange={e => setGeneral({...general, tagline: e.target.value})}
                                                    placeholder="The ultimate shopping experience"
                                                    className="h-10 text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-1.5">
                                                <Label className="text-xs font-semibold">Store Description</Label>
                                                <textarea
                                                    value={general.description || ''}
                                                    onChange={e => setGeneral({...general, description: e.target.value})}
                                                    className="w-full h-24 p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                                    placeholder="Brief description for search engines..."
                                                />
                                            </div>
                                        </div>
                                        <Separator />
                                        <Button
                                            onClick={() => handleUpdate('general', general)}
                                            disabled={isSaving}
                                            className="w-full md:w-auto px-10"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save Identity
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="border-b bg-slate-50/50 py-4">
                                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-600 italic">Visual Assets</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Header Logo</Label>
                                                <div className="h-20 rounded-lg bg-slate-50 border border-dashed flex items-center justify-center overflow-hidden p-2">
                                                    {general.headerLogo ? <img src={general.headerLogo} className="h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-slate-300" />}
                                                </div>
                                                <Input
                                                    placeholder="URL"
                                                    value={general.headerLogo || ''}
                                                    onChange={e => setGeneral({...general, headerLogo: e.target.value})}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold">Favicon</Label>
                                                <div className="h-14 w-14 rounded-lg bg-slate-50 border border-dashed flex items-center justify-center overflow-hidden p-1">
                                                    {general.faviconUrl ? <img src={general.faviconUrl} className="h-full object-contain" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                                                </div>
                                                <Input
                                                    placeholder="URL"
                                                    value={general.faviconUrl || ''}
                                                    onChange={e => setGeneral({...general, faviconUrl: e.target.value})}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border-slate-200">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Maintenance Mode</Label>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black italic">Public Access Guard</p>
                                        </div>
                                        <Switch
                                            checked={general.maintenanceMode}
                                            onCheckedChange={val => setGeneral({...general, maintenanceMode: val})}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="border-b bg-slate-50/50">
                                <CardTitle className="text-lg font-bold">Connectivity Hub</CardTitle>
                                <CardDescription className="text-xs">Primary communication nodes for customer synergy.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold flex items-center gap-2 italic">
                                            <Mail className="w-3.5 h-3.5 text-blue-500" /> Public Email
                                        </Label>
                                        <Input
                                            value={contact.email || ''}
                                            onChange={e => setContact({...contact, email: e.target.value})}
                                            className="h-10 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold flex items-center gap-2 italic">
                                            <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Primary Phone
                                        </Label>
                                        <Input
                                            value={contact.phone || ''}
                                            onChange={e => setContact({...contact, phone: e.target.value})}
                                            className="h-10 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold flex items-center gap-2 italic">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> Physical Address
                                        </Label>
                                        <Input
                                            value={contact.addressLine1 || ''}
                                            onChange={e => setContact({...contact, addressLine1: e.target.value})}
                                            className="h-10 font-medium"
                                        />
                                    </div>
                                </div>
                                <Separator />
                                <Button
                                    onClick={() => handleUpdate('contact', contact)}
                                    disabled={isSaving}
                                    className="px-8"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Update Contact Nodes
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Localization Tab */}
                    <TabsContent value="localization" className="animate-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-6 flex items-center justify-between p-5 rounded-xl border border-primary/20 bg-primary/5 shadow-sm">
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-primary uppercase flex items-center gap-2">
                                    <Languages className="w-5 h-5" /> Multi-Language & Translation Matrix
                                </h3>
                                <p className="text-xs text-primary/70 font-medium tracking-wide">
                                    Manage storefront languages, RTL support, and use AI to auto-generate UI translations.
                                </p>
                            </div>
                            <Link href="/dashboard/settings/languages">
                                <Button size="sm" className="h-10 px-6 font-bold uppercase tracking-wider text-[11px] hover:scale-105 transition-transform shadow-md shadow-primary/20">
                                    Open Translation Manager
                                </Button>
                            </Link>
                        </div>
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="border-b bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-blue-600" /> Localization Matrix
                                        </CardTitle>
                                        <CardDescription className="text-xs">Synchronize temporal and fiscal parameters.</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={fetchData}
                                        className="h-8 gap-2 border-slate-300 font-bold text-[10px] uppercase tracking-wider"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Sync Node
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Timezone Node</Label>
                                            <Select
                                                value={general.timezone || ''}
                                                onValueChange={v => setGeneral({...general, timezone: v})}
                                            >
                                                <SelectTrigger className="h-10 text-sm">
                                                    <SelectValue placeholder="Select Timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Asia/Dhaka">Dhaka (GMT+6)</SelectItem>
                                                    <SelectItem value="UTC">Universal Time (UTC)</SelectItem>
                                                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Primary Currency</Label>
                                            <Select
                                                value={general.currency || 'BDT'}
                                                onValueChange={v => setGeneral({...general, currency: v})}
                                            >
                                                <SelectTrigger className="h-10 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BDT">Bangladeshi Taka (৳)</SelectItem>
                                                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                                                    <SelectItem value="EUR">Euro (€)</SelectItem>
                                                    <SelectItem value="GBP">Pound Sterling (£)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Date Architecture</Label>
                                            <Select
                                                value={general.dateFormat || 'MMM D, YYYY'}
                                                onValueChange={v => setGeneral({...general, dateFormat: v})}
                                            >
                                                <SelectTrigger className="h-11 bg-white border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MMM D, YYYY">Jan 25, 2024</SelectItem>
                                                    <SelectItem value="DD/MM/YYYY">25/01/2024</SelectItem>
                                                    <SelectItem value="MM-DD-YYYY">01-25-2024</SelectItem>
                                                    <SelectItem value="YYYY-MM-DD">2024-01-25</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold">Time Architecture</Label>
                                            <Select
                                                value={general.timeFormat || 'h:mm A'}
                                                onValueChange={v => setGeneral({...general, timeFormat: v})}
                                            >
                                                <SelectTrigger className="h-11 bg-white border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="h:mm A">1:30 PM (12h)</SelectItem>
                                                    <SelectItem value="HH:mm">13:30 (24h)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <Button
                                    onClick={() => {
                                        handleUpdate('general', general);
                                        handleUpdate('currency', currency);
                                    }}
                                    disabled={isSaving}
                                    className="px-8"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Sync Matrix
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Social Tab */}
                    <TabsContent value="social" className="animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="border-b bg-slate-50/50">
                                <CardTitle className="text-lg font-bold">Social Architecture</CardTitle>
                                <CardDescription className="text-xs">Manage your brand's presence across major platforms.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { key: 'facebook', icon: <Facebook className="w-4 h-4 text-blue-600" />, label: 'Facebook' },
                                        { key: 'instagram', icon: <Instagram className="w-4 h-4 text-rose-500" />, label: 'Instagram' },
                                        { key: 'twitter', icon: <Twitter className="w-4 h-4 text-sky-400" />, label: 'X (Twitter)' },
                                        { key: 'youtube', icon: <Youtube className="w-4 h-4 text-red-600" />, label: 'YouTube' },
                                        { key: 'tiktok', icon: <Share2 className="w-4 h-4 text-slate-900" />, label: 'TikTok' },
                                        { key: 'linkedin', icon: <Share2 className="w-4 h-4 text-blue-700" />, label: 'LinkedIn' },
                                    ].map(social => (
                                        <div key={social.key} className="space-y-1.5">
                                            <Label className="text-xs font-semibold flex items-center gap-2">
                                                {social.icon} {social.label}
                                            </Label>
                                            <Input
                                                value={contact[social.key] || ''}
                                                onChange={e => setContact({...contact, [social.key]: e.target.value})}
                                                className="h-10 text-sm"
                                                placeholder={`URL`}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                <div className="flex justify-start">
                                    <Button
                                        onClick={() => handleUpdate('contact', contact)}
                                        disabled={isSaving}
                                        className="px-10"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Social Hub
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
