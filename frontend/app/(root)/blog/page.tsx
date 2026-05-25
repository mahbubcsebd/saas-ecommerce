import { getBlogPosts } from '@/lib/fetchers';
import { getLocale } from '@/lib/i18n';
import { getLocalized, getImageUrl } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Tag, ArrowRight, BookOpen, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Insights & Stories - Mahbub Shop Blog',
  description: 'Explore the latest trends, expert advice, tutorials, and insights from our team.',
  openGraph: {
    title: 'Insights & Stories - Mahbub Shop Blog',
    description: 'Explore the latest trends, expert advice, tutorials, and insights from our team.',
    type: 'website',
  }
};

interface PageProps {
  searchParams: Promise<{ page?: string; tag?: string; search?: string }>;
}

export default async function BlogLandingPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const pageNumber = parseInt(resolvedParams.page || '1');
  const selectedTag = resolvedParams.tag || '';
  const searchQuery = resolvedParams.search || '';
  const locale = await getLocale();

  // Fetch blog posts from API
  const res = await getBlogPosts({
    page: pageNumber,
    limit: 9,
    status: 'published',
    tag: selectedTag,
    search: searchQuery,
    lang: locale
  });

  const posts = res?.posts || [];
  const pagination = res?.pagination || { total: 0, page: 1, limit: 9, totalPages: 0 };

  // Calculate reading time roughly based on word count
  const getReadingTime = (content: string) => {
    if (!content) return 2;
    const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average 200 WPM
    return Math.max(1, minutes);
  };

  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950/20 min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-12">
        
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {locale === 'bn' ? 'আমাদের ব্লগ ও সংবাদ' : 'Insights & Stories'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {locale === 'bn' 
              ? 'ই-কমার্স টিপস, নতুন প্রোডাক্টের গাইড এবং লেটেস্ট আপডেট পান সরাসরি আমাদের বিশেষজ্ঞদের কাছ থেকে।' 
              : 'Stay up-to-date with our expert e-commerce advice, tutorials, buyer guides, and official updates.'}
          </p>
        </div>

        {/* Filters bar */}
        {selectedTag && (
          <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-350">
              {locale === 'bn' ? 'ট্যাগ ফিল্টার করা হয়েছে:' : 'Filtering by tag:'} <strong className="text-blue-600 dark:text-blue-400">#{selectedTag}</strong>
            </span>
            <Link href="/blog" className="text-xs font-semibold text-red-500 hover:underline">
              {locale === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filter'}
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-4 shadow-sm">
            <BookOpen className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {locale === 'bn' ? 'কোনো ব্লগ পোস্ট পাওয়া যায়নি' : 'No articles published yet'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              {locale === 'bn'
                ? 'বর্তমানে আমাদের কোনো ব্লগ পোস্ট নেই। অনুগ্রহ করে পরবর্তীতে আবার চেষ্টা করুন।'
                : 'Check back soon for high-quality blogs, tutorials, and stories from Mahbub Shop.'}
            </p>
            <Link href="/blog">
              <button className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition">
                {locale === 'bn' ? 'ব্লগে ফিরে যান' : 'Refresh Blog'}
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Featured Post Card (only on page 1 and when not filtering tags) */}
            {pageNumber === 1 && !selectedTag && featuredPost && (
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-7 relative aspect-video lg:aspect-auto min-h-[350px] bg-slate-100 dark:bg-slate-900 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                    <Image
                      src={getImageUrl(featuredPost.featuredImage)}
                      alt={getLocalized(featuredPost, locale, 'title')}
                      fill
                      priority
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString(undefined, {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="h-1 w-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {getReadingTime(getLocalized(featuredPost, locale, 'content'))} {locale === 'bn' ? 'মিনিট পড়া' : 'min read'}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                        <Link href={`/blog/${featuredPost.slug}`}>
                          {getLocalized(featuredPost, locale, 'title')}
                        </Link>
                      </h2>

                      <p className="text-slate-600 dark:text-slate-350 text-sm sm:text-base line-clamp-4 leading-relaxed">
                        {getLocalized(featuredPost, locale, 'excerpt') || 
                          getLocalized(featuredPost, locale, 'content')?.replace(/<[^>]*>/g, '').slice(0, 200) + '...'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-50 dark:border-slate-900">
                      <div className="flex flex-wrap gap-1.5">
                        {featuredPost.tags?.slice(0, 3).map((tag: string) => (
                          <Link 
                            key={tag} 
                            href={`/blog?tag=${tag}`}
                            className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                      <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        {locale === 'bn' ? 'বিস্তারিত পড়ুন' : 'Read Article'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(pageNumber === 1 && !selectedTag ? regularPosts : posts).map((post: any) => (
                <article key={post.id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full duration-300">
                  {/* Thumbnail cover */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    <Image
                      src={getImageUrl(post.featuredImage)}
                      alt={getLocalized(post, locale, 'title')}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="h-1 w-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {getReadingTime(getLocalized(post, locale, 'content'))} {locale === 'bn' ? 'মিনিট' : 'min'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          {getLocalized(post, locale, 'title')}
                        </Link>
                      </h3>

                      <p className="text-slate-600 dark:text-slate-450 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                        {getLocalized(post, locale, 'excerpt') || 
                          getLocalized(post, locale, 'content')?.replace(/<[^>]*>/g, '').slice(0, 120) + '...'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50/50 dark:border-slate-900">
                      <div className="flex flex-wrap gap-1">
                        {post.tags?.slice(0, 2).map((tag: string) => (
                          <Link 
                            key={tag} 
                            href={`/blog?tag=${tag}`}
                            className="text-[9px] font-semibold uppercase tracking-wider bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-350 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        {locale === 'bn' ? 'পড়ুন' : 'Read'}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                {pageNumber > 1 && (
                  <Link href={`/blog?page=${pageNumber - 1}${selectedTag ? `&tag=${selectedTag}` : ''}`}>
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
                      {locale === 'bn' ? 'পূর্ববর্তী' : 'Previous'}
                    </button>
                  </Link>
                )}
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4">
                  {locale === 'bn' ? `পৃষ্ঠা ${pageNumber} এর ${pagination.totalPages}` : `Page ${pageNumber} of ${pagination.totalPages}`}
                </span>
                {pageNumber < pagination.totalPages && (
                  <Link href={`/blog?page=${pageNumber + 1}${selectedTag ? `&tag=${selectedTag}` : ''}`}>
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
                      {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
