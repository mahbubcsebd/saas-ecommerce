"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea"; // Ensure this works
import { ProductService } from "@/services/product.service";
import { PurchaseService } from "@/services/purchase.service";
import { SupplierService } from "@/services/supplier.service";
import { ArrowLeft, Loader2, Save, Search, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link"; // FIX: Import Link
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreatePurchasePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>}>
      <CreatePurchaseForm />
    </Suspense>
  );
}

function CreatePurchaseForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (session as any)?.accessToken || "";

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState({
    supplierId: "",
    notes: "",
    receivedAt: new Date().toISOString().split("T")[0] // YYYY-MM-DD
  });

  const [items, setItems] = useState<any[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (session) {
      loadSuppliers();
      // Load products initially
      loadProducts();

      // Handle reorder from query params
      const reorderId = searchParams.get("reorderId");
      const variantId = searchParams.get("variantId");
      if (reorderId) {
        handleReorderPrefill(reorderId, variantId);
      }
    }
  }, [session, searchParams]);

  const handleReorderPrefill = async (productId: string, variantId: string | null) => {
    try {
        const res = await ProductService.getProduct(token, productId);
        if (res.success) {
            const product = res.data;
            const variant = variantId ? product.variants?.find((v: any) => v.id === variantId) : null;

            setItems([{
                productId: product.id,
                variantId: variant?.id || null,
                productName: product.name,
                variantName: variant?.name || null,
                sku: variant?.sku || product.sku,
                quantity: 1,
                unitCost: variant?.costPrice || product.costPrice || 0
            }]);

            toast.info(`Pre-filled reorder for ${variant ? variant.name : product.name}`);
        }
    } catch (e) {
        console.error("Reorder pre-fill failed", e);
    }
  };

  const loadSuppliers = async () => {
    const res = await SupplierService.getSuppliers(token, { isActive: true });
    if (res.success) setSuppliers(res.data);
  };

  const loadProducts = async () => {
    // Simple fetch for now. Real-world would need better search component.
    const res = await ProductService.getProducts(token, { limit: 100, search: productSearch });
    if (res.success) setProducts(res.data);
  };

  // Debounce search? simplified for now
  const handleProductSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
      setProductSearch(e.target.value);
      // Ideally trigger search here with debounce
  };

  // Trigger search on enter or button
  const executeSearch = () => {
      loadProducts();
  };

  const addItem = (product: any, variant: any = null) => {
    // Check if already exists
    const existingIndex = items.findIndex(i => i.productId === product.id && i.variantId === (variant?.id || null));

    if (existingIndex >= 0) {
        toast.info("Item already added. Adjust quantity.");
        return;
    }

    setItems([...items, {
        productId: product.id,
        variantId: variant?.id || null,
        productName: product.name,
        variantName: variant?.name || null,
        sku: variant?.sku || product.sku,
        quantity: 1,
        unitCost: variant?.costPrice || product.costPrice || 0
    }]);

    toast.success(`Added ${variant ? variant.name : product.name} to order.`);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
      return items.reduce((sum, item) => {
          const qty = parseInt(item.quantity) || 0;
          const cost = parseFloat(item.unitCost) || 0;
          return sum + (qty * cost);
      }, 0);
  };

  const handleSubmit = async () => {
      if (!formData.supplierId) {
          toast.error("Please select a supplier");
          return;
      }
      if (items.length === 0) {
          toast.error("Please add at least one item");
          return;
      }

      setLoading(true);
      try {
          const payload = {
              supplierId: formData.supplierId,
              notes: formData.notes,
              receivedAt: formData.receivedAt,
              paymentStatus: "PENDING", // Default
              items: items.map(i => ({
                  productId: i.productId,
                  variantId: i.variantId,
                  quantity: parseInt(i.quantity),
                  unitCost: parseFloat(i.unitCost)
              }))
          };

          const res = await PurchaseService.createPurchase(token, payload);
          if (res.success) {
              toast.success("Purchase Order created successfully!");
              router.push("/dashboard/purchases");
          } else {
              toast.error(res.message || "Failed to create PO");
          }
      } catch (e) {
          toast.error("An error occurred");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6 mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/purchases"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            {/* ITEM SELECTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Add Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={handleProductSearch}
                            onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                        />
                        <Button variant="secondary" onClick={executeSearch}><Search className="h-4 w-4" /></Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto border rounded-md">
                        <Table>
                            <TableBody>
                                {products.map(p => (
                                    <>
                                       <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer group">
                                           <TableCell className="font-medium">{p.name}</TableCell>
                                           <TableCell className="text-sm text-muted-foreground">{p.sku}</TableCell>
                                           <TableCell className="text-right">
                                               {p.variants && p.variants.length > 0 ? (
                                                   <span className="text-xs text-muted-foreground">Select variant below</span>
                                               ) : (
                                                   <Button size="sm" variant="ghost" onClick={() => addItem(p)}>Add</Button>
                                               )}
                                           </TableCell>
                                       </TableRow>
                                       {p.variants && p.variants.map((v: any) => (
                                            <TableRow key={v.id} className="bg-muted/20 text-sm">
                                                <TableCell className="pl-8 text-muted-foreground flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                                    {v.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{v.sku}</TableCell>
                                                <TableCell className="text-right">
                                                     <Button size="sm" variant="ghost" className="h-6" onClick={() => addItem(p, v)}>Add Variant</Button>
                                                </TableCell>
                                            </TableRow>
                                       ))}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ORDER ITEMS TABLE */}
            <Card>
                <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-[100px]">Quantity</TableHead>
                                <TableHead className="w-[120px]">Unit Cost</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No items added yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item, index) => (
                                    <TableRow key={`${item.productId}-${item.variantId}`}>
                                        <TableCell>
                                            <div className="font-medium">{item.productName}</div>
                                            {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                                            <div className="text-xs font-mono text-muted-foreground">{item.sku}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number" min="1"
                                                value={item.quantity === 0 ? '' : item.quantity}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/^0+/, '') || '0';
                                                    updateItem(index, 'quantity', val === '0' && e.target.value === '' ? '' : parseInt(val));
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number" min="0" step="0.01"
                                                value={item.unitCost === 0 ? '' : item.unitCost}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '') {
                                                        updateItem(index, 'unitCost', '');
                                                    } else {
                                                        // Prevent removing trailing decimals like '10.' or '10.0' while typing
                                                        if (val.endsWith('.') || val.endsWith('.0')) {
                                                            updateItem(index, 'unitCost', val);
                                                        } else {
                                                            updateItem(index, 'unitCost', parseFloat(val));
                                                        }
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {((parseInt(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => removeItem(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select
                            value={formData.supplierId}
                            onValueChange={(val) => setFormData({...formData, supplierId: val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Receive Date</Label>
                        <Input
                            type="date"
                            value={formData.receivedAt}
                            onChange={(e) => setFormData({...formData, receivedAt: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            placeholder="Optional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 border-t space-y-2">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total Cost</span>
                            <span>{calculateTotal().toLocaleString()} BDT</span>
                        </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Create Purchase Order
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
