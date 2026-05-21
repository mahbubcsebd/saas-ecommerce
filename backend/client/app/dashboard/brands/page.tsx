"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { 
  Tag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Globe, 
  Sparkles, 
  Eye, 
  Check, 
  X,
  Megaphone,
  FolderTree,
  ShoppingBag,
  Loader2,
  GripVertical
} from "lucide-react";

import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy, 
  sortableKeyboardCoordinates 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import LanguageTabs from "@/components/ui/LanguageTabs";

interface Brand {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  translations?: { langCode: string; name: string; description: string }[];
  _count?: {
    products: number;
  };
}

interface BrandFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  imageFile?: File | null;
  imagePreview?: string | null;
}

interface Language {
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
}

// Sortable Brand Item Row Component
function SortableBrandItem({
  brand,
  onEdit,
  onDelete,
  onView,
  onToggleStatus,
  isDragDisabled,
}: {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (id: string) => void;
  onView: (brand: Brand) => void;
  onToggleStatus: (brand: Brand) => void;
  isDragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: brand.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center p-4 gap-4 ${isDragging ? 'shadow-lg border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 scale-[1.01]' : ''}`}
    >
      {/* Drag Handle */}
      {!isDragDisabled ? (
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-50 dark:hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-600 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      ) : (
        <div className="p-1 text-slate-200 dark:text-slate-800" title="Reordering disabled in search/filter mode">
          <GripVertical className="h-5 w-5 cursor-not-allowed" />
        </div>
      )}

      {/* Brand logo image */}
      <div className="relative w-12 h-12 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {brand.image ? (
          <Image 
            src={brand.image.startsWith("http") ? brand.image : `${process.env.NEXT_PUBLIC_IMAGE_URL || "https://images.mahbuburrahman.xyz"}/${brand.image}`} 
            alt={brand.name} 
            fill 
            className="object-contain p-1"
          />
        ) : (
          <Tag className="h-5 w-5 text-indigo-400" />
        )}
      </div>

      {/* Info block */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{brand.name}</h3>
            {brand.isFeatured && (
              <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-none text-[9px] h-4 px-1.5 font-bold">
                ★ Featured
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono truncate">/{brand.slug}</p>
        </div>
        <div className="hidden md:block min-w-0 self-center">
          <p className="text-sm text-slate-500 truncate">
            {brand.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Badges / Metrics */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Products count */}
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1">
          <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
          <span>{brand._count?.products || 0} Products</span>
        </div>

        {/* Display Status Badge */}
        <Badge variant={brand.isActive ? "default" : "secondary"} className="h-5 text-[10px]">
          {brand.isActive ? "Active" : "Disabled"}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          type="button"
          onClick={() => onView(brand)} 
          className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          type="button"
          onClick={() => onEdit(brand)} 
          className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
          title="Edit Brand"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          type="button"
          onClick={() => onToggleStatus(brand)} 
          className={`h-8 w-8 ${brand.isActive ? 'text-green-500 hover:bg-green-50/50' : 'text-slate-400 hover:bg-slate-100/50'}`}
          title={brand.isActive ? "Deactivate" : "Activate"}
        >
          {brand.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          type="button"
          onClick={() => onDelete(brand.id)} 
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50"
          title="Delete Brand"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BrandsPage() {
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBrand, setViewingBrand] = useState<Brand | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isReorderingEnabled = searchQuery === "" && statusFilter === "all";

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle Drag End
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = brands.findIndex((b) => b.id === active.id);
    const newIndex = brands.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Move in state
    const newBrands = [...brands];
    const [movedBrand] = newBrands.splice(oldIndex, 1);
    newBrands.splice(newIndex, 0, movedBrand);
    setBrands(newBrands);

    const updates = newBrands.map((brand, index) => ({
      id: brand.id,
      order: index,
    }));

    try {
      const res = await fetch(`${API_URL}/brands/order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ brands: updates }),
      });

      if (res.ok) {
        toast.success("Brand order updated successfully!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save new brand ordering");
        fetchBrands();
      }
    } catch (error) {
      console.error("Failed to update brand order", error);
      toast.error("Network error while saving brand ordering");
      fetchBrands();
    }
  };

  // Multi-language state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, { name: string; description: string }>>({});

  const [formData, setFormData] = useState<BrandFormData>({
    name: "",
    slug: "",
    description: "",
    isActive: true,
    isFeatured: false,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    imageFile: null,
    imagePreview: null,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.mahbuburrahman.xyz/api";

  // Fetch languages
  const fetchLanguages = async () => {
    try {
      const res = await fetch(`${API_URL}/languages/active`);
      if (res.ok) {
        const data = await res.json();
        const langs = data.data || [];
        setLanguages(langs);

        // Set default lang
        const defaultLang = langs.find((l: Language) => l.isDefault)?.code || "en";
        setSelectedLang(defaultLang);
      }
    } catch (e) {
      console.error("Failed to fetch languages", e);
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      setLoading(true);
      let queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search", searchQuery);
      if (statusFilter === "active") queryParams.append("isActive", "true");
      if (statusFilter === "inactive") queryParams.append("isActive", "false");

      const res = await fetch(`${API_URL}/brands?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setBrands(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch brands", error);
      toast.error("Failed to retrieve brands listing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (session?.accessToken) {
      fetchBrands();
    }
  }, [session, searchQuery, statusFilter]);

  // Update translation state helper
  const updateTranslation = (field: 'name' | 'description', value: string) => {
    setTranslations(prev => ({
      ...prev,
      [selectedLang]: {
        ...prev[selectedLang],
        [field]: value
      }
    }));
  };

  // Image dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".svg"] },
    maxFiles: 1,
  });

  // Open modal for create
  const openCreateModal = () => {
    // Reset translations
    const initTrans: Record<string, { name: string; description: string }> = {};
    languages.forEach(l => {
      initTrans[l.code] = { name: "", description: "" };
    });
    setTranslations(initTrans);

    // Set default lang
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    setSelectedLang(defaultLang);

    setFormData({
      name: "",
      slug: "",
      description: "",
      isActive: true,
      isFeatured: false,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      imageFile: null,
      imagePreview: null,
    });
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (brand: Brand) => {
    // Populate translations
    const initTrans: Record<string, { name: string; description: string }> = {};
    languages.forEach(l => {
      initTrans[l.code] = { name: "", description: "" };
    });

    const defaultLang = languages.find(l => l.isDefault)?.code || "en";

    // Fill default
    initTrans[defaultLang] = {
      name: brand.name,
      description: brand.description || ""
    };

    // Fill others if they exist
    if (brand.translations && Array.isArray(brand.translations)) {
      brand.translations.forEach(t => {
        initTrans[t.langCode] = {
          name: t.name,
          description: t.description || ""
        };
      });
    }

    setTranslations(initTrans);
    setSelectedLang(defaultLang);

    setFormData({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      isActive: brand.isActive,
      isFeatured: brand.isFeatured || false,
      metaTitle: brand.metaTitle || "",
      metaDescription: brand.metaDescription || "",
      metaKeywords: brand.metaKeywords || "",
      imageFile: null,
      imagePreview: brand.image || null,
    });
    setShowModal(true);
  };

  // Open view modal
  const openViewModal = (brand: Brand) => {
    setViewingBrand(brand);
    setShowViewModal(true);
  };

  // Auto-generate slug
  const handleNameChange = (name: string) => {
    updateTranslation('name', name);

    // Only update slug if modifying default language
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    if (selectedLang === defaultLang) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove all non-alphanumeric chars except space/hyphen
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
      setFormData((prev) => ({ ...prev, name, slug }));
    }
  };

  // AI translation
  const handleAutoTranslate = async () => {
    const sourceName = translations[selectedLang]?.name;
    const sourceDesc = translations[selectedLang]?.description;

    if (!sourceName && !sourceDesc) {
      await alert({
        title: "Source Text Required",
        message: "Please enter some text in the current language to translate.",
        type: "warning"
      });
      return;
    }

    const targetLangs = languages
      .filter(l => l.code !== selectedLang)
      .map(l => l.code);

    if (targetLangs.length === 0) {
      await alert({
        title: "No Target Languages",
        message: "No other active languages available to translate to.",
        type: "info"
      });
      return;
    }

    setSaving(true);
    try {
      const updates = { ...translations };

      // Translate Name
      if (sourceName) {
        const res = await fetch(`${API_URL}/ai/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`
          },
          body: JSON.stringify({
            text: sourceName,
            targetLangs,
            context: 'Brand Name'
          })
        });
        if (res.ok) {
          const { data } = await res.json();
          Object.entries(data).forEach(([code, text]) => {
            if (updates[code]) updates[code].name = text as string;
          });
        }
      }

      // Translate Description
      if (sourceDesc) {
        const res = await fetch(`${API_URL}/ai/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.accessToken}`
          },
          body: JSON.stringify({
            text: sourceDesc,
            targetLangs,
            context: 'Brand Description'
          })
        });
        if (res.ok) {
          const { data } = await res.json();
          Object.entries(data).forEach(([code, text]) => {
            if (updates[code]) updates[code].description = text as string;
          });
        }
      }

      setTranslations(updates);
      toast.success("AI auto-translation complete!");
    } catch (error) {
      console.error("Auto translation error:", error);
      toast.error("Failed to translate automatically");
    } finally {
      setSaving(false);
    }
  };

  // Generate SEO details using AI
  const handleGenerateSEO = async () => {
    if (!formData.name) {
      toast.error("Please enter a Brand Name first to generate SEO tags.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/ai/seo/category-content`, { // We can reuse the AI SEO assistant
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ 
          name: formData.name, 
          description: translations[selectedLang]?.description || "" 
        })
      });

      if (res.ok) {
        const { data } = await res.json();
        setFormData(prev => ({
          ...prev,
          metaTitle: data.metaTitle || `${formData.name} - Premium Products`,
          metaDescription: data.metaDescription || translations[selectedLang]?.description?.substring(0, 150) || "",
          metaKeywords: data.metaKeywords || `${formData.name.toLowerCase()}, brand, shop`,
        }));
        toast.success("AI SEO tags generated successfully!");
      } else {
        // Fallback simple generator
        setFormData(prev => ({
          ...prev,
          metaTitle: `${formData.name} | Premium Brand Store`,
          metaDescription: translations[selectedLang]?.description?.substring(0, 150) || `Buy premium products from ${formData.name} online at the best prices.`,
          metaKeywords: `${formData.name.toLowerCase()}, products, shop, online buy`,
        }));
        toast.info("Generated default SEO tags.");
      }
    } catch (error) {
      console.error("AI Generation error:", error);
      toast.error("AI SEO generation failed. Setting standard fallbacks.");
    } finally {
      setSaving(false);
    }
  };

  // Submit Brand creation or update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    // Validate default lang name
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    if (!translations[defaultLang]?.name?.trim()) {
      await alert({
        title: "Name Required",
        message: "A Brand Name is required for the platform's default language.",
        type: "warning"
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Slug is required.");
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();

      const defaultTranslation = translations[defaultLang];
      data.append("name", defaultTranslation.name);
      data.append("description", defaultTranslation.description || "");

      // Append translations array
      const translationsArray = Object.entries(translations).map(([code, val]) => ({
        langCode: code,
        name: val.name,
        description: val.description
      }));
      data.append("translations", JSON.stringify(translationsArray));

      data.append("slug", formData.slug);
      data.append("isActive", formData.isActive.toString());
      data.append("isFeatured", formData.isFeatured.toString());
      if (formData.metaTitle) data.append("metaTitle", formData.metaTitle);
      if (formData.metaDescription) data.append("metaDescription", formData.metaDescription);
      if (formData.metaKeywords) data.append("metaKeywords", formData.metaKeywords);
      
      if (formData.imageFile) {
        data.append("image", formData.imageFile);
      }

      const url = formData.id ? `${API_URL}/brands/${formData.id}` : `${API_URL}/brands`;
      const method = formData.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: data,
      });

      if (res.ok) {
        setShowModal(false);
        fetchBrands();
        toast.success(formData.id ? "Brand updated successfully!" : "Brand created successfully!");
        
        // Cleanup preview URL
        if (formData.imagePreview && formData.imageFile) {
          URL.revokeObjectURL(formData.imagePreview);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to save Brand");
      }
    } catch (error) {
      console.error("Save brand error:", error);
      toast.error("Error saving brand details");
    } finally {
      setSaving(false);
    }
  };

  // Delete brand
  const handleDelete = async (id: string) => {
    if (!await confirm({
      title: "Delete Brand",
      message: "Are you sure you want to delete this brand? Products mapped to this brand will remain, but their brand relation will be detached. This cannot be undone.",
      type: "danger",
      confirmText: "Delete Brand",
      cancelText: "Cancel"
    })) return;

    try {
      const res = await fetch(`${API_URL}/brands/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        fetchBrands();
        toast.success("Brand successfully deleted.");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete brand");
      }
    } catch (error) {
      console.error("Delete brand error:", error);
      toast.error("Failed to delete brand");
    }
  };

  // Quick Toggle Status
  const handleToggleStatus = async (brand: Brand) => {
    try {
      const res = await fetch(`${API_URL}/brands/${brand.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          isActive: !brand.isActive
        }),
      });

      if (res.ok) {
        setBrands(prev => 
          prev.map(b => b.id === brand.id ? { ...b, isActive: !b.isActive } : b)
        );
        toast.success(`Brand ${brand.name} is now ${!brand.isActive ? 'Active' : 'Inactive'}`);
      } else {
        toast.error("Failed to toggle brand status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error toggling brand status");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upper Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Tag className="h-6 w-6" />
            </div>
            Brand Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure dynamic, relational product brands with multi-language SEO configurations and logo imagery.
          </p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add New Brand
        </Button>
      </div>

      {/* Filter and Search Panel */}
      <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search brands by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto self-start md:self-auto">
          <Button 
            variant={statusFilter === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setStatusFilter("all")}
            className="font-medium"
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "active" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setStatusFilter("active")}
            className="font-medium"
          >
            Active Only
          </Button>
          <Button 
            variant={statusFilter === "inactive" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setStatusFilter("inactive")}
            className="font-medium"
          >
            Inactive Only
          </Button>
        </div>
      </div>

      {/* Brand Grid Showcase */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
        </div>
      ) : brands.length > 0 ? (
        <div className="space-y-4">
          {!isReorderingEnabled && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse animate-in fade-in" />
              <span>Drag-and-drop reordering is disabled while search queries or filters are active. Clear search/filters to rearrange brands.</span>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={brands.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {brands.map((brand) => (
                  <SortableBrandItem
                    key={brand.id}
                    brand={brand}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onView={openViewModal}
                    onToggleStatus={handleToggleStatus}
                    isDragDisabled={!isReorderingEnabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-950 border rounded-xl border-dashed">
          <Tag className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">No Brands Configured</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            You don't have any brands configured yet. Create a brand to filter products and storefront navigation.
          </p>
          <Button onClick={openCreateModal} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
            Create First Brand
          </Button>
        </div>
      )}

      {/* Main Sliding Sheet / Dialog Form Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] bg-white dark:bg-slate-950 p-0 rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-600" />
              {formData.id ? "Edit Brand Details" : "Configure New Brand"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Multi-language tabs */}
            {languages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Translations & Details</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAutoTranslate}
                    disabled={saving}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 hover:bg-indigo-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                    <span>AI Auto-Translate</span>
                  </Button>
                </div>

                <LanguageTabs 
                  languages={languages} 
                  selectedLang={selectedLang} 
                  onChange={setSelectedLang} 
                />

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="brand-name" className="text-xs font-bold text-slate-500">
                      Brand Name ({languages.find(l => l.code === selectedLang)?.name}) <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="brand-name"
                      placeholder={`e.g., Apple, Samsung, Nike...`}
                      value={translations[selectedLang]?.name || ""}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="border-slate-200 focus:ring-indigo-500 text-sm"
                      required={selectedLang === languages.find(l => l.isDefault)?.code}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-desc" className="text-xs font-bold text-slate-500">
                      Description ({languages.find(l => l.code === selectedLang)?.name})
                    </Label>
                    <Textarea 
                      id="brand-desc"
                      placeholder={`Tell shoppers about the brand, its legacy, quality, or target audience...`}
                      value={translations[selectedLang]?.description || ""}
                      onChange={(e) => updateTranslation('description', e.target.value)}
                      className="min-h-[100px] border-slate-200 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Core details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              {/* Slug (Default Lang) */}
              <div className="space-y-2">
                <Label htmlFor="brand-slug" className="text-sm font-bold text-slate-700">Store URL Slug</Label>
                <Input 
                  id="brand-slug"
                  placeholder="e.g. apple-inc"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="border-slate-200 bg-slate-50 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400">Unique identifier used in shop routes: /brands/slug</p>
              </div>

              {/* Status active toggle */}
              <div className="flex items-center justify-between border rounded-xl p-4 bg-slate-50/50">
                <div className="space-y-0.5">
                  <Label htmlFor="brand-active" className="text-sm font-bold text-slate-700">Display Status</Label>
                  <p className="text-xs text-slate-400">Enable brand in storefront page and search menus.</p>
                </div>
                <Switch 
                  id="brand-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              {/* Featured Homepage toggle */}
              <div className="flex items-center justify-between border rounded-xl p-4 bg-amber-50/40 border-amber-200 col-span-1 md:col-span-2">
                <div className="space-y-0.5">
                  <Label htmlFor="brand-featured" className="text-sm font-bold text-amber-700">⭐ Featured on Homepage</Label>
                  <p className="text-xs text-amber-600/70">Show this brand in the homepage Featured Brands showcase section.</p>
                </div>
                <Switch 
                  id="brand-featured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                />
              </div>
            </div>

            {/* Dropzone Logo Upload */}
            <div className="space-y-2 border-t pt-6">
              <Label className="text-sm font-bold text-slate-700">Brand Logo / Brand Image</Label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : "border-slate-200 hover:border-indigo-400 bg-slate-50/50"
                }`}
              >
                <input {...getInputProps()} />
                
                {formData.imagePreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-28 h-28 border rounded-lg bg-white overflow-hidden shadow-inner flex items-center justify-center">
                      <Image 
                        src={formData.imagePreview.startsWith("blob:") ? formData.imagePreview : formData.imagePreview.startsWith("http") ? formData.imagePreview : `${process.env.NEXT_PUBLIC_IMAGE_URL || "https://images.mahbuburrahman.xyz"}/${formData.imagePreview}`} 
                        alt="Logo Preview" 
                        fill 
                        className="object-contain p-2"
                      />
                    </div>
                    <span className="text-xs text-slate-400 underline">Click or drag another image to change</span>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="mx-auto p-3 bg-white border rounded-full w-fit shadow-sm text-slate-400">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-700">Drag brand logo here</p>
                      <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP or SVG up to 2MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Accordion / Simple Dropdown for SEO Details */}
            <div className="border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">SEO Meta Configuration (Optional)</span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateSEO}
                  disabled={saving}
                  className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate SEO Meta
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="meta-title" className="text-xs text-slate-500 font-semibold">Meta Title</Label>
                  <Input 
                    id="meta-title"
                    placeholder="SEO friendly page title..."
                    value={formData.metaTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                    className="border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meta-keywords" className="text-xs text-slate-500 font-semibold">Meta Keywords</Label>
                  <Input 
                    id="meta-keywords"
                    placeholder="comma separated values, tags..."
                    value={formData.metaKeywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                    className="border-slate-200 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meta-desc" className="text-xs text-slate-500 font-semibold">Meta Description</Label>
                  <Textarea 
                    id="meta-desc"
                    placeholder="Short description for search engines (max 160 characters)..."
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    className="min-h-[60px] border-slate-200 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 border-t pt-6 bg-slate-50/20 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="font-medium border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Brand</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Viewing Details Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 p-6 rounded-2xl">
          {viewingBrand && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-500" />
                  Brand Overview
                </DialogTitle>
                <Badge variant={viewingBrand.isActive ? "default" : "secondary"}>
                  {viewingBrand.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex flex-col md:flex-row gap-6 border-b pb-6">
                <div className="relative w-28 h-28 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                  {viewingBrand.image ? (
                    <Image 
                      src={viewingBrand.image.startsWith("http") ? viewingBrand.image : `${process.env.NEXT_PUBLIC_IMAGE_URL || "https://images.mahbuburrahman.xyz"}/${viewingBrand.image}`} 
                      alt={viewingBrand.name} 
                      fill 
                      className="object-contain p-2"
                    />
                  ) : (
                    <Tag className="h-10 w-10 text-indigo-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center md:text-left">{viewingBrand.name}</h3>
                  <div className="flex justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500">
                    <span className="font-mono">Slug: /{viewingBrand.slug}</span>
                    <span>•</span>
                    <span>Mapped Products: {viewingBrand._count?.products || 0}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {viewingBrand.description || "No description written."}
                  </p>
                </div>
              </div>

              {/* View translations list */}
              {viewingBrand.translations && viewingBrand.translations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Translations Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingBrand.translations.map(t => (
                      <div key={t.langCode} className="p-3 border rounded-xl bg-slate-50/50">
                        <div className="flex items-center gap-1.5 mb-1 font-bold text-xs text-indigo-600">
                          <Globe className="h-3 w-3" />
                          <span>{t.langCode.toUpperCase()}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{t.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{t.description || "-"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SEO Tags */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEO Meta Information</h4>
                <div className="p-4 border rounded-xl bg-indigo-50/20 space-y-2">
                  <div className="grid grid-cols-3 text-xs">
                    <span className="font-bold text-slate-600">Meta Title:</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-300 font-medium">{viewingBrand.metaTitle || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 text-xs">
                    <span className="font-bold text-slate-600">Meta Description:</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-300 line-clamp-2">{viewingBrand.metaDescription || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 text-xs">
                    <span className="font-bold text-slate-600">Meta Keywords:</span>
                    <span className="col-span-2 text-slate-800 dark:text-slate-300 font-mono">{viewingBrand.metaKeywords || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowViewModal(false)} className="bg-slate-900 text-white hover:bg-slate-800">
                  Close Detail Panel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
