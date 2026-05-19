'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Plus, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Check, 
  ChevronsUpDown,
  Loader2,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GlobalDatePicker } from '@/components/forms/GlobalDatePicker';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api';

type LinkType = 'NONE' | 'PRODUCT' | 'CATEGORY' | 'EXTERNAL';

interface BannerFormProps {
  initialData?: any;
  onSubmit: (formData: any) => Promise<void>;
  isEditing?: boolean;
  loading?: boolean;
}

export function BannerForm({ initialData, onSubmit, isEditing = false, loading = false }: BannerFormProps) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || '';

  const [form, setForm] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    linkType: (initialData?.linkType as LinkType) || 'NONE',
    linkValue: initialData?.linkValue || '',
    isActive: initialData?.isActive ?? true,
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    imageFiles: [] as any[],
    existingImage: initialData?.image || '',
  });

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [openSelector, setOpenSelector] = useState(false);

  useEffect(() => {
    if (token) {
      fetchMetadata();
    }
  }, [token]);

  const fetchMetadata = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/products?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.success) setProducts(pData.data);
      if (cData.success) setCategories(cData.data);
    } catch (e) {
      console.error('Metadata fetch failed', e);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreviews = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      }),
    );
    setForm((prev) => ({ 
      ...prev, 
      imageFiles: isEditing ? [filesWithPreviews[0]] : [...prev.imageFiles, ...filesWithPreviews] 
    }));
  }, [isEditing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: !isEditing,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && form.imageFiles.length === 0) {
      return toast.error('Please upload at least one image');
    }
    onSubmit(form);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/hero">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-gray-100">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEditing ? 'Edit Banner Slide' : 'Add New Banners'}
            </h1>
            <p className="text-gray-500 text-sm">Configure your homepage promotional sequence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
             <Link href="/dashboard/hero">
                <Button variant="ghost" className="font-semibold text-gray-500">
                Cancel
                </Button>
            </Link>
            <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-black hover:bg-gray-800 text-white rounded-xl px-8 h-11 shadow-lg shadow-gray-200 flex items-center gap-2"
            >
                {loading && <Loader2 className="animate-spin" size={14} />}
                <span className="text-xs font-bold uppercase tracking-widest">
                {isEditing ? 'Save Changes' : 'Create Banners'}
                </span>
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          
          {/* LEFT SIDE: CONTENT & LINK */}
          <div className="p-8 lg:p-10 space-y-10">
            {/* Content Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-black font-bold text-xs uppercase tracking-wider">
                <Plus size={14} />
                Content Details
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Headline</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Summer Collection 2024"
                    className="h-12 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-1 focus:ring-black/5 transition-all rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Sub-headline</Label>
                  <Input
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="e.g. Up to 50% off on all items"
                    className="h-12 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-1 focus:ring-black/5 transition-all rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Link */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-black font-bold text-xs uppercase tracking-wider">
                <LinkIcon size={14} />
                Navigation Link
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Link Type</Label>
                  <Select
                    value={form.linkType}
                    onValueChange={(v: LinkType) => setForm({ ...form, linkType: v, linkValue: '' })}
                  >
                    <SelectTrigger className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-1 focus:ring-black/5">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Link</SelectItem>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="CATEGORY">Category</SelectItem>
                      <SelectItem value="EXTERNAL">External URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.linkType !== 'NONE' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Value</Label>
                    {form.linkType === 'EXTERNAL' ? (
                      <Input
                        value={form.linkValue}
                        onChange={(e) => setForm({ ...form, linkValue: e.target.value })}
                        placeholder="https://..."
                        className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-1 focus:ring-black/5"
                      />
                    ) : (
                      <Popover open={openSelector} onOpenChange={setOpenSelector}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-12 justify-between bg-gray-50/50 border-gray-100 rounded-xl font-normal text-sm hover:bg-white"
                          >
                            {form.linkValue
                              ? (form.linkType === 'PRODUCT' ? products : categories).find((i) => i.id === form.linkValue)?.name
                              : `Select ${form.linkType.toLowerCase()}`}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="end">
                          <Command>
                            <CommandInput placeholder={`Search ${form.linkType.toLowerCase()}...`} />
                            <CommandList>
                              <CommandEmpty>Nothing found.</CommandEmpty>
                              <CommandGroup>
                                {(form.linkType === 'PRODUCT' ? products : categories).map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    value={item.id}
                                    onSelect={(currentValue) => {
                                      setForm({ ...form, linkValue: currentValue });
                                      setOpenSelector(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        form.linkValue === item.id ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {item.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: MEDIA & SCHEDULING */}
          <div className="p-8 lg:p-10 bg-gray-50/20 space-y-10">
            {/* Media Assets */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-black font-bold text-xs uppercase tracking-wider">
                <ImageIcon size={14} />
                Media Assets
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  'group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all duration-300 min-h-[220px]',
                  isDragActive
                    ? 'border-black bg-gray-50 ring-4 ring-gray-100/50'
                    : 'border-gray-200 bg-white hover:border-black hover:shadow-md',
                )}
              >
                <input {...getInputProps()} />
                {form.imageFiles.length > 0 ? (
                  <div className="w-full p-4 grid grid-cols-1 gap-4">
                    {form.imageFiles.map((file, i) => (
                      <div key={i} className="relative aspect-[16/7] rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-slate-100 group/img">
                        <img src={file.preview} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(prev => ({ 
                              ...prev, 
                              imageFiles: prev.imageFiles.filter((_, idx) => idx !== i) 
                            }));
                          }}
                          className="absolute top-2 right-2 h-8 w-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all opacity-0 group-hover/img:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : isEditing && form.existingImage ? (
                  <div className="w-full p-4">
                    <div className="relative aspect-[16/7] w-full rounded-2xl overflow-hidden border-2 border-white shadow-xl group/existing">
                        <img src={form.existingImage} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/existing:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <Upload size={24} className="mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">Replace Image</p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="bg-gray-100 p-4 rounded-2xl inline-block mb-3 group-hover:scale-110 transition-transform text-black">
                      <Upload size={28} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">Drop images here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG, WebP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scheduling & Status */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-black font-bold text-xs uppercase tracking-wider">
                <Clock size={14} />
                Scheduling & Status
              </div>

              <div className="grid grid-cols-1 gap-4">
                <GlobalDatePicker
                  label="Starts At"
                  value={form.startDate ? new Date(form.startDate) : null}
                  onChange={(date) => setForm({ ...form, startDate: date ? date.toISOString() : '' })}
                  placeholder="Immediately"
                />
                <GlobalDatePicker
                  label="Expires At"
                  value={form.endDate ? new Date(form.endDate) : null}
                  onChange={(date) => setForm({ ...form, endDate: date ? date.toISOString() : '' })}
                  placeholder="Indefinite"
                />
              </div>

              <div className="flex items-center justify-between p-5 border rounded-2xl bg-white mt-4 border-gray-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">Active Visibility</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Visible on website immediately</span>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  className="data-[state=checked]:bg-black scale-110"
                />
              </div>

              {/* Quick Tip */}
              <div className="bg-black/[0.02] p-6 rounded-3xl border border-gray-100 flex gap-4 mt-2">
                <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-200">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Visual Tip</h4>
                  <p className="text-gray-500 text-xs leading-relaxed font-medium">
                    Use high-resolution images (recommended 1920x800px) for maximum impact. Text overlays look best on images with balanced contrast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
