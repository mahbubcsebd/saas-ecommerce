'use client';

import { PageBuilder } from '@/components/page-builder/PageBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogImage: '',
    gjs_html: '',
    gjs_css: '',
    gjs_json: '',
  });

  useEffect(() => {
    if (id !== 'create' && token) {
      fetchPage();
    } else if (id === 'create') {
      setLoading(false);
    }
  }, [id, token]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`${API_BASE}/landing-pages/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setPageData(data.data);
      }
    } catch (error) {
      toast.error('Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (builderData?: { html: string; css: string; json: string }) => {
    setSaving(true);

    try {
      const payload = {
        ...pageData,
        ...(builderData && {
          gjs_html: builderData.html,
          gjs_css: builderData.css,
          gjs_json: builderData.json,
        }),
      };

      const url = id === 'create'
        ? `${API_BASE}/landing-pages`
        : `${API_BASE}/landing-pages/${id}`;

      const method = id === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(id === 'create' ? 'Page created' : 'Page updated');

        if (id === 'create') {
          router.push(`/dashboard/landing-pages/${data.data.id}/edit`);
        }
      } else {
        toast.error(data.message || 'Failed to save page');
      }
    } catch (error) {
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/dashboard/landing-pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {id === 'create' ? 'Design New Funnel' : 'Refine Landing Page'}
            </h1>
            {pageData.slug && (
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">
                Path: /landing/{pageData.slug}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pageData.slug && (
            <Button variant="outline" asChild className="rounded-xl font-bold h-10 border-slate-200">
              <a href={`/landing/${pageData.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Live Preview
              </a>
            </Button>
          )}
          <Button onClick={() => handleSave()} disabled={saving} className="bg-orange-600 hover:bg-orange-700 h-10 px-6 rounded-xl font-bold shadow-lg shadow-orange-100">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Syncing...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="builder" className="h-full flex flex-col">
          <div className="px-6 border-b bg-slate-50/50">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger
                value="builder"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black text-[10px] uppercase tracking-widest h-full px-0"
              >
                Experience Designer
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black text-[10px] uppercase tracking-widest h-full px-0"
              >
                Funnel Settings
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-black text-[10px] uppercase tracking-widest h-full px-0"
              >
                SEO Optimization
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="flex-1 m-0 overflow-hidden">
            <PageBuilder
              pageId={id !== 'create' ? id : undefined}
              initialData={{
                html: pageData.gjs_html,
                css: pageData.gjs_css,
                json: pageData.gjs_json,
              }}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 overflow-auto p-8 bg-slate-50/30">
            <div className="max-w-2xl space-y-8 bg-white p-8 rounded-3xl border shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Page Title *</Label>
                <Input
                  id="title"
                  value={pageData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setPageData({
                      ...pageData,
                      title,
                      slug: pageData.slug || generateSlug(title),
                    });
                  }}
                  className="h-11 rounded-xl border-slate-200"
                  placeholder="e.g., Summer Sale 2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Campaign URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400">/landing/</span>
                  <Input
                    id="slug"
                    value={pageData.slug}
                    onChange={(e) => setPageData({
                      ...pageData,
                      slug: generateSlug(e.target.value),
                    })}
                    className="h-11 rounded-xl border-slate-200 font-bold text-blue-600"
                    placeholder="summer-sale-2025"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Use descriptive, lowercase slugs for better SEO performance.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Notes</Label>
                <Textarea
                  id="description"
                  value={pageData.description || ''}
                  onChange={(e) => setPageData({
                    ...pageData,
                    description: e.target.value,
                  })}
                  className="rounded-2xl border-slate-200 min-h-[120px]"
                  placeholder="What is the goal of this campaign?"
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="flex-1 m-0 overflow-auto p-8 bg-slate-50/30">
            <div className="max-w-2xl space-y-8 bg-white p-8 rounded-3xl border shadow-sm">
              <div className="space-y-2">
                <Label htmlFor="metaTitle" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Search Engine Title</Label>
                <Input
                  id="metaTitle"
                  value={pageData.metaTitle || ''}
                  onChange={(e) => setPageData({
                    ...pageData,
                    metaTitle: e.target.value,
                  })}
                  className="h-11 rounded-xl border-slate-200"
                  placeholder="SEO title (60 chars max)"
                  maxLength={60}
                />
                <div className="flex justify-between">
                   <p className="text-[10px] text-slate-400 font-medium">Recommended for Google: 50-60 characters</p>
                   <p className="text-[10px] text-slate-400 font-black">{pageData.metaTitle?.length || 0}/60</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={pageData.metaDescription || ''}
                  onChange={(e) => setPageData({
                    ...pageData,
                    metaDescription: e.target.value,
                  })}
                  className="rounded-2xl border-slate-200 min-h-[100px]"
                  placeholder="Sum up the offer for search engine results..."
                  maxLength={160}
                  rows={3}
                />
                <div className="flex justify-between">
                   <p className="text-[10px] text-slate-400 font-medium">Recommended: 150-160 characters</p>
                   <p className="text-[10px] text-slate-400 font-black">{pageData.metaDescription?.length || 0}/160</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaKeywords" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={pageData.metaKeywords || ''}
                  onChange={(e) => setPageData({
                    ...pageData,
                    metaKeywords: e.target.value,
                  })}
                  className="h-11 rounded-xl border-slate-200"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogImage" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Social Share Image (OG Image)</Label>
                <Input
                  id="ogImage"
                  value={pageData.ogImage || ''}
                  onChange={(e) => setPageData({
                    ...pageData,
                    ogImage: e.target.value,
                  })}
                  className="h-11 rounded-xl border-slate-200"
                  placeholder="https://yourdomain.com/social-preview.jpg"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Displays when the page is shared on Facebook, WhatsApp, or X.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
