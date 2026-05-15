"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore } from "date-fns";
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronsUpDown,
    Clock,
    Edit2,
    Loader2,
    Plus,
    Search,
    Tag,
    Trash2,
    Zap
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Types ─────────────────────────────────────────────────────────────────
type FlashSaleProduct = {
  id: string;
  productId: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  salePrice: number;
  stockLimit: number;
  soldCount: number;
  product?: {
    name: string;
    basePrice: number;
    images: string[];
    category?: { name: string };
  };
};

type FlashSale = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: FlashSaleProduct[];
  _count?: { products: number };
};

type ProductSearchItem = {
  id: string;
  name: string;
  basePrice: number;
  sku: string;
};

// Helper for datetime-local input
const toInputFormat = (dateStr: string | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  startDate: toInputFormat(new Date().toISOString()),
  endDate: toInputFormat(new Date(Date.now() + 86400000).toISOString()), // +24h
  isActive: true,
  products: [] as any[],
};

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ sale }: { sale: FlashSale }) {
  const now = new Date();
  const start = new Date(sale.startDate);
  const end = new Date(sale.endDate);

  if (!sale.isActive) return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20">Inactive</Badge>;
  if (isBefore(now, start)) return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 font-bold text-[10px]"><Clock className="h-3 w-3" /> Upcoming</Badge>;
  if (isAfter(now, end)) return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[10px]">Finished</Badge>;
  return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-bold text-[10px]"><Zap className="h-3 w-3 fill-current" /> Live</Badge>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FlashSalesPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Product Selective Search
  const [productQuery, setProductQuery] = useState("");
  const [foundProducts, setFoundProducts] = useState<ProductSearchItem[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/flash-sales`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSales(data.data);
    } catch { toast.error("Failed to load flash sales"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // Product Search for Dialog
  useEffect(() => {
    if (!comboOpen) {
      if (!productQuery) setFoundProducts([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const queryParam = productQuery ? `search=${productQuery}` : '';
        const url = `${API_BASE}/products?${queryParam}&limit=20&status=all`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
          setFoundProducts(data.data);
        } else {
          setFoundProducts([]);
        }
      } catch (err) {
        setFoundProducts([]);
      }
      finally { setSearchingProducts(false); }
    }, productQuery ? 400 : 0);

    return () => clearTimeout(delay);
  }, [productQuery, token, comboOpen]);

  const addProductToSale = (p: ProductSearchItem) => {
    if (form.products.some((fp: any) => fp.productId === p.id)) return toast.error("Product already added");
    setForm({
      ...form,
      products: [
        ...form.products,
        {
          productId: p.id,
          name: p.name,
          basePrice: p.basePrice,
          discountType: "PERCENTAGE",
          discountValue: 10,
          salePrice: p.basePrice * 0.9,
          stockLimit: 0,
        },
      ],
    });
    setProductQuery("");
    setFoundProducts([]);
  };

  const removeProduct = (productId: string) => {
    setForm({ ...form, products: form.products.filter((p: any) => p.productId !== productId) });
  };

  const updateProductLine = (index: number, key: string, val: any) => {
    const updated = [...form.products];
    updated[index][key] = val;

    if (key === "discountValue" || key === "discountType") {
      const p = updated[index];
      const base = p.basePrice;
      const dv = parseFloat(val) || 0;
      if (p.discountType === "PERCENTAGE") {
        updated[index].salePrice = base - (base * (dv / 100));
      } else {
        updated[index].salePrice = base - dv;
      }
    }

    setForm({ ...form, products: updated });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/flash-sales/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const s = data.data;
        setEditId(id);
        setForm({
          name: s.name,
          description: s.description || "",
          startDate: toInputFormat(s.startDate),
          endDate: toInputFormat(s.endDate),
          isActive: s.isActive,
          products: s.products.map((p: any) => ({
            productId: p.productId,
            name: p.product.name,
            basePrice: p.product.basePrice,
            discountType: p.discountType,
            discountValue: p.discountValue,
            salePrice: p.salePrice,
            stockLimit: p.stockLimit,
          })),
        });
        setDialogOpen(true);
      }
    } catch { toast.error("Failed to load details"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) return toast.error("Required fields missing");
    if (form.products.length === 0) return toast.error("Add at least one product");

    setSaving(true);
    try {
      const url = editId ? `${API_BASE}/flash-sales/${editId}` : `${API_BASE}/flash-sales`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editId ? "Sale updated" : "Flash sale created");
        setDialogOpen(false);
        fetchSales();
      } else toast.error(data.message);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/flash-sales/${id}/toggle`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { toast.success("Status toggled"); fetchSales(); }
    } catch { toast.error("Failed to toggle"); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Flash Sale",
        message: "Are you sure you want to delete this flash sale campaign? This will immediately restore original prices for all included products.",
        type: "danger",
        confirmText: "Delete Campaign"
    })) return;
    try {
      const res = await fetch(`${API_BASE}/flash-sales/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { toast.success("Deleted"); fetchSales(); }
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Flash Sales</h2>
          <p className="text-muted-foreground mt-1">Manage time-limited sales and promotional countdowns.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Flash Sale
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sales</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {loading ? "—" : sales.filter(s => s.isActive && isBefore(new Date(s.startDate), new Date()) && isAfter(new Date(s.endDate), new Date())).length}
            </div>
            <p className="text-xs text-muted-foreground text-emerald-600 font-medium">Currently live now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {loading ? "—" : sales.filter(s => s.isActive && isAfter(new Date(s.startDate), new Date())).length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled for future</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {loading ? "—" : sales.reduce((a, s) => a + (s._count?.products || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Sale Name</TableHead>
                  <TableHead className="font-semibold">Duration</TableHead>
                  <TableHead className="font-semibold text-center">Products</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold">Active</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && sales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                ) : sales.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground">No flash sales found.</TableCell></TableRow>
                ) : sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span className="text-slate-900 font-medium">{format(new Date(s.startDate), "dd MMM, hh:mm a")}</span>
                        <span className="opacity-50">to {format(new Date(s.endDate), "dd MMM, hh:mm a")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="font-normal">{s._count?.products || 0} items</Badge></TableCell>
                    <TableCell className="text-center"><StatusBadge sale={s} /></TableCell>
                    <TableCell><Switch checked={s.isActive} onCheckedChange={() => handleToggle(s.id)} className="scale-75 origin-left" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s.id)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col h-[90vh]">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{editId ? "Edit Flash Sale" : "New Flash Sale"}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Configure campaign details and product discounts.</p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full">
                <Zap className="h-3 w-3 fill-current" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Campaign</span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sale Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ramadan Special"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Campaign internal description..."
                    className="resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold">Active Status</p>
                    <p className="text-[10px] text-muted-foreground">Enable campaign immediately</p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Selected Products
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Add products to this campaign.</p>
                </div>

                <div className="flex items-center gap-3">
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-[280px] justify-between h-9">
                        <span className="truncate">{productQuery || "Search products..."}</span>
                        <Search className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[400px]" align="end">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search name or SKU..."
                          value={productQuery}
                          onValueChange={setProductQuery}
                          className="h-10"
                        />
                        <CommandList>
                          {searchingProducts ? (
                            <div className="p-4 text-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" /> Searching...</div>
                          ) : foundProducts.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">No products found.</div>
                          ) : (
                            <CommandGroup>
                              {foundProducts.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  onSelect={() => { addProductToSale(p); setComboOpen(false); }}
                                  className="flex items-center justify-between p-2 cursor-pointer"
                                >
                                  <div>
                                    <p className="font-bold text-xs">{p.name}</p>
                                    <p className="text-[10px] text-muted-foreground">SKU: {p.sku} • ৳{p.basePrice}</p>
                                  </div>
                                  <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2">Add</Button>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{form.products.length} Items</span>
                </div>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] h-8 font-bold">Product</TableHead>
                      <TableHead className="text-[10px] h-8 font-bold text-center">Base Price</TableHead>
                      <TableHead className="text-[10px] h-8 font-bold text-center">Discount</TableHead>
                      <TableHead className="text-[10px] h-8 font-bold text-center">Sale Price</TableHead>
                      <TableHead className="text-[10px] h-8 font-bold text-center">Limit</TableHead>
                      <TableHead className="h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.products.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No products added.</TableCell></TableRow>
                    ) : form.products.map((p, idx) => (
                      <TableRow key={p.productId}>
                        <TableCell className="py-2"><span className="text-xs font-medium truncate block max-w-[200px]">{p.name}</span></TableCell>
                        <TableCell className="text-center py-2 text-xs font-medium">৳{p.basePrice}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              className="h-7 text-[11px] w-12 text-center"
                              value={p.discountValue}
                              onChange={(e) => updateProductLine(idx, "discountValue", e.target.value)}
                            />
                            <button
                              onClick={() => updateProductLine(idx, "discountType", p.discountType === "PERCENTAGE" ? "FLAT" : "PERCENTAGE")}
                              className={cn(
                                "h-7 w-7 flex items-center justify-center rounded border font-bold text-[10px]",
                                p.discountType === "PERCENTAGE" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                              )}
                            >
                              {p.discountType === "PERCENTAGE" ? "%" : "৳"}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2 text-xs font-bold text-orange-600">৳{Math.round(p.salePrice)}</TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            className="h-7 text-[11px] w-14 mx-auto text-center"
                            placeholder="∞"
                            value={p.stockLimit}
                            onChange={(e) => updateProductLine(idx, "stockLimit", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeProduct(p.productId)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-muted/30 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
              {editId ? "Update Sale" : "Launch Sale"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
