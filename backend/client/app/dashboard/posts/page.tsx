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
import Image from 'next/image';

interface BlogPostTranslation {
  langCode: string;
  title: string;
  excerpt?: string;
}

interface BlogPost {
  id: string;
  slug: string;
  featuredImage?: string;
  published: boolean;
  publishedAt?: string;
  tags: string[];
  createdAt: string;
  translations: BlogPostTranslation[];
}

export default function BlogPostsListingPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<{ success: boolean; data: { posts: BlogPost[] } }>(
        `/blog?status=${statusFilter === 'all' ? '' : statusFilter}`
      );
      if (res.success && res.data?.posts) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Fetch posts error', err);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchPosts();
    }
  }, [session, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post permanently?')) {
      return;
    }

    try {
      const res = await fetchApi<{ success: boolean; message: string }>(`/blog/${id}`, {
        method: 'DELETE'
      });

      if (res.success) {
        toast.success('Blog post deleted successfully');
        setPosts(posts.filter((post) => post.id !== id));
      } else {
        throw new Error(res.message || 'Failed to delete');
      }
    } catch (err: any) {
      console.error('Delete error', err);
      toast.error(err.message || 'Failed to delete blog post');
    }
  };

  const getEnglishTitle = (post: BlogPost) => {
    const translation = post.translations.find((t) => t.langCode === 'en') || post.translations[0];
    return translation ? translation.title : 'Untitled Post';
  };

  const getEnglishExcerpt = (post: BlogPost) => {
    const translation = post.translations.find((t) => t.langCode === 'en') || post.translations[0];
    return translation && translation.excerpt ? translation.excerpt : 'No description available.';
  };

  // Filter posts locally based on search query
  const filteredPosts = posts.filter((post) => {
    const title = getEnglishTitle(post).toLowerCase();
    const slug = post.slug.toLowerCase();
    return title.includes(search.toLowerCase()) || slug.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Create, translate, and manage articles on your storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchPosts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading && 'animate-spin'}`} />
          </Button>

          <Link href="/dashboard/posts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by article title or slug..."
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

      {/* Posts Listing Table/Grid */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[35vh] border-2 border-dashed rounded-xl p-8 bg-card text-center">
          <FileText className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-lg">No articles found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Publish your first article to share thoughts and attract SEO traffic.
          </p>
          <Link href="/dashboard/posts/new" className="mt-4">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Create Article
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => {
            const title = getEnglishTitle(post);
            const excerpt = getEnglishExcerpt(post);
            const coverImage = post.featuredImage || '/placeholder-blog.png';

            return (
              <Card key={post.id} className="overflow-hidden border bg-card transition-all hover:shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-6 items-start">
                  {/* Thumbnail Cover */}
                  <div className="relative aspect-video md:w-[180px] w-full bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border">
                    {post.featuredImage ? (
                      <Image
                        src={post.featuredImage}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="180px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FileText className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={post.published ? 'default' : 'secondary'} className="text-[10px] font-semibold">
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 leading-snug">
                      {title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 pr-6">
                      {excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                        /{post.slug}
                      </span>
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-col gap-2 w-full md:w-auto justify-end md:self-stretch md:justify-center border-t md:border-t-0 pt-3 md:pt-0">
                    <Link href={`/dashboard/posts/edit/${post.id}`} className="flex-1 md:flex-initial">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </Button>
                    </Link>

                    <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50/50">
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
