"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Mail,
    Megaphone,
    Send,
    Users
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

type Group = { id: string; name: string };

export default function NewCampaignPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || "";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  const [form, setForm] = useState({
    name: "",
    subject: "",
    type: "EMAIL",
    content: "",
    targetType: "ALL",
    targetGroupIds: [] as string[],
    targetUserIds: [] as string[],
    scheduledAt: "",
  });

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/customer-groups`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.success) setGroups(data.data); });
    }
  }, [token]);

  const handleCreate = async (sendNow: boolean) => {
    if (!form.name || !form.content) return toast.error("Required fields missing");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          status: sendNow ? "SENDING" : (form.scheduledAt ? "SCHEDULED" : "DRAFT")
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (sendNow) {
          // Trigger send API
          await fetch(`${API_BASE}/campaigns/${data.data.id}/send`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success("Campaign sent successfully!");
        } else {
          toast.success("Campaign created!");
        }
        router.push("/dashboard/campaigns");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Configuration", icon: Megaphone },
    { id: 2, title: "Audience", icon: Users },
    { id: 3, title: "Content", icon: Mail },
    { id: 4, title: "Review", icon: Check },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft /></Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">Design a new marketing message.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        {steps.map((s) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
              step >= s.id ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-400"
            }`}>
              <s.icon className="h-5 w-5" />
            </div>
            <span className={`text-xs font-bold ${step >= s.id ? "text-blue-600" : "text-slate-400"}`}>{s.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="shadow-sm border-0 bg-slate-50/50">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Campaign Name (Internal)</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Summer Sale 2024" />
                <p className="text-[10px] text-slate-500">Only visible to admins. Use a descriptive name.</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Channel Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email Campaign</SelectItem>
                      <SelectItem value="SMS">SMS Campaign (Mock)</SelectItem>
                      <SelectItem value="PUSH">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.type === 'EMAIL' && (
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="e.g. You don't want to miss this!" />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-lg font-bold">Who should receive this?</Label>
                <RadioGroup value={form.targetType} onValueChange={v => setForm({...form, targetType: v})} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${form.targetType === 'ALL' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'}`} onClick={() => setForm({...form, targetType: 'ALL'})}>
                    <RadioGroupItem value="ALL" className="mt-1" />
                    <div>
                      <p className="font-bold text-sm">All Customers</p>
                      <p className="text-[10px] text-slate-500">Reach everyone in your database.</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${form.targetType === 'GROUP' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'}`} onClick={() => setForm({...form, targetType: 'GROUP'})}>
                    <RadioGroupItem value="GROUP" className="mt-1" />
                    <div>
                      <p className="font-bold text-sm">Customer Groups</p>
                      <p className="text-[10px] text-slate-500">Target specific segments.</p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${form.targetType === 'CUSTOM' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'}`} onClick={() => setForm({...form, targetType: 'CUSTOM'})}>
                    <RadioGroupItem value="CUSTOM" className="mt-1" />
                    <div>
                      <p className="font-bold text-sm">Custom List</p>
                      <p className="text-[10px] text-slate-500">Select individual users manually.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {form.targetType === 'GROUP' && (
                <div className="space-y-3 p-6 bg-white rounded-xl border border-slate-200">
                  <Label>Select Groups</Label>
                  <div className="flex flex-wrap gap-2">
                    {groups.map(g => (
                      <Badge
                        key={g.id}
                        variant={form.targetGroupIds.includes(g.id) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => {
                          const ids = form.targetGroupIds.includes(g.id)
                            ? form.targetGroupIds.filter(i => i !== g.id)
                            : [...form.targetGroupIds, g.id];
                          setForm({...form, targetGroupIds: ids});
                        }}
                      >
                        {g.name}
                      </Badge>
                    ))}
                    {groups.length === 0 && <p className="text-xs text-slate-400">No customer groups available.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-bold">Content Editor</Label>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase font-black"><AlertCircle className="h-3 w-3" /> HTML Support Active</div>
              </div>
              {form.type === 'EMAIL' ? (
                <div className="grid grid-cols-2 gap-6 min-h-[400px]">
                  <div className="space-y-2">
                    <Label className="text-xs">HTML/Plain Text Source</Label>
                    <Textarea
                      value={form.content}
                      onChange={e => setForm({...form, content: e.target.value})}
                      placeholder="Start writing your email content here (HTML supported)..."
                      className="h-full resize-none font-mono text-sm leading-relaxed"
                    />
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-xs">Live Preview</Label>
                    <div className="flex-1 bg-white border rounded-lg p-4 overflow-y-auto break-words shadow-inner" dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-slate-300 text-center mt-20 italic">Recipient preview will appear here...</p>' }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-w-md">
                  <Label>Message Content</Label>
                  <Textarea
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                    placeholder="Type your message..."
                    className="h-40"
                    maxLength={160}
                  />
                  <p className="text-right text-[10px] text-slate-400 font-bold">{form.content.length}/160 characters</p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold border-b pb-2">Campaign Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-1 border-b border-dashed"><span className="text-slate-500 text-sm">Name:</span> <span className="font-bold">{form.name}</span></div>
                    <div className="flex justify-between py-1 border-b border-dashed"><span className="text-slate-500 text-sm">Channel:</span> <Badge>{form.type}</Badge></div>
                    {form.subject && <div className="flex justify-between py-1 border-b border-dashed"><span className="text-slate-500 text-sm">Subject:</span> <span className="font-bold">{form.subject}</span></div>}
                    <div className="flex justify-between py-1 border-b border-dashed"><span className="text-slate-500 text-sm">Target:</span> <span className="font-bold">{form.targetType}</span></div>
                  </div>

                  <div className="space-y-2 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <Label className="text-orange-800 font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Schedule for later?</Label>
                    <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} className="bg-white border-orange-200" />
                    <p className="text-[10px] text-orange-600 italic">Leave blank to send immediately or save as draft.</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border shadow-sm p-6 overflow-hidden max-h-[400px]">
                  <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Final Preview</h4>
                  <div className="prose prose-sm max-w-none overflow-y-auto h-full pr-2" dangerouslySetInnerHTML={{ __html: form.content || 'Nothing to preview.' }} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 px-10">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-3">
          {step === 4 ? (
            <>
              <Button variant="secondary" onClick={() => handleCreate(false)} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save as Draft"}
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleCreate(true)} disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="mr-2 h-4 w-4" /> Send Now</>}
              </Button>
            </>
          ) : (
            <Button onClick={() => setStep(s => s + 1)}>
              Next Step <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
