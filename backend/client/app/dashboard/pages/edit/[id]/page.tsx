'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchApiClient as fetchApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocalizedInput, LocalizedTextEditor } from '@/components/forms/LocalizedFields';
import { Loader2, ArrowLeft, Save, Globe, Settings } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Language {
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
}

const DEFAULT_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', isDefault: true },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', isDefault: false }
];

export default function EditCustomPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  
  // Custom Fields
  const [slug, setSlug] = useState('');
  const [published, setPublished] = useState(false);
  
  // Localized Translations state
  const [translations, setTranslations] = useState<Record<string, any>>({
    en: { title: '', content: '', metaTitle: '', metaDescription: '', metaKeywords: '' },
    bn: { title: '', content: '', metaTitle: '', metaDescription: '', metaKeywords: '' }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Languages
      let activeLanguages = DEFAULT_LANGUAGES;
      try {
        const langRes = await fetchApi<{ success: boolean; data: Language[] }>('/languages/active');
        if (langRes.success && langRes.data && langRes.data.length > 0) {
          activeLanguages = langRes.data;
          setLanguages(langRes.data);
        }
      } catch (err) {
        console.warn('Failed to load languages, using defaults', err);
      }

      // 2. Initialize default state for all active languages
      const initialTrans: Record<string, any> = {};
      activeLanguages.forEach((lang) => {
        initialTrans[lang.code] = {
          title: '',
          content: '',
          metaTitle: '',
          metaDescription: '',
          metaKeywords: ''
        };
      });

      // 3. Fetch Page details by ID
      const pageRes = await fetchApi<{
        success: boolean;
        data: {
          id: string;
          slug: string;
          published: boolean;
          translations: Array<{
            langCode: string;
            title: string;
            content: string;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string;
          }>;
        };
      }>(`/pages/id/${id}`);

      if (pageRes.success && pageRes.data) {
        const page = pageRes.data;
        setSlug(page.slug);
        setPublished(page.published);

        // Populate existing translations
        page.translations.forEach((trans) => {
          if (initialTrans[trans.langCode]) {
            initialTrans[trans.langCode] = {
              title: trans.title || '',
              content: trans.content || '',
              metaTitle: trans.metaTitle || '',
              metaDescription: trans.metaDescription || '',
              metaKeywords: trans.metaKeywords || ''
            };
          }
        });
        setTranslations(initialTrans);
      } else {
        toast.error('Failed to load custom page details');
        router.push('/dashboard/pages');
      }
    } catch (err) {
      console.error('Fetch page error', err);
      toast.error('Failed to load custom page');
      router.push('/dashboard/pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken && id) {
      fetchData();
    }
  }, [session, id]);

  const handleTranslationChange = (lang: string, field: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  const handleAutoTranslate = async () => {
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    const sourceTitle = translations[defaultLang]?.title;
    const sourceContent = translations[defaultLang]?.content;
    const sourceMetaTitle = translations[defaultLang]?.metaTitle;
    const sourceMetaDesc = translations[defaultLang]?.metaDescription;
    const sourceMetaKeywords = translations[defaultLang]?.metaKeywords;

    if (!sourceTitle?.trim() && !sourceContent?.trim()) {
      toast.error(`Please enter text in the default language (${defaultLang.toUpperCase()}) to translate.`);
      return;
    }

    const targetLangs = languages
      .filter(l => l.code !== defaultLang)
      .map(l => l.code);

    if (targetLangs.length === 0) {
      toast.info("No other active languages available to translate to.");
      return;
    }

    setTranslating(true);
    try {
      const updates = { ...translations };

      // Translate Title
      if (sourceTitle?.trim()) {
        const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/ai/translate', {
          method: 'POST',
          body: JSON.stringify({
            text: sourceTitle,
            targetLangs,
            context: 'Static Page Title'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].title = text;
          });
        }
      }

      // Translate Content (HTML)
      if (sourceContent?.trim()) {
        const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/ai/translate', {
          method: 'POST',
          body: JSON.stringify({
            text: sourceContent,
            targetLangs,
            context: 'Static Page Content (HTML)'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].content = text;
          });
        }
      }

      // Translate Meta Title
      if (sourceMetaTitle?.trim()) {
        const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/ai/translate', {
          method: 'POST',
          body: JSON.stringify({
            text: sourceMetaTitle,
            targetLangs,
            context: 'SEO Meta Title'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].metaTitle = text;
          });
        }
      }

      // Translate Meta Description
      if (sourceMetaDesc?.trim()) {
        const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/ai/translate', {
          method: 'POST',
          body: JSON.stringify({
            text: sourceMetaDesc,
            targetLangs,
            context: 'SEO Meta Description'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].metaDescription = text;
          });
        }
      }

      // Translate Meta Keywords
      if (sourceMetaKeywords?.trim()) {
        const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/ai/translate', {
          method: 'POST',
          body: JSON.stringify({
            text: sourceMetaKeywords,
            targetLangs,
            context: 'SEO Meta Keywords'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].metaKeywords = text;
          });
        }
      }

      setTranslations(updates);
      toast.success("AI auto-translation completed!");
    } catch (err: any) {
      console.error("Auto translation error:", err);
      toast.error("Failed to auto-translate content.");
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    const defaultLang = languages.find(l => l.isDefault) || languages[0];
    const defaultTitle = translations[defaultLang.code]?.title;
    
    if (!defaultTitle?.trim()) {
      toast.error(`Page title in the default language (${defaultLang.name}) is required.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug: slug.trim() || undefined,
        published,
        translations
      };

      const res = await fetchApi<{ success: boolean; message: string }>(`/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.success) {
        toast.success('Custom page updated successfully!');
        router.push('/dashboard/pages');
      } else {
        throw new Error(res.message || 'Failed to update');
      }
    } catch (err: any) {
      console.error('Update page error', err);
      toast.error(err.message || 'Failed to update custom page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pages">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Custom Page</h1>
            <p className="text-muted-foreground text-sm">Modify and update dynamic static storefront pages.</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Update Page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Localized Rich Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Page Content
                </CardTitle>
                <CardDescription>
                  Translate your page title and detailed rich text content.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoTranslate}
                disabled={translating}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 flex items-center gap-1.5"
              >
                {translating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>✨ AI Auto Translate</span>
                )}
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Localized Title Input */}
              <LocalizedInput
                label="Page Title"
                languages={languages}
                translations={translations}
                field="title"
                onChange={(lang, val) => handleTranslationChange(lang, 'title', val)}
                required
                placeholder="Enter page title (e.g. Terms of Service)..."
              />

              {/* Localized BlockNote Rich Editor */}
              <LocalizedTextEditor
                label="Page Body Content"
                languages={languages}
                translations={translations}
                field="content"
                onChange={(lang, val) => handleTranslationChange(lang, 'content', val)}
                required
              />
            </CardContent>
          </Card>

          {/* Localized SEO Settings Card */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                Search Engine Optimization (SEO)
              </CardTitle>
              <CardDescription>
                Configure meta tags to boost indexing on Google Search.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Tabs defaultValue={languages.find(l => l.isDefault)?.code || 'en'} className="w-full">
                <TabsList className="mb-4">
                  {languages.map((lang) => (
                    <TabsTrigger key={lang.code} value={lang.code}>
                      <span className="mr-1.5">{lang.flag}</span>
                      {lang.code.toUpperCase()}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {languages.map((lang) => (
                  <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Meta Title</Label>
                      <Input
                        value={translations[lang.code]?.metaTitle || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'metaTitle', e.target.value)}
                        placeholder="Google Search Title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <Textarea
                        value={translations[lang.code]?.metaDescription || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'metaDescription', e.target.value)}
                        placeholder="Google Search Snippet Description..."
                        className="min-h-[70px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Keywords</Label>
                      <Input
                        value={translations[lang.code]?.metaKeywords || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'metaKeywords', e.target.value)}
                        placeholder="tags, separated, by, commas"
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Metadata & Routing</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between border p-3 rounded-lg bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Publish Page</Label>
                  <p className="text-[10px] text-muted-foreground">Make it visible on the storefront.</p>
                </div>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>

              <div className="space-y-2">
                <Label>Custom Slug (URL Path)</Label>
                <Input
                  placeholder="e.g. privacy-policy"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Unique dynamic web path.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
