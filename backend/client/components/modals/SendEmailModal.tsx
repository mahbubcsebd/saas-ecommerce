'use client';

import GlobalInput from '@/components/forms/GlobalInput';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { User } from '@/lib/api';
import { Code, Eye, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

// Predefined Tailwind Marketing Templates
const EMAIL_TEMPLATES = {
    custom: {
        name: 'Custom / Blank',
        content: `<div>\n  <p>Write your HTML/Tailwind here...</p>\n</div>`,
    },
    welcome: {
        name: 'Welcome Series (Tailwind)',
        content: `<div class="max-w-md mx-auto bg-white p-8 rounded-lg outline outline-1 outline-gray-200 shadow-sm mt-8">
  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-blue-600 mb-2">Welcome to Mahbub Shop!</h1>
    <p class="text-gray-600">We're thrilled to have you here.</p>
  </div>
  <div class="bg-blue-50 p-4 rounded-md mb-6">
    <p class="text-sm text-blue-800">Enjoy 10% off your first order with code: <strong>WELCOME10</strong></p>
  </div>
  <p class="text-gray-700 leading-relaxed mb-6">
    Hi there,<br><br>
    Start exploring our latest collections and find exactly what you're looking for.
  </p>
  <div class="text-center">
    <a href="https://example.com" class="inline-block bg-blue-600 text-white font-medium px-6 py-3 rounded-md decoration-none">Shop Now</a>
  </div>
</div>`,
    },
    saleAlert: {
        name: 'Flash Sale Alert (Tailwind)',
        content: `<div class="max-w-md mx-auto bg-slate-900 border border-slate-700 p-8 rounded-lg mt-8 text-center">
  <div class="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Flash Sale</div>
  <h1 class="text-3xl font-extrabold text-white mb-2">Up to 50% OFF!</h1>
  <p class="text-slate-300 mb-8">Our biggest sale of the season is happening right now. Don't miss out on premium gear.</p>

  <div class="grid grid-cols-2 gap-4 mb-8">
     <div class="bg-slate-800 p-4 rounded border border-slate-700">
        <h3 class="text-white font-bold mb-1">Electronics</h3>
        <p class="text-red-400 text-sm">Save 30%</p>
     </div>
     <div class="bg-slate-800 p-4 rounded border border-slate-700">
        <h3 class="text-white font-bold mb-1">Fashion</h3>
        <p class="text-red-400 text-sm">Save 50%</p>
     </div>
  </div>

  <a href="https://example.com" class="block w-full bg-white text-slate-900 font-bold px-6 py-4 rounded-md decoration-none text-lg">Shop The Sale</a>
  <p class="text-slate-500 text-xs mt-4">Offer ends in 24 hours. Terms apply.</p>
</div>`,
    }
};

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState(EMAIL_TEMPLATES.custom.content);
  const [activeTab, setActiveTab] = useState('write');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  // Attempt to load Tailwind via CDN for preview iframe ONLY
  const getPreviewHtml = () => {
      // Basic wrapper to render Tailwind CDN in preview
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-50 p-4" style="margin: 0;">
            ${message}
          </body>
        </html>
      `;
  };

  const handleTemplateChange = (val: string) => {
      setSelectedTemplate(val);
      setMessage(EMAIL_TEMPLATES[val as keyof typeof EMAIL_TEMPLATES].content);
      // Auto-set a relevant subject if empty
      if (!subject) {
          if (val === 'welcome') setSubject('Welcome to Mahbub Shop!');
          if (val === 'saleAlert') setSubject('🚨 Flash Sale: Up to 50% OFF!');
      }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
        setSubject('');
        setMessage(EMAIL_TEMPLATES.custom.content);
        setSelectedTemplate('custom');
        setActiveTab('write');
    }, 200);
  };

  const onSend = async () => {
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }

    try {
      setLoading(true);
      const token = (session as any)?.accessToken;
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const res = await fetch(`${BACKEND_URL}/user/${user.id}/send-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, message })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Email sent successfully.');
        handleClose();
      } else {
        toast.error(data.message || 'Failed to send email.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Email to User</DialogTitle>
          <DialogDescription>
            Send a custom HTML/Tailwind email to {user?.firstName} {user?.lastName} ({user?.email}).
            <br/><span className="text-xs text-blue-600 font-medium">Backend automatically inlines Tailwind CSS for email clients.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-span-3">
              <GlobalInput
                label="Subject"
                placeholder="e.g. Important Update Regarding Your Account"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-span-1 space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(EMAIL_TEMPLATES).map(([key, tpl]) => (
                             <SelectItem key={key} value={key}>{tpl.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write" className="flex items-center gap-2">
                 <Code className="h-4 w-4" /> Code Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                 <Eye className="h-4 w-4" /> Live Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="write" className="flex-1 mt-4">
              <Label className="sr-only">Message (HTML Supported)</Label>
              <Textarea
                placeholder="Write your HTML with Tailwind classes here..."
                className="min-h-[350px] font-mono text-sm bg-slate-50 dark:bg-slate-900 border-slate-200"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-4">
               <div className="rounded-md border min-h-[350px] bg-gray-50 overflow-hidden relative">
                   {message ? (
                       <iframe
                         srcDoc={getPreviewHtml()}
                         className="w-full h-full min-h-[350px] absolute inset-0 border-0"
                         title="Email Preview"
                         sandbox="allow-same-origin allow-scripts"
                       />
                   ) : (
                       <div className="flex items-center justify-center h-full text-muted-foreground">
                           No content to preview
                       </div>
                   )}
               </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-2 border-t mt-auto">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
