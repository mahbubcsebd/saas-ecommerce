'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
    BarChart,
    Copy,
    Edit,
    ExternalLink,
    Eye,
    MoreVertical,
    Plus,
    Search,
    Trash,
    Zap
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  viewCount: number;
  orderCount: number;
  createdAt: string;
}

export default function LandingPagesPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    if (token) fetchPages();
  }, [filter, token]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/landing-pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setPages(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Landing Page",
        message: "Are you sure you want to delete this promotional funnel? All associated content and tracking will be lost permanently.",
        type: "danger",
        confirmText: "Delete Page"
    })) return;

    try {
      const response = await fetch(`${API_BASE}/landing-pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Page deleted');
        fetchPages();
      } else {
        toast.error('Failed to delete page');
      }
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/landing-pages/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Page duplicated');
        fetchPages();
      } else {
        toast.error('Failed to duplicate page');
      }
    } catch (error) {
      toast.error('Failed to duplicate page');
    }
  };

  const handlePublish = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/landing-pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`Page ${isActive ? 'unpublished' : 'published'}`);
        fetchPages();
      } else {
        toast.error('Failed to update page');
      }
    } catch (error) {
      toast.error('Failed to update page');
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(search.toLowerCase()) ||
                         page.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
                         (filter === 'published' && page.isActive) ||
                         (filter === 'draft' && !page.isActive);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Zap className="h-8 w-8 text-orange-500 fill-current" /> Landing Pages
          </h1>
          <p className="text-slate-500 font-medium tracking-tight">
            Create and manage high-conversion promotional funnels
          </p>
        </div>
        <Button asChild className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 h-11 px-6 rounded-xl font-bold">
          <Link href="/dashboard/landing-pages/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 border-slate-200 bg-white rounded-xl focus:ring-orange-500"
          />
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            onClick={() => setFilter('all')}
            size="sm"
            className={cn("rounded-lg font-bold px-4 h-9", filter === 'all' && "bg-white shadow-sm")}
          >
            All
          </Button>
          <Button
            variant={filter === 'published' ? 'secondary' : 'ghost'}
            onClick={() => setFilter('published')}
            size="sm"
            className={cn("rounded-lg font-bold px-4 h-9", filter === 'published' && "bg-white shadow-sm")}
          >
            Published
          </Button>
          <Button
            variant={filter === 'draft' ? 'secondary' : 'ghost'}
            onClick={() => setFilter('draft')}
            size="sm"
            className={cn("rounded-lg font-bold px-4 h-9", filter === 'draft' && "bg-white shadow-sm")}
          >
            Draft
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-2xl">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-6">Title</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest">URL</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Stats</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Created</TableHead>
              <TableHead className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    Loading pages...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-24 text-slate-400 font-medium">
                  No pages found
                </TableCell>
              </TableRow>
            ) : (
              filteredPages.map((page) => {
                const conversionRate = page.viewCount > 0
                  ? ((page.orderCount / page.viewCount) * 100).toFixed(1)
                  : '0.0';

                return (
                  <TableRow key={page.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900 text-sm pl-6">
                      {page.title}
                    </TableCell>
                    <TableCell>
                      <code className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full uppercase tracking-tight">
                        /{page.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[10px] uppercase font-black rounded-lg border-none",
                        page.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      )}>
                        {page.isActive ? 'Live' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-4">
                         <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-slate-900">{page.viewCount}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Views</span>
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-green-600">{page.orderCount}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Conv.</span>
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="text-xs font-black text-blue-600 font-semibold">{conversionRate}%</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Rate</span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-400 text-center">
                      {formatDistanceToNow(new Date(page.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-2xl border-slate-100 p-2">
                          <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-blue-50 focus:text-blue-600 py-3">
                            <Link href={`/dashboard/landing-pages/${page.id}`}>
                              <Edit className="h-4 w-4 mr-3" />
                              Open Builder
                            </Link>
                          </DropdownMenuItem>

                          {page.isActive && (
                            <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-orange-50 focus:text-orange-600 py-3">
                              <a
                                href={`/landing/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-3" />
                                View Live Page
                              </a>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-purple-50 focus:text-purple-600 py-3">
                            <Link href={`/dashboard/landing-pages/${page.id}/analytics`}>
                              <BarChart className="h-4 w-4 mr-3" />
                              View Analytics
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleDuplicate(page.id)} className="rounded-xl cursor-pointer py-3">
                            <Copy className="h-4 w-4 mr-3" />
                            Duplicate Funnel
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handlePublish(page.id, page.isActive)}
                             className="rounded-xl cursor-pointer py-3"
                          >
                            <Eye className="h-4 w-4 mr-3" />
                            {page.isActive ? 'Unpublish Page' : 'Publish Page'}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDelete(page.id)}
                            className="rounded-xl cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 py-3"
                          >
                            <Trash className="h-4 w-4 mr-3" />
                            Permanently Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { Loader2 } from 'lucide-react';
