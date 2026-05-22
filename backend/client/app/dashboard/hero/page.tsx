'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CSS } from '@dnd-kit/utilities';
import {
  Edit2,
  GripVertical,
  Image as ImageIcon,
  LayoutGrid,
  LayoutList,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { useConfirm } from '@/hooks/use-confirm';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const HERO_API = `${API_BASE}/hero-slides`;

type LinkType = 'NONE' | 'PRODUCT' | 'CATEGORY' | 'EXTERNAL';

interface HeroSlide {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  linkType: LinkType;
  linkValue?: string;
  linkName?: string; // NEW: Added from populated backend
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

const toInputFormat = (dateStr: string | undefined | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function SortableSlideItem({
  slide,
  onEdit,
  onDelete,
  onToggle,
  viewMode,
}: {
  slide: HeroSlide;
  onEdit: (s: HeroSlide) => void;
  onDelete: (id: string) => void;
  onToggle: (s: HeroSlide) => void;
  viewMode: 'list' | 'grid';
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  if (viewMode === 'grid') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group/slide h-full"
      >
        <Card
          className={cn(
            'overflow-hidden border-none shadow-sm h-full transition-all duration-300 ring-1 ring-gray-200/50 hover:ring-black group-hover/slide:shadow-xl group-hover/slide:-translate-y-1 bg-white',
            isDragging && 'shadow-2xl ring-2 ring-black z-50 scale-105',
          )}
        >
          <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover/slide:scale-110"
            />

            {/* Glassy Overlay for Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top Bar Actions */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover/slide:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover/slide:translate-y-0">
              <div
                {...attributes}
                {...listeners}
                className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-white transition-colors pointer-events-auto"
              >
                <GripVertical size={14} className="text-gray-600" />
              </div>
              <div className="flex gap-1.5 pointer-events-auto">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white border-none shadow-sm"
                  onClick={() =>
                    router.push(`/dashboard/hero/${slide.id}/edit`)
                  }
                >
                  <Edit2 size={13} />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 shadow-lg"
                  onClick={() => onDelete(slide.id)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>

            {/* Status Badge - Bottom Left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <Badge
                variant={slide.isActive ? 'default' : 'secondary'}
                className={cn(
                  'text-[9px] h-4.5 px-2 tracking-wide font-bold backdrop-blur-sm uppercase',
                  slide.isActive
                    ? 'bg-emerald-500/90 hover:bg-emerald-500'
                    : 'bg-gray-500/90 text-white',
                )}
              >
                {slide.isActive ? 'Live' : 'Draft'}
              </Badge>
            </div>

            {/* Switch - Bottom Right */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 pointer-events-auto text-white">
              <Switch
                checked={slide.isActive}
                onCheckedChange={() => onToggle(slide)}
                className="scale-75 origin-bottom-right data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          <CardContent className="p-3.5 space-y-1">
            <h3 className="font-bold text-sm tracking-tight text-gray-900 line-clamp-1">
              {slide.title || 'Untitled Banner'}
            </h3>
            <p className="text-[11px] text-gray-500 line-clamp-1 italic">
              {slide.subtitle || 'No subtitle provided'}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <div className="flex-1 flex items-center gap-1.5 min-w-0">
                <LinkIcon size={11} className="text-black shrink-0" />
                <span className="text-[10px] font-medium text-gray-600 truncate">
                  {slide.linkType !== 'NONE'
                    ? slide.linkName || slide.linkValue
                    : 'Direct link not set'}
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[8px] h-3.5 px-1 border-gray-400/30 text-gray-400 capitalize"
              >
                {slide.linkType.toLowerCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ultra-Compact List View
  return (
    <div ref={setNodeRef} style={style} className="group/row mb-1.5">
      <div
        className={cn(
          'bg-white border-b border-gray-100/80 transition-all hover:bg-gray-50 flex items-center h-11 px-2 gap-3',
          isDragging &&
          'shadow-2xl z-50 bg-white ring-1 ring-black/10 rounded-lg scale-[1.01]',
        )}
      >
        {/* Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded-md text-gray-300 hover:text-gray-500 transition-colors shrink-0"
        >
          <GripVertical size={16} />
        </div>

        {/* Mini Preview */}
        <div className="h-7 w-12 rounded bg-gray-100 border border-gray-200/50 overflow-hidden shrink-0 shadow-sm">
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content Info */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="font-bold text-[13px] text-gray-800 truncate leading-tight">
              {slide.title || 'Untitled Slide'}
            </h4>
            {(slide.linkValue || slide.linkName) && (
              <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate opacity-0 group-hover/row:opacity-100 transition-opacity">
                <LinkIcon size={8} />
                <span className="truncate max-w-[200px]">
                  {slide.linkName || slide.linkValue}
                </span>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 shrink-0 px-3 py-0.5 rounded-full bg-gray-100/50 border border-gray-100 text-[10px] font-medium text-gray-500">
            <LinkIcon size={10} className="text-gray-400" />
            <span className="uppercase tracking-widest">{slide.linkType}</span>
          </div>
        </div>

        {/* Actions - Slick Inline */}
        <div className="flex items-center gap-3 shrink-0">
          <Switch
            checked={slide.isActive}
            onCheckedChange={() => onToggle(slide)}
            className="scale-[0.7] origin-center translate-x-1"
          />

          <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity pr-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50"
              onClick={() => router.push(`/dashboard/hero/${slide.id}/edit`)}
            >
              <Edit2 size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50/50"
              onClick={() => onDelete(slide.id)}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSlidesPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || '';

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  // Hero Configuration Settings
  const [appearance, setAppearance] = useState({
    heroSliderEnabled: true,
    heroShowContent: true,
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredSlides = useMemo(() => {
    return slides.filter((slide) => {
      const matchesSearch =
        (slide.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (slide.subtitle || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && slide.isActive) ||
        (statusFilter === 'HIDDEN' && !slide.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [slides, searchQuery, statusFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const fetchSlides = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${HERO_API}/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) setSlides(data.data);
    } catch {
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMetadata = useCallback(async () => {
    if (!token) return;
    try {
      const [pRes, cRes, aRes] = await Promise.all([
        fetch(`${API_BASE}/products?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/settings/type/appearance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      const aData = await aRes.json();

      if (pData.success) setProducts(pData.data);
      if (cData.success) setCategories(cData.data);
      if (aData.success) {
        setAppearance({
          heroSliderEnabled: aData.data.heroSliderEnabled ?? true,
          heroShowContent: aData.data.heroShowContent ?? true,
        });
      }
    } catch (e) {
      console.error('Metadata fetch failed', e);
    }
  }, [token]);

  useEffect(() => {
    fetchSlides();
    fetchMetadata();
  }, [fetchSlides, fetchMetadata]);

  const updateAppearance = async (field: string, value: boolean) => {
    if (!token) return;
    setUpdatingSettings(true);
    try {
      const newAppearance = { ...appearance, [field]: value };
      const res = await fetch(`${API_BASE}/settings/appearance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAppearance),
      });
      const data = await res.json();
      if (data.success) {
        setAppearance(newAppearance);
        toast.success('Hero settings updated');
      }
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: 'Remove Hero Banner',
        message:
          'Are you sure you want to remove this banner? This will immediately affect the homepage visual sequence.',
        type: 'danger',
        confirmText: 'Remove Banner',
      }))
    )
      return;
    try {
      const res = await fetch(`${HERO_API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Deleted');
        fetchSlides();
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch(`${HERO_API}/${slide.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });

      if (res.ok) fetchSlides();
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);

    const newSlides = arrayMove(slides, oldIndex, newIndex);
    setSlides(newSlides);

    // Persist order
    try {
      const updates = newSlides.map((s, idx) => ({ id: s.id, order: idx }));
      const res = await fetch(`${HERO_API}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slides: updates }),
      });
      if (!res.ok) throw new Error();
      toast.success('Order saved');
    } catch {
      toast.error('Failed to save order');
      fetchSlides(); // Revert
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Slides</h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop to reorder images on the homepage.
          </p>
        </div>
        <Link href="/dashboard/hero/new">
          <Button className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center gap-2 px-6">
            <Plus size={18} />
            <span>Add Banners</span>
          </Button>
        </Link>
      </div>

      {/* Hero Configuration Settings */}
      <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gray-100 rounded-2xl flex items-center justify-center text-black shrink-0 border border-gray-200">
            <ImageIcon size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Hero Configuration
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Global display and animation settings for the shop hero area
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <Label
              className="text-sm font-bold text-gray-700 cursor-pointer"
              htmlFor="slider-toggle"
            >
              Slider Enabled
            </Label>
            <Switch
              id="slider-toggle"
              checked={appearance.heroSliderEnabled}
              onCheckedChange={(v) => updateAppearance('heroSliderEnabled', v)}
              disabled={updatingSettings}
              className="data-[state=checked]:bg-black"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label
              className="text-sm font-bold text-gray-700 cursor-pointer"
              htmlFor="content-toggle"
            >
              Overlay Text
            </Label>
            <Switch
              id="content-toggle"
              checked={appearance.heroShowContent}
              onCheckedChange={(v) => updateAppearance('heroShowContent', v)}
              disabled={updatingSettings}
              className="data-[state=checked]:bg-black"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search slides by title or subtitle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-gray-50/50 border-gray-100 focus:bg-white transition-all rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40 h-11 bg-gray-50/50 border-gray-100 rounded-lg">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Banners</SelectItem>
              <SelectItem value="ACTIVE">Live Only</SelectItem>
              <SelectItem value="HIDDEN">Drafts</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg p-1 bg-gray-50/50 h-11">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={cn(
                'h-9 w-9 rounded-md',
                viewMode === 'list' && 'bg-white shadow-sm',
              )}
            >
              <LayoutList size={18} />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={cn(
                'h-9 w-9 rounded-md',
                viewMode === 'grid' && 'bg-white shadow-sm',
              )}
            >
              <LayoutGrid size={18} />
            </Button>
          </div>
        </div>
      </div>

      {loading && slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <p className="text-muted-foreground font-medium">
            Fetching slides...
          </p>
        </div>
      ) : slides.length === 0 ? (
        <Card className="border-dashed py-20 bg-gray-50 flex flex-col items-center justify-center text-center px-4">
          <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="text-gray-400" size={32} />
          </div>
          <h3 className="font-semibold text-lg">No slides found</h3>
          <p className="text-muted-foreground max-w-xs mt-1 mb-6">
            Start by adding your first banner image to the homepage slider.
          </p>
          <Link href="/dashboard/hero/new">
            <Button variant="outline">Create a slide</Button>
          </Link>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredSlides.map((s) => s.id)}
            strategy={
              viewMode === 'list'
                ? verticalListSortingStrategy
                : rectSortingStrategy
            }
          >
            <div
              className={cn(
                viewMode === 'list'
                  ? 'space-y-1'
                  : 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6',
              )}
            >
              {filteredSlides.map((slide) => (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  onEdit={() => router.push(`/dashboard/hero/${slide.id}`)}
                  onDelete={handleDelete}
                  onToggle={toggleActive}
                  viewMode={viewMode}
                />
              ))}
              {filteredSlides.length === 0 && (
                <div className="col-span-full py-24 bg-gray-50 border border-dashed rounded-xl text-center text-muted-foreground">
                  <Search className="mx-auto mb-3 opacity-20" size={40} />
                  <p className="font-medium">
                    No slides match your search or filter.
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
