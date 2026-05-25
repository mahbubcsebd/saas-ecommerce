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
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['order.created'],
  });

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL;

      const [intRes, webRes] = await Promise.all([
        fetch(`${API_URL}/settings/integrations`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${API_URL}/settings/webhooks`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      const [intData, webData] = await Promise.all([
        intRes.json(),
        webRes.json(),
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
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/settings/integrations`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(integrations),
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
    if (!newWebhook.name || !newWebhook.url)
      return toast.error('Name and URL are required');
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/settings/webhooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWebhook),
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
    if (
      !(await confirm({
        title: 'Delete Webhook',
        message:
          'Are you sure you want to delete this outbound webhook? Real-time event delivery to this destination will cease immediately.',
        type: 'danger',
        confirmText: 'Delete Webhook',
      }))
    )
      return;
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${API_URL}/settings/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
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
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${API_URL}/settings/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to update webhook status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto p-6 max-w-7xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-lg text-indigo-600 dark:text-indigo-400">
            <WebhookIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Integrations & Webhooks
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure tracking pixels, analytics suites, and real-time outbound webhooks.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="w-full sm:w-auto font-medium hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Sync Engine
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Analytics & Pixels */}
        <div className="xl:col-span-7 lg:col-span-12 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 py-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Analytics & Pixels
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Event tracking pixels and customer analytics platforms.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Analytics 4 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" /> Google Analytics 4
                    </Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      Measurement ID (e.g. G-XXXXXXXXXX)
                    </p>
                    <Input
                      value={integrations.googleAnalyticsId || ''}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          googleAnalyticsId: e.target.value,
                        })
                      }
                      placeholder="G-XXXXXX"
                      className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      GA4 API Protocol Secret
                    </Label>
                    <Input
                      type="password"
                      value={integrations.thirdPartyConfig?.ga4ApiSecret || ''}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          thirdPartyConfig: {
                            ...(integrations.thirdPartyConfig || {}),
                            ga4ApiSecret: e.target.value,
                          },
                        })
                      }
                      placeholder="API Secret for Purchase Tracking"
                      className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Meta Pixel */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Meta Pixel
                    </Label>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                      Pixel ID for active ad tracking
                    </p>
                    <Input
                      value={integrations.facebookPixelId || ''}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          facebookPixelId: e.target.value,
                        })
                      }
                      placeholder="1234567890"
                      className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      Conversion API Access Token
                    </Label>
                    <Input
                      type="password"
                      value={
                        integrations.thirdPartyConfig?.facebookAccessToken || ''
                      }
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          thirdPartyConfig: {
                            ...(integrations.thirdPartyConfig || {}),
                            facebookAccessToken: e.target.value,
                          },
                        })
                      }
                      placeholder="EAAB..."
                      className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Google Tag Manager */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-500" /> Google Tag Manager
                  </Label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                    Container ID (e.g. GTM-XXXXXXX)
                  </p>
                  <Input
                    value={integrations.googleTagManagerId || ''}
                    onChange={(e) =>
                      setIntegrations({
                        ...integrations,
                        googleTagManagerId: e.target.value,
                      })
                    }
                    placeholder="GTM-XXXXXXX"
                    className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <Separator className="bg-slate-100 dark:bg-slate-800" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-slate-900 flex items-center justify-center border border-indigo-100 dark:border-slate-800 shadow-inner">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Server-Side Propagation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tracking protocols are fully optimized for seamless event delivery.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleUpdateIntegrations}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm rounded-lg"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Integrations
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Third Party Apps Placeholder */}
          <Card className="border border-slate-200 dark:border-slate-800 border-dashed bg-slate-50/30 dark:bg-slate-900/10">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Settings className="w-4 h-4 text-slate-500" /> App Infrastructure
              </CardTitle>
              <CardDescription className="text-xs">
                Configure third-party application modules via JSON schema.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="bg-slate-950 dark:bg-black rounded-lg p-4 font-mono text-xs text-indigo-400 min-h-[100px] flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-inner">
                <span className="text-slate-500 select-none">// Flexible dynamic configuration module pending deployment</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Webhooks */}
        <div className="xl:col-span-5 lg:col-span-12 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <WebhookIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Outbound Webhooks
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Deliver real-time event payloads to external endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Webhook List */}
              <div className="space-y-4">
                {webhooks.length === 0 ? (
                  <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-900/10 text-slate-400 dark:text-slate-500">
                    <WebhookIcon className="w-8 h-8 stroke-[1.5] mb-3 text-slate-400 dark:text-slate-600" />
                    <p className="text-sm font-medium">
                      No outbound webhooks configured
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-center px-4">
                      Add a destination URL to receive live system event webhooks.
                    </p>
                  </div>
                ) : (
                  webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {webhook.name}
                            </h4>
                            <Badge
                              variant={webhook.isActive ? 'default' : 'secondary'}
                              className={
                                webhook.isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 font-medium'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'
                              }
                            >
                              {webhook.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                            {webhook.url}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((ev) => (
                              <span
                                key={ev}
                                className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 font-mono shadow-sm"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={webhook.isActive}
                            onCheckedChange={() => toggleWebhookStatus(webhook)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="bg-slate-100 dark:bg-slate-800" />

              {/* Add Webhook Form */}
              <div className="p-5 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> New Webhook Endpoint
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Webhook Name
                    </Label>
                    <Input
                      value={newWebhook.name}
                      onChange={(e) =>
                        setNewWebhook({ ...newWebhook, name: e.target.value })
                      }
                      placeholder="e.g. ERP Integration"
                      className="h-9 bg-white dark:bg-slate-950 text-sm border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Endpoint URL
                    </Label>
                    <Input
                      value={newWebhook.url}
                      onChange={(e) =>
                        setNewWebhook({ ...newWebhook, url: e.target.value })
                      }
                      placeholder="https://yourdomain.com/webhooks"
                      className="h-9 bg-white dark:bg-slate-950 text-sm font-mono border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <Button
                    onClick={handleAddWebhook}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                  >
                    Create Webhook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Link Card */}
          <div className="p-4 rounded-xl border border-dashed border-indigo-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-slate-950/20 flex items-center justify-between group hover:border-indigo-400/50 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-slate-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm transition-transform group-hover:scale-105">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Integrations Reference Guide
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Learn how to route real-time event payloads to external endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
