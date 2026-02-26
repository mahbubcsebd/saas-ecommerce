"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import GlobalInput from "./forms/GlobalInput";
import GlobalSelect from "./forms/GlobalSelect";
import ImageUploadManager from "./ImageUploadManager";

export interface VariantAttribute {
  type: string; // "color", "size", "material", etc.
  value: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  attributes: VariantAttribute[];
  sku?: string;
  barcode?: string;
  basePrice?: string;
  sellingPrice?: string;
  costPrice?: string;
  stock: string;
  minStockLevel: string;
  images: Array<{ file?: File; url: string; id: string; isPrimary?: boolean }>;
  isActive: boolean;
}

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  productBasePrice?: string;
  productSellingPrice?: string;
}

const VARIANT_TYPES = [
  { value: "color", label: "Color" },
  { value: "size", label: "Size" },
  { value: "material", label: "Material" },
  { value: "storage", label: "Storage" },
  { value: "style", label: "Style" },
  { value: "pattern", label: "Pattern" },
];

const COLOR_OPTIONS = [
  "Red", "Blue", "Green", "Black", "White", "Yellow", "Orange", "Purple",
  "Pink", "Brown", "Gray", "Navy", "Beige", "Gold", "Silver"
];

const SIZE_OPTIONS = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "28", "30", "32", "34", "36", "38", "40", "42"
];

const STORAGE_OPTIONS = [
  "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"
];

export default function VariantManager({
  variants,
  onChange,
  productBasePrice,
  productSellingPrice,
}: VariantManagerProps) {
  const { alert } = useConfirm();
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariantAttributes, setNewVariantAttributes] = useState<VariantAttribute[]>([]);
  const [currentAttribute, setCurrentAttribute] = useState<{
    type: string;
    value: string;
  }>({ type: "color", value: "" });

  const handleAddAttribute = () => {
    if (!currentAttribute.value.trim()) return;

    // Check if this attribute type already exists
    const existingIndex = newVariantAttributes.findIndex(
      (attr) => attr.type === currentAttribute.type
    );

    if (existingIndex >= 0) {
      // Replace existing attribute of same type
      const updated = [...newVariantAttributes];
      updated[existingIndex] = { ...currentAttribute };
      setNewVariantAttributes(updated);
    } else {
      // Add new attribute
      setNewVariantAttributes([...newVariantAttributes, { ...currentAttribute }]);
    }

    setCurrentAttribute({ type: "color", value: "" });
  };

  const handleRemoveAttribute = (type: string) => {
    setNewVariantAttributes(newVariantAttributes.filter((attr) => attr.type !== type));
  };

  const handleCreateVariant = async () => {
    if (newVariantAttributes.length === 0) {
      await alert({
        title: "Validation Error",
        message: "Please add at least one attribute to create a variant.",
        type: "warning"
      });
      return;
    }

    // Generate variant name from attributes
    const variantName = newVariantAttributes
      .map((attr) => `${attr.value}`)
      .join(" / ");

    const variant: ProductVariant = {
      id: `variant-${Date.now()}`,
      name: variantName,
      attributes: [...newVariantAttributes],
      stock: "0",
      minStockLevel: "2",
      images: [],
      isActive: true,
    };

    onChange([...variants, variant]);
    setNewVariantAttributes([]);
    setShowAddVariant(false);
    setExpandedVariant(variant.id);
    toast.success(`Variant "${variantName}" added successfully.`);
  };

  const handleDeleteVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
    if (expandedVariant === id) {
      setExpandedVariant(null);
    }
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    onChange(
      variants.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  const getSuggestions = () => {
    if (currentAttribute.type === "color") return COLOR_OPTIONS;
    if (currentAttribute.type === "size") return SIZE_OPTIONS;
    if (currentAttribute.type === "storage") return STORAGE_OPTIONS;
    return [];
  };

  const getAttributeLabel = (type: string) => {
    const found = VARIANT_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-500">Add combinations of color, size, storage, etc.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddVariant(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Add Variant
        </button>
      </div>

      {/* Add Variant Form */}
      {showAddVariant && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">New Variant</h4>
            <button
              type="button"
              onClick={() => {
                setShowAddVariant(false);
                setNewVariantAttributes([]);
                setCurrentAttribute({ type: "color", value: "" });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Current Attributes */}
          {newVariantAttributes.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Selected Attributes:</p>
              <div className="flex flex-wrap gap-2">
                {newVariantAttributes.map((attr) => (
                  <div
                    key={attr.type}
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-xs font-medium text-blue-900">
                      {getAttributeLabel(attr.type)}:
                    </span>
                    <span className="text-sm text-blue-700">{attr.value}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(attr.type)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Attribute */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlobalSelect
              label="Attribute Type"
              value={currentAttribute.type}
              onChange={(value) => setCurrentAttribute({ ...currentAttribute, type: value.toString(), value: "" })}
              options={VARIANT_TYPES}
            />

            <div>
              <GlobalInput
                label="Attribute Value"
                value={currentAttribute.value}
                onChange={(e) => setCurrentAttribute({ ...currentAttribute, value: (e.target as HTMLInputElement).value })}
                placeholder={`Enter ${currentAttribute.type}`}
              />
              {/* Suggestions */}
              {getSuggestions().length > 0 && !currentAttribute.value && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getSuggestions().map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setCurrentAttribute({ ...currentAttribute, value: suggestion })}
                      className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddAttribute}
              disabled={!currentAttribute.value.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Add Attribute
            </button>
            <button
              type="button"
              onClick={handleCreateVariant}
              disabled={newVariantAttributes.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Create Variant
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddVariant(false);
                setNewVariantAttributes([]);
                setCurrentAttribute({ type: "color", value: "" });
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No variants added yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add variants with multiple attributes (e.g., Red + XL + Cotton)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Variant Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedVariant(expandedVariant === variant.id ? null : variant.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{variant.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {variant.attributes.map((attr) => (
                        <span
                          key={attr.type}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {getAttributeLabel(attr.type)}: {attr.value}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Stock: {variant.stock} • Min: {variant.minStockLevel} • Images: {variant.images.length}
                      {variant.sellingPrice && ` • Price: ৳${variant.sellingPrice}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVariant(variant.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedVariant === variant.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Variant Details (Expanded) */}
              {expandedVariant === variant.id && (
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                  {/* Pricing & Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlobalInput
                      label="Base Price"
                      type="number"
                      value={variant.basePrice || ""}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          basePrice: (e.target as HTMLInputElement).value,
                        })
                      }
                      placeholder={productBasePrice || "Same as product"}
                    />
                    <GlobalInput
                      label="Selling Price"
                      type="number"
                      value={variant.sellingPrice || ""}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          sellingPrice: (e.target as HTMLInputElement).value,
                        })
                      }
                      placeholder={productSellingPrice || "Same as product"}
                    />
                    <GlobalInput
                      label="Cost Price"
                      type="number"
                      value={variant.costPrice || ""}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          costPrice: (e.target as HTMLInputElement).value,
                        })
                      }
                    />
                    <GlobalInput
                      label="Stock"
                      type="number"
                      required
                      value={variant.stock}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          stock: (e.target as HTMLInputElement).value,
                        })
                      }
                    />
                    <GlobalInput
                      label="Min Stock"
                      type="number"
                      value={variant.minStockLevel}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          minStockLevel: (e.target as HTMLInputElement).value,
                        })
                      }
                      placeholder="e.g. 2"
                    />
                  </div>

                  {/* SKU & Barcode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlobalInput
                      label="SKU"
                      value={variant.sku || ""}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          sku: (e.target as HTMLInputElement).value,
                        })
                      }
                      placeholder="Auto-generated"
                    />
                    <GlobalInput
                      label="Barcode"
                      value={variant.barcode || ""}
                      onChange={(e) =>
                        handleUpdateVariant(variant.id, {
                          barcode: (e.target as HTMLInputElement).value,
                        })
                      }
                      placeholder="Auto-generated"
                    />
                  </div>

                  {/* Variant Images */}
                  <ImageUploadManager
                    images={variant.images}
                    onChange={(images) => handleUpdateVariant(variant.id, { images })}
                    variantLabel={variant.name}
                    maxImages={5}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
