'use client';

import {
    ArrowLeft,
    Building2,
    Clock,
    Loader2,
    Save,
    ShieldCheck
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DAYS = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

export default function StoreSettingsClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // States
    const [contact, setContact] = useState<any>({});
    const [legal, setLegal] = useState<any>({});
    const [businessHours, setBusinessHours] = useState<any>({});

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

            const [conRes, legRes] = await Promise.all([
                fetch(`${BACKEND_URL}/settings/contact`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }}),
                fetch(`${BACKEND_URL}/settings/legal`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }})
            ]);

            const [conData, legData] = await Promise.all([
                conRes.json(),
                legRes.json()
            ]);

            if (conData.success) {
                setContact(conData.data || {});
                setBusinessHours(conData.data?.businessHours || {});
            }
            if (legData.success) {
                setLegal(legData.data || {});
            }
        } catch (error) {
            toast.error('Failed to sync store parameters');
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
                toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} configuration updated`);
                fetchData();
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Store infrastructure communication error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading store configuration...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard/settings">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium -ml-2 text-muted-foreground">
                                <ArrowLeft className="w-3.5 h-3.5" /> Settings
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Store Infrastructure</h1>
                    <p className="text-slate-500 text-sm">Manage physical operational parameters and legal frameworks.</p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Physical Node: Active</span>
                </div>
            </div>

            <Tabs defaultValue="hours" className="space-y-6">
                <TabsList className="bg-slate-100/50 p-1 border rounded-lg h-auto flex flex-wrap lg:inline-flex w-full lg:w-auto">
                    <TabsTrigger value="hours" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Clock className="w-3.5 h-3.5 mr-2" /> Business Hours
                    </TabsTrigger>
                    <TabsTrigger value="legal" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Legal Policies
                    </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    {/* Business Hours Tab */}
                    <TabsContent value="hours" className="animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="border-b bg-slate-50/50">
                                <CardTitle className="text-lg font-bold">Temporal Operations</CardTitle>
                                <CardDescription className="text-xs">Define operational availability nodes for each solar cycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {DAYS.map(day => (
                                        <div key={day.key} className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 hover:bg-slate-50/30 transition-colors">
                                            <div className="flex items-center gap-6 min-w-[200px]">
                                                <Switch
                                                    checked={businessHours[day.key]?.isOpen}
                                                    onCheckedChange={val => setBusinessHours({
                                                        ...businessHours,
                                                        [day.key]: { ...businessHours[day.key], isOpen: val }
                                                    })}
                                                />
                                                <Label className="text-sm font-bold uppercase tracking-tight text-slate-700">{day.label}</Label>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 flex-1 max-w-md">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400">Open Node</Label>
                                                    <Input
                                                        type="time"
                                                        value={businessHours[day.key]?.open || '09:00'}
                                                        onChange={e => setBusinessHours({
                                                            ...businessHours,
                                                            [day.key]: { ...businessHours[day.key], open: e.target.value }
                                                        })}
                                                        disabled={!businessHours[day.key]?.isOpen}
                                                        className="h-10 text-xs font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400">Close Node</Label>
                                                    <Input
                                                        type="time"
                                                        value={businessHours[day.key]?.close || '18:00'}
                                                        onChange={e => setBusinessHours({
                                                            ...businessHours,
                                                            [day.key]: { ...businessHours[day.key], close: e.target.value }
                                                        })}
                                                        disabled={!businessHours[day.key]?.isOpen}
                                                        className="h-10 text-xs font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className={`h-1.5 w-1.5 rounded-full ${businessHours[day.key]?.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                    {businessHours[day.key]?.isOpen ? 'Operational' : 'Closed'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 bg-slate-50/50 border-t">
                                    <Button
                                        onClick={() => handleUpdate('contact', { ...contact, businessHours })}
                                        disabled={isSaving}
                                        className="w-full md:w-auto px-12"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Operational Schedule
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Legal Policies Tab */}
                    <TabsContent value="legal" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {[
                            { key: 'termsAndConditions', label: 'Terms & Conditions', icon: ShieldCheck, color: 'text-blue-600' },
                            { key: 'privacyPolicy', label: 'Privacy Policy', icon: ShieldCheck, color: 'text-emerald-600' },
                            { key: 'returnPolicy', label: 'Return & Refund Policy', icon: ShieldCheck, color: 'text-rose-600' },
                        ].map(policy => (
                            <Card key={policy.key} className="shadow-sm border-slate-200">
                                <CardHeader className="border-b bg-slate-50/50 py-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic">
                                            <policy.icon className={`w-4 h-4 ${policy.color}`} /> {policy.label}
                                        </CardTitle>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Policy Node: v1.0.0</div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <textarea
                                        value={legal[policy.key] || ''}
                                        onChange={e => setLegal({...legal, [policy.key]: e.target.value})}
                                        className="w-full h-48 p-4 rounded-xl border border-slate-200 bg-white text-sm font-medium ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none transition-all"
                                        placeholder={`Draft your ${policy.label.toLowerCase()} here. Use Markdown for structured synergy...`}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={() => handleUpdate('legal', legal)}
                                            disabled={isSaving}
                                            variant="outline"
                                            size="sm"
                                            className="h-10 px-6 border-slate-300 gap-2 font-bold text-xs uppercase italic"
                                        >
                                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            Sync Policy Node
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
