'use client';

import {
    ArrowLeft,
    CheckCircle2,
    LayoutTemplate,
    Loader2,
    MessageSquare,
    RefreshCw,
    Save,
    Send,
    Settings,
    XCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SmsSettingsClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testNumber, setTestNumber] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const [config, setConfig] = useState<any>({
        gateway: 'TWILIO',
        apiSid: '',
        apiToken: '',
        apiSecret: '',
        fromNumber: '',
        sendOrderConfirmation: true,
        sendShippingUpdate: true,
        sendDeliveryConfirm: true,
        sendOtp: true,
    });

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/sms`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                setConfig(data.data || {});
            }
        } catch (error) {
            toast.error('Failed to load SMS settings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleSave = async () => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/sms`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('SMS settings updated successfully');
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestSms = async () => {
        if (!session?.accessToken) return;
        setIsTesting(true);
        setTestResult(null);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/sms-test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: config,
                    testNumber: testNumber
                })
            });
            const data = await res.json();
            setTestResult({
                success: data.success,
                message: data.message
            });
            if (data.success) {
                toast.success('Test SMS sent successfully!');
            } else {
                toast.error(data.message || 'Test failed');
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Failed to reach the server'
            });
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Initializing SMS Engine...</p>
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">SMS Configuration</h1>
                    <p className="text-slate-500 text-sm">Manage SMS gateways, API credentials, and notification triggers.</p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Status: Ready</span>
                </div>
            </div>

            <Tabs defaultValue="gateway" className="w-full">
                <TabsList className="grid w-full grid-cols-4 md:w-[600px] mb-8">
                    <TabsTrigger value="gateway">Gateway</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="test">Diagnostic</TabsTrigger>
                </TabsList>

                {/* Gateway Config */}
                <TabsContent value="gateway" className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border shadow-sm">
                                    <Settings className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">API Integration</CardTitle>
                                    <CardDescription className="text-xs">Select and configure your SMS provider credentials.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Gateway Provider</Label>
                                    <Select
                                        value={config.gateway}
                                        onValueChange={(val) => setConfig({ ...config, gateway: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Gateway" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="TWILIO">Twilio (Global)</SelectItem>
                                            <SelectItem value="MSG91">MSG91 (India/Global)</SelectItem>
                                            <SelectItem value="SSL_WIRELESS">SSL Wireless (Bangladesh)</SelectItem>
                                            <SelectItem value="BULK_SMS_BD">BulkSMS BD (Bangladesh)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">From (Number/ID)</Label>
                                    <Input
                                        placeholder="+1234567890"
                                        value={config.fromNumber}
                                        onChange={e => setConfig({ ...config, fromNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">API Account SID / ID</Label>
                                    <Input
                                        placeholder="ACxxxxxxxxxxxxxxxx"
                                        value={config.apiSid}
                                        onChange={e => setConfig({ ...config, apiSid: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Auth Token / Key</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••"
                                        value={config.apiToken}
                                        onChange={e => setConfig({ ...config, apiToken: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Gateway Config
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Templates */}
                <TabsContent value="templates" className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border shadow-sm">
                                    <LayoutTemplate className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Message Layouts</CardTitle>
                                    <CardDescription className="text-xs">Define the content for automated SMS alerts.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-12 text-center space-y-4">
                            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto" />
                            <div className="space-y-1">
                                <p className="font-bold text-slate-700 text-lg uppercase">Coming Soon</p>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto">Dynamic template management with variable support (e.g. {'{order_id}'}, {'{customer_name}'}) is under development.</p>
                            </div>
                            <Button variant="outline" size="sm" disabled>Define Custom Templates</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border shadow-sm">
                                    <RefreshCw className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">SMS Rules</CardTitle>
                                    <CardDescription className="text-xs">Select which events should trigger an SMS notification.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-700">Order Confirmation</Label>
                                    <p className="text-xs text-slate-500">Alert customers when their order is received.</p>
                                </div>
                                <Switch
                                    checked={config.sendOrderConfirmation}
                                    onCheckedChange={val => setConfig({ ...config, sendOrderConfirmation: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-700">Shipping Alert</Label>
                                    <p className="text-xs text-slate-500">Send tracking link when order leaves the warehouse.</p>
                                </div>
                                <Switch
                                    checked={config.sendShippingUpdate}
                                    onCheckedChange={val => setConfig({ ...config, sendShippingUpdate: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-700">Delivery Status</Label>
                                    <p className="text-xs text-slate-500">Notify customer upon successful delivery.</p>
                                </div>
                                <Switch
                                    checked={config.sendDeliveryConfirm}
                                    onCheckedChange={val => setConfig({ ...config, sendDeliveryConfirm: val })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-700">OTP / Authentication</Label>
                                    <p className="text-xs text-slate-500">Send security codes for login/password reset.</p>
                                </div>
                                <Switch
                                    checked={config.sendOtp}
                                    onCheckedChange={val => setConfig({ ...config, sendOtp: val })}
                                />
                            </div>

                            <div className="pt-6">
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save SMS Rules
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Diagnostic Test */}
                <TabsContent value="test" className="space-y-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border shadow-sm">
                                    <Send className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">SMS Diagnostics</CardTitle>
                                    <CardDescription className="text-xs">Send a live test message to verify gateway connectivity.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Test Phone Number</Label>
                                    <div className="flex gap-4">
                                        <Input
                                            placeholder="e.g. +8801700000000"
                                            className="flex-1"
                                            value={testNumber}
                                            onChange={e => setTestNumber(e.target.value)}
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={handleTestSms}
                                            disabled={isTesting || !testNumber}
                                            className="whitespace-nowrap"
                                        >
                                            {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                            Run Diagnostic
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic">Note: Diagnostics use your CURRENT unsaved form inputs.</p>
                                </div>

                                {testResult && (
                                    <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "bg-emerald-50 border-emerald-200" : ""}>
                                        {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4" />}
                                        <AlertTitle className={testResult.success ? "text-emerald-800 font-bold" : ""}>
                                            {testResult.success ? 'Success!' : 'Delivery Error'}
                                        </AlertTitle>
                                        <AlertDescription className={testResult.success ? "text-emerald-700" : ""}>
                                            {testResult.message}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                                    <p className="font-bold text-slate-900 border-b pb-1 mb-2">Gateways Support:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li><strong>Twilio:</strong> Global reach, requires SID and Token.</li>
                                        <li><strong>MSG91:</strong> Popular in India, utilizes AuthKey.</li>
                                        <li><strong>SSL Wireless:</strong> Top choice for Bangladesh local routes.</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
