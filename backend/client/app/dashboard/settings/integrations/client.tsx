'use client';

import { useConfirm } from '@/hooks/use-confirm';
import {
    Activity,
    Code,
    ExternalLink,
    Facebook,
    Globe,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Settings,
    Shield,
    Trash2,
    Webhook as WebhookIcon,
    Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
}

export default function IntegrationsClient() {
    const { confirm } = useConfirm();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Settings States
    const [integrations, setIntegrations] = useState<any>({});
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);

    // Webhook Form State
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: ['order.created'] });

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

            const [intRes, webRes] = await Promise.all([
                fetch(`${API_URL}/settings/integrations`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }}),
                fetch(`${API_URL}/settings/webhooks`, { headers: { 'Authorization': `Bearer ${session.accessToken}` }})
            ]);

            const [intData, webData] = await Promise.all([
                intRes.json(),
                webRes.json()
            ]);

            if (intData.success) setIntegrations(intData.data || {});
            if (webData.success) setWebhooks(webData.data || []);

        } catch (error) {
            toast.error('Failed to sync integration data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleUpdateIntegrations = async () => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${API_URL}/settings/integrations`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(integrations)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Integration settings updated');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to update integrations');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddWebhook = async () => {
        if (!session?.accessToken) return;
        if (!newWebhook.name || !newWebhook.url) return toast.error('Name and URL are required');
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${API_URL}/settings/webhooks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newWebhook)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Webhook added successfully');
                setNewWebhook({ name: '', url: '', events: ['order.created'] });
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to add webhook');
        }
    };

    const handleDeleteWebhook = async (id: string) => {
        if (!session?.accessToken) return;
        if (!await confirm({
            title: 'Delete Webhook',
            message: 'Are you sure you want to delete this outbound webhook? Real-time event delivery to this destination will cease immediately.',
            type: 'danger',
            confirmText: 'Delete Webhook'
        })) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${API_URL}/settings/webhooks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Webhook deleted');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to delete webhook');
        }
    };

    const toggleWebhookStatus = async (webhook: Webhook) => {
        if (!session?.accessToken) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            await fetch(`${API_URL}/settings/webhooks/${webhook.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !webhook.isActive })
            });
            fetchData();
        } catch (error) {
            toast.error('Failed to update webhook status');
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground italic font-medium uppercase tracking-widest">Bridging External Nodes...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Minimal Header */}
            <div className="border-b pb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Integrations matrix</h1>
                        <p className="text-slate-500 text-sm mt-1">Deploy tracking pixels, analytics engines, and system webhooks.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchData}
                        className="text-[10px] font-black uppercase tracking-tighter italic text-slate-400 hover:text-primary transition-all"
                    >
                        <RefreshCw className="w-3 h-3 mr-1.5" /> Sync Engine
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Analytics & Pixels */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    <Card className="shadow-none border-slate-200 overflow-hidden group">
                        <CardHeader className="border-b bg-slate-50/50 relative py-6">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all duration-300" />
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500" /> Analytics Cluster
                                    </CardTitle>
                                    <CardDescription className="text-xs uppercase font-black tracking-widest text-slate-400 mt-1 italic">Event Tracking & Synergy</CardDescription>
                                </div>
                                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-blue-600" /> Google Analytics 4
                                        </Label>
                                        <p className="text-[10px] text-slate-400 italic mb-1">Measurement ID (G-XXXXXXXXXX)</p>
                                        <Input
                                            value={integrations.googleAnalyticsId || ''}
                                            onChange={e => setIntegrations({...integrations, googleAnalyticsId: e.target.value})}
                                            placeholder="G-XXXXXX"
                                            className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-400 italic mb-1">GA4 API Secret (Required for Purchase Tracking)</p>
                                        <Input
                                            type="password"
                                            value={integrations.thirdPartyConfig?.ga4ApiSecret || ''}
                                            onChange={e => setIntegrations({
                                                ...integrations,
                                                thirdPartyConfig: {
                                                    ...(integrations.thirdPartyConfig || {}),
                                                    ga4ApiSecret: e.target.value
                                                }
                                            })}
                                            placeholder="Measurement Protocol API Secret"
                                            className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                            <Facebook className="w-3.5 h-3.5 text-blue-800" /> Meta Pixel
                                        </Label>
                                        <p className="text-[10px] text-slate-400 italic mb-1">Pixel ID for ad tracking</p>
                                        <Input
                                            value={integrations.facebookPixelId || ''}
                                            onChange={e => setIntegrations({...integrations, facebookPixelId: e.target.value})}
                                            placeholder="1234567890"
                                            className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-400 italic mb-1">Conversion API Access Token</p>
                                        <Input
                                            type="password"
                                            value={integrations.thirdPartyConfig?.facebookAccessToken || ''}
                                            onChange={e => setIntegrations({
                                                ...integrations,
                                                thirdPartyConfig: {
                                                    ...(integrations.thirdPartyConfig || {}),
                                                    facebookAccessToken: e.target.value
                                                }
                                            })}
                                            placeholder="EAAB..."
                                            className="h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                        <Code className="w-3.5 h-3.5 text-emerald-500" /> Google Tag Manager
                                    </Label>
                                    <p className="text-[10px] text-slate-400 italic mb-3">Container ID (GTM-XXXXXXX)</p>
                                    <Input
                                        value={integrations.googleTagManagerId || ''}
                                        onChange={e => setIntegrations({...integrations, googleTagManagerId: e.target.value})}
                                        placeholder="GTM-XXXXXXX"
                                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <Separator className="bg-slate-100" />

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
                                        <Shield className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 uppercase italic">Server-Side Propagation</p>
                                        <p className="text-[10px] text-slate-400 italic">Tracking is optimized for payload delivery</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleUpdateIntegrations}
                                    disabled={isSaving}
                                    className="px-10 h-11 bg-slate-900 hover:bg-black text-white rounded-lg shadow-lg hover:shadow-xl transition-all uppercase tracking-widest font-black text-[10px]"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Deploy Matrix
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Third Party Apps Placeholder or Flexible JSON */}
                    <Card className="shadow-none border-slate-200 border-dashed bg-slate-50/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2 italic uppercase text-slate-500">
                                <Settings className="w-4 h-4" /> App Infrastructure
                            </CardTitle>
                            <CardDescription className="text-[10px]">Configure third-party application modules via JSON schema.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-blue-300 min-h-[100px] flex items-center justify-center border border-slate-800 shadow-inner italic">
                                {"// Flexible dynamic configuration module pending deployment"}
                             </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Webhooks */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                    <Card className="shadow-none border-slate-200 overflow-hidden">
                        <CardHeader className="border-b bg-slate-50/50 py-6">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <WebhookIcon className="w-4 h-4 text-emerald-500" /> Outbound Webhooks
                            </CardTitle>
                            <CardDescription className="text-xs uppercase font-black tracking-widest text-slate-400 mt-1 italic">Real-time Event Delivery</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Webhook List */}
                            <div className="space-y-4">
                                {webhooks.length === 0 ? (
                                    <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-slate-50/30 text-slate-400 italic">
                                        <WebhookIcon className="w-8 h-8 opacity-20 mb-3" />
                                        <p className="text-xs uppercase font-bold tracking-widest">No Active Nodes</p>
                                    </div>
                                ) : (
                                    webhooks.map((webhook) => (
                                        <div key={webhook.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all group relative">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1.5 flex-1 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-bold text-slate-900 uppercase">{webhook.name}</h4>
                                                        <Badge variant={webhook.isActive ? "default" : "secondary"} className="h-4 text-[8px] uppercase font-black tracking-tighter">
                                                            {webhook.isActive ? "Online" : "Paused"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate max-w-[200px] italic">{webhook.url}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {webhook.events.map(ev => (
                                                            <span key={ev} className="text-[8px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100 font-mono">
                                                                {ev}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Switch
                                                        checked={webhook.isActive}
                                                        onCheckedChange={() => toggleWebhookStatus(webhook)}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Separator className="bg-slate-100" />

                            {/* Add Webhook Form */}
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 border-dashed space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic pb-2 flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> Initialize New Node
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-slate-500">Node Descriptor</Label>
                                        <Input
                                            value={newWebhook.name}
                                            onChange={e => setNewWebhook({...newWebhook, name: e.target.value})}
                                            placeholder="System API Gateway"
                                            className="h-10 bg-white text-xs border-slate-200"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-slate-500">Destination URL</Label>
                                        <Input
                                            value={newWebhook.url}
                                            onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
                                            placeholder="https://api.example.com/webhook"
                                            className="h-10 bg-white text-xs font-mono border-slate-200"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleAddWebhook}
                                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg uppercase tracking-widest font-black text-[9px]"
                                    >
                                        Deploy Webhook
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documentation Link Card */}
                    <div className="p-6 rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/20 flex items-center justify-between group hover:border-blue-300 transition-all cursor-help">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                                <ExternalLink className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase italic">Integrations Schema</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Learn how to route events to third-party endpoints.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
