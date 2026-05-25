import { getBlogPostBySlug, getBlogPosts } from '@/lib/fetchers';
import { getLocale } from '@/lib/i18n';
import { getLocalized, getImageUrl } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ArrowLeft, BookOpen, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || !post.published) {
    return { title: 'Article Not Found' };
  }

  const locale = await getLocale();
  const title = getLocalized(post, locale, 'title') || 'Blog Post';
  const metaTitle = getLocalized(post, locale, 'metaTitle') || title;
  const metaDescription = getLocalized(post, locale, 'metaDescription') || '';
  const metaKeywords = getLocalized(post, locale, 'metaKeywords') || '';
  const image = getImageUrl(post.featuredImage);

  return {
    title: `${metaTitle} - Mahbub Shop Blog`,
    description: metaDescription,
    keywords: metaKeywords,
    openGraph: {
      title: `${metaTitle} - Mahbub Shop Blog`,
      description: metaDescription,
      images: [{ url: image }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${metaTitle} - Mahbub Shop Blog`,
      description: metaDescription,
      images: [image],
    }
  };
}

export default async function BlogPostDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  const locale = await getLocale();
  const title = getLocalized(post, locale, 'title');
  const excerpt = getLocalized(post, locale, 'excerpt');
  const content = getLocalized(post, locale, 'content');
  const coverImage = post.featuredImage;

  // Calculate reading time
  const getReadingTime = (contentStr: string) => {
    if (!contentStr) return 2;
    const words = contentStr.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return Math.max(1, minutes);
  };

  // Fetch recent posts for a sidebar recommendation
  let recentPosts: any[] = [];
  try {
    const recentRes = await getBlogPosts({ limit: 4, status: 'published' });
    if (recentRes?.posts) {
      recentPosts = recentRes.posts.filter((p: any) => p.id !== post.id).slice(0, 3);
    }
  } catch (err) {
    console.warn('Failed to load recent posts for sidebar', err);
  }

  return (
    <div className="bg-slate-50/30 dark:bg-slate-950/20 min-h-screen py-12">
      {/* BlockNote parser styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .rich-text-container h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; line-height: 1.25; }
        .dark .rich-text-container h1 { color: #f8fafc; }
        .rich-text-container h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.875rem; color: #1e293b; line-height: 1.3; }
        .dark .rich-text-container h2 { color: #f1f5f9; }
        .rich-text-container h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #334155; line-height: 1.35; }
        .dark .rich-text-container h3 { color: #e2e8f0; }
        .rich-text-container p { margin-bottom: 1.25rem; line-height: 1.8; color: #334155; font-size: 1.125rem; }
        .dark .rich-text-container p { color: #cbd5e1; }
        .rich-text-container ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .rich-text-container ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .rich-text-container li { margin-bottom: 0.5rem; line-height: 1.7; color: #334155; font-size: 1.125rem; }
        .dark .rich-text-container li { color: #cbd5e1; }
        .rich-text-container blockquote { border-left: 4px solid #3b82f6; padding-left: 1.25rem; font-style: italic; color: #475569; margin: 1.75rem 0; font-size: 1.2rem; }
        .dark .rich-text-container blockquote { border-left-color: #3b82f6; color: #94a3b8; }
        .rich-text-container pre { background-color: #f8fafc; padding: 1.25rem; border-radius: 0.5rem; font-family: monospace; overflow-x: auto; margin-bottom: 1.25rem; border: 1px solid #e2e8f0; }
        .dark .rich-text-container pre { background-color: #0f172a; border-color: #1e293b; color: #f8fafc; }
        .rich-text-container img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 2.5rem auto; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .rich-text-container a { color: #2563eb; text-decoration: underline; }
        .rich-text-container a:hover { color: #1d4ed8; }
      ` }} />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 group transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            {locale === 'bn' ? 'ব্লগে ফিরে যান' : 'Back to Blog'}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Article Container */}
          <article className="lg:col-span-8 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
            
            {/* Header Content */}
            <header className="space-y-6">
              
              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag: string) => (
                  <Link 
                    key={tag} 
                    href={`/blog?tag=${tag}`}
                    className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-600 dark:text-slate-350 px-2.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                {title}
              </h1>

              {/* Excerpt */}
              {excerpt && (
                <p className="text-slate-500 dark:text-slate-400 text-lg border-l-2 border-slate-300 dark:border-slate-700 pl-4 py-1 leading-relaxed">
                  {excerpt}
                </p>
              )}

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 dark:text-slate-450 pt-2 border-t border-slate-50 dark:border-slate-900">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {getReadingTime(content)} {locale === 'bn' ? 'মিনিট পড়া' : 'min read'}
                </span>
              </div>
            </header>

            {/* Featured Image */}
            {coverImage && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Image
                  src={getImageUrl(coverImage)}
                  alt={title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 80vw"
                />
              </div>
            )}

            {/* Render HTML BlockNote content */}
            <div 
              className="rich-text-container text-slate-700 dark:text-slate-300 pt-4"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>

          {/* Right Sidebar: Recent posts / suggestions */}
          <aside className="lg:col-span-4 space-y-6">
            
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="font-extrabold text-slate-900 dark:text-white border-b dark:border-slate-850 pb-3 text-lg flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-500" />
                {locale === 'bn' ? 'সাম্প্রতিক পোস্টসমূহ' : 'Recent Articles'}
              </h3>

              {recentPosts.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-450 text-xs text-center py-4">
                  {locale === 'bn' ? 'কোনো সাম্প্রতিক পোস্ট পাওয়া যায়নি' : 'No other recent articles found.'}
                </p>
              ) : (
                <div className="space-y-5">
                  {recentPosts.map((rPost: any) => {
                    const rTitle = getLocalized(rPost, locale, 'title');
                    const rCover = getImageUrl(rPost.featuredImage);
                    return (
                      <div key={rPost.id} className="flex gap-4 items-start group">
                        <Link href={`/blog/${rPost.slug}`} className="relative h-14 w-20 aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex-shrink-0">
                          <Image
                            src={rCover}
                            alt={rTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="80px"
                          />
                        </Link>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            <Link href={`/blog/${rPost.slug}`}>
                              {rTitle}
                            </Link>
                          </h4>
                          <span className="text-[10px] text-slate-450">
                            {new Date(rPost.publishedAt || rPost.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Premium Call to Action */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md text-center space-y-4">
              <h3 className="font-black text-xl leading-tight">
                {locale === 'bn' ? 'পেশাদার গাইড খুঁজছেন?' : 'Looking for high quality products?'}
              </h3>
              <p className="text-blue-100 text-xs leading-relaxed">
                {locale === 'bn'
                  ? 'আমাদের চমৎকার প্রোডাক্ট ক্যাটালগ দেখুন এবং আপনার পছন্দসই পণ্যটি খুঁজে নিন।'
                  : 'Check out our curated product catalogs and enjoy premium delivery services today.'}
              </p>
              <Link href="/all" className="inline-block w-full py-2 bg-white text-blue-700 rounded-lg text-xs font-bold shadow hover:bg-slate-50 transition">
                {locale === 'bn' ? 'সব প্রোডাক্ট দেখুন' : 'Explore Catalog'}
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
