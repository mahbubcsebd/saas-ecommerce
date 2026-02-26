"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, Edit2, Eye, GripVertical, Image as ImageIcon, Plus, Save, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import LanguageTabs from "../../../components/ui/LanguageTabs";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  isHomeShown: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  order: number;
  parentId?: string | null;
  children?: Category[];
  translations?: { langCode: string; name: string; description: string }[];
}

interface CategoryFormData {
  id?: string;
  name: string; // Default lang name
  slug: string;
  description: string; // Default lang description
  isHomeShown: boolean;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  parentId: string;
  imageFile?: File | null;
  imagePreview?: string | null;
}

interface Language {
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
}

// Sortable Category Item Component
function SortableCategoryItem({
  category,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  expandedIds,
  toggleExpand,
  activeId,
  onView,
}: {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  activeId: string | null;
  onView: (category: Category) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  // Make this category droppable to accept children
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${category.id}`,
    data: { categoryId: category.id, type: 'category' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const isBeingDraggedOver = isOver && activeId !== category.id;
  const isDraggingActive = activeId !== null;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="flex items-center gap-2 mb-2 relative"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {/* Main Category Card */}
        <div className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:shadow-md transition-all flex-1">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          {/* Expand/Collapse */}
          {hasChildren ? (
            <button onClick={() => toggleExpand(category.id)} className="p-1 hover:bg-gray-100 rounded">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Image Preview */}
          {category.image ? (
            <div className="relative w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              <Image src={category.image} alt={category.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{category.name}</h3>
            <p className="text-xs text-gray-500 truncate">/{category.slug}</p>
          </div>

          {/* Badges */}
          {category.isHomeShown && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Home</span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAddChild(category.id)}
              className="p-2 hover:bg-green-50 text-green-600 rounded transition-colors"
              title="Add Child"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onView(category)}
              className="p-2 hover:bg-purple-50 text-purple-600 rounded transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(category)}
              className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dedicated Drop Zone for Nesting */}
        {isDraggingActive && activeId !== category.id && (
          <div
            ref={setDropRef}
            className={`w-16 h-full flex items-center justify-center border-2 border-dashed rounded-lg transition-all ${
              isBeingDraggedOver
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-green-400'
            }`}
            title="Drop here to make child"
          >
            {isBeingDraggedOver ? (
              <div className="flex flex-col items-center">
                <ChevronRight className="w-5 h-5 text-green-600 animate-pulse" />
                <span className="text-[10px] text-green-600 font-semibold">Child</span>
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <SortableCategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              activeId={activeId}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  // Multi-language state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, { name: string; description: string }>>({});

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    isHomeShown: false,
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    parentId: "",
    imageFile: null,
    imagePreview: null,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        const cats = data.data || [];
        setCategories(cats);

        // Flatten for parent selector and drag-drop
        const flattened = flattenCategories(cats);
        setFlatCategories(flattened);

        // Complete flat list for drag-drop
        const allFlat = flattenAllCategories(cats);
        setAllCategoriesFlat(allFlat);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
    fetchCategories();
  }, []);

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

  // Flatten categories for parent selector
  const flattenCategories = (cats: Category[], level = 0): Category[] => {
    let result: Category[] = [];
    cats.forEach((cat) => {
      result.push({ ...cat, level } as any);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    return result;
  };

  // Flatten all categories (including nested) for drag-drop
  const flattenAllCategories = (cats: Category[]): Category[] => {
    let result: Category[] = [];
    cats.forEach((cat) => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenAllCategories(cat.children));
      }
    });
    return result;
  };

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Expand all
  const expandAll = () => {
    const allIds = new Set<string>();
    const addIds = (cats: Category[]) => {
      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          allIds.add(cat.id);
          addIds(cat.children);
        }
      });
    };
    addIds(categories);
    setExpandedIds(allIds);
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedIds(new Set());
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
  const openCreateModal = (parentId?: string) => {
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
      isHomeShown: false,
      isActive: true,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      parentId: parentId || "",
      imageFile: null,
      imagePreview: null,
    });
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (category: Category) => {
    // Populate translations
    const initTrans: Record<string, { name: string; description: string }> = {};
    languages.forEach(l => {
        initTrans[l.code] = { name: "", description: "" };
    });

    const defaultLang = languages.find(l => l.isDefault)?.code || "en";

    // Fill default
    initTrans[defaultLang] = {
        name: category.name,
        description: category.description || ""
    };

    // Fill others if exist in category data (need to ensure backend sends it)
    if (category.translations && Array.isArray(category.translations)) {
        category.translations.forEach(t => {
            initTrans[t.langCode] = {
                name: t.name,
                description: t.description || ""
            };
        });
    }

    setTranslations(initTrans);
    setSelectedLang(defaultLang);

    setFormData({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      isHomeShown: category.isHomeShown,
      isActive: category.isActive !== undefined ? category.isActive : true,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
      metaKeywords: category.metaKeywords || "",
      parentId: category.parentId || "",
      imageFile: null,
      imagePreview: category.image || null,
    });
    setShowModal(true);
  };

  // Open modal for view
  const openViewModal = (category: Category) => {
    setViewingCategory(category);
    setShowViewModal(true);
  };

  // Auto-generate slug
  const handleNameChange = (name: string) => {
    // Update translation for current lang
    updateTranslation('name', name);

    // Only update slug if checking default language
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    if (selectedLang === defaultLang) {
        const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
        setFormData((prev) => ({ ...prev, slug }));
    }
  };

  // Auto-translate
  const handleAutoTranslate = async () => {
      // 1. Get source text from current language
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

      // 2. Identify target languages (all active languages except current)
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

      setSaving(true); // Re-using saving state to disable buttons
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
                      context: 'Category Name'
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
                      context: 'Category Description'
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
          toast.success("Auto-translation complete!");

      } catch (error) {
          console.error("Auto translation error:", error);
          toast.error("Failed to auto-translate.");
      } finally {
          setSaving(false);
      }
  };

  // Save category
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (saving) return;

    // Validate default lang name
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    if (!translations[defaultLang]?.name?.trim()) {
        await alert({
            title: "Name Required",
            message: "A name is required for the platform's default language.",
            type: "warning"
        });
        return;
    }

    setSaving(true);

    try {
      const data = new FormData();

      const defaultTranslation = translations[defaultLang];
      data.append("name", defaultTranslation.name);
      data.append("description", defaultTranslation.description);

      // Append translations array
      const translationsArray = Object.entries(translations).map(([code, val]) => ({
          langCode: code,
          name: val.name,
          description: val.description
      }));
      data.append("translations", JSON.stringify(translationsArray));

      data.append("slug", formData.slug);
      data.append("isHomeShown", formData.isHomeShown.toString());
      data.append("isActive", formData.isActive.toString());
      if (formData.metaTitle) data.append("metaTitle", formData.metaTitle);
      if (formData.metaDescription) data.append("metaDescription", formData.metaDescription);
      if (formData.metaKeywords) data.append("metaKeywords", formData.metaKeywords);
      data.append("parentId", formData.parentId);
      if (formData.imageFile) {
        data.append("image", formData.imageFile);
      }

      const url = formData.id ? `${API_URL}/categories/${formData.id}` : `${API_URL}/categories`;
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
        fetchCategories();
        // Cleanup preview URL
        if (formData.imagePreview && formData.imageFile) {
          URL.revokeObjectURL(formData.imagePreview);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to save category");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Category",
        message: "Are you sure you want to delete this category? This will also delete all child categories and cannot be undone.",
        type: "danger",
        confirmText: "Delete"
    })) return;

    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        fetchCategories();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category");
    }
  };

  // Drag handlers
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find dragged category
    const draggedCat = allCategoriesFlat.find((c) => c.id === active.id);
    if (!draggedCat) return;

    // Check if dropping on a droppable zone (category)
    const isDropZone = over.id.toString().startsWith('drop-');

    let newParentId: string | null = null;
    let targetOrder = 0;

    if (isDropZone) {
      // Dropped on a category - make it a child
      const targetCategoryId = over.id.toString().replace('drop-', '');
      const targetCat = allCategoriesFlat.find((c) => c.id === targetCategoryId);

      if (!targetCat) return;

      // Prevent dragging parent into its own child
      if (isDescendant(draggedCat.id, targetCat.id)) {
        await alert({
            title: "Invalid Move",
            message: "Cannot move a category into its own child.",
            type: "warning"
        });
        return;
      }

      // Make dragged category a child of target
      newParentId = targetCat.id;

      // Get existing children of target
      const existingChildren = allCategoriesFlat.filter((c) => c.parentId === targetCat.id);
      targetOrder = existingChildren.length; // Add at the end

      // Auto-expand target to show new child
      setExpandedIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(targetCat.id);
        return newSet;
      });
    } else {
      // Dropped on another category (not drop zone) - make it a sibling
      const targetCat = allCategoriesFlat.find((c) => c.id === over.id);
      if (!targetCat) return;

      // Prevent dragging parent into its own child
      if (isDescendant(draggedCat.id, targetCat.id)) {
        await alert({
            title: "Invalid Move",
            message: "Cannot move a category into its own child.",
            type: "warning"
        });
        return;
      }

      newParentId = targetCat.parentId || null;
      targetOrder = targetCat.order;
    }

    // Build update payload
    const updates: { id: string; parentId: string | null; order: number }[] = [];

    // Get all categories with same parent
    const siblings = allCategoriesFlat.filter((c) => (c.parentId || null) === newParentId);

    // Reorder siblings
    let newOrder = 0;
    siblings.forEach((sibling) => {
      if (sibling.id === active.id) return; // Skip dragged item

      if (sibling.id === over.id && !isDropZone) {
        // Insert dragged item before target (only if not drop zone)
        updates.push({ id: active.id, parentId: newParentId, order: newOrder });
        newOrder++;
      }

      updates.push({ id: sibling.id, parentId: sibling.parentId || null, order: newOrder });
      newOrder++;
    });

    // If dragged item wasn't inserted yet (drop zone case or end of list)
    if (!updates.find((u) => u.id === active.id)) {
      updates.push({ id: active.id, parentId: newParentId, order: targetOrder });
    }

    // Send to backend
    try {
      const res = await fetch(`${API_URL}/categories/structure`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ categories: updates }),
      });

      if (res.ok) {
        fetchCategories();
      } else {
        toast.error("Failed to update category order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update category order");
    }
  };

  // Check if categoryId is descendant of potentialAncestorId
  const isDescendant = (potentialAncestorId: string, categoryId: string): boolean => {
    const category = allCategoriesFlat.find((c) => c.id === categoryId);
    if (!category || !category.parentId) return false;
    if (category.parentId === potentialAncestorId) return true;
    return isDescendant(potentialAncestorId, category.parentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage product categories with unlimited nesting</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={expandAll}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Collapse All
        </button>
      </div>

      {/* Categories Tree */}
      <div>
        {categories.length > 0 ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allCategoriesFlat.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {categories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onAddChild={openCreateModal}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                  activeId={activeId}
                  onView={openViewModal}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No categories yet</p>
            <p className="text-gray-400 text-sm mt-2">Click "Add Category" to get started</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal using Shadcn Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
             <DialogTitle className="text-2xl font-bold">
               {formData.id ? "Edit Category" : "Create Category"}
             </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 mt-4">

            <div className="flex items-center justify-between gap-4">
                    <LanguageTabs
                        languages={languages}
                        selectedLang={selectedLang}
                        onChange={setSelectedLang}
                    />
                    <button
                        type="button"
                        onClick={handleAutoTranslate}
                        disabled={saving}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        <span>✨ Auto Translate</span>
                    </button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name ({selectedLang.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    value={translations[selectedLang]?.name || ""}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug * (URL Friendly)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Generated from default language name but can be customized.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description ({selectedLang.toUpperCase()})
                  </label>
                  <textarea
                    value={translations[selectedLang]?.description || ""}
                    onChange={(e) => updateTranslation('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-4 text-gray-900">General Settings</h3>

                    {/* Parent Category */}
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                    <select
                        value={formData.parentId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">None (Root Level)</option>
                        {flatCategories
                        .filter((c) => c.id !== formData.id)
                        .map((cat) => (
                            <option key={cat.id} value={cat.id}>
                            {"—".repeat((cat as any).level || 0)} {cat.name}
                            </option>
                        ))}
                    </select>
                    </div>

                    {/* Image Upload */}
                    <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                        }`}
                    >
                        <input {...getInputProps()} />
                        {formData.imagePreview ? (
                        <div className="space-y-2">
                            <div className="relative w-32 h-32 mx-auto bg-gray-100 rounded overflow-hidden">
                            <Image src={formData.imagePreview} alt="Preview" fill className="object-cover" />
                            </div>
                            <p className="text-sm text-gray-600">Click or drag to change image</p>
                        </div>
                        ) : (
                        <div>
                            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600">Drag & drop an image, or click to select</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG, JPEG, WebP, SVG</p>
                        </div>
                        )}
                    </div>
                    </div>

                    {/* Show on Home */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isHomeShown"
                            checked={formData.isHomeShown}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isHomeShown: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="isHomeShown" className="text-sm font-medium text-gray-700">
                            Show on Homepage
                        </label>
                        </div>
                        <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                            Active Status
                        </label>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold mb-4 text-gray-900">SEO Meta (Optional)</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                <input
                                    type="text"
                                    value={formData.metaTitle}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="SEO Title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                <textarea
                                    value={formData.metaDescription}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="SEO Description"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                                <input
                                    type="text"
                                    value={formData.metaKeywords}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, metaKeywords: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="shoes, apparel, electronics"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Saving..." : formData.id ? "Update Category" : "Create Category"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
        </DialogContent>
      </Dialog>

      {/* View Modal using Shadcn Dialog */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
             <DialogTitle className="text-2xl font-bold">
               View Category Details
             </DialogTitle>
          </DialogHeader>

          {viewingCategory && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4 border-b pb-4">
                {viewingCategory.image ? (
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border">
                    <Image src={viewingCategory.image} alt={viewingCategory.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border">
                     <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{viewingCategory.name}</h3>
                  <p className="text-sm text-gray-500">Slug: {viewingCategory.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                    <span className="font-semibold text-gray-700 block mb-1">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewingCategory.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {viewingCategory.isActive !== false ? "Active" : "Inactive"}
                    </span>
                 </div>
                 <div>
                    <span className="font-semibold text-gray-700 block mb-1">Visibility</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewingCategory.isHomeShown ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {viewingCategory.isHomeShown ? "Shown on Home" : "Hidden on Home"}
                    </span>
                 </div>
              </div>

               <div>
                 <span className="font-semibold text-gray-700 block mb-1">Description</span>
                 <p className="text-gray-600 bg-gray-50 p-3 rounded-md border min-h-[60px]">
                    {viewingCategory.description || <span className="text-gray-400 italic">No description provided</span>}
                 </p>
               </div>

               {/* View SEO Fields */}
               <div className="border border-purple-100 bg-purple-50/30 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 text-sm">SEO Meta Information</h4>
                  <div className="space-y-3 text-sm">
                     <div>
                        <span className="text-gray-600 font-medium block">Title</span>
                        <p className="text-gray-800">{viewingCategory.metaTitle || "-"}</p>
                     </div>
                     <div>
                        <span className="text-gray-600 font-medium block">Description</span>
                        <p className="text-gray-800">{viewingCategory.metaDescription || "-"}</p>
                     </div>
                     <div>
                        <span className="text-gray-600 font-medium block">Keywords</span>
                        <p className="text-gray-800">{viewingCategory.metaKeywords || "-"}</p>
                     </div>
                  </div>
               </div>

               <div className="pt-4 flex justify-end px-2">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
