'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Calendar, Clock, Database, Download, FileText, FolderTree, History, Loader2, Package, RefreshCw, Settings, ShoppingCart, Trash2, Truck, Upload, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BackupRecord {
  id: string;
  fileName: string;
  type: string;
  size: number;
  status: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface BackupSettings {
  frequency: string;
  time: string;
  enabled: boolean;
}

export default function BackupExportPage() {
  const { data: session } = useSession();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    frequency: 'daily',
    time: '02:00',
    enabled: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingBackups, setFetchingBackups] = useState(true);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportingType, setExportingType] = useState<string | null>(null);

  const authHeaders = (): Record<string, string> => ({
    'Authorization': `Bearer ${session?.accessToken || ''}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchBackups();
      fetchBackupSettings();
    }
  }, [session?.accessToken]);

  const fetchBackups = async () => {
    setFetchingBackups(true);
    try {
      const response = await fetch(`${BACKEND_URL}/backup/history`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setBackups(data.data.backups);
      }
    } catch (error) {
      toast.error('Failed to fetch backup history');
    } finally {
      setFetchingBackups(false);
    }
  };

  const fetchBackupSettings = async () => {
    setFetchingSettings(true);
    try {
      const response = await fetch(`${BACKEND_URL}/backup/settings`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.success && data.data) {
        setSettings({
          frequency: data.data.frequency || 'daily',
          time: data.data.time || '02:00',
          enabled: data.data.enabled || false,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch backup settings');
    } finally {
      setFetchingSettings(false);
    }
  };

  const createDatabaseBackup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/backup/database`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Backup created — ${data.data.totalRecords} records from ${data.data.tablesBackedUp} tables`);
        fetchBackups();
      } else {
        toast.error(data.message || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string, format: string = 'json') => {
    setExportingType(`${type}-${format}`);
    try {
      const response = await fetch(`${BACKEND_URL}/backup/export/${type}?format=${format}`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken || ''}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported as ${format.toUpperCase()}`);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to export data');
      }
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportingType(null);
    }
  };

  const downloadBackup = async (backupId: string, fileName: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/backup/download/${backupId}`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken || ''}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Backup downloaded');
      } else {
        toast.error('Failed to download backup');
      }
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/backup/${backupId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Backup deleted');
        fetchBackups();
      } else {
        toast.error(data.message || 'Failed to delete backup');
      }
    } catch (error) {
      toast.error('Failed to delete backup');
    }
  };

  const restoreFromBackup = async (backupId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/backup/restore/${backupId}`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Database restored — ${data.data.restored.length} tables restored`);
        fetchBackups();
      } else {
        toast.error(data.message || 'Failed to restore database');
      }
    } catch (error) {
      toast.error('Failed to restore database');
    } finally {
      setLoading(false);
    }
  };

  const updateBackupSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/backup/schedule`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Backup schedule updated');
      } else {
        toast.error(data.message || 'Failed to update schedule');
      }
    } catch (error) {
      toast.error('Failed to update backup schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      database: 'bg-blue-100 text-blue-700 border-blue-200',
      scheduled: 'bg-green-100 text-green-700 border-green-200',
      restore: 'bg-orange-100 text-orange-700 border-orange-200',
      export: 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return (
      <Badge variant="outline" className={colors[type] || ''}>
        {type}
      </Badge>
    );
  };

  if (!session?.accessToken) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const exportCards = [
    { type: 'products', label: 'Products', desc: 'All products with variants and categories', icon: Package, color: 'text-blue-600' },
    { type: 'orders', label: 'Orders', desc: 'All orders with items and customer info', icon: ShoppingCart, color: 'text-green-600' },
    { type: 'customers', label: 'Customers', desc: 'All customers with order history', icon: Users, color: 'text-purple-600' },
    { type: 'categories', label: 'Categories', desc: 'Category tree with subcategories', icon: FolderTree, color: 'text-orange-600' },
    { type: 'suppliers', label: 'Suppliers', desc: 'Suppliers with purchase records', icon: Truck, color: 'text-teal-600' },
    { type: 'inventory', label: 'Inventory', desc: 'Stock levels, SKUs, and thresholds', icon: BarChart3, color: 'text-rose-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Backup & Export</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage database backups, data exports, and automated backup schedules
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 border rounded-lg h-auto flex flex-wrap lg:inline-flex w-full lg:w-auto">
          <TabsTrigger value="overview" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database className="h-3.5 w-3.5 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="export" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Upload className="h-3.5 w-3.5 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="h-3.5 w-3.5 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md px-6 py-2 text-xs font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="h-3.5 w-3.5 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          {/* ─── OVERVIEW TAB ─── */}
          <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Database Backup
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Create a complete backup of your entire database
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button
                    onClick={createDatabaseBackup}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Create Full Backup
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Includes products, orders, customers, categories, suppliers, inventory, and all other data.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Quick Export
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Export commonly needed data
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={exportingType === 'products-json'}
                    onClick={() => exportData('products', 'json')}
                  >
                    {exportingType === 'products-json' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                    Export Products (JSON)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={exportingType === 'orders-json'}
                    onClick={() => exportData('orders', 'json')}
                  >
                    {exportingType === 'orders-json' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                    Export Orders (JSON)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={exportingType === 'customers-csv'}
                    onClick={() => exportData('customers', 'csv')}
                  >
                    {exportingType === 'customers-csv' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                    Export Customers (CSV)
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Backups */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">Recent Backups</CardTitle>
                    <CardDescription className="text-xs">Your most recent database backups</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchBackups} className="h-8 gap-2 text-xs">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {fetchingBackups ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : backups.slice(0, 5).length > 0 ? (
                  <div className="space-y-3">
                    {backups.slice(0, 5).map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{backup.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(backup.createdAt).toLocaleString()} • {formatFileSize(backup.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(backup.type)}
                          {getStatusBadge(backup.status)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup.id, backup.fileName)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No backups created yet. Create your first backup to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── EXPORT TAB ─── */}
          <TabsContent value="export" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-bold">Export Data</CardTitle>
                <CardDescription className="text-xs">
                  Export your data in JSON or CSV format for analysis or migration
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {exportCards.map(({ type, label, desc, icon: Icon, color }) => (
                    <Card key={type} className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          {label}
                        </CardTitle>
                        <CardDescription className="text-xs">{desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0">
                        <Button
                          onClick={() => exportData(type, 'json')}
                          className="w-full"
                          variant="outline"
                          size="sm"
                          disabled={exportingType === `${type}-json`}
                        >
                          {exportingType === `${type}-json` ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}
                          Export JSON
                        </Button>
                        <Button
                          onClick={() => exportData(type, 'csv')}
                          className="w-full"
                          variant="outline"
                          size="sm"
                          disabled={exportingType === `${type}-csv`}
                        >
                          {exportingType === `${type}-csv` ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}
                          Export CSV
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SCHEDULE TAB ─── */}
          <TabsContent value="schedule" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Automatic Backup Schedule
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure automatic backups to run on a regular schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {fetchingSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-backup" className="text-sm font-bold">Enable Automatic Backups</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically create backups on a schedule
                        </p>
                      </div>
                      <Switch
                        id="auto-backup"
                        checked={settings.enabled}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>

                    {settings.enabled && (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="frequency" className="text-xs font-semibold">Frequency</Label>
                            <Select
                              value={settings.frequency}
                              onValueChange={(value) => setSettings(prev => ({ ...prev, frequency: value }))}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly (Sunday)</SelectItem>
                                <SelectItem value="monthly">Monthly (1st)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="time" className="text-xs font-semibold">Time</Label>
                            <Input
                              id="time"
                              type="time"
                              value={settings.time}
                              onChange={(e) => setSettings(prev => ({ ...prev, time: e.target.value }))}
                              className="h-10"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <p className="text-sm text-blue-700">
                            Next backup: <strong>{settings.frequency}</strong> at <strong>{settings.time}</strong> (Asia/Dhaka timezone)
                          </p>
                        </div>
                      </>
                    )}

                    <Button onClick={updateBackupSettings} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Schedule'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── HISTORY TAB ─── */}
          <TabsContent value="history" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      Backup History
                    </CardTitle>
                    <CardDescription className="text-xs">
                      View and manage all your database backups
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchBackups} className="h-8 gap-2 text-xs">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {fetchingBackups ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : backups.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {backups.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell className="font-medium text-sm">{backup.fileName}</TableCell>
                          <TableCell>{getTypeBadge(backup.type)}</TableCell>
                          <TableCell className="text-sm">{formatFileSize(backup.size)}</TableCell>
                          <TableCell>{getStatusBadge(backup.status)}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(backup.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {backup.creator ? backup.creator.name : 'System'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadBackup(backup.id, backup.fileName)}
                                className="h-8 w-8 p-0"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>

                              {(backup.type === 'database' || backup.type === 'scheduled') && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Restore">
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Restore from Backup</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will replace your current database with the backup from {new Date(backup.createdAt).toLocaleString()}.
                                        <strong className="block mt-2 text-destructive">This action cannot be undone.</strong>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => restoreFromBackup(backup.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Restore
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Delete">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete <strong>{backup.fileName}</strong>? This will permanently delete the backup file from disk.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteBackup(backup.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">
                    No backups found. Create your first backup to see it here.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
