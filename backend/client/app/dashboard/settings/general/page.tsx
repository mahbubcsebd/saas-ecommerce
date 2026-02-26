"use client";

import ImageUpload from "@/components/dashboard/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function GeneralSettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Types
    interface CompanySettings { id?: string; name: string; phone: string; email: string; address: string; taxId: string; invoiceTerms: string; logo: string; website: string; }
    interface GeneralSettings { id?: string; siteName: string; tagline: string; description: string; headerLogo: string; footerLogo: string; favicon: string; maintenanceMode: boolean; copyrightText: string; }
    interface CurrencySettings { id?: string; code: string; symbol: string; symbolPosition: "LEFT" | "RIGHT"; }
    interface ContactSettings { id?: string; facebook: string; instagram: string; youtube: string; whatsapp: string; linkedin: string; tiktok: string; pinterest: string; twitter: string; workingHours: string; mapUrl: string; }

    interface SeoSettings {
        id?: string;
        metaTitle: string;
        metaDescription: string;
        metaKeywords: string;
        googleAnalyticsId?: string; // Form input is string
        facebookPixelId?: string;
        googleTagManagerId?: string;
    }

    // Forms
    const formCompany = useForm<CompanySettings>();
    const formGeneral = useForm<GeneralSettings>();
    const formCurrency = useForm<CurrencySettings>();
    const formContact = useForm<ContactSettings>();
    const formSeo = useForm<SeoSettings>();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    useEffect(() => {
        if(session?.accessToken) fetchAllSettings();
    }, [session]);

    const fetchAllSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/settings/public`);
            const data = await res.json();

            if(data.success && data.data) {
                const { company, general, currency, contact, seo } = data.data;

                if(company) formCompany.reset({ ...company, invoiceTerms: company.invoiceTerms || "Payment due within 30 days." });
                if(general) formGeneral.reset(general);
                if(currency) formCurrency.reset(currency);
                if(contact) formContact.reset(contact);

                if(seo) {
                    // Convert arrays back to newline-separated strings for the form
                    const joinArray = (arr: string[] | undefined) => Array.isArray(arr) ? arr.join('\n') : (arr || '');

                    formSeo.reset({
                        ...seo,
                        googleAnalyticsId: joinArray(seo.googleAnalyticsId),
                        facebookPixelId: joinArray(seo.facebookPixelId),
                        googleTagManagerId: joinArray(seo.googleTagManagerId),
                    });
                }
            }
        } catch (error) {
            console.error("Fetch Settings Error", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (type: string, data: any) => {
        try {
            setSaving(true);

            // Prepare data
            let payload = { ...data };

            // If SEO, convert newline strings back to arrays
            if (type === 'seo') {
                const splitString = (str: string | undefined) => str ? str.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [];

                payload = {
                    ...data,
                    googleAnalyticsId: splitString(data.googleAnalyticsId),
                    facebookPixelId: splitString(data.facebookPixelId),
                    googleTagManagerId: splitString(data.googleTagManagerId),
                };
            }

            const res = await fetch(`${API_URL}/settings/${type}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} settings saved`);
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6 mx-auto p-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">General Services</h1>
                    <p className="text-muted-foreground">Manage your store information and preferences.</p>
                </div>
            </div>

            <Tabs defaultValue="company" className="space-y-4">
                <TabsList className="flex-wrap h-auto w-full justify-start">
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="currency">Currency</TabsTrigger>
                    <TabsTrigger value="contact">Contact & Social</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                {/* COMPANY SETTINGS */}
                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Details</CardTitle>
                            <CardDescription>Displayed on invoices and footer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Company Logo</Label>
                                <ImageUpload
                                    value={formCompany.watch("logo")}
                                    onChange={(url) => formCompany.setValue("logo", url)}
                                    onRemove={() => formCompany.setValue("logo", "")}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    <Input {...formCompany.register("name")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input {...formCompany.register("phone")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input {...formCompany.register("email")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input {...formCompany.register("website")} />
                                </div>
                                 <div className="space-y-2">
                                    <Label>Tax ID / VAT</Label>
                                    <Input {...formCompany.register("taxId")} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Textarea {...formCompany.register("address")} />
                            </div>

                            <div className="space-y-2">
                                <Label>Invoice Terms & Conditions</Label>
                                <Textarea {...formCompany.register("invoiceTerms")} className="min-h-[100px]" />
                            </div>

                            <div className="flex justify-end">
                                <Button disabled={saving} onClick={formCompany.handleSubmit((d) => updateSettings('company', d))}>
                                    {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* GENERAL SETTINGS */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Store Settings</CardTitle>
                            <CardDescription>Basic configuration for your store</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Site Name</Label>
                                    <Input {...formGeneral.register("siteName")} placeholder="My Store" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tagline</Label>
                                    <Input {...formGeneral.register("tagline")} placeholder="Best products in town" />
                                    </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Description</Label>
                                    <Textarea {...formGeneral.register("description")} placeholder="Store description for SEO and footer..." />
                                </div>

                                {/* Logos Section */}
                                <div className="space-y-4 col-span-2 border p-4 rounded-md">
                                    <h3 className="font-medium">Brand Assets</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Header Logo</Label>
                                            <ImageUpload
                                                id="header-logo"
                                                value={formGeneral.watch("headerLogo")}
                                                onChange={(url) => formGeneral.setValue("headerLogo", url)}
                                                onRemove={() => formGeneral.setValue("headerLogo", "")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Footer Logo</Label>
                                            <ImageUpload
                                                id="footer-logo"
                                                value={formGeneral.watch("footerLogo")}
                                                onChange={(url) => formGeneral.setValue("footerLogo", url)}
                                                onRemove={() => formGeneral.setValue("footerLogo", "")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Favicon</Label>
                                            <ImageUpload
                                                id="favicon"
                                                value={formGeneral.watch("favicon")}
                                                onChange={(url) => formGeneral.setValue("favicon", url)}
                                                onRemove={() => formGeneral.setValue("favicon", "")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label>Copyright Text</Label>
                                    <Input {...formGeneral.register("copyrightText")} placeholder="© 2026 Mahbub Shop. All rights reserved." />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 border p-4 rounded-md">
                                <Switch
                                    checked={formGeneral.watch("maintenanceMode")}
                                    onCheckedChange={(checked) => formGeneral.setValue("maintenanceMode", checked)}
                                />
                                <Label>Maintenance Mode</Label>
                                <span className="text-sm text-muted-foreground ml-2">(Only admins can access the site)</span>
                            </div>
                            <div className="flex justify-end">
                                <Button disabled={saving} onClick={formGeneral.handleSubmit((d) => updateSettings('general', d))}>
                                    {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CURRENCY SETTINGS */}
                <TabsContent value="currency">
                    <Card>
                        <CardHeader>
                            <CardTitle>Currency Settings</CardTitle>
                            <CardDescription>Manage your store's primary currency</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Currency Code</Label>
                                    <Input {...formCurrency.register("code")} placeholder="USD, BDT" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Symbol</Label>
                                    <Input {...formCurrency.register("symbol")} placeholder="$, ৳" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Symbol Position</Label>
                                    <Select
                                        value={formCurrency.watch("symbolPosition")}
                                        onValueChange={(val: any) => formCurrency.setValue("symbolPosition", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LEFT">Left ($100)</SelectItem>
                                            <SelectItem value="RIGHT">Right (100$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                             <div className="flex justify-end">
                                <Button disabled={saving} onClick={formCurrency.handleSubmit((d) => updateSettings('currency', d))}>
                                    {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONTACT & SOCIAL */}
                <TabsContent value="contact">
                    <Card>
                         <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>Links for your footer and contact pages</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Facebook URL</Label>
                                    <Input {...formContact.register("facebook")} placeholder="https://facebook.com/..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>WhatsApp Number</Label>
                                    <Input {...formContact.register("whatsapp")} placeholder="+880..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Instagram URL</Label>
                                    <Input {...formContact.register("instagram")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>YouTube URL</Label>
                                    <Input {...formContact.register("youtube")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Twitter (X) URL</Label>
                                    <Input {...formContact.register("twitter")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>LinkedIn URL</Label>
                                    <Input {...formContact.register("linkedin")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>TikTok URL</Label>
                                    <Input {...formContact.register("tiktok")} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pinterest URL</Label>
                                    <Input {...formContact.register("pinterest")} />
                                </div>
                            </div>

                            <div className="space-y-8 pt-4">
                                <h3 className="text-lg font-medium">Additional Information</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Working Hours</Label>
                                        <Input {...formContact.register("workingHours")} placeholder="Mon - Fri: 9:00 AM - 6:00 PM" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Google Map Embed URL (src)</Label>
                                        <Textarea {...formContact.register("mapUrl")} placeholder="https://www.google.com/maps/embed?pb=..." className="min-h-[80px]" />
                                        <p className="text-xs text-muted-foreground">Paste the 'src' link from Google Maps Embed HTML.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button disabled={saving} onClick={formContact.handleSubmit((d) => updateSettings('contact', d))}>
                                    {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SEO SETTINGS */}
                <TabsContent value="seo">
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Configuration</CardTitle>
                            <CardDescription>Search Engine Optimization settings for your store</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Meta Title</Label>
                                <Input {...formSeo.register("metaTitle")} placeholder="My Store - Best Products" />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Description</Label>
                                <Textarea {...formSeo.register("metaDescription")} placeholder="Shop for..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Meta Keywords</Label>
                                <Input {...formSeo.register("metaKeywords")} placeholder="shop, products, electronics" />
                            </div>

                             <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold mb-2">Analytics & Pixels</h3>
                                <p className="text-sm text-muted-foreground mb-4">Enter one ID per line to add multiple.</p>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Google Analytics 4 (Measurement IDs)</Label>
                                        <Textarea
                                            {...formSeo.register("googleAnalyticsId")}
                                            placeholder="G-XXXXXXX&#10;G-YYYYYYY"
                                            className="font-mono"
                                        />
                                        <p className="text-xs text-muted-foreground">Format: G-XXXXXXXXXX</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Facebook Pixel IDs</Label>
                                        <Textarea
                                            {...formSeo.register("facebookPixelId")}
                                            placeholder="1234567890&#10;0987654321"
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Google Tag Manager IDs</Label>
                                        <Textarea
                                            {...formSeo.register("googleTagManagerId")}
                                            placeholder="GTM-XXXXXXX&#10;GTM-YYYYYYY"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button disabled={saving} onClick={formSeo.handleSubmit((d) => updateSettings('seo', d))}>
                                    {saving && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
