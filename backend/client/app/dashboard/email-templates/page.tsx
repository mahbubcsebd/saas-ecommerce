"use client";

import { CampaignComposer } from "@/components/email/CampaignComposer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CheckCircle,
  Copy,
  Eye,
  History,
  Loader2,
  Mail,
  MoreVertical,
  Search,
  Send,
  Trash2,
  Zap
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const EMAIL_API = `${API_BASE}/email-templates`;

// Transactional system templates (hardcoded, always available)
const SYSTEM_TEMPLATES = [
  { id: "welcome", name: "Welcome Email", type: "WELCOME_EMAIL", description: "Sent automatically when a user registers", trigger: "Auto: On Registration", color: "text-blue-500", bg: "bg-blue-50" },
  { id: "forgot-password", name: "Password Reset", type: "PASSWORD_RESET", description: "Sent automatically when a user requests password reset", trigger: "Auto: On Reset Request", color: "text-rose-500", bg: "bg-rose-50" },
  { id: "order-confirmation", name: "Order Confirmation", type: "ORDER_CONFIRMATION", description: "Sent automatically after an order is placed", trigger: "Auto: On Order Placed", color: "text-emerald-500", bg: "bg-emerald-50" },
  { id: "shipping-notification", name: "Shipping Notification", type: "SHIPPING_NOTIFICATION", description: "Sent when an order is marked as shipped", trigger: "Auto: On Shipped", color: "text-purple-500", bg: "bg-purple-50" },
];

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  type: string | null;
  body: string;
  isActive: boolean;
  updatedAt: string;
  variables?: any[];
};

export default function EmailTemplatesPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const fetchTemplates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(EMAIL_API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch { toast.error("Failed to load templates"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, [token]);

  const handleDelete = async (id: string) => {
    if (!await confirm({
      title: "Delete Template",
      message: "Are you sure you want to delete this email template? This action cannot be undone and may affect scheduled campaigns.",
      type: "danger",
      confirmText: "Delete Template"
    })) return;
    const res = await fetch(`${EMAIL_API}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); fetchTemplates(); }
    else toast.error(data.message || "Delete failed");
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`${EMAIL_API}/${id}/duplicate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { toast.success("Duplicated"); fetchTemplates(); }
    else toast.error(data.message || "Duplicate failed");
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground mt-1">Manage transactional emails and automated campaigns.</p>
        </div>
        <Button onClick={() => setComposerOpen(true)}>
          <Send className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* KPI/Summary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Designs</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : templates.length}</div>
            <p className="text-xs text-muted-foreground">Reusable campaign templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Flows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{SYSTEM_TEMPLATES.length}</div>
            <p className="text-xs text-muted-foreground">System-triggered sequences</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.length > 0 ? format(new Date(templates[0].updatedAt), "dd MMM") : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Recent template activity</p>
          </CardContent>
        </Card>
      </div>

      {/* System Templates (Auto-Triggered) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-4 w-4 text-amber-500 fill-current" />
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">System Automations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_TEMPLATES.map((t) => (
            <Card key={t.id} className="relative group overflow-hidden border-muted/60">
              <div className={cn("absolute top-0 right-0 p-3 opacity-10", t.color)}>
                <Zap className="h-10 w-10" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("h-2 w-2 rounded-full", t.bg.replace("bg-", "bg-").replace("50", "500"))} />
                  <CardTitle className="text-sm">{t.name}</CardTitle>
                </div>
                <CardDescription className="text-xs line-clamp-1">{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-[10px] font-bold bg-muted/50 border-none px-2 py-0.5">
                  <CheckCircle size={9} className="mr-1 text-emerald-500" /> {t.trigger}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Templates */}
      <div className="space-y-4 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Campaign Library ({templates.length})</h3>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9 h-9 text-xs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-40 bg-muted/30 animate-pulse border-dashed" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-20 text-center border-dashed bg-muted/5">
            <Mail className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-muted-foreground">No custom templates found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Start by creating a new email campaign or template.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Card key={t.id} className="group transition-all hover:border-blue-200">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className="min-w-0 pr-4">
                    <CardTitle className="text-sm truncate">{t.name}</CardTitle>
                    <CardDescription className="text-xs truncate mt-0.5">{t.subject}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(t)} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(t.id)} className="cursor-pointer">
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    {t.type && (
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-none font-bold px-2 py-0">
                        {t.type.replace(/_/g, " ")}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold border-none px-2 py-0",
                      t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {t.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t text-[10px] text-muted-foreground">
                    <span className="font-medium uppercase tracking-tighter">Updated</span>
                    <span className="font-bold">{format(new Date(t.updatedAt), "dd MMM, yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Composer Modal */}
      <CampaignComposer isOpen={composerOpen} onClose={() => setComposerOpen(false)} />

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden h-[85vh] flex flex-col border-none shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0 bg-background">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{previewTemplate?.name}</DialogTitle>
                <p className="text-xs text-muted-foreground line-clamp-1">{previewTemplate?.subject}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)} className="h-8">Close</Button>
          </DialogHeader>

          <div className="flex-1 bg-muted/10 p-4 overflow-hidden">
            <div className="bg-white rounded-lg border h-full overflow-hidden shadow-sm">
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8 bg-white font-sans">${previewTemplate?.body}</body></html>`}
                className="w-full h-full border-0"
                title="Email Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
