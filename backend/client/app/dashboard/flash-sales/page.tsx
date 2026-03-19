"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    Search,
    Tag,
    Timer,
    Trash2,
    Zap
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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

  if (!sale.isActive) return <Badge variant="secondary">Inactive</Badge>;
  if (isBefore(now, start)) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1"><Clock className="h-3 w-3" /> Upcoming</Badge>;
  if (isAfter(now, end)) return <Badge variant="destructive">Finished</Badge>;
  return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1"><Zap className="h-3 w-3 fill-current" /> Live</Badge>;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FlashSalesPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    // If it's closed, clear results and query
    if (!comboOpen) {
      if (!productQuery) setFoundProducts([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const queryParam = productQuery ? `search=${productQuery}` : '';
        const url = `${API_BASE}/products?${queryParam}&limit=20&status=all`;

        console.log("Fetching products from:", url);

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        console.log("Product Search Response:", {
            success: data.success,
            count: data.data?.length,
            firstItem: data.data?.[0]?.name,
            error: data.message
        });

        if (data.success) {
          setFoundProducts(data.data);
        } else {
          setFoundProducts([]);
          toast.error(data.message || "Failed to fetch products");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setFoundProducts([]);
      }
      finally { setSearchingProducts(false); }
    }, productQuery ? 400 : 0); // Immediate fetch if query is empty (on open)

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

    // Recalculate price
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
          <h1 className="text-3xl font-bold tracking-tight">Flash Sales</h1>
          <p className="text-muted-foreground mt-1">Manage time-limited sales and countdowns.</p>
        </div>
        <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700">
          <Zap className="mr-2 h-4 w-4 fill-current" /> Create Flash Sale
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Active Sales", value: sales.filter(s => s.isActive && isBefore(new Date(s.startDate), new Date()) && isAfter(new Date(s.endDate), new Date())).length, icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Upcoming", value: sales.filter(s => s.isActive && isAfter(new Date(s.startDate), new Date())).length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Products on Sale", value: sales.reduce((a, s) => a + (s._count?.products || 0), 0), icon: Tag, color: "text-green-600", bg: "bg-green-50" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{loading ? "—" : kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Sale Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && sales.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-orange-600" /></TableCell></TableRow>
            ) : sales.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16 text-slate-400">
                <Timer className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                No flash sales found. Start a new one!
              </TableCell></TableRow>
            ) : sales.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50/50">
                <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex flex-col">
                    <span className="text-slate-600">{format(new Date(s.startDate), "MMM dd, hh:mm a")}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">to</span>
                    <span className="text-slate-600">{format(new Date(s.endDate), "MMM dd, hh:mm a")}</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{s._count?.products || 0} Items</Badge></TableCell>
                <TableCell><StatusBadge sale={s} /></TableCell>
                <TableCell><Switch checked={s.isActive} onCheckedChange={() => handleToggle(s.id)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s.id)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white rounded-xl border-none shadow-2xl h-[90vh] flex flex-col">
          <DialogHeader className="p-6 border-b bg-slate-50/50 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {editId ? "Update Flash Sale" : "New Flash Sale"}
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-1">Configure your limited time offer and select products.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100">
                <Zap className="h-4 w-4 text-orange-600 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700">Campaign Manager</span>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Config Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sale Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ramdan Mega Sale"
                    className="h-10 border-slate-200 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description for customers..."
                    className="resize-none border-slate-200"
                    rows={2}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="h-10 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">End Date</Label>
                    <Input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="h-10 border-slate-200"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Publication Status</span>
                    <span className="text-[10px] text-slate-500">Enable sale instantly</span>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                </div>
              </div>
            </div>

            {/* Product Selection Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-orange-500" /> Selected Products
                  </h3>
                  <p className="text-[10px] text-slate-500">Search and add products to the sale.</p>
                </div>

                {/* Search Area - Combobox */}
                <div className="flex items-center gap-4">
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="w-full md:w-[320px] justify-between h-10 border-blue-100 hover:bg-blue-50 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-blue-500" />
                          <span className="text-slate-600 truncate">
                            {productQuery || "Select products..."}
                          </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full md:w-[400px] p-0 shadow-2xl border-blue-100 rounded-xl overflow-hidden z-[1001]" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search product name, SKU, or brand..."
                          value={productQuery}
                          onValueChange={setProductQuery}
                          className="h-12 border-none focus:ring-0"
                        />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          {searchingProducts && (
                            <div className="p-4 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                            </div>
                          )}
                          {!searchingProducts && foundProducts.length === 0 && productQuery.length >= 2 && (
                            <div className="p-4 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                              <AlertCircle className="h-4 w-4 opacity-50" />
                              <span>No products found for "{productQuery}"</span>
                            </div>
                          )}
                          <CommandGroup>
                            {foundProducts.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  addProductToSale(p);
                                  setComboOpen(false);
                                  setProductQuery("");
                                }}
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 border-b last:border-0"
                              >
                                <div className="flex flex-col gap-0.5 max-w-[240px]">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 truncate">{p.name}</span>
                                    <Check
                                      className={cn(
                                        "h-3 w-3 text-green-600",
                                        form.products.some(fp => fp.productId === p.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-slate-50">{p.sku || 'No SKU'}</Badge>
                                    <span className="text-[10px] text-slate-400 font-medium">Orig: ৳{p.basePrice}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs font-black text-blue-600">৳{p.basePrice}</span>
                                  <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 bg-blue-100 text-blue-700 uppercase font-black">Add</Button>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {form.products.length} Products Added
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="border rounded-xl overflow-x-auto bg-slate-50/30">
                <Table>
                  <TableHeader className="bg-slate-100/50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-8 pl-4">Product</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-8 text-center">Price</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-8 text-center">Discount</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-8 text-center">Sale Price</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 h-8 text-center">Stock</TableHead>
                      <TableHead className="h-8 w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.products.map((p, idx) => (
                      <TableRow key={p.productId} className="bg-white border-b last:border-0">
                        <TableCell className="pl-4 py-2">
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[180px]">{p.name}</span>
                        </TableCell>
                        <TableCell className="text-center py-2 text-xs font-medium text-slate-500">৳{p.basePrice}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              className="h-7 text-[11px] p-1 w-12 text-center"
                              value={p.discountValue}
                              onChange={(e) => updateProductLine(idx, "discountValue", e.target.value)}
                            />
                            <button
                              onClick={() => updateProductLine(idx, "discountType", p.discountType === "PERCENTAGE" ? "FLAT" : "PERCENTAGE")}
                              className={cn(
                                "h-7 w-7 flex items-center justify-center rounded border font-bold text-[10px]",
                                p.discountType === "PERCENTAGE" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                              )}
                            >
                              {p.discountType === "PERCENTAGE" ? "%" : "৳"}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <span className="text-xs font-black text-orange-600">৳{Math.round(p.salePrice)}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="number"
                            className="h-7 text-[11px] p-1 w-14 mx-auto text-center"
                            placeholder="∞"
                            value={p.stockLimit}
                            onChange={(e) => updateProductLine(idx, "stockLimit", e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="pr-4 py-2 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => removeProduct(p.productId)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {form.products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                          No products added to this sale yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 border-t bg-slate-50/80 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 px-8 rounded-lg shadow-lg shadow-orange-200"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4 fill-current" />}
              {editId ? "Update Flash Sale" : "Launch Flash Sale"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
