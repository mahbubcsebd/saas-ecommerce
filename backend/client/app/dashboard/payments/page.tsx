"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
    Banknote, 
    CreditCard, 
    DollarSign, 
    Download,
    ExternalLink,
    History, 
    Loader2, 
    MoreHorizontal, 
    Plus, 
    Search, 
    Wallet 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Order, OrderService } from "@/services/order.service";
import { PaymentService } from "@/services/payment.service";

export default function PaymentsPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Record Payment Dialog State
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: "CASH",
    transactionId: "",
    notes: ""
  });

  const fetchOrders = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await OrderService.getAllOrders(accessToken, { limit: 100 });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (error) {
      toast.error("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [accessToken]);

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalReceived = orders.reduce((acc, order) => acc + (order.total - (order.dueAmount || 0)), 0);
  const totalDue = orders.reduce((acc, order) => acc + (order.dueAmount || 0), 0);

  const handleDownloadReceipt = async (order: Order) => {
    try {
        setProcessingId(order.id + "-download");
        const blob = await OrderService.downloadInvoice(accessToken, order.id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Receipt downloaded successfully");
    } catch (error) {
        toast.error("Failed to download receipt");
    } finally {
        setProcessingId(null);
    }
  };

  const openRecordDialog = (order: Order) => {
    setSelectedOrder(order);
    setPaymentForm({
        amount: order.dueAmount || 0,
        paymentMethod: "CASH",
        transactionId: "",
        notes: ""
    });
    setIsRecordDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder || !accessToken) return;
    
    if (paymentForm.amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
    }

    try {
        setProcessingId("submitting-payment");
        const res = await PaymentService.addOrderPayment(accessToken, selectedOrder.id, paymentForm);
        if (res.success) {
            toast.success("Payment recorded successfully");
            setIsRecordDialogOpen(false);
            fetchOrders();
        } else {
            toast.error(res.message || "Failed to record payment");
        }
    } catch (error) {
        toast.error("Error recording payment");
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Payments</h1>
          <p className="text-muted-foreground mt-1">Monitor transactions and manage outstanding balances.</p>
        </div>
        <Button variant="outline" className="hidden md:flex" onClick={fetchOrders} disabled={loading}>
            <History className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh History
        </Button>
      </div>

      {/* Analytics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Received</p>
              <p className="text-2xl font-bold text-slate-900">
                {totalReceived.toLocaleString()} <span className="text-xs font-medium text-slate-400">BDT</span>
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successfully collected</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Due</p>
              <p className="text-2xl font-bold text-amber-600">
                {totalDue.toLocaleString()} <span className="text-xs font-medium text-slate-400">BDT</span>
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
             <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">Pending Collection</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online Payments</p>
              <p className="text-2xl font-bold text-slate-900">
                {orders.filter(o => o.paymentMethod !== 'COD').length}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
             <p className="text-[10px] font-bold text-indigo-600/70 uppercase tracking-widest">Digital transactions</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">COD Volume</p>
              <p className="text-2xl font-bold text-slate-900">
                {orders.filter(o => o.paymentMethod === 'COD').length}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cash on delivery</p>
          </div>
        </div>
      </div>

        {/* Toolbar Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search order #, customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Button variant="outline" className="w-full md:w-auto rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" onClick={fetchOrders} disabled={loading}>
                <History className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Sync History
             </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order #</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer & Method</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Paid</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Outstanding</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="py-5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-slate-100 rounded-full" />
                          <div className="w-12 h-12 border-4 border-slate-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronizing Records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                      <TableCell className="py-5 px-6">
                        <span className="text-sm font-bold text-slate-900">{order.orderNumber}</span>
                      </TableCell>
                      <TableCell className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{order.user?.firstName} {order.user?.lastName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-right font-bold text-slate-900">
                        {order.total.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">BDT</span>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-right font-bold text-emerald-600">
                        {(order.total - (order.dueAmount || 0)).toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">BDT</span>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-right font-bold text-rose-600">
                        {(order.dueAmount || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">BDT</span>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-center">
                        <Badge variant="outline" className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest border-none ${
                          order.paymentStatus === 'PAID' 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-amber-50 text-amber-600"
                        }`}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200/60 shadow-xl">
                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Transaction Controls</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-xl focus:bg-slate-50 cursor-pointer">
                              <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                                <ExternalLink className="h-4 w-4 mr-2 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">View Details</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openRecordDialog(order)} 
                              disabled={(order.dueAmount || 0) <= 0}
                              className="rounded-xl focus:bg-slate-50 cursor-pointer"
                            >
                              <Plus className="h-4 w-4 mr-2 text-slate-400" />
                              <span className="text-sm font-semibold text-slate-700">Record Payment</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDownloadReceipt(order)} 
                              disabled={processingId === order.id + "-download"}
                              className="rounded-xl focus:bg-slate-50 cursor-pointer"
                            >
                              {processingId === order.id + "-download" ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-400" />
                              ) : (
                                <Download className="h-4 w-4 mr-2 text-slate-400" />
                              )}
                              <span className="text-sm font-semibold text-slate-700">Download Receipt</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                          <History className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No payment records found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
                Collect due amount for order {selectedOrder?.orderNumber}. 
                Current due: <span className="font-bold text-red-600">{(selectedOrder?.dueAmount || 0).toLocaleString()} BDT</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="amount">Amount to Pay (BDT)</Label>
                <Input
                    id="amount"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value)})}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select 
                    value={paymentForm.paymentMethod} 
                    onValueChange={(val) => setPaymentForm({...paymentForm, paymentMethod: val})}
                >
                    <SelectTrigger id="method">
                        <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BKASH">bKash</SelectItem>
                        <SelectItem value="NAGAD">Nagad</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                <Input
                    id="transactionId"
                    value={paymentForm.transactionId}
                    onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                    placeholder="e.g. TRN123456"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                    id="notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={processingId === "submitting-payment"}>
                {processingId === "submitting-payment" ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Recording...
                    </>
                ) : (
                    "Confirm Payment"
                )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
