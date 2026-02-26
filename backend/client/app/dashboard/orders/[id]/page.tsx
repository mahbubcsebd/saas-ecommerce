"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { format } from "date-fns";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    CreditCard,
    Download,
    FileText,
    Loader2,
    MapPin,
    Package,
    Printer,
    Receipt,
    User
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Order, OrderService } from "@/services/order.service";

export default function OrderDetailsPage() {
  const { confirm } = useConfirm();
  const { id } = useParams();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      if (typeof id === 'string') {
          const res = await OrderService.getOrder(accessToken, id);
          if (res.success) {
            setOrder(res.data);
          } else {
             toast.error("Failed to load order");
          }
      }
    } catch (error) {
      console.error("Failed to fetch order", error);
      toast.error("Error loading order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && id) {
      fetchOrder();
    }
  }, [accessToken, id]);

  const handleStatusUpdate = async (status: string) => {
      try {
          setUpdating(true);
          const res = await OrderService.updateStatus(accessToken, order!.id, status);
          if (res.success) {
              toast.success(`Order status updated to ${status}`);
              setOrder(res.data);
          } else {
              toast.error("Failed to update status");
          }
      } catch (error) {
          console.error("Update status error", error);
          toast.error("Error updating status");
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
          toast.success("Invoice downloaded");
      } catch (error) {
          console.error("Download error", error);
          toast.error("Failed to download invoice");
      } finally {
          setDownloading(false);
      }
  };

  const handlePrint = () => {
      window.print();
  };

  if (loading) {
      return <div className="flex w-full h-screen justify-center items-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  if (!order) {
      return <div className="p-8 text-center text-muted-foreground">Order not found</div>
  }

  // Status Steps
  const steps = [
      { status: 'PENDING', label: 'Order Placed' },
      { status: 'PROCESSING', label: 'Processing' },
      { status: 'SHIPPED', label: 'Shipped' },
      { status: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status) !== -1
        ? steps.findIndex(s => s.status === order.status)
        : (order.status === 'COMPLETED' ? 4 : (order.status === 'CANCELLED' ? -1 : 0));

  return (
    <div className="space-y-8 print:p-0 print:space-y-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/orders">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    Order {order.orderNumber}
                    <Badge variant={order.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                        {order.status}
                    </Badge>
                </h1>
                <p className="text-muted-foreground text-sm">
                    {format(new Date(order.createdAt), "MMMM do, yyyy 'at' h:mm a")}
                </p>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
            <Button variant="outline" onClick={handlePrint}>
                <Receipt className="mr-2 h-4 w-4" />
                POS Print
            </Button>
            <Button variant="default" onClick={handleDownloadInvoice} disabled={downloading}>
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download PDF
            </Button>
             <Select
                disabled={updating}
                value={order.status}
                onValueChange={handleStatusUpdate}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
            </Select>
            {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                <Button
                    variant="destructive"
                    onClick={async () => {
                        if (await confirm({
                            title: "Cancel Order",
                            message: "Are you sure you want to cancel this order? Stock will be restored to inventory and this action may be difficult to reverse.",
                            type: "danger",
                            confirmText: "Cancel Order"
                        })) {
                            handleStatusUpdate('CANCELLED');
                        }
                    }}
                    disabled={updating}
                >
                    Cancel Order
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

              {/* Order Status Timeline (Hidden in Print) */}
              {order.status !== 'CANCELLED' && (
                  <Card className="print:hidden">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-base font-medium">Order Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="relative flex items-center justify-between w-full">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10" />
                                {steps.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex || order.status === 'COMPLETED';
                                    const isCurrent = index === currentStepIndex;

                                    return (
                                        <div key={step.status} className="flex flex-col items-center bg-background px-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-background border-gray-300 text-gray-300'}`}>
                                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                            </div>
                                            <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    )
                                })}
                          </div>
                      </CardContent>
                  </Card>
              )}

              {/* Order Items */}
              <Card className="print:shadow-none print:border-none">
                  <CardHeader className="print:px-0">
                      <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          Order Items
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="print:px-0">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[80px] print:hidden">Image</TableHead>
                                  <TableHead>Product</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {order.items?.map((item) => (
                                  <TableRow key={item.id}>
                                      <TableCell className="print:hidden">
                                        <div className="relative h-12 w-12 rounded overflow-hidden border">
                                            <img
                                                src={item.variant?.images?.[0] || item.product?.images?.[0] || "/placeholder.png"}
                                                alt={item.name}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                          <div className="font-medium">
                                              {item.name}
                                          </div>
                                          <div className="text-xs text-muted-foreground">{item.sku}</div>
                                      </TableCell>
                                      <TableCell className="text-right">{item.salePrice?.toLocaleString()} BDT</TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right font-medium">{item.total?.toLocaleString()} BDT</TableCell>
                                  </TableRow>
                              ))}

                              <TableRow>
                                  <TableCell colSpan={3} className="text-right font-medium print:hidden">Subtotal</TableCell>
                                  <TableCell className="text-right font-medium hidden print:table-cell" colSpan={3}>Subtotal</TableCell>
                                  <TableCell className="text-right">{order.subtotal?.toLocaleString()} BDT</TableCell>
                              </TableRow>
                              {(order.discountAmount || 0) > 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium text-green-600 print:hidden">Discount</TableCell>
                                    <TableCell className="text-right font-medium text-green-600 hidden print:table-cell" colSpan={3}>Discount</TableCell>
                                    <TableCell className="text-right text-green-600">-{order.discountAmount?.toLocaleString()} BDT</TableCell>
                                </TableRow>
                              )}
                              {(order.vatAmount || 0) > 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right font-medium print:hidden">VAT</TableCell>
                                    <TableCell className="text-right font-medium hidden print:table-cell" colSpan={3}>VAT</TableCell>
                                    <TableCell className="text-right">{order.vatAmount?.toLocaleString()} BDT</TableCell>
                                </TableRow>
                              )}
                              <TableRow>
                                  <TableCell colSpan={3} className="text-right font-medium print:hidden">Shipping</TableCell>
                                  <TableCell className="text-right font-medium hidden print:table-cell" colSpan={3}>Shipping</TableCell>
                                  <TableCell className="text-right">{order.shippingCost?.toLocaleString()} BDT</TableCell>
                              </TableRow>
                              <TableRow>
                                  <TableCell colSpan={3} className="text-right font-bold text-lg print:hidden">Total</TableCell>
                                  <TableCell className="text-right font-bold text-lg hidden print:table-cell" colSpan={3}>Total</TableCell>
                                  <TableCell className="text-right font-bold text-lg">{order.total?.toLocaleString()} BDT</TableCell>
                              </TableRow>
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6 print:grid print:grid-cols-2 print:gap-8 print:space-y-0">
              <Card className="print:shadow-none print:border-none">
                  <CardHeader className="print:px-0">
                      <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          Customer Info
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 print:px-0">
                      <div className="grid gap-1">
                          <p className="font-medium">{order.user?.username || order.guestInfo?.name || "Guest"}</p>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                              <span className="truncate">{order.user?.email || order.guestInfo?.email}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                              <span>{order.user?.phone || order.guestInfo?.phone}</span>
                          </div>
                      </div>
                  </CardContent>
              </Card>

              <Card className="print:shadow-none print:border-none">
                  <CardHeader className="print:px-0">
                      <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          Shipping Address
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 print:px-0">
                      <div className="text-sm">
                        {order.shippingAddress && typeof order.shippingAddress === 'object' ? (
                            <>
                                {order.shippingAddress.name && <p className="font-medium">{order.shippingAddress.name}</p>}
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                                <p>{order.shippingAddress.country}</p>
                                {order.shippingAddress.phone && <p className="mt-1">{order.shippingAddress.phone}</p>}
                            </>
                        ) : (
                            <p className="text-muted-foreground">{order.shippingAddress || "No shipping address provided"}</p>
                        )}
                      </div>
                  </CardContent>
              </Card>

              <Card className="print:hidden">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                          Payment & Source
                      </CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-4">
                       <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Order Source</span>
                            <Badge variant="outline">{order.source}</Badge>
                        </div>
                       <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Payment Method</span>
                            <span className="font-medium">{order.paymentMethod}</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Payment Status</span>
                            <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}>{order.paymentStatus}</Badge>
                        </div>
                   </CardContent>
              </Card>

              {/* Invoice Info (Visible only in Print or Details) */}
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
                          <span className="font-bold">{order.invoiceNumber || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{format(new Date(order.createdAt), "dd MMM yyyy")}</span>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
