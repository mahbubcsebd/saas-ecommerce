"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    User
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  }

  if (!campaign) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 mx-auto text-orange-400" />
        <h2 className="text-2xl font-bold">Campaign not found</h2>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const openRate = campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">Campaign Analytics & Delivery Report</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchDetails}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Stats
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Target", value: campaign.totalRecipients, sub: "Recipients", icon: User, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Successfully Sent", value: campaign.sentCount, sub: `${((campaign.sentCount / campaign.totalRecipients) * 100).toFixed(1)}% Delivery`, icon: Send, color: "text-green-600", bg: "bg-green-50" },
          { label: "Opened", value: campaign.openCount, sub: `${openRate}% Open Rate`, icon: Eye, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Failed", value: campaign.failedCount, sub: "Error during sending", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recipient Table */}
        <Card className="lg:col-span-2 shadow-sm">
          <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Delivery List</h3>
            <Badge variant="outline">{campaign.recipients.length} Detailed Logs</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Opened At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.recipients.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-slate-700">{r.email}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'SENT' ? 'secondary' : r.status === 'OPENED' ? 'default' : 'destructive'}
                      className={r.status === 'OPENED' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : ''}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{r.sentAt ? format(new Date(r.sentAt), "HH:mm, MMM dd") : "—"}</TableCell>
                  <TableCell className="text-xs text-slate-500">{r.openedAt ? format(new Date(r.openedAt), "HH:mm, MMM dd") : "—"}</TableCell>
                </TableRow>
              ))}
              {campaign.recipients.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">No recipients tracked yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Info & Content Preview */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <div className="p-5 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-800 italic flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-slate-400">Campaign Created</span>
                  <span className="text-sm font-bold text-slate-700">Dec 20, 2024 at 10:00 AM</span>
                </div>
              </div>
              {campaign.sentAt && (
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400">Delivery Finished</span>
                    <span className="text-sm font-bold text-slate-700">{format(new Date(campaign.sentAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Content Preview</h3>
              <Mail className="h-4 w-4 text-slate-400" />
            </div>
            <div className="p-5 bg-white max-h-[400px] overflow-y-auto">
              <div className="mb-4 text-xs">
                <p><strong>Subject:</strong> {campaign.subject}</p>
              </div>
              <div className="border rounded p-4 text-[13px] bg-slate-50 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: campaign.content }} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
