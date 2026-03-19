'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailSettingsClient() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [config, setConfig] = useState<any>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: true,
    fromName: '',
    fromEmail: '',
    replyTo: '',
    sendOrderConfirmation: true,
    sendShippingUpdate: true,
    sendDeliveryConfirm: true,
    sendAbandonedCart: false,
  });

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/settings/email`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.data || {});
      }
    } catch (error) {
      toast.error('Failed to load email settings');
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
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/settings/email`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Email settings updated successfully');
      } else {
        toast.error(data.message || 'Update failed');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!session?.accessToken) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/settings/email-test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: config,
          testEmail: testRecipient,
        }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message,
      });
      if (data.success) {
        toast.success('SMTP connection verified!');
      } else {
        toast.error(data.message || 'Connection test failed');
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to reach the server',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Initializing Mail Engine...
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
            Email Configuration
          </h1>
          <p className="text-slate-500 text-sm">
            Manage SMTP servers, sender identities, and automated notifications.
          </p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <Mail className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Status: Configured
          </span>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-[600px] mb-8">
          <TabsTrigger value="smtp">SMTP Server</TabsTrigger>
          <TabsTrigger value="sender">Sender Identity</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="test">Test Connection</TabsTrigger>
        </TabsList>

        {/* SMTP Server */}
        <TabsContent value="smtp" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    SMTP Connection
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your outgoing mail server details.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    SMTP Host
                  </Label>
                  <Input
                    placeholder="e.g. smtp.gmail.com"
                    value={config.smtpHost}
                    onChange={(e) =>
                      setConfig({ ...config, smtpHost: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    SMTP Port
                  </Label>
                  <Input
                    type="number"
                    placeholder="587"
                    value={config.smtpPort}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtpPort: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    SMTP Username
                  </Label>
                  <Input
                    placeholder="user@example.com"
                    value={config.smtpUser}
                    onChange={(e) =>
                      setConfig({ ...config, smtpUser: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    SMTP Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••••••"
                    value={config.smtpPass}
                    onChange={(e) =>
                      setConfig({ ...config, smtpPass: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">
                    SSL/TLS Security
                  </Label>
                  <p className="text-xs text-slate-500">
                    Use secure connection for mail transmission.
                  </p>
                </div>
                <Switch
                  checked={config.smtpSecure}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, smtpSecure: val })
                  }
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Server Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sender Identity */}
        <TabsContent value="sender" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    Mail Identity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define how your brand appears in recipient inboxes.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sender Name
                  </Label>
                  <Input
                    placeholder="e.g. Mahbub Shop Official"
                    value={config.fromName}
                    onChange={(e) =>
                      setConfig({ ...config, fromName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sender Email
                  </Label>
                  <Input
                    placeholder="no-reply@mahbubshop.com"
                    value={config.fromEmail}
                    onChange={(e) =>
                      setConfig({ ...config, fromEmail: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Reply-To Address
                  </Label>
                  <Input
                    placeholder="support@mahbubshop.com"
                    value={config.replyTo}
                    onChange={(e) =>
                      setConfig({ ...config, replyTo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Identity Settings
                </Button>
              </div>
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
                  <CardTitle className="text-lg font-bold">
                    Automated Notifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Toggle which system events trigger an automated email.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">
                    Order Confirmation
                  </Label>
                  <p className="text-xs text-slate-500">
                    Sent immediately after a successful checkout.
                  </p>
                </div>
                <Switch
                  checked={config.sendOrderConfirmation}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, sendOrderConfirmation: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">
                    Shipping Updates
                  </Label>
                  <p className="text-xs text-slate-500">
                    Sent when an order status changes to "Shipped".
                  </p>
                </div>
                <Switch
                  checked={config.sendShippingUpdate}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, sendShippingUpdate: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">
                    Delivery Confirmation
                  </Label>
                  <p className="text-xs text-slate-500">
                    Sent when courier confirms successful delivery.
                  </p>
                </div>
                <Switch
                  checked={config.sendDeliveryConfirm}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, sendDeliveryConfirm: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-700">
                    Abandoned Cart Recovery
                  </Label>
                  <p className="text-xs text-slate-500">
                    Sent to customers who left items without checking out.
                  </p>
                </div>
                <Switch
                  checked={config.sendAbandonedCart}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, sendAbandonedCart: val })
                  }
                />
              </div>

              <div className="pt-6">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Notification Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Connection */}
        <TabsContent value="test" className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border shadow-sm">
                  <Send className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    Mail Diagnostics
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verify your SMTP settings by sending a live test email.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Test Recipient Email
                  </Label>
                  <div className="flex gap-4">
                    <Input
                      placeholder="you@example.com"
                      className="flex-1"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleTestConnection}
                      disabled={isTesting || !testRecipient}
                      className="whitespace-nowrap"
                    >
                      {isTesting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Run Diagnostic
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Note: Diagnostic results are based on your UN-SAVED current
                    form inputs.
                  </p>
                </div>

                {testResult && (
                  <Alert
                    variant={testResult.success ? 'default' : 'destructive'}
                    className={
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-200'
                        : ''
                    }
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <AlertTitle
                      className={
                        testResult.success ? 'text-emerald-800 font-bold' : ''
                      }
                    >
                      {testResult.success ? 'Success!' : 'Configuration Error'}
                    </AlertTitle>
                    <AlertDescription
                      className={testResult.success ? 'text-emerald-700' : ''}
                    >
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                  <p className="font-bold text-slate-900 border-b pb-1 mb-2">
                    Common SMTP Hosts:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong>Gmail:</strong> smtp.gmail.com (Port 587, TLS)
                    </li>
                    <li>
                      <strong>Outlook:</strong> smtp-mail.outlook.com (Port 587,
                      TLS)
                    </li>
                    <li>
                      <strong>Mailtrap (Testing):</strong>{' '}
                      sandbox.smtp.mailtrap.io (Port 2525)
                    </li>
                    <li>
                      <strong>SendGrid:</strong> smtp.sendgrid.net (Port 587)
                    </li>
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
