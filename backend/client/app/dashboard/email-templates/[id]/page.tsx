"use client";

import EmailBuilder from "@/components/email/EmailBuilder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ChevronLeft,
  Loader2,
  Mail,
  Save,
  Settings
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const EMAIL_API = `${API_BASE}/email-templates`;

export default function EmailTemplateEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form State for Metadata
  const [form, setForm] = useState({
    name: "",
    subject: "",
    type: "CUSTOM",
    isActive: true
  });

  const fetchTemplate = async () => {
    if (!token || id === "new") {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${EMAIL_API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTemplate(data.data);
        setForm({
          name: data.data.name,
          subject: data.data.subject,
          type: data.data.type || "CUSTOM",
          isActive: data.data.isActive
        });
      }
    } catch (error) {
      toast.error("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [token, id]);

  const handleSaveDesign = async (builderData: { html: string; design: string }) => {
    if (!token) return;
    setSaving(true);
    try {
      const isNew = id === "new";
      const url = isNew ? EMAIL_API : `${EMAIL_API}/${id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...form,
        body: builderData.html,
        design: builderData.design,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isNew ? "Template created!" : "Template updated!");
        if (isNew) router.push(`/dashboard/email-templates/${data.data.id}`);
      } else {
        toast.error(data.message || "Save failed");
      }
    } catch (error) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium">Initializing Email Designer...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b bg-background flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/dashboard/email-templates")}>
            <ChevronLeft size={20} />
          </Button>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[300px] leading-tight">
              {form.name || "Untitled Template"}
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {id === "new" ? "New Design" : `Last Edited: ${new Date(template?.updatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Settings size={14} className="mr-2" /> Template Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="text-blue-500" size={18} />
                  Email Configuration
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">Template Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Monthly Newsletter"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-semibold">Default Subject Line</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Check out our latest updates!"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-semibold">Template Category</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Custom Template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOM">Custom Template</SelectItem>
                      <SelectItem value="ORDER_CONFIRMATION">Order Confirmation</SelectItem>
                      <SelectItem value="SHIPPING_NOTIFICATION">Shipping Notification</SelectItem>
                      <SelectItem value="DELIVERY_NOTIFICATION">Delivery Notification</SelectItem>
                      <SelectItem value="WELCOME_EMAIL">Welcome Email</SelectItem>
                      <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                      <SelectItem value="PROMOTION">Promotional / Sale</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Category determines where this template can be used.</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)} className="w-full h-9">
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="h-8 w-px bg-border mx-1" />
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-2" />
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </header>

      {/* Builder Main View */}
      <main className="flex-1 overflow-hidden p-6 bg-slate-100/50 relative">
        <div className="h-full rounded-xl border bg-background shadow-sm overflow-hidden">
          <EmailBuilder
            initialData={template ? { html: template.body, design: template.design } : undefined}
            onSave={handleSaveDesign}
            variables={template?.variables || [
              { key: "customer_name", label: "Customer Name" },
              { key: "order_number", label: "Order Number" },
              { key: "order_total", label: "Order Total" },
              { key: "shop_link", label: "Shop Link" },
              { key: "reset_link", label: "Reset Link" }
            ]}
          />
        </div>
      </main>

      {/* Floating Status */}
      {saving && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 z-50 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
          <Loader2 className="animate-spin h-3.5 w-3.5" />
          <span className="text-xs font-bold">Saving changes...</span>
        </div>
      )}
    </div>
  );
}
