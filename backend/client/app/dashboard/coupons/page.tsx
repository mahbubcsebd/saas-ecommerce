"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
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
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/hooks/use-confirm";
import { format, isBefore } from "date-fns";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Copy,
    Edit2,
    Loader2,
    Percent,
    Plus,
    RefreshCw,
    Search,
    Tag,
    Trash2,
    Truck,
    Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Types ─────────────────────────────────────────────────────────────────
type DiscountType = "PERCENTAGE" | "FLAT" | "FREE_SHIPPING";
type ApplicableOn = "CART" | "PRODUCT" | "CATEGORY";

type Coupon = {
  id: string; code: string; name: string; description?: string;
  type: DiscountType; value: number; maxDiscountCap?: number;
  applicableOn: ApplicableOn; categoryIds: string[]; excludedProducts: string[];
  minOrderValue?: number; usageLimit?: number; perUserLimit?: number; usageCount: number;
  newUsersOnly: boolean; allowedUserIds: string[]; allowedCountries: string[];
  startDate: string; endDate?: string; isActive: boolean;
  _count: { usages: number };
  createdAt: string;
};

// Helper for datetime-local input (YYYY-MM-DDTHH:mm)
const toInputFormat = (dateStr: string | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_FORM = {
  code: "", name: "", description: "",
  type: "PERCENTAGE" as DiscountType,
  value: "", maxDiscountCap: "",
  applicableOn: "CART" as ApplicableOn,
  minOrderValue: "", usageLimit: "", perUserLimit: "",
  newUsersOnly: false,
  startDate: toInputFormat(new Date().toISOString()),
  endDate: "",
  isActive: true,
};

// ─── Type badge ──────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: DiscountType }) {
  const cfg = {
    PERCENTAGE:    { label: "% Off",      icon: Percent, color: "bg-blue-100 text-blue-700" },
    FLAT:          { label: "Flat Off",   icon: Tag,     color: "bg-purple-100 text-purple-700" },
    FREE_SHIPPING: { label: "Free Ship",  icon: Truck,   color: "bg-green-100 text-green-700" },
  }[type];
  const Ic = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Ic className="h-3 w-3" />{cfg.label}
    </span>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ coupon }: { coupon: Coupon }) {
  const now = new Date();
  const expired = coupon.endDate && isBefore(new Date(coupon.endDate), now);
  const exhausted = coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;
  const scheduled = isBefore(now, new Date(coupon.startDate));

  if (!coupon.isActive) return <Badge variant="secondary">Inactive</Badge>;
  if (expired) return <Badge variant="destructive">Expired</Badge>;
  if (scheduled) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</Badge>;
  if (exhausted) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Limit Reached</Badge>;

  return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CouponsPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [summary, setSummary] = useState({ total: 0, totalActive: 0, totalExpired: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  const fetch$ = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/coupons?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setCoupons(data.data); setSummary(data.summary); }
    } catch { toast.error("Failed to load coupons"); }
    finally { setLoading(false); }
  }, [token, search, statusFilter]);

  useEffect(() => { fetch$(); }, [fetch$]);

  // ─── Code Generator ────────────────────────────────────────────────────────
  const generateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch(`${API_BASE}/coupons/generate-code`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setForm((f) => ({ ...f, code: data.code }));
    } catch {}
    finally { setGeneratingCode(false); }
  };

  // ─── Open dialog ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditCoupon(null);
    setForm({ ...EMPTY_FORM, startDate: toInputFormat(new Date().toISOString()) });
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({
      code: c.code, name: c.name, description: c.description || "",
      type: c.type, value: String(c.value), maxDiscountCap: c.maxDiscountCap ? String(c.maxDiscountCap) : "",
      applicableOn: c.applicableOn,
      minOrderValue: c.minOrderValue ? String(c.minOrderValue) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      perUserLimit: c.perUserLimit ? String(c.perUserLimit) : "",
      newUsersOnly: c.newUsersOnly,
      startDate: toInputFormat(c.startDate),
      endDate: toInputFormat(c.endDate),
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name) return toast.error("Name is required");
    if (!form.code) return toast.error("Code is required");
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: parseFloat(form.value) || 0,
        maxDiscountCap: form.maxDiscountCap ? parseFloat(form.maxDiscountCap) : undefined,
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };
      const url = editCoupon ? `${API_BASE}/coupons/${editCoupon.id}` : `${API_BASE}/coupons`;
      const method = editCoupon ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { toast.success(editCoupon ? "Coupon updated!" : "Coupon created!"); setDialogOpen(false); fetch$(); }
      else toast.error(data.message || "Failed");
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  };

  // ─── Toggle ────────────────────────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}/toggle`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { toast.success("Status updated"); fetch$(); }
      else toast.error(data.message);
    } catch { toast.error("Network error"); }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Coupon",
        message: "Are you sure you want to delete this coupon? Existing orders using this coupon won't be affected, but no new orders can use it.",
        type: "danger",
        confirmText: "Delete Coupon"
    })) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { toast.success("Coupon deleted"); fetch$(); }
      else toast.error(data.message);
    } catch { toast.error("Network error"); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success(`Copied: ${code}`); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground mt-1">Manage discount codes and promotional offers.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Coupon
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : summary.total}</div>
            <p className="text-xs text-muted-foreground">Lifetime promotions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : summary.totalActive}</div>
            <p className="text-xs text-muted-foreground">Currently valid codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : summary.totalExpired}</div>
            <p className="text-xs text-muted-foreground">Past validity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : coupons.reduce((a, c) => a + c.usageCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Total successful redemptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder="Search codes..." 
                        className="pl-9 h-9" 
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px] h-9">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">Code</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Discount</TableHead>
                            <TableHead className="font-semibold text-center">Status</TableHead>
                            <TableHead className="font-semibold text-right">Uses</TableHead>
                            <TableHead className="font-semibold">Expiry</TableHead>
                            <TableHead className="font-semibold">Active</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={9} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                        ) : coupons.length === 0 ? (
                            <TableRow><TableCell colSpan={9} className="text-center py-16 text-muted-foreground">No coupons found.</TableCell></TableRow>
                        ) : coupons.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <button
                                        onClick={() => copyCode(c.code)}
                                        className="inline-flex items-center gap-1.5 font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs hover:bg-blue-100 transition-colors"
                                    >
                                        {c.code} <Copy className="h-3 w-3" />
                                    </button>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{c.name}</span>
                                        {c.description && <span className="text-[10px] text-muted-foreground line-clamp-1">{c.description}</span>}
                                    </div>
                                </TableCell>
                                <TableCell><TypeBadge type={c.type} /></TableCell>
                                <TableCell className="font-medium text-sm">
                                    {c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FLAT" ? `৳${c.value}` : "Free"}
                                    {c.maxDiscountCap && <span className="text-[10px] text-muted-foreground ml-1">(max ৳{c.maxDiscountCap})</span>}
                                </TableCell>
                                <TableCell className="text-center"><StatusBadge coupon={c} /></TableCell>
                                <TableCell className="text-right">
                                    <span className="font-medium text-sm">{c._count.usages}</span>
                                    {c.usageLimit && <span className="text-muted-foreground text-[10px]">/{c.usageLimit}</span>}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {c.endDate ? format(new Date(c.endDate), "dd MMM, yy") : "No expiry"}
                                </TableCell>
                                <TableCell>
                                    <Switch checked={c.isActive} onCheckedChange={() => handleToggle(c.id)} className="scale-75 origin-left" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(c.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editCoupon ? "Edit Coupon" : "New Coupon"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <div className="flex gap-2">
                  <Input 
                    value={form.code} 
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20" 
                    className="font-mono h-9" 
                  />
                  <Button type="button" variant="outline" size="icon" onClick={generateCode} className="h-9 w-9">
                    {generatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E.g. Ramadan Special" className="h-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description of this offer" className="resize-none" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DiscountType })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type !== "FREE_SHIPPING" && (
                <div className="space-y-2">
                  <Label>{form.type === "PERCENTAGE" ? "Value (%)" : "Amount (৳)"}</Label>
                  <Input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="h-9" />
                </div>
              )}
              {form.type === "PERCENTAGE" && (
                <div className="space-y-2">
                  <Label>Max Discount (৳)</Label>
                  <Input type="number" min="0" value={form.maxDiscountCap} onChange={(e) => setForm({ ...form, maxDiscountCap: e.target.value })} className="h-9" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min. Purchase (৳)</Label>
                <Input type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label>Total Limit</Label>
                <Input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label>Per User Limit</Label>
                <Input type="number" min="1" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} min={form.startDate} className="h-9" />
              </div>
            </div>

            <div className="flex items-center gap-6 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Switch id="newUser" checked={form.newUsersOnly} onCheckedChange={(v) => setForm({ ...form, newUsersOnly: v })} className="scale-75" />
                <Label htmlFor="newUser" className="text-xs font-medium cursor-pointer">NEW USERS ONLY</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} className="scale-75" />
                <Label htmlFor="active" className="text-xs font-medium cursor-pointer">ACTIVE</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-9">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="h-9">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
