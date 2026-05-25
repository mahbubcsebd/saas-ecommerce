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
  Globe,
  LockKeyhole,
  Check,
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
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

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
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
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
        setInviteForm({
          email: '',
          firstName: '',
          lastName: '',
          role: 'STAFF',
          customRoleId: 'NONE',
          isActive: true,
        });
        fetchData();
      } else {
        toast.error(data.message || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedStaff) return;
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
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
        toast.success('Permissions updated successfully');
        setIsPermModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to update permissions');
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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto p-6 max-w-7xl animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Staff Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage staff accounts, roles, access permissions, and audit systemic activities.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Add Staff Member
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
          <TabsTrigger value="members" className="font-semibold text-sm px-6">
            <UserCheck className="w-4 h-4 mr-2" /> Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="font-semibold text-sm px-6">
            <Activity className="w-4 h-4 mr-2" /> Activity Stream
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <Input
                placeholder="Search staff by name or email..."
                className="pl-10 h-10 w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 px-3">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="border-slate-250 dark:border-slate-800">
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Staff List Card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="px-6 py-4">Staff Member</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                          No staff members found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((member) => (
                        <tr
                          key={member.id}
                          className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="h-10 w-10 border border-slate-100 dark:border-slate-800">
                                  <AvatarImage src={member.avatar || ''} />
                                  <AvatarFallback className="bg-indigo-600 text-white font-semibold">
                                    {member.firstName[0]}
                                    {member.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {member.isOnline && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-md" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {member.firstName} {member.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {member.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={member.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}
                                className="font-medium text-[10px] w-fit"
                              >
                                {member.role.replace('_', ' ')}
                              </Badge>
                              {member.customRole && (
                                <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                  <Shield className="w-3 h-3" />
                                  <span>{member.customRole.name}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
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
                              <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                                {member.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => {
                                  setSelectedStaff(member);
                                  setSelectedPermissions(member.permissions || []);
                                  setIsPermModalOpen(true);
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md hover:bg-indigo-50 dark:hover:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-transparent hover:border-indigo-150"
                                title="Edit Permissions"
                              >
                                <Lock className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="rounded-lg border-slate-200 dark:border-slate-850 shadow-lg min-w-[160px]"
                                >
                                  <DropdownMenuItem className="font-medium text-xs py-2 cursor-pointer">
                                    <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                    Edit Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="font-medium text-xs py-2 cursor-pointer">
                                    <RefreshCw className="w-3.5 h-3.5 mr-2 text-slate-500" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="font-medium text-xs py-2 cursor-pointer text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-700">
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Remove Staff
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        <TabsContent value="activity" className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/10 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Operational Audit Logs
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Audit ledger records of recent administrative activities on systemic resources.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="font-medium hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {activities.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 italic">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No operational activities recorded.</p>
                  </div>
                ) : (
                  activities.map((log) => (
                    <div
                      key={log.id}
                      className="p-6 hover:bg-slate-50/30 dark:hover:bg-slate-900/5 transition-colors flex items-start gap-4"
                    >
                      <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                        <AvatarImage src={log.user.avatar || ''} />
                        <AvatarFallback className="bg-slate-800 text-white font-semibold text-xs">
                          {log.user.firstName[0]}
                          {log.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {log.user.firstName} {log.user.lastName}
                            <span className="text-indigo-500 dark:text-indigo-400 mx-2">→</span>
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40 text-[9px] font-medium"
                            >
                              {log.action}
                            </Badge>
                          </p>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          Resource Target:{' '}
                          <span className="font-mono text-slate-900 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40">
                            {log.target}
                          </span>
                        </p>
                        <div className="flex items-center gap-3 text-[9px] text-slate-400 uppercase tracking-wider font-semibold pt-0.5">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {log.ipAddress || 'Internal Call'}
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

      {/* Invite Staff Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-950 p-6">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <UserPlus className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400" /> Recruit Team Member
            </DialogTitle>
            <DialogDescription className="text-sm">
              Authorize a new staff member to join your system workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  First Name
                </Label>
                <Input
                  className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white text-sm"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, firstName: e.target.value })
                  }
                  placeholder="e.g. John"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Last Name
                </Label>
                <Input
                  className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white text-sm"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, lastName: e.target.value })
                  }
                  placeholder="e.g. Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Official Workspace Email
              </Label>
              <Input
                type="email"
                className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white text-sm"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                placeholder="john.doe@company.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                System Role Assignment
              </Label>
              <Select
                value={inviteForm.role}
                onValueChange={(val) =>
                  setInviteForm({ ...inviteForm, role: val })
                }
              >
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-250 dark:border-slate-800">
                  <SelectItem value="STAFF">Field Staff</SelectItem>
                  <SelectItem value="MANAGER">Department Manager</SelectItem>
                  <SelectItem value="ADMIN">System Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customRoles.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Matrix Role (Custom Roles)
                </Label>
                <Select
                  value={inviteForm.customRoleId}
                  onValueChange={(val) =>
                    setInviteForm({ ...inviteForm, customRoleId: val })
                  }
                >
                  <SelectTrigger className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-3 text-sm">
                    <SelectValue placeholder="No Custom Role Assigned" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-250 dark:border-slate-800">
                    <SelectItem value="NONE">No Custom Role</SelectItem>
                    {customRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-6 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="font-medium h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9"
              >
                Send Invite Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      <Dialog open={isPermModalOpen} onOpenChange={setIsPermModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-950 p-6 flex flex-col max-h-[90vh]">
          <DialogHeader className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-900">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <LockKeyhole className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400" /> Access Permission Matrix
            </DialogTitle>
            <DialogDescription className="text-sm">
              Define granular permissions for{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedStaff?.firstName} {selectedStaff?.lastName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 scrollbar-thin">
            {['General', 'Inventory', 'Sales', 'CRM', 'Admin', 'Analytics'].map((cat) => (
              <div key={cat} className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
                  {cat} <div className="h-px flex-1 bg-slate-100 dark:bg-slate-900" />
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.filter((p) => p.category === cat).map((perm) => (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        selectedPermissions.includes(perm.id)
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-500/40 text-indigo-950 dark:text-indigo-300'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{perm.label}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                          Node: {perm.id}
                        </p>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          selectedPermissions.includes(perm.id)
                            ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-900 mt-4 gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsPermModalOpen(false)}
              className="font-medium h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9"
            >
              Update Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
