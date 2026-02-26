"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import {
    Check,
    ChevronsUpDown,
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
    Upload,
    X
} from "lucide-react";

import { useConfirm } from "@/hooks/use-confirm";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const HERO_API = `${API_BASE}/hero-slides`;


type LinkType = "NONE" | "PRODUCT" | "CATEGORY" | "EXTERNAL";

interface HeroSlide {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  linkType: LinkType;
  linkValue?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

const toInputFormat = (dateStr: string | undefined | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function SortableSlideItem({
  slide,
  onEdit,
  onDelete,
  onToggle,
  viewMode
}: {
  slide: HeroSlide;
  onEdit: (s: HeroSlide) => void;
  onDelete: (id: string) => void;
  onToggle: (s: HeroSlide) => void;
  viewMode: "list" | "grid";
}) {
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
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  if (viewMode === "grid") {
    return (
      <div ref={setNodeRef} style={style} className="relative group/slide h-full">
        <Card className={cn(
          "overflow-hidden border-none shadow-sm h-full transition-all duration-300 ring-1 ring-gray-200/50 hover:ring-blue-400 group-hover/slide:shadow-xl group-hover/slide:-translate-y-1 bg-white",
          isDragging && "shadow-2xl ring-2 ring-blue-500 z-50 scale-105"
        )}>
          <div className="relative aspect-[16/9] bg-gray-50 overflow-hidden">
            <img src={slide.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover/slide:scale-110" />

            {/* Glassy Overlay for Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top Bar Actions */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover/slide:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover/slide:translate-y-0">
               <div {...attributes} {...listeners} className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-white transition-colors pointer-events-auto">
                 <GripVertical size={14} className="text-gray-600" />
               </div>
               <div className="flex gap-1.5 pointer-events-auto">
                 <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white border-none shadow-sm" onClick={() => onEdit(slide)}>
                   <Edit2 size={13} />
                 </Button>
                 <Button variant="destructive" size="icon" className="h-8 w-8 shadow-lg" onClick={() => onDelete(slide.id)}>
                   <Trash2 size={13} />
                 </Button>
               </div>
            </div>

            {/* Status Badge - Bottom Left */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
               <Badge variant={slide.isActive ? "default" : "secondary"} className={cn(
                 "text-[9px] h-4.5 px-2 tracking-wide font-bold backdrop-blur-sm uppercase",
                 slide.isActive ? "bg-emerald-500/90 hover:bg-emerald-500" : "bg-gray-500/90 text-white"
               )}>
                 {slide.isActive ? "Live" : "Draft"}
               </Badge>
            </div>

             {/* Switch - Bottom Right */}
             <div className="absolute bottom-2 right-2 opacity-0 group-hover/slide:opacity-100 transition-opacity duration-300 pointer-events-auto text-white">
               <Switch checked={slide.isActive} onCheckedChange={() => onToggle(slide)} className="scale-75 origin-bottom-right data-[state=checked]:bg-emerald-500" />
            </div>
          </div>

          <CardContent className="p-3.5 space-y-1">
             <h3 className="font-bold text-sm tracking-tight text-gray-900 line-clamp-1">{slide.title || "Untitled Banner"}</h3>
             <p className="text-[11px] text-gray-500 line-clamp-1 italic">{slide.subtitle || "No subtitle provided"}</p>

             <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <LinkIcon size={11} className="text-blue-500 shrink-0" />
                  <span className="text-[10px] font-medium text-gray-600 truncate">
                    {slide.linkType !== "NONE" ? slide.linkValue : "Direct link not set"}
                  </span>
                </div>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-gray-400/30 text-gray-400 capitalize">{slide.linkType.toLowerCase()}</Badge>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ultra-Compact List View
  return (
    <div ref={setNodeRef} style={style} className="group/row mb-1.5">
      <div className={cn(
        "bg-white border-b border-gray-100/80 transition-all hover:bg-gray-50 flex items-center h-11 px-2 gap-3",
        isDragging && "shadow-2xl z-50 bg-white ring-1 ring-blue-500/30 rounded-lg scale-[1.01]"
      )}>
        {/* Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded-md text-gray-300 hover:text-gray-500 transition-colors shrink-0">
          <GripVertical size={16} />
        </div>

        {/* Mini Preview */}
        <div className="h-7 w-12 rounded bg-gray-100 border border-gray-200/50 overflow-hidden shrink-0 shadow-sm">
          <img src={slide.image} alt="" className="h-full w-full object-cover" />
        </div>

        {/* Content Info */}
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="font-bold text-[13px] text-gray-800 truncate leading-tight">{slide.title || "Untitled Slide"}</h4>
            {slide.linkValue && (
               <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <LinkIcon size={8} />
                  <span className="truncate max-w-[200px]">{slide.linkValue}</span>
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
           <Switch checked={slide.isActive} onCheckedChange={() => onToggle(slide)} className="scale-[0.7] origin-center translate-x-1" />

           <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity pr-1">
             <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50" onClick={() => onEdit(slide)}>
               <Edit2 size={12} />
             </Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50/50" onClick={() => onDelete(slide.id)}>
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
  const token = (session as any)?.accessToken || "";

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");


  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    linkType: "NONE" as LinkType,
    linkValue: "",
    isActive: true,
    startDate: "",
    endDate: "",
    imageFiles: [] as File[],
    existingImage: "",
  });

  const filteredSlides = useMemo(() => {
    return slides.filter(slide => {
      const matchesSearch = (slide.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (slide.subtitle || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" ||
                           (statusFilter === "ACTIVE" && slide.isActive) ||
                           (statusFilter === "HIDDEN" && !slide.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [slides, searchQuery, statusFilter]);


  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchSlides = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${HERO_API}/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) setSlides(data.data);
    } catch { toast.error("Failed to load slides"); }
    finally { setLoading(false); }
  }, [token]);

  const fetchMetadata = useCallback(async () => {
    if(!token) return;
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/products?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if(pData.success) setProducts(pData.data);
      if(cData.success) setCategories(cData.data);
    } catch (e) { console.error("Metadata fetch failed", e); }
  }, [token]);

  useEffect(() => {
    fetchSlides();
    fetchMetadata();
  }, [fetchSlides, fetchMetadata]);

  // Dropzone Setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreviews = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setForm(prev => ({ ...prev, imageFiles: filesWithPreviews }));
  }, []);

  // Cleanup previews
  useEffect(() => {
    return () => {
      form.imageFiles.forEach((file: any) => URL.revokeObjectURL(file.preview));
    };
  }, [form.imageFiles]);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: !editId,
  });

  const openCreate = () => {
    setEditId(null);
    setForm({
      title: "",
      subtitle: "",
      linkType: "NONE",
      linkValue: "",
      isActive: true,
      startDate: "",
      endDate: "",
      imageFiles: [],
      existingImage: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditId(slide.id);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      linkType: slide.linkType,
      linkValue: slide.linkValue || "",
      isActive: slide.isActive,
      startDate: toInputFormat(slide.startDate),
      endDate: toInputFormat(slide.endDate),
      imageFiles: [],
      existingImage: slide.image,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editId && form.imageFiles.length === 0) return toast.error("Image is required");

    setSaving(true);
    try {
      if (editId) {
        const payload = {
          title: form.title,
          subtitle: form.subtitle,
          linkType: form.linkType,
          linkValue: form.linkValue,
          isActive: form.isActive,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        };

        const res = await fetch(`${HERO_API}/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          toast.success("Slide updated");
          setDialogOpen(false);
          fetchSlides();
        } else toast.error(data.message);
      } else {
        const formData = new FormData();
        form.imageFiles.forEach(file => formData.append("images", file));
        formData.append("metadata", JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          linkType: form.linkType,
          linkValue: form.linkValue,
          isActive: form.isActive,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }));

        const res = await fetch(`${HERO_API}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          toast.success("Slides created");
          setDialogOpen(false);
          fetchSlides();
        } else toast.error(data.message);
      }
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Remove Hero Banner",
        message: "Are you sure you want to remove this banner? This will immediately affect the homepage visual sequence.",
        type: "danger",
        confirmText: "Remove Banner"
    })) return;
    try {
      const res = await fetch(`${HERO_API}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) { toast.success("Deleted"); fetchSlides(); }
    } catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch(`${HERO_API}/${slide.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });

      if (res.ok) fetchSlides();
    } catch { toast.error("Toggle failed"); }
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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ slides: updates }),
      });
      if (!res.ok) throw new Error();
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
      fetchSlides(); // Revert
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Slides</h1>
          <p className="text-muted-foreground mt-1">Drag and drop to reorder images on the homepage.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={18} /> Add Banner
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn("h-9 w-9 rounded-md", viewMode === "list" && "bg-white shadow-sm")}
            >
              <LayoutList size={18} />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn("h-9 w-9 rounded-md", viewMode === "grid" && "bg-white shadow-sm")}
            >
              <LayoutGrid size={18} />
            </Button>
          </div>
        </div>
      </div>

      {loading && slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
           <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
           <p className="text-muted-foreground font-medium">Fetching slides...</p>
        </div>
      ) : slides.length === 0 ? (
        <Card className="border-dashed py-20 bg-gray-50 flex flex-col items-center justify-center text-center px-4">
           <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="text-gray-400" size={32} />
           </div>
           <h3 className="font-semibold text-lg">No slides found</h3>
           <p className="text-muted-foreground max-w-xs mt-1 mb-6">Start by adding your first banner image to the homepage slider.</p>
           <Button onClick={openCreate} variant="outline">Create a slide</Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredSlides.map(s => s.id)}
            strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}
          >
            <div className={cn(
               viewMode === "list" ? "space-y-1" : "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            )}>
              {filteredSlides.map((slide) => (
                <SortableSlideItem
                  key={slide.id}
                  slide={slide}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={toggleActive}
                  viewMode={viewMode}
                />
              ))}
              {filteredSlides.length === 0 && (
                <div className="col-span-full py-24 bg-gray-50 border border-dashed rounded-xl text-center text-muted-foreground">
                  <Search className="mx-auto mb-3 opacity-20" size={40} />
                  <p className="font-medium">No slides match your search or filter.</p>
                  <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}>Clear all filters</Button>
                </div>
              )}
            </div>
          </SortableContext>

        </DndContext>
      )}


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editId ? "Edit Slide" : "Add New Banners"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">Content</Label>
                <div className="space-y-3">
                   <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Main Headline" className="bg-gray-50/50" />
                   <Input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="Supporting Text" className="bg-gray-50/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">Banner Image</Label>
                {!editId ? (
                   <div
                     {...getRootProps()}
                     className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                       isDragActive ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                     }`}
                   >
                      <input {...getInputProps()} />
                      {form.imageFiles.length > 0 ? (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {(form.imageFiles as any[]).map((file, i) => (
                            <div key={i} className="relative aspect-[16/6] rounded-lg overflow-hidden border bg-black/5">
                              <img src={file.preview} alt="" className="h-full w-full object-cover" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = [...form.imageFiles];
                                  newFiles.splice(i, 1);
                                  setForm({...form, imageFiles: newFiles});
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md transform transition-transform hover:scale-110"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (

                        <>
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                             <Upload size={20} className="text-gray-500" />
                          </div>
                          <p className="text-sm font-semibold">Drop images here</p>
                          <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, WebP</p>
                        </>
                      )}

                   </div>
                ) : (
                  <div className="group relative h-40 w-full rounded-xl border border-gray-100 overflow-hidden bg-gray-50 shadow-inner">
                     <img src={form.existingImage} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Badge className="bg-white/90 text-black border-none">Current Image</Badge>
                     </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">Navigation Link</Label>
                <div className="space-y-3">
                  <Select value={form.linkType} onValueChange={(v: LinkType) => setForm({...form, linkType: v, linkValue: ""})}>
                     <SelectTrigger className="bg-gray-50/50">
                        <SelectValue placeholder="Select target type" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="NONE">No Link</SelectItem>
                        <SelectItem value="PRODUCT">Go to Product</SelectItem>
                        <SelectItem value="CATEGORY">Go to Category</SelectItem>
                        <SelectItem value="EXTERNAL">External URL</SelectItem>
                     </SelectContent>
                  </Select>

                  {form.linkType !== 'NONE' && (
                    <div className="relative">
                      {form.linkType === 'PRODUCT' ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-gray-50/50",
                                !form.linkValue && "text-muted-foreground"
                              )}
                            >
                              {form.linkValue
                                ? products.find((p) => p.id === form.linkValue)?.name
                                : "Search products..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder="Search product name..." />
                              <CommandList className="max-h-[300px] overflow-y-auto">
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                  {products.map((p) => (
                                    <CommandItem
                                      key={p.id}
                                      value={p.name}
                                      onSelect={() => {
                                        setForm({ ...form, linkValue: p.id });
                                      }}
                                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100"
                                    >

                                      <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-gray-100 border">
                                        {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-medium text-sm">{p.name}</span>
                                        <span className="text-[10px] text-muted-foreground">ID: {p.id.slice(-6)} | {p.price} BDT</span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          form.linkValue === p.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : form.linkType === 'CATEGORY' ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-gray-50/50",
                                !form.linkValue && "text-muted-foreground"
                              )}
                            >
                              {form.linkValue
                                ? categories.find((c) => c.id === form.linkValue)?.name
                                : "Search categories..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                            <Command>
                              <CommandInput placeholder="Search category name..." />
                              <CommandList className="max-h-[300px] overflow-y-auto">
                                <CommandEmpty>No category found.</CommandEmpty>
                                <CommandGroup>
                                  {categories.map((c) => (
                                    <CommandItem
                                      key={c.id}
                                      value={c.name}
                                      onSelect={() => {
                                        setForm({ ...form, linkValue: c.id });
                                      }}
                                      className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-100"
                                    >

                                      <div className="h-8 w-8 rounded overflow-hidden flex-shrink-0 bg-gray-100 border">
                                        {c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}
                                      </div>
                                      <span className="font-medium text-sm">{c.name}</span>
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          form.linkValue === c.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Input value={form.linkValue} onChange={e => setForm({...form, linkValue: e.target.value})} placeholder="https://external-link.com" className="bg-gray-50/50" />
                      )}
                    </div>
                  )}

                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">Scheduling</Label>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">Starts At</Label>
                      <Input type="datetime-local" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="text-[11px] h-9 bg-gray-50/50" />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[10px] text-gray-400">Expires At</Label>
                      <Input type="datetime-local" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="text-[11px] h-9 bg-gray-50/50" />
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50 mt-4 border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Active Status</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest\">Visible on Website</span>
                </div>
                <Switch checked={form.isActive} onCheckedChange={v => setForm({...form, isActive: v})} />
              </div>
            </div>
          </div>

          <DialogFooter className="bg-gray-50/50 -mx-6 -mb-6 p-6 border-t mt-4 gap-3">
             <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving} className="font-semibold text-gray-500">
               Discard
             </Button>
             <Button onClick={handleSave} disabled={saving} className="px-8 font-bold shadow-lg shadow-blue-100">
                {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                {editId ? "Update Slide" : `Upload ${form.imageFiles.length > 0 ? form.imageFiles.length : ''} Banners`}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
