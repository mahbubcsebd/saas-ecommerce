'use client';

import { useConfirm } from '@/hooks/use-confirm';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  Package,
  Printer,
  Receipt,
  User,
  XCircle,
  ShieldAlert,
  Globe,
  Monitor,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Order, OrderService } from '@/services/order.service';

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-100',
    text: 'Pending',
    border: 'border-yellow-300',
  },
  PROCESSING: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    text: 'Processing',
    border: 'border-blue-300',
  },
  SHIPPED: {
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    text: 'Shipped',
    border: 'border-purple-300',
  },
  DELIVERED: {
    color: 'text-green-700',
    bg: 'bg-green-100',
    text: 'Delivered',
    border: 'border-green-300',
  },
  COMPLETED: {
    color: 'text-green-800',
    bg: 'bg-green-200',
    text: 'Completed',
    border: 'border-green-400',
  },
  CANCELLED: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    text: 'Cancelled',
    border: 'border-red-300',
  },
  REFUNDED: {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    text: 'Refunded',
    border: 'border-gray-300',
  },
};

export default function OrderDetailsPage() {
  const { confirm } = useConfirm();
  const { id } = useParams();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const [blockingIp, setBlockingIp] = useState(false);
  const [blockingDevice, setBlockingDevice] = useState(false);

  const handleBlockClient = async (type: 'IP' | 'DEVICE', value: string) => {
    if (!accessToken) return;
    const confirmMessage = `Are you sure you want to block this ${type === 'IP' ? 'IP Address' : 'Device'} (${value})? This will instantly prevent any future checkouts from this ${type === 'IP' ? 'IP' : 'Device'}.`;
    
    if (!await confirm({
      title: `Block ${type === 'IP' ? 'IP Address' : 'Device'}`,
      message: confirmMessage,
      type: 'danger',
      confirmText: 'Block Client'
    })) return;

    const reason = prompt(`Enter reason for blocking this ${type.toLowerCase()} (optional):`) || `Suspicious activity/fake orders`;

    try {
      if (type === 'IP') setBlockingIp(true);
      else setBlockingDevice(true);

      const res = await OrderService.blockClient(accessToken, type, value, reason);
      if (res.success) {
        toast.success(`${type} blocked successfully!`);
      } else {
        toast.error(res.message || `Failed to block ${type}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error blocking ${type}`);
    } finally {
      setBlockingIp(false);
      setBlockingDevice(false);
    }
  };

  const fetchOrder = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      if (typeof id === 'string') {
        const res = await OrderService.getOrder(accessToken, id);
        console.log('[OrderDetail] API response:', res);
        console.log('[OrderDetail] items:', res.data?.items);
        if (res.success) {
          setOrder(res.data);
        } else {
          toast.error('Failed to load order');
        }
      }
    } catch (error) {
      console.error('Failed to fetch order', error);
      toast.error('Error loading order details');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && id) {
      fetchOrder(true);
    }
  }, [accessToken, id]);

  const handleStatusUpdate = async (status: string) => {
    try {
      setUpdating(true);
      const res = await OrderService.updateStatus(
        accessToken,
        order!.id,
        status,
      );
      if (res.success) {
        toast.success(`Order status updated to ${status}`);
        await fetchOrder(false); // Silent reload to fetch fully populated relation models
        window.dispatchEvent(new CustomEvent('refresh-sidebar-counts'));
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Update status error', error);
      toast.error('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      const blob = await OrderService.downloadInvoice(accessToken, order!.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Invoice-${order!.invoiceNumber || order!.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Download error', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Order not found
      </div>
    );
  }

  // Status Steps
  const steps = [
    { status: 'PENDING', label: 'Placed', icon: '📦' },
    { status: 'PROCESSING', label: 'Processing', icon: '⚙️' },
    { status: 'SHIPPED', label: 'Shipped', icon: '🚚' },
    { status: 'DELIVERED', label: 'Delivered', icon: '✅' },
  ];

  const isCancelledOrRefunded =
    order.status === 'CANCELLED' || order.status === 'REFUNDED';

  const currentStepIndex =
    steps.findIndex((s) => s.status === order.status) !== -1
      ? steps.findIndex((s) => s.status === order.status)
      : order.status === 'COMPLETED'
        ? steps.length - 1
        : 0;

  const progressPercent = isCancelledOrRefunded
    ? 0
    : order.status === 'COMPLETED'
      ? 100
      : (currentStepIndex / (steps.length - 1)) * 100;

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['PENDING'];

  return (
    <div className="space-y-6 print:p-0 print:space-y-0">
      {/* Header */}
      <div className="print:hidden">
        {/* Top Row: Back + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Order {order.orderNumber}
              </h1>
              <p className="text-muted-foreground text-sm">
                {format(new Date(order.createdAt), "MMMM do, yyyy 'at' h:mm a")}
              </p>
            </div>
            <span
              className={`ml-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
            >
              {statusCfg.text}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border rounded-lg">
          {/* Document Actions */}
          <div className="flex items-center gap-2 border-r pr-3 mr-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">POS</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvoice}
              disabled={downloading}
              className="gap-1.5"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>

          {/* Status Update */}
          <div className="flex items-center gap-2">
            <Select
              disabled={updating}
              value={order.status}
              onValueChange={handleStatusUpdate}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm bg-white">
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />{' '}
                    Updating...
                  </>
                ) : (
                  <SelectValue placeholder="Update Status" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">⏳ Pending</SelectItem>
                <SelectItem value="PROCESSING">⚙️ Processing</SelectItem>
                <SelectItem value="SHIPPED">🚚 Shipped</SelectItem>
                <SelectItem value="DELIVERED">📬 Delivered</SelectItem>
                <SelectItem value="COMPLETED">✅ Completed</SelectItem>
                <SelectItem value="CANCELLED">❌ Cancelled</SelectItem>
                <SelectItem value="REFUNDED">💸 Refunded</SelectItem>
              </SelectContent>
            </Select>

            {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  if (
                    await confirm({
                      title: 'Cancel Order',
                      message:
                        'Are you sure you want to cancel this order? Stock will be restored to inventory.',
                      type: 'danger',
                      confirmText: 'Cancel Order',
                    })
                  ) {
                    handleStatusUpdate('CANCELLED');
                  }
                }}
                disabled={updating}
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Progress Bar */}
          {!isCancelledOrRefunded ? (
            <Card className="print:hidden overflow-hidden border-slate-100 shadow-sm">
              <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100 dark:bg-zinc-900/50 dark:border-zinc-800">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                  <Package className="h-4 w-4 text-primary" />
                  Order Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8 pb-6 relative">
                {/* Connected Progress Line */}
                <div className="absolute left-[12.5%] right-[12.5%] top-[50px] h-1 bg-slate-100 dark:bg-zinc-800 rounded-full -translate-y-1/2">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-700 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                  {progressPercent > 0 && progressPercent < 100 && (
                    <div
                      className="absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite] rounded-full"
                      style={{ left: `calc(${progressPercent}% - 2rem)` }}
                    />
                  )}
                </div>

                {/* Step Indicators */}
                <div className="relative flex items-center justify-between">
                  {steps.map((step, index) => {
                    const isCompleted =
                      index < currentStepIndex || order.status === 'COMPLETED';
                    const isCurrent =
                      index === currentStepIndex &&
                      order.status !== 'COMPLETED';

                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center gap-2.5 flex-1 relative z-10"
                      >
                        {/* Step Circle Container (To keep line centered) */}
                        <div className="h-9 flex items-center justify-center relative">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isCompleted
                                ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20'
                                : isCurrent
                                  ? 'bg-white border-primary text-primary shadow-md shadow-primary/10 dark:bg-zinc-950'
                                  : 'bg-white border-slate-200 text-slate-300 dark:bg-zinc-950 dark:border-zinc-800'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4.5 w-4.5 stroke-[2.5]" />
                            ) : (
                              <span className="text-sm font-semibold">{step.icon}</span>
                            )}
                          </div>
                          
                          {/* Pulse Glow for Current Step */}
                          {isCurrent && (
                            <span className="absolute w-9 h-9 rounded-full border-2 border-primary/40 animate-ping opacity-75 pointer-events-none" />
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className={`text-xs font-semibold text-center leading-tight transition-colors ${
                            isCurrent
                              ? 'text-primary font-bold'
                              : isCompleted
                                ? 'text-slate-700 dark:text-slate-300 font-medium'
                                : 'text-slate-400 dark:text-zinc-600 font-normal'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="print:hidden border-red-200 bg-red-50/30">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-800 text-sm">
                    Order{' '}
                    {order.status === 'CANCELLED' ? 'Cancelled' : 'Refunded'}
                  </p>
                  <p className="text-xs text-red-600/80">
                    This order has been {order.status.toLowerCase()}. Stock has
                    been restored.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="print:shadow-none print:border-none overflow-hidden">
            <CardHeader className="pb-0 print:px-0">
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  Order Items
                </span>
                <span className="text-xs font-normal text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                  {order.items?.length ?? 0} item
                  {(order.items?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 print:px-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-y">
                    <TableHead className="w-[56px] print:hidden pl-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Product
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">
                      Qty
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide pr-4">
                      Subtotal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!order.items || order.items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground text-sm"
                      >
                        No items found in this order.
                      </TableCell>
                    </TableRow>
                  ) : (
                    order.items.map((item, idx) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="print:hidden pl-4 py-3">
                          <div className="relative h-12 w-12 rounded-lg border bg-slate-50 overflow-hidden flex-shrink-0">
                            <img
                              src={
                                item.variant?.images?.[0] ||
                                item.product?.images?.[0] ||
                                '/placeholder.png'
                              }
                              alt={item.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="font-medium text-sm text-slate-900 line-clamp-1">
                            {item.productName || item.name}
                          </div>
                          {item.sku && (
                            <div className="text-xs text-muted-foreground font-mono mt-0.5 bg-slate-50 inline-block px-1.5 py-0.5 rounded">
                              {item.sku}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-slate-600 py-3">
                          {(item.unitPrice ?? item.salePrice)?.toLocaleString()}{' '}
                          ৳
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold">
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm text-slate-900 pr-4 py-3">
                          {(item.totalPrice ?? item.total)?.toLocaleString()} ৳
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Order Summary */}
              <div className="border-t bg-slate-50/50">
                <div className="flex justify-end px-4 py-3">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        {order.subtotal?.toLocaleString()} ৳
                      </span>
                    </div>
                    {(order.discountAmount || 0) > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Discount</span>
                        <span className="font-medium text-green-600">
                          −{order.discountAmount?.toLocaleString()} ৳
                        </span>
                      </div>
                    )}
                    {(order.vatAmount || 0) > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">VAT</span>
                        <span className="font-medium">
                          {order.vatAmount?.toLocaleString()} ৳
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">
                        {order.shippingCost?.toLocaleString() ?? 0} ৳
                      </span>
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900">
                        Total
                      </span>
                      <span className="font-bold text-lg text-primary">
                        {order.total?.toLocaleString()} ৳
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4 print:grid print:grid-cols-2 print:gap-8 print:space-y-0">
          <Card className="print:shadow-none print:border-none">
            <CardHeader className="pb-3 print:px-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 print:px-0">
              <p className="font-semibold text-sm">
                {order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.username : order.guestInfo?.name || 'Guest'}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.user?.email || order.guestInfo?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.user?.phone || order.guestInfo?.phone}
              </p>

              {order.customerStats && (
                <div className="mt-4 pt-4 border-t space-y-2.5 print:hidden">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Order History</span>
                    <span className="font-semibold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                      {order.customerStats.total} {order.customerStats.total === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Delivery Success Rate</span>
                      <span className={`font-bold ${
                        order.customerStats.successRate >= 80 
                          ? 'text-green-600 dark:text-green-400' 
                          : order.customerStats.successRate >= 50 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-red-600 dark:text-red-400'
                      }`}>
                        {order.customerStats.successRate}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          order.customerStats.successRate >= 80 
                            ? 'bg-green-500' 
                            : order.customerStats.successRate >= 50 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`} 
                        style={{ width: `${order.customerStats.successRate}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-center">
                    <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 p-1.5 rounded">
                      <span className="block text-green-600 dark:text-green-400 font-bold text-sm">
                        {order.customerStats.delivered}
                      </span>
                      <span className="text-muted-foreground">Delivered</span>
                    </div>
                    <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 p-1.5 rounded">
                      <span className="block text-red-600 dark:text-red-400 font-bold text-sm">
                        {order.customerStats.cancelled}
                      </span>
                      <span className="text-muted-foreground">Returned</span>
                    </div>
                  </div>

                  {order.customerStats.total > 1 && order.customerStats.successRate < 75 && (
                    <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 p-2 rounded text-[10px] leading-normal flex items-start gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Caution:</strong> High cancellation/return history detected. Verify client before shipment.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="print:shadow-none print:border-none">
            <CardHeader className="pb-3 print:px-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5 print:px-0">
              {order.shippingAddress &&
              typeof order.shippingAddress === 'object' ? (
                <>
                  {order.shippingAddress.name && (
                    <p className="font-medium">{order.shippingAddress.name}</p>
                  )}
                  <p className="text-muted-foreground">
                    {order.shippingAddress.address}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.zip}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phone && (
                    <p className="text-muted-foreground mt-1">
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  {order.shippingAddress || 'No address provided'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Payment & Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Source</span>
                <Badge variant="outline" className="text-xs">
                  {order.source}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Method</span>
                <span className="text-xs font-medium">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Payment</span>
                <Badge
                  variant={
                    order.paymentStatus === 'PAID' ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {order.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Security & Fraud Blocking */}
          <Card className="print:hidden border-red-100 bg-red-50/10 dark:bg-zinc-900/10 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-950 dark:text-red-400">
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                Security & Fraud Prevention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* IP Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-400" />
                    IP Address
                  </span>
                  {order.ipAddress ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-[10px] uppercase font-bold rounded cursor-pointer"
                      onClick={() => handleBlockClient('IP', order.ipAddress!)}
                      disabled={blockingIp}
                    >
                      {blockingIp ? 'Blocking...' : 'Block IP'}
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Not Tracked</span>
                  )}
                </div>
                <p className="text-xs font-mono font-medium text-slate-800 bg-slate-100/50 p-1.5 rounded border border-slate-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                  {order.ipAddress || '127.0.0.1 (Local)'}
                </p>
              </div>

              {/* Device Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Monitor className="h-3 w-3 text-slate-400" />
                    Device Agent
                  </span>
                  {order.deviceInfo ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-[10px] uppercase font-bold rounded cursor-pointer"
                      onClick={() => handleBlockClient('DEVICE', order.deviceInfo!)}
                      disabled={blockingDevice}
                    >
                      {blockingDevice ? 'Blocking...' : 'Block Device'}
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Not Tracked</span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-600 bg-slate-100/50 p-2 rounded border border-slate-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 line-clamp-3 leading-normal" title={order.deviceInfo || 'Unknown'}>
                  {order.deviceInfo || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Info (Print Only) */}
          <Card className="hidden print:block print:shadow-none print:border-none">
            <CardHeader className="print:px-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="print:px-0 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Invoice #:</span>
                <span className="font-bold">
                  {order.invoiceNumber || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(new Date(order.createdAt), 'dd MMM yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
