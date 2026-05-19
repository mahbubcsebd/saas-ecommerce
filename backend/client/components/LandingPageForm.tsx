'use client';

import {
  ArrowLeft,
  Edit2,
  Eye,
  Globe,
  Layout,
  Loader2,
  Plus,
  Settings2,
  Split,
  Trash,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';
import { PageBuilder } from './page-builder/PageBuilder';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api';

interface LandingPageFormProps {
  initialData?: any;
}

export default function LandingPageForm({ initialData }: LandingPageFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // -- Builder State --
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      title: '',
      slug: '',
      productId: '',
      isAbTestActive: false,
      themeColor: '#3b82f6',
      fontFamily: 'Inter',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      isActive: true,
      gjs_html: initialData?.gjs_html || '',
      gjs_css: initialData?.gjs_css || '',
      gjs_json: initialData?.gjs_json || '',
      description: initialData?.description || '',
      variants: initialData?.variants || [],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
  });

  const isAbTest = watch('isAbTestActive');

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/products?limit=200&status=all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (error) {
        console.error('Failed to fetch products', error);
      }
    };
    fetchProducts();
  }, [token]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
      };

      const url = initialData
        ? `${API_BASE}/landing-pages/${initialData.id}`
        : `${API_BASE}/landing-pages`;

      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (resData.success) {
        toast.success(initialData ? 'Page Updated!' : 'Page Created!');
        router.push('/dashboard/landing-pages');
        router.refresh();
      } else {
        toast.error(resData.message || 'Failed to save');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 py-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {initialData ? 'Edit Funnel' : 'Create New Funnel'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {initialData
                  ? `Editing: ${initialData.title}`
                  : 'Build high-conversion promotional pages'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4 fill-current" />
              )}
              {initialData ? 'Save Changes' : 'Create Funnel'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Workspace */}
          <div className="lg:col-span-9 space-y-6">
            <Tabs defaultValue="builder" className="w-full">
              <div className="bg-muted p-1 rounded-lg w-fit mb-6">
                <TabsList className="h-8 bg-transparent gap-1">
                  <TabsTrigger
                    value="builder"
                    className="h-6 rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Layout className="h-3.5 w-3.5 mr-2" /> Builder
                  </TabsTrigger>
                  <TabsTrigger
                    value="ab-test"
                    className="h-6 rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Split className="h-3.5 w-3.5 mr-2" /> A/B Testing
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="h-6 rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-2" /> Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="seo"
                    className="h-6 rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Globe className="h-3.5 w-3.5 mr-2" /> SEO
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="builder" className="mt-0">
                <Card className="border-none shadow-none bg-transparent">
                  <PageBuilder
                    pageId={initialData?.id}
                    initialData={{
                      html: watch('gjs_html'),
                      css: watch('gjs_css'),
                      json: watch('gjs_json'),
                    }}
                    onSave={async (gjs) => {
                      setValue('gjs_html', gjs.html);
                      setValue('gjs_css', gjs.css);
                      setValue('gjs_json', gjs.json);
                    }}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="ab-test" className="mt-0 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        A/B Testing Experiments
                      </CardTitle>
                      <CardDescription>
                        Compare different versions of your page to see which
                        performs better.
                      </CardDescription>
                    </div>
                    <Switch
                      checked={watch('isAbTestActive')}
                      onCheckedChange={(v) => setValue('isAbTestActive', v)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isAbTest ? (
                      <div className="space-y-4">
                        {variantFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex gap-4 p-4 rounded-lg border bg-muted/30 group transition-colors"
                          >
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold">
                                    Variant Name
                                  </Label>
                                  <Input
                                    {...register(`variants.${index}.name`)}
                                    placeholder="e.g. Red CTA Button"
                                    className="h-9"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs font-semibold">
                                    Traffic Weight (%)
                                  </Label>
                                  <Input
                                    {...register(`variants.${index}.weight`)}
                                    type="number"
                                    className="h-9"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-bold"
                                  onClick={() => setEditingVariantIndex(index)}
                                >
                                  <Edit2 className="h-3 w-3 mr-2" /> Design
                                  Variant
                                </Button>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'font-bold text-[10px]',
                                    (field as any).gjs_json
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : 'bg-slate-50 text-slate-500 border-slate-200',
                                  )}
                                >
                                  {(field as any).gjs_json
                                    ? 'DESIGN READY'
                                    : 'NO DESIGN'}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeVariant(index)}
                              className="text-muted-foreground hover:text-destructive h-8 w-8"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 border-dashed"
                          onClick={() =>
                            appendVariant({
                              name: 'New Variant',
                              weight: 50,
                              blocks: [],
                              gjs_html: '',
                              gjs_css: '',
                              gjs_json: '',
                            })
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Variation
                        </Button>
                      </div>
                    ) : (
                      <div className="py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                        <Split className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-muted-foreground">
                          A/B Testing Disabled
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[280px] mx-auto">
                          Turn on experiments to start optimizing your landing
                          page conversions.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Funnel Information
                    </CardTitle>
                    <CardDescription>
                      General settings and checkout product link.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Internal Title
                        </Label>
                        <Input
                          {...register('title', { required: true })}
                          placeholder="e.g. Ramadan Special Offer"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          URL Slug
                        </Label>
                        <div className="flex">
                          <div className="h-9 flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-xs font-medium text-muted-foreground">
                            /landing/
                          </div>
                          <Input
                            {...register('slug', { required: true })}
                            placeholder="my-cool-page"
                            className="h-9 rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Link to Product (Direct Checkout)
                      </Label>
                      <Controller
                        name="productId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Search product for direct purchase..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem
                                  key={p.id}
                                  value={p.id}
                                  className="py-2"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-xs">
                                      {p.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase">
                                      SKU: {p.sku || 'N/A'} • ৳{p.basePrice}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Internal Notes (Optional)
                      </Label>
                      <Textarea
                        {...register('description')}
                        placeholder="Page objective, source details, etc."
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" /> Search
                      Optimization
                    </CardTitle>
                    <CardDescription>
                      Manage how your landing page appears in search engine
                      results.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Meta Title
                      </Label>
                      <Input
                        {...register('metaTitle')}
                        className="h-9"
                        placeholder="The title that appears in Google search"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Meta Description
                      </Label>
                      <Textarea
                        {...register('metaDescription')}
                        className="min-h-[100px] resize-none"
                        placeholder="Brief summary for search engine users"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Keywords (Comma separated)
                      </Label>
                      <Input
                        {...register('metaKeywords')}
                        className="h-9"
                        placeholder="sale, limited, offer, shop"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold">Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Public Status
                  </Label>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div className="pt-4 border-t space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-xs font-bold"
                    onClick={() =>
                      window.open(`/landing/${watch('slug')}`, '_blank')
                    }
                  >
                    <Eye className="h-3.5 w-3.5 mr-2" /> Live Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-orange-400 fill-current" />{' '}
                  Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Accent Color
                  </Label>
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/10">
                    <Input
                      type="color"
                      {...register('themeColor')}
                      className="h-8 w-8 p-0 border-none bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300 uppercase">
                      {watch('themeColor')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Global Typography
                  </Label>
                  <Select
                    value={watch('fontFamily')}
                    onValueChange={(v) => setValue('fontFamily', v)}
                  >
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-xs font-medium text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter" className="font-sans">
                        Inter (Modern)
                      </SelectItem>
                      <SelectItem value="Roboto" className="font-sans">
                        Roboto (Clean)
                      </SelectItem>
                      <SelectItem value="Outfit" className="font-sans">
                        Outfit (Geometric)
                      </SelectItem>
                      <SelectItem
                        value="Playfair Display"
                        className="font-serif"
                      >
                        Playfair (Serif)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Variant Designer Dialog */}
      <Dialog
        open={editingVariantIndex !== null}
        onOpenChange={() => setEditingVariantIndex(null)}
      >
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-2xl">
          <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between shrink-0 bg-background">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 border border-orange-100">
                <Split className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {editingVariantIndex !== null
                    ? `Designing: ${watch(`variants.${editingVariantIndex}.name`)}`
                    : 'Experiment Variant'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Customize the look of this specific variant
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setEditingVariantIndex(null)}
              className="bg-slate-900 hover:bg-black"
            >
              Apply Design
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {editingVariantIndex !== null && (
              <PageBuilder
                pageId={initialData?.id}
                initialData={{
                  html: watch(`variants.${editingVariantIndex}.gjs_html`),
                  css: watch(`variants.${editingVariantIndex}.gjs_css`),
                  json: watch(`variants.${editingVariantIndex}.gjs_json`),
                }}
                onSave={async (gjs) => {
                  setValue(
                    `variants.${editingVariantIndex}.gjs_html`,
                    gjs.html,
                  );
                  setValue(`variants.${editingVariantIndex}.gjs_css`, gjs.css);
                  setValue(
                    `variants.${editingVariantIndex}.gjs_json`,
                    gjs.json,
                  );
                  toast.success('Variant design updated');
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
