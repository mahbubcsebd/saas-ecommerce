'use client';

import { CampaignComposer } from '@/components/email/CampaignComposer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    CheckCircle,
    Copy,
    Eye,
    Mail,
    MoreVertical,
    Search,
    Send,
    Trash2,
    Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const EMAIL_API = `${API_BASE}/email-templates`;

// Transactional system templates (hardcoded, always available)
const SYSTEM_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email', type: 'WELCOME_EMAIL', description: 'Sent automatically when a user registers', trigger: 'Auto: On Registration', color: 'bg-blue-500' },
  { id: 'forgot-password', name: 'Password Reset', type: 'PASSWORD_RESET', description: 'Sent automatically when a user requests password reset', trigger: 'Auto: On Reset Request', color: 'bg-red-500' },
  { id: 'order-confirmation', name: 'Order Confirmation', type: 'ORDER_CONFIRMATION', description: 'Sent automatically after an order is placed', trigger: 'Auto: On Order Placed', color: 'bg-green-500' },
  { id: 'shipping-notification', name: 'Shipping Notification', type: 'SHIPPING_NOTIFICATION', description: 'Sent when an order is marked as shipped', trigger: 'Auto: On Shipped', color: 'bg-purple-500' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const fetchTemplates = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(EMAIL_API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, [token]);

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: 'Delete Template',
        message: 'Are you sure you want to delete this email template? This action cannot be undone and may affect scheduled campaigns.',
        type: 'danger',
        confirmText: 'Delete Template'
    })) return;
    const res = await fetch(`${EMAIL_API}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { toast.success('Deleted'); fetchTemplates(); }
    else toast.error(data.message || 'Delete failed');
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`${EMAIL_API}/${id}/duplicate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) { toast.success('Duplicated'); fetchTemplates(); }
    else toast.error(data.message || 'Duplicate failed');
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Manage transactional emails and launch campaigns.</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-lg shadow-blue-500/20"
          onClick={() => setComposerOpen(true)}
        >
          <Send size={16} className="mr-2" /> New Campaign
        </Button>
      </div>

      {/* System Templates (Auto-Triggered) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-amber-500" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Auto-Triggered (System)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_TEMPLATES.map((t) => (
            <Card key={t.id} className="p-5 border hover:shadow-md transition-shadow overflow-hidden relative group">
              <div className={cn('absolute top-0 left-0 w-1 h-full', t.color)} />
              <div className="pl-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2 h-2 rounded-full', t.color)} />
                  <h3 className="font-bold text-sm">{t.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{t.description}</p>
                <Badge variant="secondary" className="text-[10px]">
                  <CheckCircle size={9} className="mr-1 text-green-500" /> {t.trigger}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Custom Templates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-blue-500" />
            <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Custom Templates ({templates.length})</h2>
          </div>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search templates..." className="pl-9 h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Mail size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-500">No custom templates yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create reusable designs for campaigns or recurring messages.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Card key={t.id} className="p-5 border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{t.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-1"><MoreVertical size={14} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(t)}><Eye size={14} className="mr-2" /> Preview</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(t.id)}><Copy size={14} className="mr-2" /> Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(t.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {t.type && <Badge variant="outline" className="text-[10px] mb-3">{t.type.replace(/_/g, ' ')}</Badge>}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className={cn('flex items-center gap-1 text-[11px] font-medium', t.isActive ? 'text-green-600' : 'text-slate-400')}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', t.isActive ? 'bg-green-500' : 'bg-slate-300')} />
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(t.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Campaign Composer Modal */}
      <CampaignComposer isOpen={composerOpen} onClose={() => setComposerOpen(false)} />

      {/* Preview Dialog */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewTemplate(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold">{previewTemplate.name}</h3>
                <p className="text-xs text-muted-foreground">{previewTemplate.subject}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(null)}>Close</Button>
            </div>
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="p-4 bg-gray-50">${previewTemplate.body}</body></html>`}
              className="flex-1 border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
