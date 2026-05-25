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
import ImageUpload from '@/components/dashboard/ImageUpload';
import { Loader2, ArrowLeft, Save, Globe, Settings, Eye } from 'lucide-react';
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

export default function EditBlogPostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  
  // Custom Fields (Common across all translations)
  const [slug, setSlug] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [published, setPublished] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  
  // Localized Translations state
  const [translations, setTranslations] = useState<Record<string, any>>({
    en: { title: '', content: '', excerpt: '', metaTitle: '', metaDescription: '', metaKeywords: '' },
    bn: { title: '', content: '', excerpt: '', metaTitle: '', metaDescription: '', metaKeywords: '' }
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
          excerpt: '',
          metaTitle: '',
          metaDescription: '',
          metaKeywords: ''
        };
      });

      // 3. Fetch Blog Post details by ID
      const postRes = await fetchApi<{
        success: boolean;
        data: {
          id: string;
          slug: string;
          featuredImage?: string;
          published: boolean;
          tags: string[];
          translations: Array<{
            langCode: string;
            title: string;
            content: string;
            excerpt?: string;
            metaTitle?: string;
            metaDescription?: string;
            metaKeywords?: string;
          }>;
        };
      }>(`/blog/id/${id}`);

      if (postRes.success && postRes.data) {
        const post = postRes.data;
        setSlug(post.slug);
        setFeaturedImage(post.featuredImage || '');
        setPublished(post.published);
        setTagsInput(post.tags ? post.tags.join(', ') : '');

        // Populate existing translations
        post.translations.forEach((trans) => {
          if (initialTrans[trans.langCode]) {
            initialTrans[trans.langCode] = {
              title: trans.title || '',
              content: trans.content || '',
              excerpt: trans.excerpt || '',
              metaTitle: trans.metaTitle || '',
              metaDescription: trans.metaDescription || '',
              metaKeywords: trans.metaKeywords || ''
            };
          }
        });
        setTranslations(initialTrans);
      } else {
        toast.error('Failed to load blog post details');
        router.push('/dashboard/posts');
      }
    } catch (err) {
      console.error('Fetch post error', err);
      toast.error('Failed to load blog post');
      router.push('/dashboard/posts');
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
    const sourceExcerpt = translations[defaultLang]?.excerpt;
    const sourceContent = translations[defaultLang]?.content;
    const sourceMetaTitle = translations[defaultLang]?.metaTitle;
    const sourceMetaDesc = translations[defaultLang]?.metaDescription;
    const sourceMetaKeywords = translations[defaultLang]?.metaKeywords;

    if (!sourceTitle?.trim() && !sourceExcerpt?.trim() && !sourceContent?.trim()) {
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
            context: 'Blog Post Title'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].title = text;
          });
        }
      }

      // Translate Excerpt
      if (sourceExcerpt?.trim()) {
        const res = await fetchApi<{ success: boolean; data: Record<string, string> }>('/ai/translate', {
          method: 'POST',
          body: JSON.stringify({
            text: sourceExcerpt,
            targetLangs,
            context: 'Blog Post Excerpt'
          })
        });
        if (res.success && res.data) {
          Object.entries(res.data).forEach(([code, text]) => {
            if (updates[code]) updates[code].excerpt = text;
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
            context: 'Blog Post Content (HTML)'
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
    // Validation
    const defaultLang = languages.find(l => l.isDefault) || languages[0];
    const defaultTitle = translations[defaultLang.code]?.title;
    
    if (!defaultTitle?.trim()) {
      toast.error(`Title in the default language (${defaultLang.name}) is required.`);
      return;
    }

    setSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        slug: slug.trim() || undefined,
        featuredImage: featuredImage || null,
        published,
        tags,
        translations
      };

      const res = await fetchApi<{ success: boolean; message: string }>(`/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.success) {
        toast.success('Article updated successfully!');
        router.push('/dashboard/posts');
      } else {
        throw new Error(res.message || 'Failed to update');
      }
    } catch (err: any) {
      console.error('Update error', err);
      toast.error(err.message || 'Failed to update blog post');
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
          <Link href="/dashboard/posts">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
            <p className="text-muted-foreground text-sm">Modify and update your premium blog post.</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Update Post
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
                  Article Content
                </CardTitle>
                <CardDescription>
                  Translate your title, excerpt, and content into active languages.
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
                label="Article Title"
                languages={languages}
                translations={translations}
                field="title"
                onChange={(lang, val) => handleTranslationChange(lang, 'title', val)}
                required
                placeholder="Enter article title..."
              />

              {/* Localized Excerpt Textarea */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Article Excerpt (Short Summary)</Label>
                <Tabs defaultValue={languages.find(l => l.isDefault)?.code || 'en'} className="w-full">
                  <TabsList className="mb-2">
                    {languages.map((lang) => (
                      <TabsTrigger key={lang.code} value={lang.code}>
                        <span className="mr-1.5">{lang.flag}</span>
                        {lang.code.toUpperCase()}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {languages.map((lang) => (
                    <TabsContent key={lang.code} value={lang.code}>
                      <Textarea
                        value={translations[lang.code]?.excerpt || ''}
                        onChange={(e) => handleTranslationChange(lang.code, 'excerpt', e.target.value)}
                        placeholder={`Short summary of the post in ${lang.name}...`}
                        className="min-h-[80px]"
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Localized BlockNote Rich Editor */}
              <LocalizedTextEditor
                label="Article Body Content"
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
                Configure SEO meta tags to increase organic Google traffic.
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
                        placeholder="Google Search Excerpt..."
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
          {/* Cover Featured Image Card */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-orange-500" />
                Featured Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <ImageUpload
                value={featuredImage}
                onChange={setFeaturedImage}
                onRemove={() => setFeaturedImage('')}
              />
              <div className="space-y-1 pt-2">
                <Label className="text-xs">Or custom Image URL</Label>
                <Input
                  placeholder="https://example.com/cover.jpg"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Publishing & Slug Configuration */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold">Metadata & Routing</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between border p-3 rounded-lg bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Publish Article</Label>
                  <p className="text-[10px] text-muted-foreground">Make it visible on the storefront.</p>
                </div>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>

              <div className="space-y-2">
                <Label>Custom Slug (URL Path)</Label>
                <Input
                  placeholder="e.g. how-to-choose-headphone"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Unique dynamic web path.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tags (SEO & Categories)</Label>
                <Input
                  placeholder="e.g. Tech, Headphone, Guide"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Separate tags with commas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
