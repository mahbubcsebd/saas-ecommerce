"use client";

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
   Zap
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { PageBuilder } from "./page-builder/PageBuilder";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData || {
      title: "",
      slug: "",
      productId: "",
      isAbTestActive: false,
      themeColor: "#3b82f6",
      fontFamily: "Inter",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      isActive: true,
      gjs_html: initialData?.gjs_html || "",
      gjs_css: initialData?.gjs_css || "",
      gjs_json: initialData?.gjs_json || "",
      description: initialData?.description || "",
      variants: initialData?.variants || []
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants",
  });

  const isAbTest = watch("isAbTestActive");

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/products?limit=200&status=all`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (error) {
        console.error("Failed to fetch products", error);
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

      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (resData.success) {
        toast.success(initialData ? "Page Updated!" : "Page Created!");
        router.push("/dashboard/landing-pages");
        router.refresh();
      } else {
        toast.error(resData.message || "Failed to save");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" type="button" onClick={() => router.back()} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {initialData ? "Editor" : "New Landing Page"}
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest px-1">Page builder & stats</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-bold" onClick={() => router.back()}>
               Cancel
             </Button>
             <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 h-11 px-8 rounded-xl font-bold text-white">
               {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5 fill-current" />}
               {initialData ? "Update Changes" : "Launch Funnel"}
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Workspace */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="builder" className="w-full">
              <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit h-auto gap-1 border border-slate-200 shadow-inner">
                <TabsTrigger value="builder" className="rounded-xl font-bold py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600">
                  <Layout className="h-4 w-4 mr-2" /> Builder
                </TabsTrigger>
                <TabsTrigger value="ab-test" className="rounded-xl font-bold py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600">
                  <Split className="h-4 w-4 mr-2" /> Experiments
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-xl font-bold py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600">
                  <Settings2 className="h-4 w-4 mr-2" /> Content
                </TabsTrigger>
                <TabsTrigger value="seo" className="rounded-xl font-bold py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600">
                  <Globe className="h-4 w-4 mr-2" /> SEO
                </TabsTrigger>
              </TabsList>

               <TabsContent value="builder" className="pt-6">
                  <PageBuilder
                    pageId={initialData?.id}
                    initialData={{
                      html: watch("gjs_html"),
                      css: watch("gjs_css"),
                      json: watch("gjs_json")
                    }}
                    onSave={async (gjs) => {
                      setValue("gjs_html", gjs.html);
                      setValue("gjs_css", gjs.css);
                      setValue("gjs_json", gjs.json);
                    }}
                  />
               </TabsContent>

              <TabsContent value="ab-test" className="pt-6 space-y-6">
                 <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b p-6">
                       <div className="flex items-center justify-between">
                          <div>
                             <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                               <Split className="h-5 w-5 text-orange-500" /> Experiment Hub
                             </CardTitle>
                             <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">Run A/B tests to optimize conversion</p>
                          </div>
                          <Switch
                            checked={watch("isAbTestActive")}
                            onCheckedChange={(v) => setValue("isAbTestActive", v)}
                          />
                       </div>
                    </CardHeader>
                    <CardContent className="p-6">
                       {isAbTest ? (
                         <div className="space-y-6">
                            {variantFields.map((field, index) => (
                               <div key={field.id} className="flex gap-4 p-4 rounded-2xl border bg-white shadow-sm group hover:border-orange-200 transition-colors">
                                  <div className="flex-1 space-y-4">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                           <Label className="text-[10px] font-black uppercase text-slate-400">Variant Name</Label>
                                           <Input {...register(`variants.${index}.name`)} placeholder="e.g. Red CTA Button" className="h-10 rounded-xl border-slate-200 focus:ring-orange-500" />
                                        </div>
                                        <div className="space-y-1.5">
                                           <Label className="text-[10px] font-black uppercase text-slate-400">Weight (%)</Label>
                                           <Input {...register(`variants.${index}.weight`)} type="number" className="h-10 rounded-xl border-slate-200 focus:ring-orange-500" />
                                        </div>
                                     </div>
                                      <div className="flex items-center gap-3">
                                         <Button
                                           type="button"
                                           variant="outline"
                                           size="sm"
                                           className="text-[10px] font-black uppercase rounded-xl border-slate-200 hover:bg-slate-50 h-9"
                                           onClick={() => setEditingVariantIndex(index)}
                                         >
                                            <Edit2 className="h-3 w-3 mr-1.5" /> Design Variant
                                         </Button>
                                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                            {(field as any).gjs_json ? "Design Active" : "No Design"}
                                         </div>
                                      </div>
                                  </div>
                                  <Button variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 self-start mt-2">
                                     <Trash className="h-4 w-4" />
                                  </Button>
                               </div>
                            ))}
                            <Button type="button" variant="outline" className="w-full h-12 border-dashed border-2 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 font-black rounded-2xl" onClick={() => appendVariant({ name: "New Variant", weight: 50, blocks: [], gjs_html: "", gjs_css: "", gjs_json: "" })}>
                               <Plus className="h-4 w-4 mr-2" /> Add Experiment Variant
                            </Button>
                         </div>
                       ) : (
                         <div className="py-20 text-center border-2 border-dashed rounded-2xl border-slate-100">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Split className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">A/B Testing Disabled</p>
                            <p className="text-slate-500 text-sm mt-1">Enable to compare page performance variants.</p>
                         </div>
                       )}
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="settings" className="pt-6 space-y-6">
                 <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl">
                    <CardHeader className="bg-white border-b p-6">
                       <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                         <Settings2 className="h-5 w-5 text-orange-500" /> Funnel Content
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Campaign Title</Label>
                             <Input {...register("title", { required: true })} placeholder="e.g. Ramdan Offer 2024" className="h-12 rounded-xl focus:ring-orange-500" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Public URL Slug</Label>
                             <div className="flex">
                               <div className="h-12 flex items-center px-4 bg-slate-50 border border-r-0 rounded-l-xl text-xs font-bold text-slate-400">/landing/</div>
                               <Input {...register("slug", { required: true })} placeholder="offer-name" className="h-12 rounded-l-none rounded-r-xl focus:ring-orange-500" />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Linked Product (Checkout)</Label>
                         <Controller
                           name="productId"
                           control={control}
                           render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                 <SelectTrigger className="h-12 rounded-xl focus:ring-orange-500">
                                    <SelectValue placeholder="Search product for checkout..." />
                                 </SelectTrigger>
                                 <SelectContent className="rounded-2xl shadow-2xl border-slate-100 max-h-[300px]">
                                    {products.map(p => (
                                      <SelectItem key={p.id} value={p.id} className="py-3 px-4 focus:bg-orange-50 focus:text-orange-700">
                                        <div className="flex flex-col">
                                          <span className="font-bold">{p.name}</span>
                                          <span className="text-[10px] opacity-50 uppercase tracking-widest">SKU: {p.sku || 'N/A'}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           )}
                         />
                       </div>

                       <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Description</Label>
                          <Textarea {...register("description")} placeholder="Short summary for admin reference..." className="rounded-2xl min-h-[80px] p-4 text-sm focus:ring-orange-500" />
                       </div>
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="seo" className="pt-6 space-y-6">
                 <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-8 space-y-8 bg-white">
                    <div>
                      <h2 className="text-lg font-black tracking-tight flex items-center gap-2 mb-1">
                        <Globe className="h-5 w-5 text-orange-500" /> Search Optimization
                      </h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Optimize how this page appears in search engines</p>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Title</Label>
                        <Input {...register("metaTitle")} className="h-12 rounded-xl" placeholder="Catchy title for Google results..." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Description</Label>
                        <Textarea {...register("metaDescription")} className="rounded-2xl min-h-[120px] p-4 text-sm" placeholder="A compelling summary of your page to drive clicks..." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Meta Keywords</Label>
                        <Input {...register("metaKeywords")} className="h-12 rounded-xl" placeholder="sales, ecommerce, fashion, limited-offer" />
                      </div>
                    </div>
                 </Card>
               </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
             <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl p-6 space-y-6 bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />

                <div className="flex items-center justify-between relative z-10">
                   <Label className="text-sm font-black text-slate-700 uppercase tracking-tight">Public Status</Label>
                   <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                         <Switch
                           checked={field.value}
                           onCheckedChange={field.onChange}
                           className="data-[state=checked]:bg-orange-600"
                         />
                      )}
                   />
                </div>

                <div className="space-y-3 pt-4 border-t relative z-10">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Live Actions</p>
                   <Button
                     type="button"
                     variant="outline"
                     className="w-full h-11 rounded-xl font-bold bg-slate-50 border-slate-100 hover:bg-white text-slate-600 hover:border-orange-200 transition-all hover:shadow-md"
                     onClick={() => window.open(`/landing/${watch("slug")}`, '_blank')}
                   >
                      <Eye className="h-4 w-4 mr-2 text-orange-500" /> Open Live Page
                   </Button>
                </div>
             </Card>

             <Card className="border-none shadow-2xl shadow-slate-900/10 rounded-2xl p-6 bg-slate-900 text-white">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
                  <Zap className="h-3 w-3 fill-current text-orange-400" /> Branding Tokens
                </p>
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-xs font-black uppercase tracking-tight">Theme Accent</span>
                      <Input type="color" {...register("themeColor")} className="h-8 w-8 p-0 border-none bg-transparent cursor-pointer" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Typography System</Label>
                      <Select value={watch("fontFamily")} onValueChange={(v) => setValue("fontFamily", v)}>
                         <SelectTrigger className="h-10 bg-white/5 border-white/10 text-xs font-bold rounded-xl px-4">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="Inter" className="font-sans">Inter (Modern)</SelectItem>
                            <SelectItem value="Roboto" className="font-sans">Roboto (Clean)</SelectItem>
                            <SelectItem value="Outfit" className="font-sans">Outfit (Premium)</SelectItem>
                            <SelectItem value="Playfair Display" className="font-serif">Playfair (Elegant)</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </form>

      {/* Variant Designer Dialog */}
      <Dialog open={editingVariantIndex !== null} onOpenChange={() => setEditingVariantIndex(null)}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[95vh] p-0 overflow-hidden bg-white shadow-2xl rounded-3xl border-none">
           <DialogHeader className="p-4 border-b bg-white flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                    <Split className="h-6 w-6" />
                 </div>
                 <div>
                    <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                       {editingVariantIndex !== null ? watch(`variants.${editingVariantIndex}.name`) : "Experiment Variant"}
                    </DialogTitle>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Designing local experience variation</p>
                 </div>
              </div>
              <Button type="button" onClick={() => setEditingVariantIndex(null)} className="font-black rounded-2xl h-11 px-8 bg-slate-900 hover:bg-black text-white shadow-lg">
                 Finish & Apply
              </Button>
           </DialogHeader>

           <div className="flex-1 overflow-hidden">
              {editingVariantIndex !== null && (
                <PageBuilder
                  pageId={initialData?.id}
                  initialData={{
                    html: watch(`variants.${editingVariantIndex}.gjs_html`),
                    css: watch(`variants.${editingVariantIndex}.gjs_css`),
                    json: watch(`variants.${editingVariantIndex}.gjs_json`)
                  }}
                  onSave={async (gjs) => {
                    setValue(`variants.${editingVariantIndex}.gjs_html`, gjs.html);
                    setValue(`variants.${editingVariantIndex}.gjs_css`, gjs.css);
                    setValue(`variants.${editingVariantIndex}.gjs_json`, gjs.json);
                    toast.success("Variant design synced!");
                  }}
                />
              )}
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
