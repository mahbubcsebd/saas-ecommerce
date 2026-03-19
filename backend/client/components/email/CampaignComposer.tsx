'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  CheckSquare,
  Code,
  Eye,
  FileText,
  Image,
  Link,
  Loader2,
  Paperclip,
  Save,
  Search,
  Send,
  Square,
  Trash2,
  Users,
  Variable,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useRef, useState } from 'react';
import CodeEditor from 'react-simple-code-editor';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserItem {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  status?: string;
  groupId?: string | null;
}

interface CustomerGroup {
  id: string;
  name: string;
  _count?: { users: number };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type?: string | null;
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  contentType: string;
  type: 'pdf' | 'csv' | 'image' | 'other';
}

interface CampaignComposerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultUser?: UserItem | null;
}

// ─── Variables ────────────────────────────────────────────────────────────────
const AVAILABLE_VARIABLES = [
  {
    group: 'User',
    items: [
      { key: 'user.firstName', label: 'First Name', example: 'John' },
      { key: 'user.lastName', label: 'Last Name', example: 'Doe' },
      { key: 'user.name', label: 'Full Name', example: 'John Doe' },
      { key: 'user.email', label: 'Email', example: 'john@example.com' },
      { key: 'user.phone', label: 'Phone', example: '+880...' },
      { key: 'user.role', label: 'Role', example: 'CUSTOMER' },
    ],
  },
  {
    group: 'Order',
    items: [
      { key: 'order.number', label: 'Order #', example: 'ORD-1001' },
      { key: 'order.total', label: 'Total', example: '৳1250.00' },
      { key: 'order.status', label: 'Status', example: 'DELIVERED' },
      { key: 'order.date', label: 'Order Date', example: 'Feb 22, 2026' },
      { key: 'order.trackingId', label: 'Tracking ID', example: 'TRK-0012' },
      { key: 'order.paymentMethod', label: 'Payment', example: 'BKASH' },
      {
        key: 'order.shippingAddress',
        label: 'Shipping Address',
        example: 'Dhaka, Bangladesh',
      },
      { key: 'order.itemCount', label: 'Item Count', example: '3' },
    ],
  },
  {
    group: 'Product',
    items: [
      { key: 'product.name', label: 'Product Name', example: 'T-Shirt' },
      { key: 'product.price', label: 'Price', example: '৳500' },
      { key: 'product.sku', label: 'SKU', example: 'TSH-001' },
      { key: 'product.category', label: 'Category', example: 'Clothing' },
    ],
  },
  {
    group: 'Store',
    items: [
      { key: 'store.name', label: 'Store Name', example: 'Mahbub Shop' },
      {
        key: 'store.supportEmail',
        label: 'Support Email',
        example: 'support@mahbubshop.com',
      },
      { key: 'store.phone', label: 'Support Phone', example: '+8801...' },
      {
        key: 'store.website',
        label: 'Website',
        example: 'https://mahbubshop.com',
      },
      { key: 'store.address', label: 'Address', example: 'Dhaka, Bangladesh' },
    ],
  },
  {
    group: 'Custom',
    items: [
      { key: 'custom.couponCode', label: 'Coupon Code', example: 'SAVE10' },
      { key: 'custom.saleTitle', label: 'Sale Title', example: 'Summer Sale' },
      { key: 'custom.discount', label: 'Discount %', example: '20' },
      {
        key: 'custom.expiryDate',
        label: 'Expiry Date',
        example: 'Feb 28, 2026',
      },
      { key: 'custom.message', label: 'Custom Message', example: 'Thank you!' },
      { key: 'custom.link', label: 'Custom Link', example: 'https://...' },
      { key: 'custom.buttonText', label: 'Button Text', example: 'Shop Now' },
    ],
  },
];

// ─── Preset templates ─────────────────────────────────────────────────────────
const PRESETS: Record<
  string,
  { name: string; subject: string; content: string }
> = {
  blank: {
    name: 'Blank',
    subject: '',
    content: '<div>\n  <p>Write your email here...</p>\n</div>',
  },
  welcome: {
    name: 'Welcome',
    subject: 'Welcome to Mahbub Shop, {{user.firstName}}!',
    content: `<div class="max-w-md mx-auto bg-white p-8 rounded-lg border border-gray-100 shadow-sm mt-4">
  <h1 class="text-2xl font-bold text-blue-600 mb-2">Welcome, {{user.firstName}}!</h1>
  <p class="text-gray-600 leading-relaxed mb-6">We're so glad to have you here. Explore thousands of products and enjoy exclusive deals tailored for you.</p>
  <a href="https://mahbubshop.com" class="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-lg no-underline">Start Shopping →</a>
</div>`,
  },
  flash: {
    name: 'Flash Sale',
    subject: '🔥 {{custom.discount}}% OFF — {{custom.saleTitle}} is LIVE!',
    content: `<div class="max-w-md mx-auto bg-slate-900 p-8 rounded-lg text-center mt-4">
  <span class="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">Flash Sale</span>
  <h1 class="text-4xl font-black text-white mb-2">{{custom.discount}}% OFF</h1>
  <h2 class="text-xl font-bold text-slate-300 mb-6">{{custom.saleTitle}}</h2>
  <p class="text-slate-400 mb-8">Hi {{user.firstName}}, this offer is only for you. Don't miss out!</p>
  <a href="https://mahbubshop.com" class="block w-full bg-white text-slate-900 font-bold py-3 rounded-lg no-underline">Shop the Sale</a>
</div>`,
  },
  coupon: {
    name: 'Coupon',
    subject: 'Your exclusive coupon: {{custom.couponCode}}',
    content: `<div class="max-w-md mx-auto bg-white p-8 rounded-lg border border-gray-100 shadow-sm mt-4 text-center">
  <p class="text-gray-600 mb-2">Hi {{user.firstName}}, here's a special offer just for you:</p>
  <div class="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-6 my-6">
    <p class="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">Your Code</p>
    <p class="text-3xl font-black text-slate-900 tracking-widest">{{custom.couponCode}}</p>
  </div>
  <a href="https://mahbubshop.com" class="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded-lg no-underline">Use Code Now</a>
</div>`,
  },
};

// ─── Group Combobox ───────────────────────────────────────────────────────────
const GroupCombobox = ({
  groups,
  selectedGroupId,
  onSelect,
}: {
  groups: CustomerGroup[];
  selectedGroupId: string;
  onSelect: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = groups.find((g) => g.id === selectedGroupId);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative space-y-1.5">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 px-3 text-sm text-left border border-slate-200 rounded-lg bg-white hover:border-blue-400 transition-all flex items-center justify-between"
      >
        {selected ? (
          <span className="font-medium text-slate-800 truncate">
            {selected.name}
            {selected._count != null && (
              <span className="text-slate-400 font-normal ml-1">
                ({selected._count.users} members)
              </span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">Select a group…</span>
        )}
        <Search size={12} className="text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-10 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                autoFocus
                className="w-full pl-7 pr-3 h-8 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400 bg-slate-50"
                placeholder="Search groups…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                No groups found
              </p>
            )}
            {filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  onSelect(g.id);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between',
                  selectedGroupId === g.id &&
                    'bg-blue-50 text-blue-700 font-semibold',
                )}
              >
                <span className="truncate">{g.name}</span>
                {g._count != null && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] ml-2 shrink-0"
                  >
                    {g._count.users}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info line */}
      {selectedGroupId && selected && (
        <p className="text-[10px] text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5">
          Emails will be sent to all{' '}
          <strong>{selected._count?.users ?? '?'}</strong> members of{' '}
          <strong>{selected.name}</strong>.
        </p>
      )}
    </div>
  );
};

// ─── Template Picker Modal ────────────────────────────────────────────────────
const TemplatePickerModal = ({
  open,
  onClose,
  onSelect,
  token,
  API,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (t: EmailTemplate) => void;
  token: string;
  API: string;
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);
    fetch(`${API}/email-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTemplates(d.data);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.type || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-row items-center justify-between p-4 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen size={15} className="text-blue-600" /> Load Template
          </DialogTitle>
        </DialogHeader>
        <div className="p-3 border-b shrink-0">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <p className="text-sm text-center text-slate-400 py-8">
              Loading...
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-center text-slate-400 py-8">
              No templates found.
            </p>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onSelect(t);
                onClose();
              }}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-sm text-slate-800">
                  {t.name}
                </span>
                {t.type && (
                  <Badge variant="outline" className="text-[10px]">
                    {t.type.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {t.subject || '(no subject)'}
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const CampaignComposer: React.FC<CampaignComposerProps> = ({
  isOpen,
  onClose,
  defaultUser,
}) => {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken ?? '';
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  const CAMPAIGN_API = `${API}/campaigns`;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Editor state ──
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState(PRESETS.blank.content);
  const [activePreset, setActivePreset] = useState('blank');
  const [activeTab, setActiveTab] = useState('write');

  // ── Template picker / save ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadedTemplate, setLoadedTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [savingTemplate, setSavingTemplate] = useState(false);

  // ── Recipients ──
  type RecipientType = 'all' | 'segment' | 'group' | 'specific';
  const [recipientType, setRecipientType] = useState<RecipientType>(
    defaultUser ? 'specific' : 'all',
  );
  const [segment, setSegment] = useState('CUSTOMER');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);

  // ── Specific users ──
  const [allUsers, setAllUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>(
    defaultUser ? [defaultUser] : [],
  );
  const [userSearch, setUserSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');

  // ── Custom vars ──
  const [extraData, setExtraData] = useState({
    couponCode: '',
    saleTitle: '',
    discount: '',
  });

  // ── Image/link insert ──
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // ── Attachments ──
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attInput, setAttInput] = useState({ url: '', filename: '' });
  const [uploadingAtt, setUploadingAtt] = useState(false);

  // ── Send ──
  const [sending, setSending] = useState(false);

  // ─── Load customer groups & all users on open ─────────────────────────────
  useEffect(() => {
    if (!isOpen || !token) return;

    // Load customer groups
    fetch(`${API}/customer-groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCustomerGroups(d.data);
      })
      .catch(() => {});

    // Pre-load all users (up to 200)
    setLoadingUsers(true);
    fetch(`${CAMPAIGN_API}/recipients?limit=200`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAllUsers(d.data);
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [isOpen, token]);

  // ─── Filtered users list ──────────────────────────────────────────────────
  const filteredUsers = allUsers.filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isSelected = (u: UserItem) => selectedUsers.some((s) => s.id === u.id);

  const toggleUser = (u: UserItem) => {
    setSelectedUsers((prev) =>
      isSelected(u) ? prev.filter((x) => x.id !== u.id) : [...prev, u],
    );
  };

  const selectAllFiltered = () => {
    const toAdd = filteredUsers.filter((u) => !isSelected(u));
    setSelectedUsers((prev) => [...prev, ...toAdd]);
  };

  const clearSelection = () => setSelectedUsers([]);

  // ─── Insert variable at cursor ────────────────────────────────────────────
  const insertAtCursor = (tag: string) => {
    const ta = textareaRef.current;
    const value = `{{${tag}}}`;
    if (!ta) {
      setBody((prev) => prev + value);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setBody(body.substring(0, start) + value + body.substring(end));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + value.length, start + value.length);
    }, 0);
    toast.success(`Inserted {{${tag}}}`);
  };

  const insertHtmlAtCursor = (html: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setBody((prev) => prev + html);
      return;
    }
    const start = ta.selectionStart;
    setBody(body.substring(0, start) + html + body.substring(start));
  };

  // ─── Load template ────────────────────────────────────────────────────────
  const handleLoadTemplate = (t: EmailTemplate) => {
    setLoadedTemplate(t);
    setBody(t.body || '');
    if (t.subject) setSubject(t.subject);
    setActivePreset('blank');
    toast.success(`Loaded: ${t.name}`);
  };

  // ─── Save back to template ────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!loadedTemplate) {
      toast.error('Load a template first to save back to it');
      return;
    }
    setSavingTemplate(true);
    try {
      const res = await fetch(`${API}/email-templates/${loadedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body, subject }),
      });
      const data = await res.json();
      if (data.success)
        toast.success(`Template "${loadedTemplate.name}" saved!`);
      else toast.error(data.message || 'Save failed');
    } finally {
      setSavingTemplate(false);
    }
  };

  // ─── Save as new template ─────────────────────────────────────────────────
  const handleSaveAsNew = async () => {
    const name = window.prompt('Template name:', subject || 'New Template');
    if (!name?.trim()) return;
    setSavingTemplate(true);
    try {
      const res = await fetch(`${API}/email-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          subject,
          body,
          type: 'CAMPAIGN',
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLoadedTemplate(data.data);
        toast.success(`Template "${name}" created!`);
      } else {
        toast.error(data.message || 'Create failed');
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  // ─── File upload ──────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    setUploadingAtt(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      const url = data.url || data.data?.url || data.secure_url;
      if (url) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const type: Attachment['type'] =
          ext === 'pdf'
            ? 'pdf'
            : ext === 'csv'
              ? 'csv'
              : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
                ? 'image'
                : 'other';
        setAttachments((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            filename: file.name,
            url,
            contentType: file.type,
            type,
          },
        ]);
        toast.success(`${file.name} attached!`);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingAtt(false);
    }
  };

  const addAttachmentUrl = () => {
    if (!attInput.url || !attInput.filename) {
      toast.error('Provide filename and URL');
      return;
    }
    const ext = attInput.url.split('.').pop()?.toLowerCase() || '';
    const type: Attachment['type'] =
      ext === 'pdf'
        ? 'pdf'
        : ext === 'csv'
          ? 'csv'
          : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
            ? 'image'
            : 'other';
    setAttachments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        filename: attInput.filename,
        url: attInput.url,
        contentType: 'application/octet-stream',
        type,
      },
    ]);
    setAttInput({ url: '', filename: '' });
  };

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Email body is required');
      return;
    }
    if (recipientType === 'specific' && selectedUsers.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }
    if (recipientType === 'group' && !selectedGroupId) {
      toast.error('Select a customer group');
      return;
    }

    setSending(true);
    try {
      const payload = {
        subject,
        templateHtml: body,
        recipientType,
        recipientIds:
          recipientType === 'specific' ? selectedUsers.map((u) => u.id) : [],
        segment: recipientType === 'segment' ? segment : undefined,
        groupId: recipientType === 'group' ? selectedGroupId : undefined,
        extraData: { custom: extraData },
        attachments: attachments.map((a) => ({
          filename: a.filename,
          url: a.url,
          contentType: a.contentType,
        })),
      };

      const res = await fetch(`${CAMPAIGN_API}/send-quick`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Campaign sent!');
        handleClose();
      } else {
        toast.error(data.message || 'Send failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setBody(PRESETS.blank.content);
      setSubject('');
      setActivePreset('blank');
      setActiveTab('write');
      setAttachments([]);
      setLoadedTemplate(null);
      setExtraData({ couponCode: '', saleTitle: '', discount: '' });
      setImgUrlInput('');
      setLinkText('');
      setLinkUrl('');
      if (!defaultUser) setSelectedUsers([]);
    }, 200);
  };

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setActivePreset(key);
    setBody(p.content);
    setLoadedTemplate(null);
    if (p.subject) setSubject(p.subject);
  };

  // ─── Recipient summary label ──────────────────────────────────────────────
  const recipientLabel = () => {
    if (recipientType === 'all') return 'All active users';
    if (recipientType === 'segment') return `All ${segment}s`;
    if (recipientType === 'group') {
      const g = customerGroups.find((g) => g.id === selectedGroupId);
      return g
        ? `Group: ${g.name} (${g._count?.users ?? '?'})`
        : 'Select a group';
    }
    return `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected`;
  };

  const getPreviewHtml = () =>
    `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 p-4" style="margin:0">${body}</body></html>`;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[960px] max-h-[95vh] flex flex-col p-0 overflow-hidden gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-4 pb-3 border-b bg-slate-50 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Send size={16} className="text-blue-600" /> Campaign Composer
                {loadedTemplate && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] ml-1 font-normal"
                  >
                    {loadedTemplate.name}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setPickerOpen(true)}
                >
                  <BookOpen size={13} /> Load Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  disabled={!loadedTemplate || savingTemplate}
                  onClick={handleSaveTemplate}
                >
                  {savingTemplate ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Save to Template
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleSaveAsNew}
                >
                  <Save size={13} /> Save as New
                </Button>
              </div>
            </div>
            <DialogDescription className="text-[11px] text-blue-600 font-medium mt-0.5">
              Tailwind HTML → Variables per recipient → Inlined CSS → SMTP
            </DialogDescription>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex min-h-0">
            {/* Left: Editor */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Subject row */}
              <div className="px-5 pt-3 pb-2 border-b shrink-0 flex gap-2">
                <Input
                  placeholder="Subject (e.g. Hi {{user.firstName}}, check this out!)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 bg-slate-50 border-slate-200 font-medium text-sm flex-1"
                />
                <Select value={activePreset} onValueChange={applyPreset}>
                  <SelectTrigger className="w-32 h-9 bg-slate-50 border-slate-200 shrink-0 text-sm">
                    <SelectValue placeholder="Preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESETS).map(([k, p]) => (
                      <SelectItem key={k} value={k}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Write / Preview */}
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden min-h-0"
              >
                <TabsList className="grid grid-cols-2 mx-5 mt-3 shrink-0">
                  <TabsTrigger
                    value="write"
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Code size={13} /> Code Editor
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="text-xs flex items-center gap-1.5"
                  >
                    <Eye size={13} /> Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="write"
                  className="flex-1 px-5 pb-4 mt-3 overflow-auto"
                >
                  <div
                    className="min-h-[260px] rounded-lg border border-slate-200 overflow-auto"
                    style={{ background: '#1e1e2e' }}
                  >
                    <CodeEditor
                      key={activePreset + (loadedTemplate?.id ?? '')}
                      value={body}
                      onValueChange={(code) => setBody(code)}
                      highlight={(code) =>
                        Prism.highlight(code, Prism.languages.markup, 'markup')
                      }
                      padding={14}
                      style={{
                        fontFamily: '"Fira Code","Cascadia Code",monospace',
                        fontSize: 12,
                        minHeight: 260,
                        lineHeight: 1.7,
                        color: '#cdd6f4',
                      }}
                      textareaId="campaign-code-editor"
                      textareaClassName="focus:outline-none"
                    />
                  </div>
                </TabsContent>
                <TabsContent
                  value="preview"
                  className="flex-1 px-5 pb-4 mt-3 overflow-hidden"
                >
                  <div className="h-full min-h-[260px] rounded-lg border overflow-hidden bg-white">
                    <iframe
                      srcDoc={getPreviewHtml()}
                      className="w-full h-full border-0"
                      title="Preview"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Sidebar */}
            <div className="w-[280px] border-l bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
              <Tabs
                defaultValue="recipients"
                className="flex flex-col flex-1 overflow-hidden"
              >
                <TabsList className="grid grid-cols-3 m-3 mb-2 shrink-0">
                  <TabsTrigger
                    value="recipients"
                    className="text-[11px] flex items-center gap-1"
                  >
                    <Users size={11} /> To
                  </TabsTrigger>
                  <TabsTrigger
                    value="variables"
                    className="text-[11px] flex items-center gap-1"
                  >
                    <Variable size={11} /> Vars
                  </TabsTrigger>
                  <TabsTrigger
                    value="attach"
                    className="text-[11px] flex items-center gap-1"
                  >
                    <Paperclip size={11} /> Files
                  </TabsTrigger>
                </TabsList>

                {/* ── RECIPIENTS TAB ── */}
                <TabsContent
                  value="recipients"
                  className="flex-1 overflow-y-auto px-3 pb-3 space-y-3"
                >
                  {/* Type select */}
                  <Select
                    value={recipientType}
                    onValueChange={(v: any) => setRecipientType(v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Active Users</SelectItem>
                      <SelectItem value="segment">By Role / Segment</SelectItem>
                      <SelectItem value="group">Customer Group</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Segment picker */}
                  {recipientType === 'segment' && (
                    <Select value={segment} onValueChange={setSegment}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Customers</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="MANAGER">Managers</SelectItem>
                        <SelectItem value="ADMIN">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Customer group picker — searchable combobox */}
                  {recipientType === 'group' && (
                    <GroupCombobox
                      groups={customerGroups}
                      selectedGroupId={selectedGroupId}
                      onSelect={setSelectedGroupId}
                    />
                  )}

                  {/* Specific users */}
                  {recipientType === 'specific' && (
                    <div className="space-y-2">
                      {/* Filters row */}
                      <div className="flex gap-1.5">
                        <Select
                          value={filterRole}
                          onValueChange={setFilterRole}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All roles</SelectItem>
                            <SelectItem value="CUSTOMER">Customer</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={filterStatus}
                          onValueChange={setFilterStatus}
                        >
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All status</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search
                          size={12}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <Input
                          placeholder="Search name or email…"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>

                      {/* Select all / clear */}
                      {filteredUsers.length > 0 && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] px-2 flex-1 border border-slate-200"
                            onClick={selectAllFiltered}
                          >
                            <CheckSquare size={11} className="mr-1" /> All (
                            {filteredUsers.length})
                          </Button>
                          {selectedUsers.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] px-2 flex-1 border border-slate-200 text-red-500 hover:text-red-600"
                              onClick={clearSelection}
                            >
                              <Square size={11} className="mr-1" /> Clear
                            </Button>
                          )}
                        </div>
                      )}

                      {/* User list */}
                      <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-lg">
                        {loadingUsers && (
                          <p className="text-xs text-center py-4 text-slate-400">
                            Loading users…
                          </p>
                        )}
                        {!loadingUsers && filteredUsers.length === 0 && (
                          <p className="text-xs text-center py-4 text-slate-400">
                            No users match.
                          </p>
                        )}
                        {filteredUsers.slice(0, 60).map((u) => {
                          const selected = isSelected(u);
                          return (
                            <button
                              key={u.id}
                              onClick={() => toggleUser(u)}
                              className={cn(
                                'w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2',
                                selected
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50',
                              )}
                            >
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                  selected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 text-slate-600',
                                )}
                              >
                                {(
                                  u.firstName?.[0] ||
                                  u.email?.[0] ||
                                  '?'
                                ).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 truncate">
                                  {u.firstName && u.lastName
                                    ? `${u.firstName} ${u.lastName}`
                                    : u.firstName || u.email?.split('@')[0]}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {u.email}
                                </div>
                              </div>
                              {u.role && (
                                <span
                                  className={cn(
                                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                                    u.role === 'ADMIN'
                                      ? 'bg-red-100 text-red-600'
                                      : u.role === 'STAFF'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-green-100 text-green-700',
                                  )}
                                >
                                  {u.role}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected chips */}
                      {selectedUsers.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Selected ({selectedUsers.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedUsers.map((u) => (
                              <Badge
                                key={u.id}
                                variant="secondary"
                                className="flex items-center gap-1 text-[10px] max-w-[120px] group"
                              >
                                <span className="truncate">
                                  {u.firstName || u.email?.split('@')[0]}
                                </span>
                                <button
                                  onClick={() => toggleUser(u)}
                                  className="ml-0.5 text-slate-400 group-hover:text-red-500 shrink-0"
                                >
                                  <X size={9} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary badge */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
                    <p className="text-[11px] font-bold text-blue-700">
                      {recipientLabel()}
                    </p>
                  </div>
                </TabsContent>

                {/* ── VARIABLES TAB ── */}
                <TabsContent
                  value="variables"
                  className="flex-1 overflow-y-auto px-3 pb-3 space-y-3"
                >
                  <p className="text-[10px] text-slate-500 bg-blue-50 p-2 rounded-lg border border-blue-100">
                    Click to insert at cursor position. Each recipient gets
                    their own values.
                  </p>

                  {AVAILABLE_VARIABLES.map((group) => (
                    <div key={group.group}>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {group.group}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((v) => (
                          <button
                            key={v.key}
                            onClick={() => insertAtCursor(v.key)}
                            className="w-full text-left px-2 py-1.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all bg-white flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="text-[11px] font-semibold text-slate-700 leading-tight">
                                {v.label}
                              </div>
                              <div className="text-[9px] text-slate-400 font-mono leading-tight">
                                {'{{' + v.key + '}}'}
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 max-w-[70px] truncate">
                              {v.example}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Custom values fill-in */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Custom Values
                    </p>
                    <div className="space-y-2">
                      {Object.keys(extraData).map((key) => (
                        <div key={key}>
                          <Label className="text-[10px] text-slate-500 capitalize">
                            {key}
                          </Label>
                          <Input
                            placeholder={`{{custom.${key}}}`}
                            value={(extraData as any)[key]}
                            onChange={(e) =>
                              setExtraData((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className="h-8 text-xs mt-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick insert */}
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Quick Insert
                    </p>
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        <Input
                          placeholder="Image URL"
                          value={imgUrlInput}
                          onChange={(e) => setImgUrlInput(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 shrink-0"
                          title="Insert image"
                          onClick={() => {
                            if (!imgUrlInput.trim()) {
                              toast.error('Enter image URL');
                              return;
                            }
                            insertHtmlAtCursor(
                              `<img src="${imgUrlInput}" alt="image" style="width:100%;border-radius:8px;margin:16px 0;" />`,
                            );
                            setImgUrlInput('');
                          }}
                        >
                          <Image size={12} />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <Input
                            placeholder="Button text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="https://…"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-xs"
                          onClick={() => {
                            if (!linkText || !linkUrl) {
                              toast.error('Enter both text and URL');
                              return;
                            }
                            insertHtmlAtCursor(
                              `<a href="${linkUrl}" style="background:#2563eb;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;display:inline-block;">${linkText}</a>`,
                            );
                            setLinkText('');
                            setLinkUrl('');
                          }}
                        >
                          <Link size={12} className="mr-1" /> Insert Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ── ATTACHMENTS TAB ── */}
                <TabsContent
                  value="attach"
                  className="flex-1 overflow-y-auto px-3 pb-3 space-y-3"
                >
                  <p className="text-[10px] text-slate-500 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    Attach files. Every recipient gets the same attachments.
                  </p>

                  {/* File upload */}
                  <label
                    htmlFor="att-file-input"
                    className={cn(
                      'flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all',
                      uploadingAtt && 'opacity-50 pointer-events-none',
                    )}
                  >
                    <div className="flex items-center gap-2 text-slate-400">
                      {uploadingAtt ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Paperclip size={16} />
                      )}
                      <span className="text-xs font-medium">
                        {uploadingAtt ? 'Uploading…' : 'Click to upload'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PDF, CSV, PNG, JPG
                    </p>
                  </label>
                  <input
                    id="att-file-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.csv,.png,.jpg,.jpeg,.gif,.webp,.xlsx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f);
                      e.target.value = '';
                    }}
                  />

                  {/* Or paste URL */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Or paste URL
                    </p>
                    <Input
                      placeholder="Filename (e.g. catalog.pdf)"
                      value={attInput.filename}
                      onChange={(e) =>
                        setAttInput((p) => ({ ...p, filename: e.target.value }))
                      }
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="File URL (https://…)"
                      value={attInput.url}
                      onChange={(e) =>
                        setAttInput((p) => ({ ...p, url: e.target.value }))
                      }
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-slate-700 hover:bg-slate-800"
                      onClick={addAttachmentUrl}
                    >
                      <Paperclip size={12} className="mr-1" /> Add
                    </Button>
                  </div>

                  {/* List */}
                  {attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {attachments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {a.type === 'pdf' ? (
                              <FileText
                                size={14}
                                className="text-red-500 shrink-0"
                              />
                            ) : a.type === 'image' ? (
                              <Image
                                size={14}
                                className="text-blue-500 shrink-0"
                              />
                            ) : (
                              <Paperclip
                                size={14}
                                className="text-slate-400 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]">
                                {a.filename}
                              </div>
                              <div className="text-[9px] text-slate-400 uppercase">
                                {a.type}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setAttachments((p) =>
                                p.filter((x) => x.id !== a.id),
                              )
                            }
                            className="text-slate-300 hover:text-red-500 shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {attachments.length > 0 && (
                <span className="flex items-center gap-1 text-slate-600">
                  <Paperclip size={12} /> {attachments.length} attachment
                  {attachments.length !== 1 ? 's' : ''}
                </span>
              )}
              <span className="text-slate-300">|</span>
              <span>{recipientLabel()}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
              >
                {sending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2" /> Send Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Picker */}
      <TemplatePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleLoadTemplate}
        token={token}
        API={API}
      />
    </>
  );
};
