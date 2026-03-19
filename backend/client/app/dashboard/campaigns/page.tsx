"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { format } from "date-fns";
import {
    BarChart2,
    Bell,
    Eye,
    Loader2,
    Mail,
    Megaphone,
    MessageSquare,
    Plus,
    Search,
    Send,
    Trash2
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type Campaign = {
  id: string;
  name: string;
  subject?: string;
  type: "EMAIL" | "SMS" | "PUSH";
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  createdAt: string;
  sentAt?: string;
  _count?: { recipients: number };
};

export default function CampaignsPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCampaigns = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch (err) {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Campaign",
        message: "Are you sure you want to delete this marketing campaign? Any pending scheduled triggers will be aborted.",
        type: "danger",
        confirmText: "Delete"
    })) return;
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Campaign deleted");
        fetchCampaigns();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sent</Badge>;
      case "SENDING": return <Badge className="bg-blue-100 text-blue-700 animate-pulse">Sending</Badge>;
      case "SCHEDULED": return <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "EMAIL": return <Mail className="h-4 w-4 text-blue-500" />;
      case "SMS": return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "PUSH": return <Bell className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Design and send marketing messages to your audience.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Campaigns</p>
                <p className="text-2xl font-bold">{loading ? "—" : campaigns.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Sent Messages</p>
                <p className="text-2xl font-bold">{loading ? "—" : campaigns.reduce((a, b) => a + b.sentCount, 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Opens</p>
                <p className="text-2xl font-bold">{loading ? "—" : campaigns.reduce((a, b) => a + b.openCount, 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg. Open Rate</p>
                <p className="text-2xl font-bold">
                  {loading ? "—" : (() => {
                    const sent = campaigns.reduce((a, b) => a + b.sentCount, 0);
                    const opened = campaigns.reduce((a, b) => a + b.openCount, 0);
                    return sent > 0 ? `${((opened / sent) * 100).toFixed(1)}%` : "0%";
                  })()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16 text-slate-400">No campaigns found.</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="hover:bg-slate-50/50">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <span className="text-xs text-slate-500 line-clamp-1">{c.subject || "No subject"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(c.type)}
                    <span className="text-xs capitalize font-medium">{c.type.toLowerCase()}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(c.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-slate-400">Sent</span>
                      <span className="text-xs font-bold">{c.sentCount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-black text-slate-400">Opens</span>
                      <span className="text-xs font-bold">{c.openCount}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {format(new Date(c.createdAt), "MMM dd, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/dashboard/campaigns/${c.id}`}>
                      <Button variant="ghost" size="icon"><BarChart2 className="h-4 w-4" /></Button>
                    </Link>
                    {c.status === "DRAFT" && (
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
