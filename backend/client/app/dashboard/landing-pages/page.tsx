"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
    BarChart,
    Copy,
    Edit,
    ExternalLink,
    Eye,
    FileText,
    Loader2,
    MoreVertical,
    MousePointer2,
    Plus,
    Search,
    ShoppingBag,
    Trash,
    Zap
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.mahbuburrahman.xyz/api";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    if (token) fetchPages();
  }, [token]);

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
      toast.error("Failed to fetch pages");
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
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Page deleted");
        fetchPages();
      } else {
        toast.error("Failed to delete page");
      }
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/landing-pages/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Page duplicated");
        fetchPages();
      } else {
        toast.error("Failed to duplicate page");
      }
    } catch (error) {
      toast.error("Failed to duplicate page");
    }
  };

  const handlePublish = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/landing-pages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        toast.success(`Page ${isActive ? "unpublished" : "published"}`);
        fetchPages();
      } else {
        toast.error("Failed to update page");
      }
    } catch (error) {
      toast.error("Failed to update page");
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(search.toLowerCase()) ||
                         page.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" ||
                         (filter === "published" && page.isActive) ||
                         (filter === "draft" && !page.isActive);
    return matchesSearch && matchesFilter;
  });

  const totalViews = pages.reduce((acc, p) => acc + p.viewCount, 0);
  const totalOrders = pages.reduce((acc, p) => acc + p.orderCount, 0);

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Landing Pages</h2>
          <p className="text-muted-foreground mt-1">Create and manage high-conversion promotional funnels.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/landing-pages/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : pages.length}</div>
            <p className="text-xs text-muted-foreground">Active and drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <MousePointer2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined traffic across funnels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{loading ? "—" : totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Orders from landing pages</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            onClick={() => setFilter("all")}
            size="sm"
            className={cn("h-7 px-3 text-xs font-semibold rounded-md", filter === "all" && "bg-background shadow-sm")}
          >
            All
          </Button>
          <Button
            variant={filter === "published" ? "secondary" : "ghost"}
            onClick={() => setFilter("published")}
            size="sm"
            className={cn("h-7 px-3 text-xs font-semibold rounded-md", filter === "published" && "bg-background shadow-sm")}
          >
            Published
          </Button>
          <Button
            variant={filter === "draft" ? "secondary" : "ghost"}
            onClick={() => setFilter("draft")}
            size="sm"
            className={cn("h-7 px-3 text-xs font-semibold rounded-md", filter === "draft" && "bg-background shadow-sm")}
          >
            Draft
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Path</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center">Analytics</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs">Loading pages...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground text-sm">
                      No landing pages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => {
                    const conversionRate = page.viewCount > 0
                      ? ((page.orderCount / page.viewCount) * 100).toFixed(1)
                      : "0.0";

                    return (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium text-slate-900">
                          {page.title}
                        </TableCell>
                        <TableCell>
                          <code className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded border">
                            /{page.slug}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border-none",
                            page.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {page.isActive ? "LIVE" : "DRAFT"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-6">
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-900 leading-tight">{page.viewCount}</p>
                                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Views</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-emerald-600 leading-tight">{page.orderCount}</p>
                                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Orders</p>
                             </div>
                             <div className="text-center">
                                <p className="text-[10px] font-bold text-blue-600 leading-tight">{conversionRate}%</p>
                                <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider">Conv.</p>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(page.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/landing-pages/${page.id}`} className="cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit in Builder
                                </Link>
                              </DropdownMenuItem>

                              {page.isActive && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`/landing/${page.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Live Page
                                  </a>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/landing-pages/${page.id}/analytics`} className="cursor-pointer">
                                  <BarChart className="h-4 w-4 mr-2" />
                                  View Analytics
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => handleDuplicate(page.id)} className="cursor-pointer">
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Funnel
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handlePublish(page.id, page.isActive)}
                                className="cursor-pointer"
                              >
                                {page.isActive ? <Eye className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                {page.isActive ? "Unpublish Page" : "Publish Page"}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleDelete(page.id)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Page
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
        </CardContent>
      </Card>
    </div>
  );
}
