'use client';

import {
    ArrowLeft,
    Banknote,
    DollarSign,
    Globe,
    Loader2,
    Phone,
    Save,
    Smartphone,
    Wallet
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

export default function PaymentSettingsClient() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [payment, setPayment] = useState<any>({});

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/payment`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();

            if (data.success) {
                setPayment(data.data || {});
            }
        } catch (error) {
            toast.error('Failed to sync financial parameters');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleUpdate = async (gatewayData: any) => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
            const res = await fetch(`${BACKEND_URL}/settings/payment`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...payment, ...gatewayData })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Payment configuration updated');
                fetchData();
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            toast.error('Financial infrastructure error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading payment gateways...</p>
            </div>
        );
    }

    const GatewayCard = ({ title, icon: Icon, fields, enabledKey, sandboxKey, description }: any) => (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="pb-4 border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border shadow-sm">
                            <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">{title}</CardTitle>
                            <CardDescription className="text-xs">{description}</CardDescription>
                        </div>
                    </div>
                    <Switch
                        checked={payment[enabledKey]}
                        onCheckedChange={val => handleUpdate({ [enabledKey]: val })}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {sandboxKey && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 mb-2">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Environment</Label>
                            <p className="text-[10px] text-muted-foreground">Sandbox vs Live mode</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${!payment[sandboxKey] ? 'text-emerald-600' : 'text-slate-400'}`}>LIVE</span>
                            <Switch
                                checked={payment[sandboxKey]}
                                onCheckedChange={val => handleUpdate({ [sandboxKey]: val })}
                            />
                            <span className={`text-[10px] font-bold ${payment[sandboxKey] ? 'text-blue-600' : 'text-slate-400'}`}>TEST</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {fields.map((f: any) => (
                        <div key={f.key} className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700">{f.label}</Label>
                            <Input
                                type={f.type || 'text'}
                                value={payment[f.key] || ''}
                                onChange={e => setPayment({ ...payment, [f.key]: e.target.value })}
                                className="h-10 text-sm focus-visible:ring-primary/20"
                                placeholder={f.placeholder}
                                disabled={!payment[enabledKey]}
                            />
                        </div>
                    ))}
                </div>

                <Button
                    onClick={() => handleUpdate(payment)}
                    disabled={isSaving || !payment[enabledKey]}
                    className="w-full mt-2"
                    size="sm"
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                    Save Configuration
                </Button>
            </CardContent>
        </Card>
    );

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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Payment Gateways</h1>
                    <p className="text-slate-500 text-sm">Configure secure payment methods and API credentials for your store.</p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Gateway Engine: Operational</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Stripe */}
                <GatewayCard
                    title="Stripe"
                    icon={DollarSign}
                    description="Global credit/debit card hub"
                    enabledKey="stripeEnabled"
                    sandboxKey="stripeSandbox"
                    fields={[
                        { key: 'stripePublicKey', label: 'Public Key', placeholder: 'pk_test_...' },
                        { key: 'stripeSecretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...' },
                        { key: 'stripeWebhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' },
                    ]}
                />

                {/* PayPal */}
                <GatewayCard
                    title="PayPal"
                    icon={Wallet}
                    description="Universal digital wallet"
                    enabledKey="paypalEnabled"
                    sandboxKey="paypalSandbox"
                    fields={[
                        { key: 'paypalClientId', label: 'Client ID', placeholder: 'AUZ...' },
                        { key: 'paypalSecretKey', label: 'Secret Key', type: 'password', placeholder: 'EFx...' },
                    ]}
                />

                {/* bKash */}
                <GatewayCard
                    title="bKash"
                    icon={Smartphone}
                    description="Mobile financial service (BD)"
                    enabledKey="bkashEnabled"
                    sandboxKey="bkashSandbox"
                    fields={[
                        { key: 'bkashAppKey', label: 'App Key', placeholder: '5zi...' },
                        { key: 'bkashAppSecret', label: 'App Secret', type: 'password', placeholder: 'vUf...' },
                        { key: 'bkashUsername', label: 'Username', placeholder: 'merchant_user' },
                        { key: 'bkashPassword', label: 'Password', type: 'password' },
                    ]}
                />

                {/* Nagad */}
                <GatewayCard
                    title="Nagad"
                    icon={Banknote}
                    description="Digital financial service (BD)"
                    enabledKey="nagadEnabled"
                    sandboxKey="nagadSandbox"
                    fields={[
                        { key: 'nagadMerchantId', label: 'Merchant ID', placeholder: '682...' },
                        { key: 'nagadApiKey', label: 'API Key', type: 'password' },
                    ]}
                />

                {/* SSLCommerz */}
                <GatewayCard
                    title="SSLCommerz"
                    icon={Globe}
                    description="Local gateway aggregate (BD)"
                    enabledKey="sslcEnabled"
                    sandboxKey="sslcSandbox"
                    fields={[
                        { key: 'sslcStoreId', label: 'Store ID', placeholder: 'test_id' },
                        { key: 'sslcStorePass', label: 'Store Password', type: 'password' },
                    ]}
                />

                {/* Cash on Delivery */}
                <GatewayCard
                    title="Cash on Delivery"
                    icon={Phone}
                    description="Offline settlement on arrival"
                    enabledKey="codEnabled"
                    fields={[
                        { key: 'codExtraCharge', label: 'Extra Charge', type: 'number', placeholder: '0.00' },
                        { key: 'codNote', label: 'Operational Note', placeholder: 'Pay when receiving order' },
                    ]}
                />
            </div>
        </div>
    );
}
