"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Create discount codes for your customers.</p>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Coupons", value: summary.total, icon: Tag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: summary.totalActive, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Expired", value: summary.totalExpired, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Total Uses", value: coupons.reduce((a, c) => a + c.usageCount, 0), icon: Zap, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{loading ? "—" : kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code or name…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Uses</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-10">
                <Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" />
              </TableCell></TableRow>
            ) : coupons.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-14 text-slate-400">
                <Tag className="h-10 w-10 mx-auto text-slate-200 mb-3" />
                No coupons found. Create your first one!
              </TableCell></TableRow>
            ) : coupons.map((c) => (
              <TableRow key={c.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <button
                    onClick={() => copyCode(c.code)}
                    className="flex items-center gap-1.5 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    {c.code} <Copy className="h-3 w-3" />
                  </button>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  {c.description && <p className="text-xs text-slate-400 line-clamp-1">{c.description}</p>}
                </TableCell>
                <TableCell><TypeBadge type={c.type} /></TableCell>
                <TableCell className="font-medium">
                  {c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FLAT" ? `৳${c.value}` : "Free"}
                  {c.maxDiscountCap && <span className="text-xs text-slate-400 ml-1">(max ৳{c.maxDiscountCap})</span>}
                </TableCell>
                <TableCell><StatusBadge coupon={c} /></TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{c._count.usages}</span>
                  {c.usageLimit && <span className="text-slate-400 text-xs">/{c.usageLimit}</span>}
                </TableCell>
                <TableCell className="text-sm text-slate-500">
                  {c.endDate ? format(new Date(c.endDate), "dd MMM, hh:mm a") : <span className="text-slate-300">No expiry</span>}
                </TableCell>
                <TableCell>
                  <Switch checked={c.isActive} onCheckedChange={() => handleToggle(c.id)} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCoupon ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Code + Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER20" className="font-mono" />
                  <Button type="button" variant="outline" size="icon" onClick={generateCode} title="Generate random code">
                    {generatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer Sale 20%" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional internal description" />
            </div>

            {/* Type + Value */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Discount Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as DiscountType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.type !== "FREE_SHIPPING" && (
                <div className="space-y-1">
                  <Label>{form.type === "PERCENTAGE" ? "Percentage" : "Amount (৳)"} *</Label>
                  <Input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" />
                </div>
              )}
              {form.type === "PERCENTAGE" && (
                <div className="space-y-1">
                  <Label>Max Discount Cap (৳)</Label>
                  <Input type="number" min="0" value={form.maxDiscountCap} onChange={(e) => setForm({ ...form, maxDiscountCap: e.target.value })} placeholder="No cap" />
                </div>
              )}
            </div>

            {/* Applicable On */}
            <div className="space-y-1">
              <Label>Applicable On</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["CART", "PRODUCT", "CATEGORY"] as ApplicableOn[]).map((a) => (
                  <button key={a} onClick={() => setForm({ ...form, applicableOn: a })}
                    className={`border-2 rounded-lg py-2 px-3 text-sm font-medium transition-all ${form.applicableOn === a ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    {a === "CART" ? "🛒 Entire Cart" : a === "PRODUCT" ? "📦 Products" : "📁 Categories"}
                  </button>
                ))}
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Min. Order Value (৳)</Label>
                <Input type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="None" />
              </div>
              <div className="space-y-1">
                <Label>Total Usage Limit</Label>
                <Input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
              </div>
              <div className="space-y-1">
                <Label>Per-Customer Limit</Label>
                <Input type="number" min="1" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} placeholder="Unlimited" />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date & Time</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                <p className="text-[10px] text-slate-400">Scheduled coupons start automatically at this time.</p>
              </div>
              <div className="space-y-1">
                <Label>Expiry Date & Time</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} min={form.startDate} />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6 bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Switch id="newUser" checked={form.newUsersOnly} onCheckedChange={(v) => setForm({ ...form, newUsersOnly: v })} />
                <Label htmlFor="newUser" className="text-sm cursor-pointer font-medium uppercase text-slate-600">New customers only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                <Label htmlFor="active" className="text-sm cursor-pointer font-medium uppercase text-blue-600">Active</Label>
              </div>
            </div>

            {form.newUsersOnly && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                This coupon will only work for customers with no previous orders.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
