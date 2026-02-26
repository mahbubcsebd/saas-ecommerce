"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';
import { toast } from "sonner";
import GlobalInput from "./forms/GlobalInput";
import GlobalSelect, { Option } from "./forms/GlobalSelect";
import { LocalizedInput, LocalizedTextEditor } from "./forms/LocalizedFields";
import ImageUploadManager from "./ImageUploadManager";
import VariantManager, { ProductVariant } from "./VariantManager";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

interface Language {
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
}

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

// Predefined tags for e-commerce
const PREDEFINED_TAGS = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "trending", label: "Trending" },
  { value: "new-arrival", label: "New Arrival" },
  { value: "best-seller", label: "Best Seller" },
  { value: "sale", label: "Sale" },
  { value: "featured", label: "Featured" },
  { value: "limited-edition", label: "Limited Edition" },
  { value: "eco-friendly", label: "Eco Friendly" },
  { value: "premium", label: "Premium" },
];

const POPULAR_META_KEYWORDS = [
  { value: "online shopping", label: "Online Shopping" },
  { value: "best price", label: "Best Price" },
  { value: "free shipping", label: "Free Shipping" },
  { value: "quality products", label: "Quality Products" },
  { value: "buy online", label: "Buy Online" },
  { value: "trending", label: "Trending" },
  { value: "top rated", label: "Top Rated" },
  { value: "discount", label: "Discount" },
  { value: "offers", label: "Offers" },
  { value: "authentic", label: "Authentic" },
];

// Helper function to flatten nested categories with indentation
const flattenCategories = (categories: Category[], level = 0): Option[] => {
  const result: Option[] = [];

  categories.forEach((cat) => {
    const indent = "  ".repeat(level);
    result.push({
      value: cat.id,
      label: `${indent}${cat.name}`,
    });

    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children, level + 1));
    }
  });

  return result;
};

export default function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Array<{ file?: File; url: string; id: string; isPrimary?: boolean }>>([]);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Multi-language state
  const [languages, setLanguages] = useState<Language[]>([]);

  const [translations, setTranslations] = useState<Record<string, { name: string; description: string }>>({});

  const [formData, setFormData] = useState({
    slug: "",
    basePrice: "",
    sellingPrice: "",
    costPrice: "",
    sku: "",
    barcode: "",
    stock: "",
    lowStockAlert: "10",
    categoryId: "",
    brand: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    status: "DRAFT",
    isNewArrival: false,
    isFeatured: false,
    isFreeShipping: false,
    isPreOrder: false,
    isHomeShown: false,
    homeOrder: "0",
    warranty: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: [] as { label: string; value: string }[],
    ogImage: "",
    trackInventory: true,
    minStockLevel: "5",
  });



  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const fetchLanguages = async () => {
      try {
        const res = await fetch(`${API_URL}/languages/active`);
        if (res.ok) {
            const data = await res.json();
            const langs = data.data || [];
            setLanguages(langs);

            // Initialize translations
            const initTrans: Record<string, { name: string; description: string }> = {};
            langs.forEach((l: Language) => {
                initTrans[l.code] = { name: "", description: "" };
            });
            setTranslations(prev => ({ ...initTrans, ...prev })); // Merge to keep if any existing


        }
      } catch (e) {
          console.error("Failed to fetch languages", e);
      }
  };

  useEffect(() => {
    fetchLanguages();
    fetchCategories();
  }, []);

  // Fetch product data only after languages are loaded to correctly populate translations
  useEffect(() => {
      if (mode === "edit" && productId && languages.length > 0) {
          fetchProduct();
      }
  }, [mode, productId, languages]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async () => {
    if (!session?.accessToken) return;

    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (res.ok) {
        const { data } = await res.json();

        // Populate translations from response
        const newTranslations: Record<string, { name: string; description: string }> = {};

        // Initialize with empty
        languages.forEach(l => {
            newTranslations[l.code] = { name: "", description: "" };
        });

        // Fill with default data for default lang (usually 'en' or from basic fields)
        const defaultLangCode = languages.find(l => l.isDefault)?.code || "en";
        newTranslations[defaultLangCode] = {
            name: data.name || "",
            description: data.description || ""
        };

        // Fill from translations array if exists
        if (data.translations && Array.isArray(data.translations)) {
            data.translations.forEach((t: any) => {
                newTranslations[t.langCode] = {
                    name: t.name || "",
                    description: t.description || ""
                };
            });
        }
        setTranslations(newTranslations);

        setFormData({
          slug: data.slug || "",
          basePrice: data.basePrice?.toString() || "",
          sellingPrice: data.sellingPrice?.toString() || "",
          costPrice: data.costPrice?.toString() || "",
          sku: data.sku || "",
          barcode: data.barcode || "",
          stock: data.stock?.toString() || "",
          minStockLevel: data.minStockLevel?.toString() || "5",
          lowStockAlert: data.lowStockAlert?.toString() || "10",
          categoryId: data.categoryId || "",
          brand: data.brand || "",
          weight: data.weight?.toString() || "",
          length: data.length?.toString() || "",
          width: data.width?.toString() || "",
          height: data.height?.toString() || "",
          status: data.status || "DRAFT",
          isNewArrival: data.isNewArrival || false,
          isFeatured: data.isFeatured || false,
          isFreeShipping: data.isFreeShipping || false,
          isPreOrder: data.isPreOrder || false,
          isHomeShown: data.isHomeShown || false,
          homeOrder: data.homeOrder?.toString() || "0",
          warranty: data.warranty || "",
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map((k: string) => ({ label: k.trim(), value: k.trim() })) : [],
          ogImage: data.ogImage || "",
          trackInventory: data.trackInventory !== false,
        });

        // Set existing images
        if (data.images) {
          setImages(data.images.map((url: string, index: number) => ({
            url,
            id: `existing-${index}`,
            isPrimary: index === 0,
          })));
        }

        // Set tags
        if (data.tags) {
          setSelectedTags(data.tags.map((tag: string) => ({
            value: tag,
            label: tag.charAt(0).toUpperCase() + tag.slice(1),
          })));
        }

        // Set variants
        if (data.variants && data.variants.length > 0) {
          const loadedVariants: ProductVariant[] = data.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            attributes: v.attributes || [],
            sku: v.sku,
            barcode: v.barcode,
            basePrice: v.basePrice?.toString(),
            sellingPrice: v.sellingPrice?.toString(),
            costPrice: v.costPrice?.toString(),
            stock: v.stock?.toString() || "0",
            minStockLevel: v.minStockLevel?.toString() || "2",
            images: v.images?.map((url: string, index: number) => ({
              url,
              id: `variant-${v.id}-${index}`,
              isPrimary: index === 0,
            })) || [],
            isActive: v.isActive !== false,
          }));
          setVariants(loadedVariants);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  const handleTranslationChange = (lang: string, field: 'name' | 'description', value: string) => {
      setTranslations(prev => ({
          ...prev,
          [lang]: { ...prev[lang], [field]: value }
      }));
  };

  const handleAutoTranslate = async () => {
      const defaultLang = languages.find(l => l.isDefault)?.code || "en";

      // 1. Get source text from default language
      const sourceName = translations[defaultLang]?.name;
      const sourceDesc = translations[defaultLang]?.description;

      if (!sourceName && !sourceDesc) {
          await alert({
              title: "Source Missing",
              message: `Please enter text in the default language (${defaultLang.toUpperCase()}) to translate.`,
              type: "warning"
          });
          return;
      }

      // 2. Identify target languages (all active languages except default)
      const targetLangs = languages
          .filter(l => l.code !== defaultLang)
          .map(l => l.code);

      if (targetLangs.length === 0) {
          await alert({
              title: "No Target Languages",
              message: "No other active languages available to translate to.",
              type: "info"
          });
          return;
      }

      setLoading(true);
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
                      context: 'Product Name'
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
                      context: 'Product Description (HTML)'
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
          setLoading(false);
      }
  };

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-');    // Replace multiple - with single -
  };

  const handleGenerateSlug = async () => {
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    const name = translations[defaultLang]?.name;
    if (name) {
      setFormData(prev => ({ ...prev, slug: `${slugify(name)}-${Date.now().toString().slice(-6)}` }));
    } else {
      await alert({
          title: "Name Required",
          message: "Please enter product name first to generate a slug.",
          type: "warning"
      });
    }
  };

  const handleGenerateSKU = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `PROD-${random}` }));
  };

  const handleGenerateBarcode = () => {
    let barcode = '';
    for (let i = 0; i < 12; i++) {
      barcode += Math.floor(Math.random() * 10);
    }
    // Simple check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode[i]);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    setFormData(prev => ({ ...prev, barcode: barcode + checkDigit }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate default language at least
    const defaultLang = languages.find(l => l.isDefault)?.code || "en";
    if (!translations[defaultLang]?.name?.trim()) {
        newErrors.name = `Product name (${defaultLang.toUpperCase()}) is required`;
    }

    if (!formData.basePrice) newErrors.basePrice = "Base price is required";
    if (!formData.sellingPrice) newErrors.sellingPrice = "Selling price is required";
    if (!formData.stock) newErrors.stock = "Stock is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    if (!validateForm()) {
      return;
    }

    if (!session?.accessToken) {
      await alert({
          title: "Authentication Required",
          message: "Please login to continue saving this product.",
          type: "danger"
      });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      const defaultLang = languages.find(l => l.isDefault)?.code || "en";
      const defaultTranslation = translations[defaultLang] || { name: "", description: "" };

      // Append basic fields
      formDataToSend.append("name", defaultTranslation.name); // Default name for fallback
      formDataToSend.append("description", defaultTranslation.description); // Default desc for fallback

      // Append translations array
      const translationsArray = Object.entries(translations).map(([code, data]) => ({
          langCode: code,
          name: data.name,
          description: data.description
      }));
      formDataToSend.append("translations", JSON.stringify(translationsArray));

      formDataToSend.append("slug", formData.slug || ""); // Will auto-generate if empty
      formDataToSend.append("basePrice", formData.basePrice);
      formDataToSend.append("sellingPrice", formData.sellingPrice || formData.basePrice); // Default to basePrice
      if (formData.costPrice) formDataToSend.append("costPrice", formData.costPrice);
      if (formData.sku) formDataToSend.append("sku", formData.sku);
      if (formData.barcode) formDataToSend.append("barcode", formData.barcode);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("minStockLevel", formData.minStockLevel);
      formDataToSend.append("lowStockAlert", formData.lowStockAlert);
      formDataToSend.append("categoryId", formData.categoryId);
      if (formData.brand) formDataToSend.append("brand", formData.brand);
      if (formData.weight) formDataToSend.append("weight", formData.weight);
      if (formData.length) formDataToSend.append("length", formData.length);
      if (formData.width) formDataToSend.append("width", formData.width);
      if (formData.height) formDataToSend.append("height", formData.height);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("isNewArrival", formData.isNewArrival.toString());
      formDataToSend.append("isFeatured", formData.isFeatured.toString());
      formDataToSend.append("isFreeShipping", formData.isFreeShipping.toString());
      if (formData.metaTitle) formDataToSend.append("metaTitle", formData.metaTitle);
      if (formData.metaDescription) formDataToSend.append("metaDescription", formData.metaDescription);
      if (formData.ogImage) formDataToSend.append("ogImage", formData.ogImage);

      // Append tags
      const tags = selectedTags.map((tag) => tag.value);
      formDataToSend.append("tags", JSON.stringify(tags));

      // Append Meta Keywords
      if (formData.metaKeywords && formData.metaKeywords.length > 0) {
        const keywords = formData.metaKeywords.map((k: any) => k.value).join(', ');
        formDataToSend.append("metaKeywords", keywords);
      }

      // Append variants data (JSON string)
      if (variants.length > 0) {
        const variantsData = variants.map((variant) => ({
          id: variant.id.startsWith("variant-") ? undefined : variant.id,
          name: variant.name,
          attributes: variant.attributes,
          sku: variant.sku,
          barcode: variant.barcode,
          basePrice: variant.basePrice ? parseFloat(variant.basePrice) : parseFloat(formData.basePrice),
          sellingPrice: variant.sellingPrice ? parseFloat(variant.sellingPrice) : parseFloat(formData.sellingPrice || formData.basePrice),
          costPrice: variant.costPrice ? parseFloat(variant.costPrice) : formData.costPrice ? parseFloat(formData.costPrice) : undefined,
          stock: parseInt(variant.stock) || 0,
          minStockLevel: parseInt(variant.minStockLevel) || 0,
          isActive: variant.isActive,
          images: variant.images.filter(img => !img.file).map(img => img.url),
        }));
        formDataToSend.append("variants", JSON.stringify(variantsData));
      }

      // Append main product images (only new ones with file property)
      images.forEach((img, index) => {
        if (img.file) {
          formDataToSend.append("images", img.file);
        }
        if (img.isPrimary) {
          formDataToSend.append("primaryImageIndex", index.toString());
        }
      });

      // Append variant images (Files)
      if (variants.length > 0) {
        variants.forEach((variant, variantIndex) => {
          variant.images.forEach((img, imgIndex) => {
            if (img.file) {
              formDataToSend.append(`variant_${variantIndex}_images`, img.file);
            }
            if (img.isPrimary) {
              formDataToSend.append(`variant_${variantIndex}_primaryIndex`, imgIndex.toString());
            }
          });
        });
      }

      // If editing, keep existing images
      if (mode === "edit") {
        formDataToSend.append("keepExistingImages", "true");
      }

      const url = mode === "create" ? `${API_URL}/products` : `${API_URL}/products/${productId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formDataToSend,
      });

      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const error = await res.json();
        console.error("Error response:", error);
        toast.error(error.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setLoading(false);
    }
  };


  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Please login to continue...</div>
      </div>
    );
  }

  // Flatten categories for select dropdown
  const categoryOptions = flattenCategories(categories);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {mode === "create" ? "Add New Product" : "Edit Product"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={loading}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
              >
                <span>✨ Auto Translate Missing Fields</span>
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LocalizedInput
                label="Product Name"
                languages={languages}
                translations={translations}
                field="name"
                onChange={(lang, val) => handleTranslationChange(lang, 'name', val)}
                required
                error={errors.name}
                placeholder="Enter product name"
            />
            {/* Slug is universal, unrelated to lang usually, or auto-generated from default name */}
            <GlobalInput
              label="Slug (URL Friendly ID)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: (e.target as HTMLInputElement).value })}
              placeholder="Auto-generated if empty"
              rightElement={
                <button
                  type="button"
                  onClick={handleGenerateSlug}
                  className="text-purple-600 hover:text-purple-700 text-xs font-bold px-2 py-1 bg-purple-50 rounded border border-purple-100 transition-colors"
                >
                  ✨ Magic
                </button>
              }
            />
          </div>

          <div>
             <LocalizedTextEditor
                label="Description"
                languages={languages}
                translations={translations}
                field="description"
                onChange={(lang, val) => handleTranslationChange(lang, 'description', val)}
             />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlobalInput
              label="Base Price"
              type="number"
              required
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: (e.target as HTMLInputElement).value })}
              error={errors.basePrice}
            />
            <GlobalInput
              label="Selling Price"
              type="number"
              required
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: (e.target as HTMLInputElement).value })}
              error={errors.sellingPrice}
            />
            <GlobalInput
              label="Cost Price"
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: (e.target as HTMLInputElement).value })}
            />
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlobalInput
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: (e.target as HTMLInputElement).value })}
              placeholder="Auto-generated"
              rightElement={
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  className="text-purple-600 hover:text-purple-700 text-xs font-bold px-2 py-1 bg-purple-50 rounded border border-purple-100 transition-colors"
                >
                  ✨ SKU
                </button>
              }
            />
            <GlobalInput
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: (e.target as HTMLInputElement).value })}
              placeholder="Auto-generated"
              rightElement={
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-purple-600 hover:text-purple-700 text-xs font-bold px-2 py-1 bg-purple-50 rounded border border-purple-100 transition-colors"
                >
                  ✨ Code
                </button>
              }
            />
            <GlobalInput
              label="Stock"
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: (e.target as HTMLInputElement).value })}
              error={errors.stock}
            />
            <GlobalInput
              label="Min Stock Level (Alert)"
              type="number"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: (e.target as HTMLInputElement).value })}
              placeholder="e.g. 5"
            />
            <GlobalInput
              label="Legacy Low Alert"
              type="number"
              value={formData.lowStockAlert}
              onChange={(e) => setFormData({ ...formData, lowStockAlert: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.trackInventory}
                onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700">Track Inventory</span>
            </label>
          </div>
        </div>

        {/* Category, Brand & Tags */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Category, Brand & Tags</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlobalSelect
              label="Category"
              required
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value.toString() })}
              options={categoryOptions}
              placeholder="Select Category"
              error={errors.categoryId}
            />
            <GlobalInput
              label="Brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <Select
              isMulti
              options={PREDEFINED_TAGS}
              value={selectedTags}
              onChange={(selected) => setSelectedTags(selected as any)}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select tags..."
            />
          </div>
        </div>

        {/* Main Product Images */}
        <div className="bg-white p-6 rounded-lg shadow">
          <ImageUploadManager
            images={images}
            onChange={setImages}
            variantLabel="Main Product"
            maxImages={10}
          />
        </div>

        {/* Product Variants */}
        <div className="bg-white p-6 rounded-lg shadow">
          <VariantManager
            variants={variants}
            onChange={setVariants}
            productBasePrice={formData.basePrice}
            productSellingPrice={formData.sellingPrice}
          />
        </div>

        {/* Status & Flags */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Status & Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlobalSelect
              label="Status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value.toString() })}
              options={[
                { value: "DRAFT", label: "Draft" },
                { value: "PUBLISHED", label: "Published" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
            />
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">New Arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFreeShipping}
                    onChange={(e) => setFormData({ ...formData, isFreeShipping: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Free Shipping</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPreOrder}
                    onChange={(e) => setFormData({ ...formData, isPreOrder: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Pre-Order Only</span>
                </label>
              </div>

              <div className="mt-4 pt-4 border-t space-y-4">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Home Page & Warranty</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isHomeShown}
                        onChange={(e) => setFormData({ ...formData, isHomeShown: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Show in Home Category Slider</span>
                    </label>
                    <GlobalInput
                      label="Home Page Priority/Order"
                      type="number"
                      value={formData.homeOrder}
                      onChange={(e) => setFormData({ ...formData, homeOrder: (e.target as HTMLInputElement).value })}
                      placeholder="e.g. 1"
                    />
                   </div>
                   <GlobalInput
                     label="Warranty Info"
                     value={formData.warranty}
                     onChange={(e) => setFormData({ ...formData, warranty: (e.target as HTMLInputElement).value })}
                     placeholder="e.g. 1 Year Official"
                   />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO & Social Media */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">SEO & Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlobalInput
              label="Meta Title"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: (e.target as HTMLInputElement).value })}
              placeholder="SEO Title (Optional)"
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Meta Keywords</label>
              <CreatableSelect
                isMulti
                options={POPULAR_META_KEYWORDS}
                placeholder="Type and press enter..."
                value={formData.metaKeywords}
                onChange={(newValue) => setFormData({ ...formData, metaKeywords: newValue as any })}
                className="text-sm"
                styles={{
                    control: (base) => ({
                        ...base,
                        minHeight: '48px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '8px',
                        borderColor: '#E5E7EB'
                    })
                }}
              />
            </div>
          </div>
          <GlobalInput
            label="Meta Description"
            value={formData.metaDescription}
            onChange={(e) => setFormData({ ...formData, metaDescription: (e.target as HTMLInputElement).value })}
            placeholder="Search engine description..."
          />
          <GlobalInput
            label="OG Image URL"
            value={formData.ogImage}
            onChange={(e) => setFormData({ ...formData, ogImage: (e.target as HTMLInputElement).value })}
            placeholder="Social media share image URL"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Saving..." : mode === "create" ? "Create Product" : "Update Product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
