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
    Settings
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const EMAIL_API = `${API_BASE}/api/email-templates`;

export default function EmailTemplateEditorPage() {
  const { id } = useParams();
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
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
          <p className="text-slate-500 font-medium tracking-tight">Initializing Designer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/email-templates")}>
            <ChevronLeft size={20} />
          </Button>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px] leading-tight">
              {form.name || "Untitled Template"}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              {id === "new" ? "New Draft" : `Last Edited: ${new Date(template?.updatedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 font-bold">
                <Settings size={16} className="mr-2" /> Template Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="text-blue-500" size={20} />
                  Email Template Settings
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Template Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Black Friday Launch"
                    className="h-11 bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Subject</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    placeholder="e.g. Get 20% off your next purchase!"
                    className="h-11 bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-xs font-bold uppercase tracking-widest text-slate-400">System Category</Label>
                  <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Custom Template (Default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOM">Custom Template</SelectItem>
                      <SelectItem value="ORDER_CONFIRMATION">Order Confirmation</SelectItem>
                      <SelectItem value="SHIPPING_NOTIFICATION">Shipping Notification</SelectItem>
                      <SelectItem value="DELIVERY_NOTIFICATION">Delivery Notification</SelectItem>
                      <SelectItem value="WELCOME_EMAIL">Welcome Email</SelectItem>
                      <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                      <SelectItem value="PROMOTION">Promotional / Sale</SelectItem>
                      <SelectItem value="USER_DIRECT">User Direct Message</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 italic">Selecting a category links this design to specific system events.</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 rounded-xl">
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Builder Main View */}
      <main className="flex-1 overflow-hidden p-6 relative">
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
      </main>

      {/* Floating Status (Optional) */}
      {saving && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-3 animate-bounce z-50 border border-white/20">
          <Loader2 className="animate-spin h-4 w-4" />
          <span className="text-xs font-bold tracking-tight">Syncing Changes...</span>
        </div>
      )}
    </div>
  );
}
