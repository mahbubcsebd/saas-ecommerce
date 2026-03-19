"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
    AlertTriangle,
    Edit,
    Loader2,
    Plus,
    Search,
    Trash2,
    UserCheck,
    UserMinus,
    Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type CustomerGroup = {
  id: string;
  name: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  isActive: boolean;
  _count: { users: number };
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// ─────────────────────────────────────────
// Create / Edit Group Dialog
// ─────────────────────────────────────────
function GroupFormDialog({
  open, onOpenChange, editGroup, token, onSuccess,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editGroup: CustomerGroup | null; token: string; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: "", description: "", discountType: "PERCENTAGE", discountValue: "", isActive: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editGroup) {
      setForm({
        name: editGroup.name, description: editGroup.description || "",
        discountType: editGroup.discountType || "PERCENTAGE",
        discountValue: editGroup.discountValue ? String(editGroup.discountValue) : "", isActive: editGroup.isActive,
      });
    } else {
      setForm({ name: "", description: "", discountType: "PERCENTAGE", discountValue: "", isActive: true });
    }
  }, [editGroup, open]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Group name is required"); return; }
    setSaving(true);
    try {
      const url = editGroup ? `${API_BASE}/customer-groups/${editGroup.id}` : `${API_BASE}/customer-groups`;
      const method = editGroup ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { toast.success(editGroup ? "Group updated!" : "Group created!"); onSuccess(); onOpenChange(false); }
      else { toast.error(data.message || "Failed to save group"); }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  const discountSymbol = form.discountType === "FLAT" ? "BDT" : "%";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editGroup ? "Edit Group" : "Create Customer Group"}</DialogTitle>
          <DialogDescription>{editGroup ? "Update the details." : "Create a new pricing group."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1">
            <Label>Group Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. VIP, Wholesale, Retail" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Discount Type</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FLAT">Flat Amount (BDT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Discount Value ({discountSymbol})</Label>
              <Input type="number" min={0} step={0.5} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder="0" />
            </div>
          </div>
          {form.discountType === "PERCENTAGE" && (
            <p className="text-xs text-muted-foreground -mt-2">Members of this group get {form.discountValue || 0}% off automatically.</p>
          )}
          {form.discountType === "FLAT" && (
            <p className="text-xs text-muted-foreground -mt-2">Members get BDT {form.discountValue || 0} off their orders automatically.</p>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-blue-600" />
            <Label htmlFor="isActive" className="cursor-pointer">Active Group</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editGroup ? "Save Changes" : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Assign Customers Dialog (Combobox-style)
// ─────────────────────────────────────────
function AssignCustomersDialog({
  open, onOpenChange, group, token, onSuccess,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  group: CustomerGroup | null; token: string; onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!token || !open) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100", role: "CUSTOMER" });
      if (search) params.append("search", search);
      const res = await fetch(`${API_BASE}/user?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      } else {
        toast.error("Failed to load customers");
      }
    } catch { toast.error("Network error loading customers"); }
    finally { setLoading(false); }
  }, [token, search, open]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => { if (open) setSelected([]); }, [open]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleAssign = async () => {
    if (!group || selected.length === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API_BASE}/customer-groups/${group.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userIds: selected }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); onSuccess(); onOpenChange(false); }
      else { toast.error(data.message || "Assignment failed"); }
    } catch { toast.error("Network error"); }
    finally { setAssigning(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Assign Customers to "{group?.name}"</DialogTitle>
          <DialogDescription>Select customers to add. They'll get the group's discount automatically.</DialogDescription>
        </DialogHeader>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-9" />
        </div>
        <div className="mt-2 border rounded-lg overflow-auto max-h-[320px] divide-y">
          {loading ? (
            <div className="py-8 flex justify-center items-center gap-2 text-slate-500">
              <Loader2 className="animate-spin h-5 w-5 text-blue-600" /> Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No customers found matching your search.</div>
          ) : (
            customers.map((c) => {
              const isSelected = selected.includes(c.id);
              const alreadyInGroup = c.groupId === group?.id;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors select-none ${alreadyInGroup ? "opacity-50 cursor-not-allowed bg-slate-50" : isSelected ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  onClick={() => !alreadyInGroup && toggleSelect(c.id)}
                >
                  <input type="checkbox" checked={isSelected || alreadyInGroup} readOnly disabled={alreadyInGroup} className="accent-blue-600 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase flex-shrink-0">
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">
                      {c.firstName} {c.lastName}
                      {alreadyInGroup && <span className="ml-1 text-xs text-blue-500">(in group)</span>}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{c.email}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {selected.length > 0 && <p className="text-sm text-blue-700 font-medium">{selected.length} customer(s) selected</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assigning}>Cancel</Button>
          <Button onClick={handleAssign} disabled={assigning || selected.length === 0}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <UserCheck className="mr-2 h-4 w-4" />
            Assign {selected.length > 0 ? `${selected.length} ` : ""}Customer{selected.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Members Dialog
// ─────────────────────────────────────────
function GroupMembersDialog({
  open, onOpenChange, group, token, onSuccess,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  group: CustomerGroup | null; token: string; onSuccess: () => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!open || !group) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customer-groups/${group.id}?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMembers(data.data.users || []);
    } catch { toast.error("Failed to load members"); }
    finally { setLoading(false); }
  }, [open, group, token]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleRemove = async (userId: string) => {
    if (!group) return;
    setRemoving(userId);
    try {
      const res = await fetch(`${API_BASE}/customer-groups/${group.id}/members/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success("User removed"); setMembers((p) => p.filter((m) => m.id !== userId)); onSuccess(); }
      else { toast.error(data.message); }
    } catch { toast.error("Network error"); }
    finally { setRemoving(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Members of "{group?.name}"</DialogTitle>
          <DialogDescription>{group?._count?.users || 0} customer(s) in this group.</DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg overflow-auto max-h-[380px] divide-y mt-2">
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
          ) : members.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No members yet. Use "Assign" to add customers.</div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm uppercase flex-shrink-0">
                  {m.firstName?.[0]}{m.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900">{m.firstName} {m.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{m.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 flex-shrink-0"
                  onClick={() => handleRemove(m.id)} disabled={removing === m.id}>
                  {removing === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                </Button>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Delete Confirm Dialog
// ─────────────────────────────────────────
function DeleteConfirmDialog({
  group, token, onClose, onSuccess,
}: {
  group: CustomerGroup | null; token: string; onClose: () => void; onSuccess: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!group) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/customer-groups/${group.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { toast.success("Group deleted"); onSuccess(); onClose(); }
      else { toast.error(data.message || "Failed to delete"); }
    } catch { toast.error("Network error"); }
    finally { setDeleting(false); }
  };

  return (
    <Dialog open={!!group} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Delete "{group?.name}"?
          </DialogTitle>
          <DialogDescription>
            This will remove the group and unassign all {group?._count?.users || 0} member(s). This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function CustomerGroupsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<CustomerGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerGroup | null>(null);
  const [assignGroup, setAssignGroup] = useState<CustomerGroup | null>(null);
  const [membersGroup, setMembersGroup] = useState<CustomerGroup | null>(null);

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customer-groups`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setGroups(data.data);
    } catch { toast.error("Failed to load groups"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const groupColors: Record<string, string> = { VIP: "bg-yellow-500", WHOLESALE: "bg-blue-600", RETAIL: "bg-green-600", DEFAULT: "bg-slate-500" };
  const getColor = (name: string) => groupColors[name.toUpperCase()] || groupColors.DEFAULT;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Groups</h1>
          <p className="text-muted-foreground mt-1">Organize customers into groups and apply automatic discounts.</p>
        </div>
        <Button onClick={() => { setEditGroup(null); setFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> New Group
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-white rounded-xl border h-[220px]" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border">
          <Users className="h-14 w-14 text-slate-300 mb-4" />
          <h3 className="font-medium text-slate-900 text-lg">No groups yet</h3>
          <p className="text-sm mt-1">Create your first group like VIP, Wholesale, or Retail.</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => { setEditGroup(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <div key={g.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className={`h-2 w-full ${getColor(g.name)}`} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{g.name}</h3>
                    {g.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{g.description}</p>}
                  </div>
                  <Badge variant={g.isActive ? "default" : "secondary"} className="flex-shrink-0 mt-0.5">
                    {g.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Members</p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{g._count.users}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Discount</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {g.discountValue}
                      <span className="text-base font-normal ml-0.5">{g.discountType === "FLAT" ? " BDT" : "%"}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-3">
                  {g.discountType === "PERCENTAGE" ? "Percentage off all orders" : "Flat amount off all orders"} · Created {format(new Date(g.createdAt), "dd MMM yyyy")}
                </p>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setMembersGroup(g)}>
                    <Users className="mr-1 h-3.5 w-3.5" /> Members
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => setAssignGroup(g)}>
                    <UserCheck className="mr-1 h-3.5 w-3.5" /> Assign
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:bg-slate-100" onClick={() => { setEditGroup(g); setFormOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(g)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GroupFormDialog open={formOpen} onOpenChange={setFormOpen} editGroup={editGroup} token={token} onSuccess={fetchGroups} />
      <AssignCustomersDialog open={!!assignGroup} onOpenChange={(v) => { if (!v) setAssignGroup(null); }} group={assignGroup} token={token} onSuccess={fetchGroups} />
      <GroupMembersDialog open={!!membersGroup} onOpenChange={(v) => { if (!v) setMembersGroup(null); }} group={membersGroup} token={token} onSuccess={fetchGroups} />
      <DeleteConfirmDialog group={deleteTarget} token={token} onClose={() => setDeleteTarget(null)} onSuccess={fetchGroups} />
    </div>
  );
}
