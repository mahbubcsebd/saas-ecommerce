"use client";

import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Clock,
    ExternalLink,
    MessageSquare,
    Package,
    Save,
    Truck,
    User,
    XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ReturnService } from "@/services/return.service";
import { format } from "date-fns";

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;
  const id = params.id as string;

  const [returnReq, setReturnReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (accessToken && id) {
      fetchReturnDetails();
    }
  }, [accessToken, id]);

  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      const res = await ReturnService.getReturn(accessToken, id);
      if (res.success && res.data) {
        setReturnReq(res.data);
        setAdminNotes(res.data.adminNotes || "");
      } else {
        toast.error("Failed to load return details");
      }
    } catch (error) {
      console.error("Error fetching return details:", error);
      toast.error("An error occurred while loading details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const res = await ReturnService.updateStatus(accessToken, id, newStatus);
      if (res.success) {
        toast.success(`Return request ${newStatus.toLowerCase()} successfully`);
        fetchReturnDetails();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred during update");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Clock className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!returnReq) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Return Request Not Found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/dashboard/returns">Back to Returns</Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">Pending Review</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">Approved</Badge>;
      case "REFUNDED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">Refunded</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/returns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{returnReq.rmaId}</h1>
              {getStatusBadge(returnReq.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {format(new Date(returnReq.createdAt), "PPP p")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
            {returnReq.status === 'PENDING' && (
                <>
                    <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleUpdateStatus('REJECTED')} disabled={updating}>
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button onClick={() => handleUpdateStatus('APPROVED')} disabled={updating}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                </>
            )}
            {returnReq.status === 'APPROVED' && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('REFUNDED')} disabled={updating}>
                    <Package className="w-4 h-4 mr-2" /> Process Refund
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Return Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Product</Label>
                  <p className="font-semibold text-lg mt-1">{returnReq.productName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Quantity to Return</Label>
                  <p className="font-semibold text-lg mt-1">{returnReq.quantity} Units</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Requested Refund</Label>
                  <p className="font-semibold text-lg mt-1 text-destructive">{returnReq.refundAmount.toLocaleString()} BDT</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Linked Order</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold">{returnReq.order?.orderNumber || "Order Lookup..."}</span>
                    <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                        <Link href={`/dashboard/orders/${returnReq.orderId}`}><ExternalLink className="w-3 h-3"/></Link>
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Customer Reason</Label>
                <div className="mt-2 p-4 bg-muted/30 rounded-lg border italic">
                    "{returnReq.reason}"
                </div>
              </div>

              {returnReq.images && returnReq.images.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Proof Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    {returnReq.images.map((img: string, i: number) => (
                      <div key={i} className="aspect-square rounded-md overflow-hidden border bg-muted flex items-center justify-center relative group">
                        <img src={img} alt={`Proof ${i+1}`} className="object-cover w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" onClick={() => window.open(img, '_blank')}>View Large</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Processing</CardTitle>
              <CardDescription>Only visible to staff and admins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="notes">Admin Notes</Label>
                 <Textarea
                    id="notes"
                    placeholder="Add internal notes about this return request..."
                    rows={4}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                 />
               </div>
               <div className="flex justify-end">
                  <Button variant="outline" onClick={async () => {
                    setUpdating(true);
                    // Just save notes without changing status
                    const res = await ReturnService.updateStatus(accessToken, id, returnReq.status, adminNotes);
                    if(res.success) toast.success("Notes saved");
                    setUpdating(false);
                  }} disabled={updating}>
                    <Save className="w-4 h-4 mr-2" /> Save Notes
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <User className="w-4 h-4"/> Customer Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-tighter">Full Name</Label>
                        <p className="font-medium">{returnReq.user?.username || "Guest"}</p>
                    </div>
                    <div className="text-sm">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-tighter">Email Address</Label>
                        <p className="font-medium truncate">{returnReq.user?.email}</p>
                    </div>
                    <div className="text-sm">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-tighter">Phone Number</Label>
                        <p className="font-medium">{returnReq.user?.phone || "N/A"}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Truck className="w-4 h-4"/> Logistics Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 bg-muted/40 rounded-md border text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Original Order:</span>
                            <span className="font-medium">{returnReq.order?.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment:</span>
                            <span className="font-medium">{returnReq.order?.paymentStatus}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md border border-yellow-100 dark:border-yellow-900/50">
                        <MessageSquare className="w-4 h-4 mt-0.5 text-yellow-600"/>
                        <p className="text-xs">Processing a refund will automatically increment <strong>Returned Quantity</strong> and create a stock movement inward.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
