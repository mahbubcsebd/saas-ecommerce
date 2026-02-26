"use client";

import { CartItem, POSCart } from "@/components/dashboard/pos/POSCart";
import { POSCustomer } from "@/components/dashboard/pos/POSCustomer";
import { POSPayment } from "@/components/dashboard/pos/POSPayment";
import { POSProductList } from "@/components/dashboard/pos/POSProductList";
import { POSReceipt } from "@/components/dashboard/pos/POSReceipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { OrderService } from "@/services/order.service";
import { Home, Printer, RefreshCcw, ScanLine } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

export default function POSPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Transaction State
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("FLAT");
  const [vatPercent, setVatPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [tenderedAmount, setTenderedAmount] = useState(0);

  // Customer State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");

  // Order & Print State
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Printing Hook
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Use contentRef instead of content for latest version
    documentTitle: `Receipt-${lastOrder?.invoiceNumber || lastOrder?.orderNumber || "POS"}`,
    onAfterPrint: () => setLastOrder(null)
  });

  // --- Barcode Scanner Logic ---
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in an input/textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const now = Date.now();
      // Rapid typing (less than 30ms between keys) is usually a scanner
      if (now - lastKeyTime.current > 100) {
        barcodeBuffer.current = "";
      }
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        if (barcodeBuffer.current.length > 2) {
          handleBarcodeScan(barcodeBuffer.current);
          barcodeBuffer.current = "";
        }
      } else if (e.key === "F9") {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === "F10") {
        e.preventDefault();
        setPaymentMethod("CASH");
        setTenderedAmount(total);
        handleCheckout();
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBarcodeScan = async (sku: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?search=${sku}&limit=1`, {
        headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const product = data.data[0];
        // If product has variants, we can't auto-add unless barcode matches variant SKU perfectly
        // For now, if no variants or exact SKU match, add it.
        handleAddToCart(product);
        toast({ title: "Product Scanned", description: product.name });
      } else {
        toast({ title: "Not Found", description: `SKU ${sku} not found`, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
    }
  };
  // --- End Barcode Logic ---

  // Computed Values
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vatAmount = (afterDiscount * vatPercent) / 100;
  const total = afterDiscount + vatAmount;
  const changeAmount = paymentMethod === "CASH" ? tenderedAmount - total : 0;

  // Handlers
  const handleAddToCart = (product: any, variant?: any) => {
    // Generate unique ID based on variant
    const cartId = variant ? `${product.id}-${variant.id}` : product.id;
    const price = variant ? (variant.sellingPrice || product.sellingPrice) : product.sellingPrice;
    const stock = variant ? variant.stock : product.stock;
    const name = product.name + (variant ? ` - ${variant.name}` : '');

    setCartItems(prev => {
      const existing = prev.find(item => item.id === cartId);
      if (existing) {
        if (existing.quantity >= stock) {
             toast({ title: "Stock Limit Reached", variant: "destructive" });
             return prev;
        }
        return prev.map(item => item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: cartId, // Unique Cart ID
        // We keep original IDs for backend
        productId: product.id,
        variantId: variant?.id,
        name,
        price,
        quantity: 1,
        stock
      }]; // Note: Need to update CartItem interface
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };


  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === "CASH" && tenderedAmount < total) {
       toast({ title: "Insufficient Payment", variant: "destructive" });
       return;
    }

    setIsProcessing(true);

    try {
      const payload = {
        source: 'POS',
        items: cartItems.map(item => ({
            productId: (item as any).productId || item.id, // Fallback logic
            variantId: (item as any).variantId,
            quantity: item.quantity
        })),
        userId: selectedUser?.id,
        walkInName: !selectedUser ? walkInName : undefined,
        walkInPhone: !selectedUser ? walkInPhone : undefined,
        discount,
        discountType,
        vatPercent,
        paymentMethod,
        tenderedAmount: paymentMethod === 'CASH' ? tenderedAmount : undefined,
        changeAmount: paymentMethod === 'CASH' ? changeAmount : undefined,
      };

      const data = await OrderService.createOrder((session as any)?.accessToken as string, payload);

      if (data.success) {
        toast({ title: "Order Successful!", description: `Inv: ${data.data.invoiceNumber || data.data.orderNumber}`, className: "bg-green-600 text-white" });
        setLastOrder(data.data);
        // Clear Cart
        setCartItems([]);
        setTenderedAmount(0);
        setDiscount(0);
        setWalkInName("");
        setWalkInPhone("");
        setSelectedUser(null);
      } else {
         toast({ title: "Order Failed", description: data.message, variant: "destructive" });
      }

    } catch (error) {
        console.error(error);
        toast({ title: "Network Error", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-60px)] gap-4 p-2 sm:p-4 max-w-[1920px] mx-auto bg-muted/20">
        <Toaster />

        {/* Helper for Print - Hidden usually */}
        <div className="hidden">
            <POSReceipt ref={printRef} order={lastOrder} />
        </div>

        {/* Modal/Dialog for Post-Order Actions */}
        {lastOrder && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-white p-8 rounded-lg shadow-xl text-center space-y-6 max-w-sm w-full animate-in zoom-in-50 duration-300">
                     <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <Printer className="h-8 w-8" />
                     </div>
                     <div>
                         <h2 className="text-xl font-bold">Order Successful!</h2>
                         <p className="text-muted-foreground font-mono">{lastOrder.invoiceNumber}</p>
                     </div>
                     <div className="flex gap-4 justify-center">
                         <Button variant="outline" onClick={() => setLastOrder(null)}>Close</Button>
                         <Button onClick={() => handlePrint && handlePrint()}>Print Receipt</Button>
                     </div>
                 </div>
             </div>
        )}

        {/* Left Column: Products (65% on large, full on small) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 bg-white rounded-lg shadow-sm border p-4 h-full">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                 <div className="flex items-center gap-2">
                    <Link href="/dashboard">
                        <Button variant="outline" size="icon">
                            <Home className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Products</h2>
                        <Badge variant="outline" className="hidden sm:flex gap-1 items-center py-0 h-6">
                            <ScanLine className="h-3 w-3" /> Scanner Ready
                        </Badge>
                    </div>
                 </div>

                 <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="h-8">
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
                 </Button>
             </div>
             <POSProductList onAddToCart={handleAddToCart} />
        </div>

        {/* Right Column: Cart & Checkout (35% or side drawer style) */}
        <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col gap-4 min-w-0 h-full">
            <div className="flex-1 overflow-auto flex flex-col gap-3">
                 <POSCustomer
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    walkInName={walkInName}
                    setWalkInName={setWalkInName}
                    walkInPhone={walkInPhone}
                    setWalkInPhone={setWalkInPhone}
                 />

                 <POSCart
                    items={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    subtotal={subtotal}
                    discount={discount}
                    setDiscount={setDiscount}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    vatPercent={vatPercent}
                    setVatPercent={setVatPercent}
                    total={total}
                    onCheckout={handleCheckout}
                    isProcessing={isProcessing}
                 />

                 <POSPayment
                    total={total}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    tenderedAmount={tenderedAmount}
                    setTenderedAmount={setTenderedAmount}
                    changeAmount={changeAmount}
                 />
            </div>
        </div>
    </div>
  );
}
