'use client';

import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Info,
    Loader2,
    Save,
    Search
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TranslationItem {
    namespace: string;
    key: string;
    enValue: string;
    targetValue: string;
    isModified: boolean;
}

export default function TranslationEditorPage() {
    const { code } = useParams();
    const { data: session } = useSession();
    const router = useRouter();

    const [translations, setTranslations] = useState<TranslationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const [languageInfo, setLanguageInfo] = useState<{name: string, isRtl: boolean} | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    useEffect(() => {
        if (session?.accessToken && code) {
            fetchTranslations();
        }
    }, [session, code]);

    const fetchTranslations = async () => {
        setLoading(true);
        try {
            // 1. Language metadata
            const langRes = await fetch(`${API_URL}/languages`, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });
            const langData = await langRes.json();
            const currentLang = langData.data?.find((l: any) => l.code === code);
            if (currentLang) setLanguageInfo({ name: currentLang.name, isRtl: currentLang.isRtl });

            // 2. Fetch base (en) and target (code)
            const [baseRes, targetRes] = await Promise.all([
                fetch(`${API_URL}/translations/en`),
                fetch(`${API_URL}/translations/${code}`)
            ]);

            const [baseData, targetData] = await Promise.all([
                baseRes.json(),
                targetRes.json()
            ]);

            const baseMap = baseData.data || {};
            const targetMap = targetData.data || {};

            // 3. Flatten and merge
            const merged: TranslationItem[] = [];
            Object.keys(baseMap).forEach(ns => {
                Object.keys(baseMap[ns]).forEach(key => {
                    merged.push({
                        namespace: ns,
                        key,
                        enValue: baseMap[ns][key],
                        targetValue: targetMap[ns]?.[key] || "",
                        isModified: false
                    });
                });
            });

            // Catch any target keys missing in base
            Object.keys(targetMap).forEach(ns => {
                Object.keys(targetMap[ns]).forEach(key => {
                    if (!baseMap[ns]?.[key]) {
                        merged.push({
                            namespace: ns,
                            key,
                            enValue: "(Missing in Base)",
                            targetValue: targetMap[ns][key],
                            isModified: false
                        });
                    }
                });
            });

            setTranslations(merged);
        } catch (e) {
            toast.error("Failed to load language nodes");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (namespace: string, key: string, newValue: string) => {
        setTranslations(prev => prev.map(item =>
            (item.namespace === namespace && item.key === key)
            ? { ...item, targetValue: newValue, isModified: true }
            : item
        ));
    };

    const handleSave = async (item: TranslationItem) => {
        const itemKey = `${item.namespace}:${item.key}`;
        setSaving(itemKey);
        try {
            const res = await fetch(`${API_URL}/translations/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                    langCode: code,
                    namespace: item.namespace,
                    key: item.key,
                    value: item.targetValue
                })
            });

            if (res.ok) {
                toast.success("Sync successful");
                setTranslations(prev => prev.map(t =>
                    (t.namespace === item.namespace && t.key === item.key)
                    ? { ...t, isModified: false }
                    : t
                ));
            } else {
                throw new Error();
            }
        } catch (e) {
            toast.error("Cloud synchronization failed");
        } finally {
            setSaving(null);
        }
    };

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return translations.filter(t =>
            t.key.toLowerCase().includes(q) ||
            t.enValue.toLowerCase().includes(q) ||
            t.targetValue.toLowerCase().includes(q) ||
            t.namespace.toLowerCase().includes(q)
        ).sort((a, b) => b.isModified ? 1 : -1);
    }, [translations, searchQuery]);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-center p-6">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900">Translation Engine</h3>
                    <p className="text-sm text-slate-500 animate-pulse">Mapping dictionary nodes for {code}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard/settings/languages">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium -ml-2 text-muted-foreground">
                                <ArrowLeft className="w-3.5 h-3.5" /> Languages
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        {languageInfo?.name || code} <ChevronRight className="w-6 h-6 text-slate-300" /> Dictionary
                    </h1>
                    <p className="text-slate-500 text-sm">Maintain UI strings and terminology for the local storefront.</p>
                </div>

                <div className="flex items-center gap-6">
                   <div className="relative w-64 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by key or text..."
                            className="h-11 pl-10 bg-white shadow-sm ring-1 ring-slate-100"
                        />
                   </div>
                </div>
            </div>

            <div className="space-y-4">
                <Alert className="bg-blue-50/50 border-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-bold uppercase text-[10px] tracking-widest">Efficiency Tip</AlertTitle>
                    <AlertDescription className="text-blue-700 text-xs">
                        Use the search bar to quickly find specific UI elements. Modified entries will automatically float to the top for review.
                    </AlertDescription>
                </Alert>

                <Card className="shadow-none border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b">
                                <tr>
                                    <th className="px-6 py-4 w-[25%]">Node Path / Key</th>
                                    <th className="px-6 py-4 w-[35%]">Primary (EN)</th>
                                    <th className="px-6 py-4 w-[35%]">{languageInfo?.name} (Local)</th>
                                    <th className="px-6 py-4 text-right w-[5%]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filtered.map((item) => (
                                    <tr key={`${item.namespace}:${item.key}`} className={`group hover:bg-slate-50/50 transition-colors ${item.isModified ? 'bg-amber-50/30' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <code className="text-xs font-mono font-bold text-slate-800 truncate max-w-[200px]">{item.key}</code>
                                                <Badge variant="outline" className="w-fit text-[9px] uppercase h-4 px-1 shadow-none border-slate-200 text-slate-400">{item.namespace}</Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm text-slate-500 italic">"{item.enValue}"</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <textarea
                                                className={`w-full min-h-[60px] p-3 text-sm rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none ${
                                                    item.isModified ? 'border-amber-200 bg-white ring-1 ring-amber-100' : 'border-slate-100 bg-transparent'
                                                }`}
                                                rows={2}
                                                value={item.targetValue}
                                                dir={languageInfo?.isRtl ? 'rtl' : 'ltr'}
                                                onChange={e => handleUpdate(item.namespace, item.key, e.target.value)}
                                            />
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.isModified && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-primary shadow-sm hover:scale-105 transition-transform"
                                                        onClick={() => handleSave(item)}
                                                        disabled={saving === `${item.namespace}:${item.key}`}
                                                    >
                                                        {saving === `${item.namespace}:${item.key}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                    </Button>
                                                )}
                                                {!item.isModified && item.targetValue && (
                                                    <div className="h-8 w-8 flex items-center justify-center text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-20 text-center space-y-3">
                                <Search className="w-12 h-12 text-slate-100 mx-auto" />
                                <div>
                                    <p className="text-sm font-bold text-slate-800 uppercase italic">Zero matches found</p>
                                    <p className="text-xs text-slate-400">Try adjusting your search filters or check for typos.</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="text-[10px] font-bold uppercase tracking-widest h-8 px-4">Clear Filters</Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
