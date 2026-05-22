"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Grid,
  Check,
  Tag,
  Hash,
  Sparkles
} from "lucide-react";

import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Attribute {
  id: string;
  name: string;
  label: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

interface AttributeFormData {
  id?: string;
  name: string;
  label: string;
  values: string[];
}

export default function AttributesPage() {
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  
  // List State
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newValueInput, setNewValueInput] = useState("");
  const [newValueColor, setNewValueColor] = useState("#4f46e5");
  const [formData, setFormData] = useState<AttributeFormData>({
    name: "",
    label: "",
    values: [],
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Fetch all attributes from backend
  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/attributes`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        const result = await res.json();
        setAttributes(result.data || []);
      } else {
        toast.error("Failed to retrieve attributes listing.");
      }
    } catch (error) {
      console.error("Failed to fetch attributes", error);
      toast.error("Network error while loading attributes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchAttributes();
    }
  }, [session]);

  // Open modal for Create Mode
  const openCreateModal = () => {
    setFormData({
      name: "",
      label: "",
      values: [],
    });
    setNewValueInput("");
    setShowModal(true);
  };

  // Open modal for Edit Mode
  const openEditModal = (attr: Attribute) => {
    setFormData({
      id: attr.id,
      name: attr.name,
      label: attr.label,
      values: [...attr.values],
    });
    setNewValueInput("");
    setShowModal(true);
  };

  // Add a value to the current form tags
  const handleAddValue = () => {
    const trimmed = newValueInput.trim();
    if (!trimmed) return;

    let finalValue = trimmed;
    const isColor = formData.name.toLowerCase() === "color";
    if (isColor) {
      finalValue = `${trimmed}:${newValueColor}`;
    }

    // Check for duplicate value (ignoring case of color names)
    const checkName = trimmed.toLowerCase();
    const isDuplicate = formData.values.some((val) => {
      const existingName = val.includes(":") ? val.split(":")[0] : val;
      return existingName.toLowerCase() === checkName;
    });

    if (isDuplicate) {
      toast.warning(`"${trimmed}" is already in the values list.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      values: [...prev.values, finalValue],
    }));
    setNewValueInput("");
    setNewValueColor("#4f46e5");
  };

  // Handle Enter press in the value input
  const handleValueKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddValue();
    }
  };

  // Remove a value tag from current form
  const handleRemoveValue = (valueToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      values: prev.values.filter((val) => val !== valueToRemove),
    }));
  };

  // Submit create or edit form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    // Validation
    const systemName = formData.name.trim().toLowerCase();
    const displayLabel = formData.label.trim();

    if (!systemName) {
      toast.error("Attribute System Name is required.");
      return;
    }
    if (!displayLabel) {
      toast.error("Attribute Display Label is required.");
      return;
    }
    if (formData.values.length === 0) {
      await alert({
        title: "Values Required",
        message: "Please add at least one attribute value (e.g. Red, XL, 128GB).",
        type: "warning",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/attributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          name: systemName,
          label: displayLabel,
          values: formData.values,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchAttributes();
        toast.success(formData.id ? "Attribute updated successfully!" : "Attribute created successfully!");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to save attribute.");
      }
    } catch (error) {
      console.error("Save attribute error:", error);
      toast.error("Error saving attribute details.");
    } finally {
      setSaving(false);
    }
  };

  // Delete attribute
  const handleDelete = async (attr: Attribute) => {
    if (
      !(await confirm({
        title: "Delete Attribute",
        message: `Are you sure you want to delete the "${attr.label}" attribute? This cannot be undone and may affect products using this variant type.`,
        type: "danger",
        confirmText: "Delete Attribute",
        cancelText: "Cancel",
      }))
    )
      return;

    try {
      const res = await fetch(`${API_URL}/attributes/${attr.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        fetchAttributes();
        toast.success("Attribute deleted successfully.");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete attribute.");
      }
    } catch (error) {
      console.error("Delete attribute error:", error);
      toast.error("Failed to delete attribute.");
    }
  };

  // Filtered attributes list
  const filteredAttributes = attributes.filter(
    (attr) =>
      attr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attr.values.some((val) => val.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute stats
  const totalAttributesCount = attributes.length;
  const totalValuesCount = attributes.reduce((sum, attr) => sum + attr.values.length, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Sliders className="h-6 w-6" />
            </div>
            Variant Attributes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage product variant attributes (like Color, Size, Storage) and their selection values.
          </p>
        </div>
        
        <Button
          type="button"
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm flex items-center gap-2 rounded-lg px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Attribute Types</CardTitle>
            <Grid className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalAttributesCount}</div>
            <p className="text-xs text-slate-400 mt-1">Commonly used and custom properties</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Unique Values</CardTitle>
            <Hash className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalValuesCount}</div>
            <p className="text-xs text-slate-400 mt-1">Color shades, size numbers, capacities</p>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-indigo-50/10 dark:bg-slate-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Variant Status</CardTitle>
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
              Synchronized with DB
            </div>
            <p className="text-xs text-slate-400 mt-2">Active in product creation variants panel</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel: Search & Filter */}
      <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by attribute name, label or specific values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>
        {searchQuery && (
          <Button
            variant="ghost"
            onClick={() => setSearchQuery("")}
            className="text-slate-500 hover:text-slate-700 h-9"
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* Attributes Listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 mt-4">Retrieving attribute configuration details...</p>
        </div>
      ) : filteredAttributes.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm border-dashed">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-900 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sliders className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
            {searchQuery ? "No matching attributes found" : "No Variant Attributes Configured"}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms or code name identifiers to locate the attribute."
              : "Attributes allow you to define properties like size or color. Create one to begin defining product options."}
          </p>
          {!searchQuery && (
            <Button onClick={openCreateModal} className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg">
              Create First Attribute
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAttributes.map((attr) => (
            <div
              key={attr.id}
              className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Attribute Header & Code Info */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-slate-900 rounded-xl text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{attr.label}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
                      {attr.name}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    System identifier code: <span className="font-mono text-indigo-500">{attr.name}</span>
                  </p>
                </div>
              </div>

              {/* Badges / Value Pills Group */}
              <div className="flex-1 min-w-0 md:max-w-2xl">
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-600 mb-2 uppercase tracking-wider">
                  Associated Values ({attr.values.length}):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                  {attr.values.map((val) => {
                    const isColor = attr.name.toLowerCase() === "color";
                    const hasHex = val.includes(":");
                    const displayName = hasHex ? val.split(":")[0] : val;
                    const hexCode = hasHex ? val.split(":")[1] : null;

                    return (
                      <Badge
                        key={val}
                        variant="secondary"
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-none font-medium px-2.5 py-1 text-xs transition-colors flex items-center gap-1.5"
                      >
                        {isColor && hexCode && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-700 flex-shrink-0"
                            style={{ backgroundColor: hexCode }}
                          />
                        )}
                        {displayName}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(attr)}
                  className="h-9 w-9 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-900 transition-colors"
                  title="Edit Attribute"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(attr)}
                  className="h-9 w-9 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title="Delete Attribute"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation & Editing Modal Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md md:max-w-lg border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-500" />
              {formData.id ? "Modify Variant Attribute" : "Configure New Variant Attribute"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 pt-2">
            {/* System Identifier Name */}
            <div className="space-y-1.5">
              <Label htmlFor="attr-name" className="text-slate-800 dark:text-slate-200 font-semibold">
                System Code Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="attr-name"
                type="text"
                required
                disabled={!!formData.id} // Disable changing name on edit as it's the DB key
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, "") })}
                placeholder="e.g. color, size, storage"
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 leading-normal">
                {formData.id 
                  ? "The database key name cannot be edited once set." 
                  : "Unique, lowercase system key with no spaces or special characters (e.g. 'color', 'storage')."}
              </p>
            </div>

            {/* Display Label */}
            <div className="space-y-1.5">
              <Label htmlFor="attr-label" className="text-slate-800 dark:text-slate-200 font-semibold">
                Display Label <span className="text-red-500">*</span>
              </Label>
              <Input
                id="attr-label"
                type="text"
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. Color, Size, Storage Capacity"
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 leading-normal">
                Friendly display name shown in forms and dashboards (e.g. 'Storage', 'Bottle Size').
              </p>
            </div>

            {/* Values / Tags Editor */}
            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Label className="text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-between">
                <span>Attribute Values <span className="text-red-500">*</span></span>
                <span className="text-[11px] text-indigo-500 font-normal">
                  ({formData.values.length} added)
                </span>
              </Label>
              
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={handleValueKeyDown}
                  placeholder={formData.name.toLowerCase() === "color" ? "e.g. Crimson, Teal" : "Type a value (e.g. 128GB, XL) and press Enter"}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm flex-1 focus-visible:ring-1 focus-visible:ring-indigo-500"
                />

                {formData.name.toLowerCase() === "color" && (
                  <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 px-2 h-10 shrink-0">
                    <input
                      type="color"
                      value={newValueColor}
                      onChange={(e) => setNewValueColor(e.target.value)}
                      className="w-6 h-6 border border-slate-300 dark:border-slate-700 rounded cursor-pointer p-0 bg-transparent shrink-0"
                      title="Choose color code"
                    />
                    <span className="text-[11px] font-mono text-slate-500 uppercase select-all shrink-0">{newValueColor}</span>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAddValue}
                  disabled={!newValueInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs"
                >
                  Add Value
                </Button>
              </div>

              {/* Tag Pill List */}
              {formData.values.length > 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mt-3 max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mb-2 uppercase tracking-wide">
                    Added Tag List (Click 'X' to remove):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.values.map((val) => {
                      const isColor = formData.name.toLowerCase() === "color";
                      const hasHex = val.includes(":");
                      const displayName = hasHex ? val.split(":")[0] : val;
                      const hexCode = hasHex ? val.split(":")[1] : null;

                      return (
                        <span
                          key={val}
                          className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 hover:border-red-200 dark:hover:border-red-950 hover:bg-red-50/30 group transition-all"
                        >
                          {isColor && hexCode && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-700 flex-shrink-0"
                              style={{ backgroundColor: hexCode }}
                            />
                          )}
                          {displayName}
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(val)}
                            className="text-slate-400 hover:text-red-500 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-colors"
                            title={`Remove ${displayName}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900 border border-dashed rounded-xl mt-3">
                  <p className="text-xs text-slate-400 italic">No values added yet. Type a value above to add.</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {formData.id ? "Update Attribute" : "Save Attribute"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
