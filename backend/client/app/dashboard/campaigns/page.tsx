"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h2>
          <p className="text-muted-foreground mt-1">Design and send marketing messages to your audience.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> New Campaign
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : campaigns.length}</div>
            <p className="text-xs text-muted-foreground">Active lifetime campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent Messages</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : campaigns.reduce((a, b) => a + b.sentCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Successfully transmitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : campaigns.reduce((a, b) => a + b.openCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Unique recipient views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {loading ? "—" : (() => {
                const sent = campaigns.reduce((a, b) => a + b.sentCount, 0);
                const opened = campaigns.reduce((a, b) => a + b.openCount, 0);
                return sent > 0 ? `${((opened / sent) * 100).toFixed(1)}%` : "0%";
                })()}
            </div>
            <p className="text-xs text-muted-foreground">Engagement efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-9 h-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">Campaign</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Stats</TableHead>
                            <TableHead className="font-semibold">Created</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" /></TableCell></TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground">No campaigns found.</TableCell></TableRow>
                        ) : filtered.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{c.name}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-1">{c.subject || "No subject"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(c.type)}
                                        <span className="text-xs capitalize">{c.type.toLowerCase()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(c.status)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Sent</span>
                                            <span className="text-xs font-semibold">{c.sentCount}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Opens</span>
                                            <span className="text-xs font-semibold">{c.openCount}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {format(new Date(c.createdAt), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Link href={`/dashboard/campaigns/${c.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <BarChart2 className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {c.status === "DRAFT" && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                                onClick={() => handleDelete(c.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
