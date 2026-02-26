"use client";

import { ArrowLeft, Loader2, Save, UploadCloud, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Order, OrderService } from "@/services/order.service";
import { ReturnService } from "@/services/return.service";
import { ChevronsUpDown } from "lucide-react";

export default function CreateRMAPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Form State
  const [orderNumberInput, setOrderNumberInput] = useState("");
  const [orderData, setOrderData] = useState<Order | null>(null);

  // Combobox State
  const [open, setOpen] = useState(false);

  // RMA Details
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState("PENDING");

  // Images
  const [images, setImages] = useState<File[]>([]);

  // Derived state for the selected item to calculate max refund
  const selectedItem = orderData?.items.find(item => item.id === selectedItemId);
  const maxRefundAmount = selectedItem ? selectedItem.unitPrice * quantity : 0;

  const handleSearchOrder = async (searchVal: string) => {
    if (!searchVal) return;

    setSearching(true);
    setOrderNumberInput(searchVal);
    setOpen(false);

    try {
      // Find real order by searching API
      const res = await OrderService.getAllOrders(accessToken, { search: searchVal, limit: 1 });

      if (!res.success || !res.data || res.data.length === 0) {
          throw new Error("Order not found");
      }

      const foundOrder = res.data[0];

      setOrderData(foundOrder as Order);
      toast.success("Order found! Select the product to return.");

      // Reset dependent fields
      setSelectedItemId("");
      setQuantity(1);
      setAmount("");

    } catch (error) {
      toast.error("Could not find order. Please check the order number.");
      setOrderData(null);
    } finally {
      setSearching(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const filesArray = Array.from(e.target.files);
          setImages(prev => [...prev, ...filesArray].slice(0, 5)); // Limit to 5 images
      }
  };

  const removeImage = (index: number) => {
      setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData || !selectedItemId) {
        toast.error("Please search for an order and select a product first.");
        return;
    }

    const refundValue = parseFloat(amount);
    if (refundValue > maxRefundAmount) {
        toast.error(`Refund amount cannot exceed ${maxRefundAmount} BDT for this item.`);
        return;
    }

    setLoading(true);

    try {
      if (!selectedItem) {
          toast.error("Please select a valid product.");
          setLoading(false);
          return;
      }

      // Create RMA using ReturnService
      const payload = {
        orderId: orderData.id,
        productId: selectedItem.productId || selectedItem.variantId || selectedItemId,
        quantity,
        refundAmount: refundValue,
        reason,
        status: status,
        // Optional: Images array
        images: images.length > 0 ? ["placeholder.png"] : [] // Mocking image handling without actual Cloudinary code for now
      };

      const res = await ReturnService.createReturn(accessToken, payload);

      if (res.success) {
          toast.success("Return Merchandize Authorization (RMA) created successfully!");
          router.push("/dashboard/returns");
      } else {
          toast.error(res.message || "Failed to create RMA.");
      }

    } catch (error) {
      toast.error("Failed to create RMA. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/returns">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create RMA</h1>
          <p className="text-muted-foreground mt-1">Initiate a return or refund for a customer order.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
            <CardHeader>
                <CardTitle>Order Lookup</CardTitle>
                <CardDescription>
                Search by order number to fetch details.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/30 p-4 rounded-lg border">
                <div className="space-y-2 flex-1 relative">
                    <Label htmlFor="orderNumberCombobox">Select Order <span className="text-destructive">*</span></Label>
                    <div className="flex gap-2 relative">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                                disabled={searching}
                              >
                                {orderData && orderData.orderNumber === orderNumberInput
                                  ? orderData.orderNumber
                                  : orderNumberInput || "Enter Order Number..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search order number..." />
                                <CommandEmpty>No order found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandList>
                                       {/* Optional: Add search results list here if you fetch multiple. For now, we search directly on enter or exact type */}
                                       <CommandItem
                                          value={orderNumberInput || "Enter Order Number..."}
                                          onSelect={() => handleSearchOrder(orderNumberInput)}
                                        >
                                          Search `{orderNumberInput}`
                                       </CommandItem>
                                    </CommandList>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                    </div>
                </div>
                </div>

                {orderData && (
                    <div className="mt-6 p-4 border rounded-md bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50">
                        <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">Order Confirmed</h4>
                        <div className="grid grid-cols-2 text-sm gap-2">
                            <div><span className="text-muted-foreground">Customer:</span> {orderData.user?.username || orderData.user?.email || "Guest"}</div>
                            <div><span className="text-muted-foreground">Date:</span> {new Date(orderData.createdAt).toLocaleDateString()}</div>
                            <div><span className="text-muted-foreground">Status:</span> {orderData.status}</div>
                            <div><span className="text-muted-foreground">Total:</span> {orderData.total} BDT</div>
                        </div>
                    </div>
                )}
            </CardContent>
            </Card>

            <Card className={!orderData ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
            <CardHeader>
                <CardTitle>Return Product Details</CardTitle>
                <CardDescription>
                Select the product, quantity, and reason for return.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Product to Return <span className="text-destructive">*</span></Label>
                        <Select
                            value={selectedItemId}
                            onValueChange={(val) => {
                                setSelectedItemId(val);
                                setQuantity(1); // Reset quantity when product changes
                            }}
                            disabled={!orderData}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="-- Choose an item from order --" />
                            </SelectTrigger>
                            <SelectContent>
                                {orderData?.items.map(item => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} (Qty: {item.quantity}) - {item.unitPrice} BDT/ea
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="returnQuantity">Return Quantity <span className="text-destructive">*</span></Label>
                            <Input
                                id="returnQuantity"
                                type="number"
                                min="1"
                                max={selectedItem?.quantity || 1}
                                value={quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    const max = selectedItem?.quantity || 1;
                                    setQuantity(val > max ? max : val);
                                }}
                                disabled={!selectedItemId}
                                required
                            />
                            {selectedItem && (
                                <p className="text-xs text-muted-foreground">Max allowed: {selectedItem.quantity}</p>
                            )}
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="refundAmount">Refund Amount (BDT) <span className="text-destructive">*</span></Label>
                            <Input
                                id="refundAmount"
                                type="number"
                                min="0"
                                max={maxRefundAmount}
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val > maxRefundAmount) {
                                        toast.error(`Cannot exceed ${maxRefundAmount} BDT`);
                                        setAmount(maxRefundAmount.toString());
                                    } else {
                                        setAmount(e.target.value);
                                    }
                                }}
                                disabled={!selectedItemId}
                                required
                            />
                            {selectedItem && (
                                <p className="text-xs text-muted-foreground flex justify-between">
                                    <span>Max eligible: <strong className={amount && parseFloat(amount) > maxRefundAmount ? "text-destructive" : "text-green-600 font-bold"}>{maxRefundAmount} BDT</strong></span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Return Reason & Notes <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Briefly describe why the item is being returned (e.g., damaged, wrong item, changed mind)..."
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={!orderData}
                            required
                        />
                    </div>
                </div>

            </CardContent>
            </Card>
        </div>

        {/* Right Column - Status & Attachments */}
        <div className="space-y-6">
             <Card className={!orderData ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <CardHeader>
                    <CardTitle>RMA Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>Initial Status</Label>
                        <Select value={status} onValueChange={setStatus} disabled={!orderData}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pending Approval</SelectItem>
                            <SelectItem value="APPROVED">Already Approved</SelectItem>
                            <SelectItem value="REFUNDED">Refunded Immediately</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </CardContent>
             </Card>

             <Card className={!orderData ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <CardHeader>
                    <CardTitle>Proof / Attachments</CardTitle>
                    <CardDescription>Upload photos of damaged items or return labels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors border-muted-foreground/30">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (Max 5)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={!orderData} />
                        </label>
                    </div>

                    {images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative rounded-md overflow-hidden border group">
                                    <div className="aspect-video bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                        {/* Simple placeholder since object URL needs cleanup in real app */}
                                        {img.name.substring(0, 15)}...
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
             </Card>

             <div className="pt-4 flex flex-col gap-3">
                <Button type="submit" size="lg" disabled={loading || !orderData || !selectedItemId} className="w-full">
                    {loading ? (
                    <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...
                    </>
                    ) : (
                    <>
                        <Save className="h-5 w-5 mr-2" /> Submit RMA Ticket
                    </>
                    )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="w-full">
                    Cancel
                </Button>
             </div>
        </div>

      </form>
    </div>
  );
}
