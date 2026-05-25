'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { fetchApiClient as fetchApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Search, FileText, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface CustomPageTranslation {
  langCode: string;
  title: string;
}

interface CustomPage {
  id: string;
  slug: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  translations: CustomPageTranslation[];
}

export default function CustomPagesListingPage() {
  const { data: session } = useSession();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<{ success: boolean; data: CustomPage[] }>(
        `/pages?status=${statusFilter === 'all' ? '' : statusFilter}`
      );
      if (res.success && res.data) {
        setPages(res.data);
      }
    } catch (err) {
      console.error('Fetch pages error', err);
      toast.error('Failed to load custom pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchPages();
    }
  }, [session, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page permanently?')) {
      return;
    }

    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/pages/${id}`, {
        method: 'DELETE'
      });

      if (res.success) {
        toast.success('Custom page deleted successfully');
        setPages(pages.filter((page) => page.id !== id));
      } else {
        throw new Error(res.message || 'Failed to delete');
      }
    } catch (err: any) {
      console.error('Delete error', err);
      toast.error(err.message || 'Failed to delete custom page');
    }
  };

  const getEnglishTitle = (page: CustomPage) => {
    const translation = page.translations.find((t) => t.langCode === 'en') || page.translations[0];
    return translation ? translation.title : 'Untitled Page';
  };

  // Filter pages locally based on search query
  const filteredPages = pages.filter((page) => {
    const title = getEnglishTitle(page).toLowerCase();
    const slug = page.slug.toLowerCase();
    return title.includes(search.toLowerCase()) || slug.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Pages</h1>
          <p className="text-muted-foreground">
            Create, translate, and manage static pages like About Us, Privacy Policy, etc.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchPages} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
          </Button>

          <Link href="/dashboard/pages/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Page
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by page title or slug..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('published')}
            size="sm"
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('draft')}
            size="sm"
          >
            Drafts
          </Button>
        </div>
      </div>

      {/* Pages Listing Grid */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[35vh] border-2 border-dashed rounded-xl p-8 bg-card text-center">
          <FileText className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-lg">No custom pages found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Publish brand details, dynamic information pages, and agreements easily.
          </p>
          <Link href="/dashboard/pages/new" className="mt-4">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Create Page
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPages.map((page) => {
            const title = getEnglishTitle(page);

            return (
              <Card key={page.id} className="overflow-hidden border bg-card transition-all hover:shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-6 items-center">
                  
                  {/* Icon Indicator */}
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 border flex-shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-1.5 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={page.published ? 'default' : 'secondary'} className="text-[10px] font-semibold">
                        {page.published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(page.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 leading-snug">
                      {title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                        /{page.slug}
                      </span>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-row gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                    <Link href={`/dashboard/pages/edit/${page.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </Button>
                    </Link>

                    <Button variant="outline" size="sm" onClick={() => handleDelete(page.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50/50">
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
