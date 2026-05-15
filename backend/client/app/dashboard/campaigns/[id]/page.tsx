"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    AlertTriangle,
    ChevronLeft,
    Clock,
    Eye,
    Loader2,
    Mail,
    RefreshCw,
    Send,
    Users
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Recipient = {
  id: string;
  email: string;
  status: "PENDING" | "SENT" | "FAILED" | "OPENED";
  sentAt?: string;
  openedAt?: string;
};

type Campaign = {
  id: string;
  name: string;
  subject?: string;
  status: string;
  type: string;
  content: string;
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string;
  recipients: Recipient[];
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!token || !params.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/campaigns/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCampaign(data.data);
    } catch {
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [token, params.id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading && !campaign) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-black" /></div>;
  }

  if (!campaign) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 mx-auto text-orange-400" />
        <h2 className="text-2xl font-bold">Campaign not found</h2>
        <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const openRate = campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{campaign.name}</h2>
            <p className="text-muted-foreground mt-1">Campaign Analytics & Delivery Report</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchDetails}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Stats
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Target", value: campaign.totalRecipients, sub: "Recipients", icon: Users },
          { label: "Successfully Sent", value: campaign.sentCount, sub: `${campaign.totalRecipients > 0 ? ((campaign.sentCount / campaign.totalRecipients) * 100).toFixed(1) : 0}% Delivery`, icon: Send },
          { label: "Opened", value: campaign.openCount, sub: `${openRate}% Open Rate`, icon: Eye },
          { label: "Failed", value: campaign.failedCount, sub: "Error during sending", icon: AlertTriangle },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recipient Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Delivery List</CardTitle>
            <CardDescription>{campaign.recipients.length} detailed logs found.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Recipient</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Sent At</TableHead>
                            <TableHead className="font-semibold text-xs uppercase tracking-wider">Opened At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaign.recipients.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium text-sm">{r.email}</TableCell>
                                <TableCell>
                                    <Badge variant={r.status === 'SENT' ? 'secondary' : r.status === 'OPENED' ? 'default' : 'destructive'} className="text-[10px] px-2 py-0">
                                        {r.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{r.sentAt ? format(new Date(r.sentAt), "HH:mm, MMM dd") : "—"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{r.openedAt ? format(new Date(r.openedAt), "HH:mm, MMM dd") : "—"}</TableCell>
                            </TableRow>
                        ))}
                        {campaign.recipients.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No recipients tracked yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> 
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Campaign Created</span>
              <span className="text-sm font-medium">{format(new Date(campaign.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
            </div>
            {campaign.sentAt && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Delivery Finished</span>
                <span className="text-sm font-medium text-green-600">{format(new Date(campaign.sentAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Preview (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" /> 
            Content Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Subject Line</p>
            <p className="text-sm font-medium">{campaign.subject || "No subject"}</p>
          </div>
          <div className="border rounded-md p-4 bg-slate-50/50 min-h-[200px] overflow-y-auto">
            <div className="prose prose-sm max-w-none text-xs" dangerouslySetInnerHTML={{ __html: campaign.content }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
