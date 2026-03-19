'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirm } from '@/hooks/use-confirm';
import {
  Activity,
  CheckCircle2,
  Database,
  Edit2,
  Layers,
  Loader2,
  MessageSquare,
  Package,
  PieChart,
  Plus,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  _count?: {
    users: number;
  };
  createdAt: string;
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: PieChart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'staff', label: 'Staff Management', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'chat', label: 'Messenger', icon: MessageSquare },
];

const ACTIONS = [
  { id: 'read', label: 'View', icon: Eye },
  { id: 'write', label: 'Edit', icon: Edit2 },
  { id: 'delete', label: 'Delete', icon: Trash2 },
  { id: 'all', label: 'Manage All', icon: ShieldCheck },
];

function Eye(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function RolesClient() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/roles`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.success) setRoles(data.data);
    } catch (error) {
      toast.error('Failed to sync roles data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchData();
  }, [session?.accessToken]);

  const handleSave = async () => {
    if (!formData.name) return toast.error('Role name is required');

    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const method = selectedRole ? 'PATCH' : 'POST';
      const url = selectedRole
        ? `${BACKEND_URL}/roles/${selectedRole.id}`
        : `${BACKEND_URL}/roles`;

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(selectedRole ? 'Role updated' : 'Role created');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: 'Delete Role',
        message:
          'Are you sure you want to delete this role archetype? This will remove permissions for all assigned personnel.',
        type: 'danger',
        confirmText: 'Delete Role',
      }))
    )
      return;
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(`${BACKEND_URL}/roles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Role deleted');
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Deletion failed');
    }
  };

  const togglePermission = (moduleId: string, actionId: string) => {
    const perm = `${moduleId}.${actionId}`;
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const openEditModal = (role: CustomRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      {/* Design-forward Hero Section */}
      <div className="relative overflow-hidden bg-white/50 backdrop-blur-xl rounded-[3rem] p-12 border border-white shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full -ml-20 -mb-20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Granular Access
              Control
            </div>
            <h1 className="text-6xl md:text-7xl font-[1000] tracking-tighter leading-none italic uppercase text-slate-900">
              Access <span className="text-blue-600">Matrices</span>
            </h1>
            <p className="text-slate-500 font-bold max-w-2xl text-xl leading-relaxed">
              Architect custom operational roles by bridging specific
              organizational modules with precise capability strings.
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-3xl h-20 px-12 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 group shrink-0"
          >
            <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform duration-500" />{' '}
            Architect New Role
          </Button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="group rounded-[2.5rem] border-none shadow-[0_16px_48px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] bg-white transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col"
          >
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="p-10 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <Button
                    onClick={() => openEditModal(role)}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-blue-50 text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(role.id)}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-rose-50 text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-2xl font-black uppercase text-slate-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                {role.name}
              </CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400 italic">
                {role.description ||
                  'No specialized narrative provided for this role.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 mt-auto">
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">
                    Assigned Personnel
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {role._count?.users || 0} Members
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">
                    Capacities
                  </span>
                  <span className="text-lg font-black text-blue-600">
                    {role.permissions.length} nodes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Architecture / Matrix Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl rounded-[3rem] p-0 border-none shadow-[0_64px_128px_-32px_rgba(0,0,0,0.25)] overflow-hidden bg-slate-50">
          <div className="flex h-[85vh]">
            {/* Sidebar: General Narrative */}
            <div className="w-[350px] bg-white p-12 flex flex-col gap-10 border-r border-slate-100 shadow-xl">
              <div className="space-y-4">
                <Label className="text-[11px] font-[900] uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                  <Database className="w-4 h-4" /> Role Architecture
                </Label>
                <Input
                  placeholder="Enter Role Identity..."
                  className="h-16 px-6 rounded-2xl bg-slate-50 border-none font-black text-lg placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-4 flex-1">
                <Label className="text-[11px] font-[900] uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Narrative
                </Label>
                <textarea
                  placeholder="Define purpose and organizational scope..."
                  className="w-full h-40 p-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-600 placeholder:text-slate-300 resize-none focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Status Quo
                  </span>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black rounded-lg">
                    Operational
                  </Badge>
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full h-20 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all gap-3"
                >
                  <Save className="w-5 h-5" /> Execute Update
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
                >
                  Discard Changes
                </Button>
              </div>
            </div>

            {/* Main Content: The Matrix */}
            <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
              <div className="mb-12">
                <h3 className="text-4xl font-[1000] italic uppercase tracking-tighter text-slate-900 mb-2">
                  Capability Matrix
                </h3>
                <p className="text-slate-400 font-bold italic">
                  Assign specialized modular capacities to this role archetype.
                </p>
              </div>

              <div className="grid gap-12">
                {MODULES.map((module) => (
                  <div key={module.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <module.icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-[1000] uppercase tracking-[0.2em] text-slate-900">
                        {module.label}
                      </h4>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ACTIONS.map((action) => {
                        const perm = `${module.id}.${action.id}`;
                        const isSelected = formData.permissions.includes(perm);
                        return (
                          <div
                            key={action.id}
                            onClick={() =>
                              togglePermission(module.id, action.id)
                            }
                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col gap-4 group ${
                              isSelected
                                ? 'bg-white border-blue-600 shadow-2xl shadow-blue-100'
                                : 'bg-white border-white hover:border-blue-100'
                            }`}
                          >
                            <div
                              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-50 text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600'
                              }`}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <action.icon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p
                                className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}
                              >
                                {action.label}
                              </p>
                              <p className="text-[9px] font-bold text-slate-300 uppercase italic">
                                {perm}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
