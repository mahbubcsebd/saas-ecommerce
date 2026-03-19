'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  CheckCircle2,
  Clock,
  Edit2,
  History,
  Loader2,
  Lock,
  MoreVertical,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  status: string;
  isActive: boolean;
  permissions: string[];
  customRoleId: string | null;
  customRole: {
    id: string;
    name: string;
  } | null;
  avatar: string | null;
  phone: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
}

interface CustomRole {
  id: string;
  name: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_dashboard', label: 'View Dashboard', category: 'General' },
  { id: 'manage_products', label: 'Manage Products', category: 'Inventory' },
  {
    id: 'manage_categories',
    label: 'Manage Categories',
    category: 'Inventory',
  },
  { id: 'manage_orders', label: 'Manage Orders', category: 'Sales' },
  { id: 'manage_returns', label: 'Manage Returns', category: 'Sales' },
  { id: 'manage_customers', label: 'Manage Customers', category: 'CRM' },
  { id: 'manage_staff', label: 'Manage Staff', category: 'Admin' },
  { id: 'manage_settings', label: 'Manage Settings', category: 'Admin' },
  { id: 'manage_logistics', label: 'Manage Logistics', category: 'Admin' },
  { id: 'view_reports', label: 'View Reports', category: 'Analytics' },
];

export default function StaffClient() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Form States
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'STAFF',
    customRoleId: 'NONE',
    isActive: true,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      // Get Staff
      const staffRes = await fetch(`${BACKEND_URL}/staff`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const staffData = await staffRes.json();
      if (staffData.success) setStaff(staffData.data);

      // Get Activity
      const activityRes = await fetch(`${BACKEND_URL}/staff/activity`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const activityData = await activityRes.json();
      if (activityData.success) setActivities(activityData.data.logs);

      // Get Custom Roles
      const rolesRes = await fetch(`${BACKEND_URL}/roles`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const rolesData = await rolesRes.json();
      if (rolesData.success) setCustomRoles(rolesData.data);
    } catch (error) {
      toast.error('Failed to sync team data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchData();
  }, [session?.accessToken]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/admin/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Invitation sent successfully');
        setIsAddModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedStaff) return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(
        `${BACKEND_URL}/staff/${selectedStaff.id}/permissions`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permissions: selectedPermissions }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success('Permissions updated');
        setIsPermModalOpen(false);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update permissions');
    }
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = `${s.firstName} ${s.lastName} ${s.email}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Design-forward Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full -ml-20 -mb-20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
              <Shield className="w-4 h-4" /> Security-First Orchestration
            </div>
            <h1 className="text-5xl md:text-6xl font-[1000] tracking-tighter leading-none italic uppercase">
              Team{' '}
              <span className="text-blue-500 text-outline-white">Command</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
              Master your workforce with granular role hierarchies, specialized
              permission matrices, and real-time operational auditing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-10 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all gap-2 group"
            >
              <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />{' '}
              Recruit Staff
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl h-16 px-10 border-2 border-slate-700 hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-all gap-2"
            >
              <History className="w-5 h-5" /> Audit Logs
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-slate-100 p-1.5 rounded-3xl h-16 w-full md:w-auto flex justify-start mb-8 gap-1 shadow-sm">
          <TabsTrigger
            value="members"
            className="rounded-2xl px-10 h-13 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all"
          >
            <UserCheck className="w-4 h-4 mr-2" /> Members
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-2xl px-10 h-13 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all"
          >
            <Activity className="w-4 h-4 mr-2" /> Activity Stream
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search by name, email or ID..."
                className="h-16 pl-14 rounded-2xl bg-white border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] font-bold text-slate-700 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px] h-16 rounded-2xl bg-white border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] font-black text-xs uppercase tracking-widest px-6">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                <SelectItem
                  value="ALL"
                  className="rounded-xl font-bold py-3 text-xs uppercase"
                >
                  All Roles
                </SelectItem>
                <SelectItem
                  value="SUPER_ADMIN"
                  className="rounded-xl font-bold py-3 text-xs uppercase"
                >
                  Super Admin
                </SelectItem>
                <SelectItem
                  value="ADMIN"
                  className="rounded-xl font-bold py-3 text-xs uppercase"
                >
                  Admin
                </SelectItem>
                <SelectItem
                  value="MANAGER"
                  className="rounded-xl font-bold py-3 text-xs uppercase"
                >
                  Manager
                </SelectItem>
                <SelectItem
                  value="STAFF"
                  className="rounded-xl font-bold py-3 text-xs uppercase"
                >
                  Staff
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Staff Table */}
          <Card className="rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
            <CardContent className="p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100/50">
                  <tr className="text-[11px] font-[900] uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-8 py-6">Member Identity</th>
                    <th className="px-8 py-6">Operational Role</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStaff.map((member) => (
                    <tr
                      key={member.id}
                      className="group hover:bg-slate-50/50 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-xl">
                              <AvatarImage src={member.avatar || ''} />
                              <AvatarFallback className="bg-blue-600 text-white font-black rounded-2xl">
                                {member.firstName[0]}
                                {member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            {member.isOnline && (
                              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-lg animate-pulse" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-[900] text-slate-900 leading-tight">
                              {member.firstName} {member.lastName}
                            </span>
                            <span className="text-xs font-bold text-slate-400 italic">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge
                          className={`rounded-lg font-[900] text-[10px] uppercase tracking-widest px-3 py-1 border-none ${
                            member.role === 'SUPER_ADMIN'
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                              : member.role === 'ADMIN'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                : member.role === 'MANAGER'
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                                  : 'bg-slate-900 text-white'
                          }`}
                        >
                          {member.role.replace('_', ' ')}
                        </Badge>
                        {member.customRole && (
                          <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 w-fit">
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] font-black uppercase text-slate-600">
                              {member.customRole.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              member.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : member.status === 'PENDING'
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-xs font-black uppercase tracking-tight text-slate-600">
                            {member.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <Button
                            onClick={() => {
                              setSelectedStaff(member);
                              setSelectedPermissions(member.permissions || []);
                              setIsPermModalOpen(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-xl hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100 transition-all"
                          >
                            <Lock className="w-5 h-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-xl hover:bg-slate-100 border"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]"
                            >
                              <DropdownMenuItem className="rounded-xl font-bold py-3 text-xs uppercase tracking-tight">
                                <Edit2 className="w-4 h-4 mr-3 text-blue-500" />{' '}
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl font-bold py-3 text-xs uppercase tracking-tight">
                                <RefreshCw className="w-4 h-4 mr-3 text-amber-500" />{' '}
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-xl font-bold py-3 text-xs uppercase tracking-tight text-rose-500 focus:bg-rose-50 focus:text-rose-600">
                                <Trash2 className="w-4 h-4 mr-3" /> Terminate
                                Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black italic uppercase">
                    Operational Narrative
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-400">
                    Comprehensive ledger of staff interactions with systemic
                    assets.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fetchData()}
                  className="ml-auto rounded-xl border-2 font-black text-[10px] uppercase tracking-widest h-12 hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Live Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {activities.length === 0 ? (
                  <div className="py-24 text-center">
                    <History className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No activity logs recorded today.
                    </p>
                  </div>
                ) : (
                  activities.map((log) => (
                    <div
                      key={log.id}
                      className="p-8 hover:bg-slate-50/50 transition-all flex items-start gap-6"
                    >
                      <Avatar className="h-12 w-12 rounded-xl shadow-md border-2 border-white">
                        <AvatarImage src={log.user.avatar || ''} />
                        <AvatarFallback className="bg-slate-900 text-white font-black text-xs uppercase">
                          {log.user.firstName[0]}
                          {log.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-[900] text-slate-900">
                            {log.user.firstName} {log.user.lastName}
                            <span className="text-blue-500 mx-2">↠</span>
                            <Badge
                              variant="outline"
                              className="rounded-lg font-black text-[9px] uppercase tracking-tighter bg-emerald-50 text-emerald-600 border-emerald-100"
                            >
                              {log.action}
                            </Badge>
                          </p>
                          <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 italic">
                          Modified resource:{' '}
                          <span className="text-slate-900 not-italic font-black bg-slate-100 px-2 py-0.5 rounded leading-loose">
                            {log.target}
                          </span>
                        </p>
                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                            <Globe className="w-3 h-3" />{' '}
                            {log.ipAddress || 'Internal Trace'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invitation Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-[1000] tracking-tight italic uppercase italic">
              Recruit New Talent
            </DialogTitle>
            <DialogDescription className="text-lg font-medium text-slate-400 leading-relaxed">
              Send an encrypted setup link to authorize a new staff member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 pl-1">
                  First Name
                </Label>
                <Input
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 pl-1">
                  Last Name
                </Label>
                <Input
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 pl-1">
                Official Workspace Email
              </Label>
              <Input
                type="email"
                className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-blue-500/20 font-bold"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 pl-1">
                Operational Role assignment
              </Label>
              <Select
                value={inviteForm.role}
                onValueChange={(val) =>
                  setInviteForm({ ...inviteForm, role: val })
                }
              >
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-black text-xs uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem
                    value="STAFF"
                    className="rounded-xl font-bold py-3 text-xs uppercase"
                  >
                    Field Staff
                  </SelectItem>
                  <SelectItem
                    value="MANAGER"
                    className="rounded-xl font-bold py-3 text-xs uppercase"
                  >
                    Department Manager
                  </SelectItem>
                  <SelectItem
                    value="ADMIN"
                    className="rounded-xl font-bold py-3 text-xs uppercase"
                  >
                    System Administrator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customRoles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 pl-1">
                  Matrix Role (Custom)
                </Label>
                <Select
                  value={inviteForm.customRoleId}
                  onValueChange={(val) =>
                    setInviteForm({ ...inviteForm, customRoleId: val })
                  }
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-black text-xs uppercase tracking-widest">
                    <SelectValue placeholder="Selective Matrix Alignment" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                    <SelectItem
                      value="NONE"
                      className="rounded-xl font-bold py-3 text-xs uppercase"
                    >
                      No Custom Role
                    </SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.id}
                        className="rounded-xl font-bold py-3 text-xs uppercase italic"
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="mt-10 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-2xl font-black text-xs uppercase tracking-widest px-8"
              >
                Discard
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-16 font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all"
              >
                Dispatch Invitation Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      <Dialog open={isPermModalOpen} onOpenChange={setIsPermModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-10 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-[1000] tracking-tight italic uppercase">
              Access Matrix Control
            </DialogTitle>
            <DialogDescription className="text-lg font-medium text-slate-400">
              Define granular modular access for{' '}
              <span className="text-slate-900 font-black">
                {selectedStaff?.firstName} {selectedStaff?.lastName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
            {['General', 'Inventory', 'Sales', 'CRM', 'Admin', 'Analytics'].map(
              (cat) => (
                <div key={cat} className="space-y-4">
                  <h4 className="text-[10px] font-[900] uppercase tracking-[0.3em] text-blue-600 pl-2 flex items-center gap-4">
                    {cat} <div className="h-px flex-1 bg-blue-100" />
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {AVAILABLE_PERMISSIONS.filter(
                      (p) => p.category === cat,
                    ).map((perm) => (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                          selectedPermissions.includes(perm.id)
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-white border-slate-100 hover:border-blue-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-black uppercase tracking-tight">
                            {perm.label}
                          </p>
                          <p
                            className={`text-[9px] font-bold uppercase transition-colors ${selectedPermissions.includes(perm.id) ? 'text-blue-100' : 'text-slate-300'}`}
                          >
                            System Node: {perm.id}
                          </p>
                        </div>
                        <div
                          className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                            selectedPermissions.includes(perm.id)
                              ? 'bg-white text-blue-600'
                              : 'bg-slate-50 text-slate-200 group-hover:bg-blue-50'
                          }`}
                        >
                          {selectedPermissions.includes(perm.id) ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4 text-slate-200" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <DialogFooter className="mt-10 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPermModalOpen(false)}
              className="rounded-2xl font-black text-xs uppercase tracking-widest px-8"
            >
              Discard
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-12 h-16 font-black text-xs uppercase tracking-widest shadow-xl transition-all"
            >
              Synchronize Matrix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Additional Components
import { Globe } from 'lucide-react';
