"use client";

import { PageBuilder } from "@/components/page-builder/PageBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, Loader2, Save } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.mahbuburrahman.xyz/api";

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState({
    title: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
    gjs_html: "",
    gjs_css: "",
    gjs_json: "",
  });

  useEffect(() => {
    if (id !== "create" && token) {
      fetchPage();
    } else if (id === "create") {
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
      toast.error("Failed to load page");
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

      const url = id === "create"
        ? `${API_BASE}/landing-pages`
        : `${API_BASE}/landing-pages/${id}`;

      const method = id === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(id === "create" ? "Page created" : "Page updated");

        if (id === "create") {
          router.push(`/dashboard/landing-pages/${data.data.id}/edit`);
        }
      } else {
        toast.error(data.message || "Failed to save page");
      }
    } catch (error) {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary mb-2" />
        <p className="text-muted-foreground text-xs font-medium">Loading page details...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col -m-6">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard/landing-pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {id === "create" ? "Create Landing Page" : "Edit Experience"}
            </h2>
            {pageData.slug && (
              <p className="text-xs text-muted-foreground">
                Path: <span className="font-mono text-blue-600">/landing/{pageData.slug}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pageData.slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/landing/${pageData.slug}`} target="_blank">
                <Eye className="h-3.5 w-3.5 mr-2" />
                Preview
              </a>
            </Button>
          )}
          <Button onClick={() => handleSave()} disabled={saving} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Save className="h-3.5 w-3.5 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="builder" className="h-full flex flex-col">
          <div className="px-6 border-b bg-muted/30">
            <TabsList className="h-10 bg-transparent p-0 gap-6">
              <TabsTrigger
                value="builder"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-xs uppercase tracking-wider"
              >
                Designer
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-xs uppercase tracking-wider"
              >
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="seo"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-xs uppercase tracking-wider"
              >
                SEO
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="builder" className="flex-1 m-0 overflow-hidden">
            <PageBuilder
              pageId={id !== "create" ? id : undefined}
              initialData={{
                html: pageData.gjs_html,
                css: pageData.gjs_css,
                json: pageData.gjs_json,
              }}
              onSave={handleSave}
            />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 overflow-auto p-6 bg-muted/10">
            <div className="max-w-2xl space-y-6 mx-auto">
               <div className="bg-background p-6 rounded-xl border shadow-sm space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-xs font-semibold">Page Title</Label>
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
                      className="h-9"
                      placeholder="e.g. Summer Sale 2025"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="slug" className="text-xs font-semibold">URL Slug</Label>
                    <div className="flex items-center">
                      <span className="h-9 flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-xs font-medium text-muted-foreground">/landing/</span>
                      <Input
                        id="slug"
                        value={pageData.slug}
                        onChange={(e) => setPageData({
                          ...pageData,
                          slug: generateSlug(e.target.value),
                        })}
                        className="h-9 rounded-l-none font-medium"
                        placeholder="summer-sale"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">Internal Description</Label>
                    <Textarea
                      id="description"
                      value={pageData.description || ""}
                      onChange={(e) => setPageData({
                        ...pageData,
                        description: e.target.value,
                      })}
                      className="min-h-[120px] resize-none"
                      placeholder="Brief notes for reference..."
                    />
                  </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="flex-1 m-0 overflow-auto p-6 bg-muted/10">
            <div className="max-w-2xl space-y-6 mx-auto">
               <div className="bg-background p-6 rounded-xl border shadow-sm space-y-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="metaTitle" className="text-xs font-semibold">Search Title</Label>
                    <Input
                      id="metaTitle"
                      value={pageData.metaTitle || ""}
                      onChange={(e) => setPageData({
                        ...pageData,
                        metaTitle: e.target.value,
                      })}
                      className="h-9"
                      placeholder="Appears in Google results"
                      maxLength={60}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="metaDescription" className="text-xs font-semibold">Search Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={pageData.metaDescription || ""}
                      onChange={(e) => setPageData({
                        ...pageData,
                        metaDescription: e.target.value,
                      })}
                      className="min-h-[100px] resize-none"
                      placeholder="Summary for search results..."
                      maxLength={160}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ogImage" className="text-xs font-semibold">OG Image (Share Preview)</Label>
                    <Input
                      id="ogImage"
                      value={pageData.ogImage || ""}
                      onChange={(e) => setPageData({
                        ...pageData,
                        ogImage: e.target.value,
                      })}
                      className="h-9"
                      placeholder="https://example.com/share-image.jpg"
                    />
                  </div>
               </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
