'use client';

import { useConfirm } from "@/hooks/use-confirm";
import {
    ArrowLeft,
    Box,
    ChevronRight,
    Key,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Tag,
    Trash2,
    Undo2,
    Zap
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TranslationKey {
    namespace: string;
    key: string;
    enValue: string;
}

interface Namespace {
    id: string;
    name: string;
}

export default function KeyManagerPage() {
    const { data: session } = useSession();
    const [languages, setLanguages] = useState<any[]>([]);
    const [keys, setKeys] = useState<string[]>([]);
    const [namespaces, setNamespaces] = useState<Namespace[]>([]);
    const [translationData, setTranslationData] = useState<Record<string, Record<string, string>>>({});

    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedNamespace, setSelectedNamespace] = useState<string>("all");

    const { confirm } = useConfirm();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [newNamespaceName, setNewNamespaceName] = useState("");
    const [editingNamespace, setEditingNamespace] = useState<Namespace | null>(null);
    const [formData, setFormData] = useState({ namespace: "", key: "", value: "" });
    const [renamingKey, setRenamingKey] = useState<{oldKey: string, newName: string} | null>(null);
    const [isTranslatingRow, setIsTranslatingRow] = useState<string | null>(null);
    const [showNamespaceModal, setShowNamespaceModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const fetchData = async (silent = false) => {
        if (!session?.accessToken) return;
        if (!silent) setLoading(true);
        try {
            const langRes = await fetch(`${API_URL}/languages`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            if (!langRes.ok) throw new Error(`Languages fetch failed: ${langRes.status}`);
            const langData = await langRes.json();
            const allLangs = langData.data || [];

            const nsRes = await fetch(`${API_URL}/translations/namespaces`);
            const nsData = await nsRes.json();

            const allTranslations: Record<string, Record<string, string>> = {};
            const allUniqueKeys = new Set<string>();

            await Promise.all(allLangs.map(async (lang: any) => {
                try {
                    const res = await fetch(`${API_URL}/translations/${lang.code}?t=${Date.now()}`);
                    const data = await res.json();
                    const map = data.data || {};

                    allTranslations[lang.code] = {};
                    Object.keys(map).forEach(ns => {
                        Object.keys(map[ns]).forEach(k => {
                            const compositeKey = `${ns}:${k}`;
                            allTranslations[lang.code][compositeKey] = map[ns][k];
                            allUniqueKeys.add(compositeKey);
                        });
                    });
                } catch (e) {
                    console.error(`Failed to fetch for ${lang.code}`, e);
                }
            }));

            setTranslationData(allTranslations);
            setKeys(Array.from(allUniqueKeys).sort());
            setLanguages(allLangs);
            if (nsData && nsData.success) setNamespaces(nsData.data);
        } catch (e) {
            toast.error("Failed to fetch translation matrix");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) {
            fetchData();
        }
    }, [session?.accessToken]);

    const handleAddKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/translations/key`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Key created and auto-translated!");
                await fetchData();
                setShowAddModal(false);
                setFormData({ namespace: "", key: "", value: "" });
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to create key");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTranslation = async (langCode: string, compositeKey: string, newValue: string) => {
        const [namespace, key] = compositeKey.split(':');

        setTranslationData(prev => ({
            ...prev,
            [langCode]: {
                ...prev[langCode],
                [compositeKey]: newValue
            }
        }));

        try {
            const res = await fetch(`${API_URL}/translations/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ langCode, namespace, key, value: newValue }),
            });

            if (res.ok) {
                toast.success(`Synced ${langCode}`);
            } else {
                throw new Error();
            }
        } catch (error) {
            toast.error(`Update failed for ${langCode}`);
            fetchData(true);
        }
    };

    const handleDeleteKey = async (compositeKey: string) => {
        const [namespace, key] = compositeKey.split(':');
        if (!await confirm({
            title: "Delete Key",
            message: `Permanently remove '${key}' from ALL languages?`,
            type: "danger",
            confirmText: "Delete",
            cancelText: "Keep it"
        })) return;

        try {
            const res = await fetch(`${API_URL}/translations/key`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ namespace, key }),
            });
            if (res.ok) {
                toast.success("Key purged from matrix");
                setKeys(prev => prev.filter(k => k !== compositeKey));
            }
        } catch (error) {
            toast.error("Purge operation failed");
        }
    };

    const handleRenameKey = async () => {
        if (!renamingKey) return;
        const [namespace, oldKey] = renamingKey.oldKey.split(':');
        const newKey = renamingKey.newName.trim().toLowerCase().replace(/\s+/g, '_');

        if (!newKey || oldKey === newKey) {
            setRenamingKey(null);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/translations/rename-key`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ namespace, oldKey, newKey }),
            });

            if (res.ok) {
                toast.success("Key updated across matrix");
                await fetchData();
                setRenamingKey(null);
            }
        } catch (error) {
            toast.error("Rename operation failed");
        }
    };

    const handleTranslateSingleKey = async (keyPath: string, force = false) => {
        const [namespace, key] = keyPath.split(':');
        setIsTranslatingRow(keyPath);
        try {
            const res = await fetch(`${API_URL}/translations/translate-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ namespace, key, force })
            });
            if (res.ok) {
                toast.success(force ? "Reset and re-translated" : "Single key translated");
                fetchData(true);
            }
        } catch (error) {
            toast.error("Translation failed");
        } finally {
            setIsTranslatingRow(null);
        }
    };

    const handleResetAll = async () => {
        if (resetConfirmText !== "OK") {
            toast.error("Please type OK to confirm");
            return;
        }
        if (!selectedNamespace || selectedNamespace === 'all') {
            toast.error("Please select a specific namespace to reset");
            return;
        }

        setIsResetting(true);
        try {
            const res = await fetch(`${API_URL}/translations/reset-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ namespace: selectedNamespace })
            });
            if (res.ok) {
                toast.success("Namespace translations reset and re-filled");
                fetchData(true);
                setShowResetConfirm(false);
                setResetConfirmText("");
            }
        } catch (error) {
            toast.error("Reset failed");
        } finally {
            setIsResetting(false);
        }
    };

    const handleNamespaceAction = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingNamespace ? "PUT" : "POST";
        const url = editingNamespace ? `${API_URL}/translations/namespaces/${editingNamespace.id}` : `${API_URL}/translations/namespaces`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ name: newNamespaceName.toLowerCase().replace(/\s+/g, '_') }),
            });

            if (res.ok) {
                toast.success(editingNamespace ? "Library renamed" : "Library cataloged");
                setNewNamespaceName("");
                setEditingNamespace(null);
                fetchData(true);
            }
        } catch (e) {
            toast.error("Communication error");
        }
    };

    const handleBulkTranslate = async () => {
        if (!await confirm({
            title: "Bulk AI Translation",
            message: `Auto-translate all missing keys in '${selectedNamespace === 'all' ? 'All Libraries' : selectedNamespace}'? This uses AI credits.`,
            type: "warning",
            confirmText: "Sync Now",
            cancelText: "Maybe Later"
        })) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/translations/bulk-translate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ namespace: selectedNamespace }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                await fetchData(true);
            } else {
                toast.error(data.message || "Bulk translation failed");
            }
        } catch (e) {
            toast.error("Network error during bulk translation");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredKeys = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return keys.filter(compositeKey => {
            const [ns, k] = compositeKey.split(':');
            const matchNs = selectedNamespace === "all" || ns === selectedNamespace;
            const values = Object.values(translationData).map(langMap => langMap[compositeKey] || "");
            const matchSearch = k.toLowerCase().includes(q) || values.some(v => v.toLowerCase().includes(q));
            return matchNs && matchSearch;
        });
    }, [keys, searchQuery, selectedNamespace, translationData]);

    if (!isMounted) return null;

    return (
        /*
         * ROOT WRAPPER
         * - w-0 min-w-full: zero base width, expands only to fill parent. Never forces page wider.
         * - overflow-hidden: hard wall — nothing escapes this box horizontally or vertically.
         * - flex flex-col + h-full: stacks header / body vertically, fills layout height.
         */
        <div className="flex flex-col w-0 min-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 p-0 lg:p-6" style={{ height: '100%', maxHeight: '100%' }}>

            {/* ── HEADER ─────────────────────────────────────────────────────────
                shrink-0 = never squished by the table area growing.
                overflow-hidden = buttons can't push this wider than the viewport.
            */}
            <div className="shrink-0 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-6 py-5 lg:px-8 rounded-t-3xl border border-slate-200 shadow-sm">
                <div className="space-y-1.5 shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Link href="/dashboard/settings/languages">
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 text-[10px] font-black uppercase tracking-wider -ml-2 text-slate-400 hover:text-primary transition-all">
                                <ArrowLeft className="w-3 h-3" /> Core Config
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 ring-4 ring-slate-50 shrink-0">
                            <Key className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase leading-none">
                                Language <span className="text-indigo-600">Glossary</span>
                            </h1>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                                <Box className="w-3 h-3 text-indigo-400" /> UI Resource Matrix
                            </p>
                        </div>
                    </div>
                </div>

                {/* flex-wrap: buttons wrap to next line instead of pushing width */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData()}
                        className="h-11 rounded-xl bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold group"
                    >
                        <RefreshCw className="w-4 h-4 mr-2 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-xs">Refresh Grid</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={selectedNamespace === 'all'}
                        className="h-11 px-6 rounded-xl font-bold bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100 hover:border-rose-200 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        <Undo2 className="w-4 h-4 mr-2" />
                        <span className="text-xs">Reset All</span>
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleBulkTranslate}
                        disabled={submitting}
                        className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md shadow-slate-100"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2 fill-current text-amber-400" />}
                        AI Sync
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} className="h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-wider shadow-lg shadow-indigo-100 bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                        <Plus className="w-4 h-4 mr-2" /> Register Key
                    </Button>
                </div>
            </div>

            {/* ── BODY (sidebar + grid) ────────────────────────────────────────────
                flex-1 min-h-0: fills remaining height, allows shrinking below content size.
                overflow-hidden: second containment wall.
            */}
            <div className="flex-1 flex overflow-hidden border-x border-b border-slate-200 rounded-b-3xl bg-white" style={{ minHeight: 0 }}>

                {/* SIDEBAR */}
                <div className="w-64 shrink-0 border-r border-slate-200 flex flex-col overflow-hidden bg-slate-50/10">
                    <div className="bg-slate-50/50 py-3 px-6 shrink-0 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Libraries</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNamespaceModal(true)}
                                className="h-7 w-7 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-all"
                            >
                                <Tag className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setSelectedNamespace("all")}
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all group",
                                    selectedNamespace === "all"
                                        ? "bg-slate-900 shadow-lg shadow-slate-200 text-white"
                                        : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent"
                                )}
                            >
                                <span className="text-[10px] font-bold uppercase tracking-wide">Root Matrix</span>
                                <Badge className={cn("text-[9px] h-4 rounded-md font-bold border-none", selectedNamespace === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400')}>
                                    {keys.length}
                                </Badge>
                            </button>
                            {namespaces.map(ns => {
                                const count = keys.filter(k => k.startsWith(`${ns.name}:`)).length;
                                return (
                                    <button
                                        key={ns.id}
                                        onClick={() => setSelectedNamespace(ns.name)}
                                        className={cn(
                                            "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all group",
                                            selectedNamespace === ns.name
                                                ? "bg-slate-900 text-white"
                                                : "text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent"
                                        )}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-left">{ns.name}</span>
                                        {count > 0 && (
                                            <Badge variant="outline" className={cn("text-[9px] h-4 rounded-md font-bold border-none", selectedNamespace === ns.name ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400')}>
                                                {count}
                                            </Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* ── GRID AREA ──────────────────────────────────────────────────────
                    flex-1 min-w-0: fills width, but crucially min-w-0 lets it shrink
                    below content size — without this, the table pushes the column wider
                    than the viewport and the whole page overflows.
                    overflow-hidden: third containment wall.
                    flex flex-col min-h-0: enables child flex-1 to work vertically.
                */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/20 max-h-screen" style={{ minWidth: 0, minHeight: 0 }}>

                    {/* TOOLBAR — never scrolls, always visible */}
                    <div className="shrink-0 py-4 px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-8">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                            <h2 className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                                Active Grid <ChevronRight className="w-3 h-3" /> {selectedNamespace === 'all' ? 'All Namespaces' : selectedNamespace}
                            </h2>
                        </div>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <Input
                                placeholder="Locate key or translation value..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-10 pl-10 text-xs bg-white border-slate-100 rounded-xl focus:ring-4 focus:ring-slate-50 focus:border-slate-300 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    {/* THE ONLY SCROLL ZONE — h-0 + flex-1 is the key:
                        flex-1 grows to fill available space,
                        h-0 prevents it from using content height as minimum,
                        so it CANNOT grow beyond its flex parent.
                        Scrollbar stays visible at the bottom of the viewport. */}
                    <div className="flex-1 overflow-auto" style={{ height: 0 }} dir="ltr">
                        {/*
                         * min-w-full: table is at least as wide as the scroll container.
                         * NOT w-full: w-full would force-fit the table and hide columns.
                         * border-collapse:separate is required for sticky to work in tables.
                         */}
                        <table className="min-w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    {/* KEY NODE: sticky top-0 + left-0 → pinned to corner */}
                                    <th className="sticky top-0 left-0 z-[60] bg-slate-900 px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700 whitespace-nowrap shadow-[2px_0_8px_rgba(0,0,0,0.15)]">
                                        Key Node
                                    </th>
                                    {/* LANGUAGE COLS: sticky top-0 only → scroll left/right freely */}
                                    {languages.map(lang => (
                                        <th key={lang.id} className="sticky top-0 z-[40] bg-slate-900 px-8 py-4 text-center border-b border-l border-slate-700 whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-xl">{lang.flag}</span>
                                                <div className="flex flex-col items-start leading-tight">
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase">{lang.code}</div>
                                                    <div className="text-xs font-bold text-white">{lang.name}</div>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                    {/* ACTIONS: sticky top-0 + right-0 → pinned to corner */}
                                    <th className="sticky top-0 right-0 z-[60] bg-slate-900 px-4 py-4 text-center border-b border-l border-slate-700 whitespace-nowrap shadow-[-2px_0_8px_rgba(0,0,0,0.15)]">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={languages.length + 2} className="py-24 text-center bg-white">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Synchronizing Matrix...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {filteredKeys.map((compositeKey) => (
                                            <tr key={compositeKey} className="group hover:bg-slate-50/50 transition-colors">

                                                {/* KEY NODE CELL — sticky left */}
                                                <td className="sticky left-0 z-30 bg-white group-hover:bg-slate-50 px-6 py-2 border-b border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.04)] transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1 w-1 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-all shrink-0" />
                                                        {renamingKey?.oldKey === compositeKey ? (
                                                            <Input
                                                                value={renamingKey.newName}
                                                                onChange={(e) => setRenamingKey({...renamingKey, newName: e.target.value})}
                                                                onBlur={handleRenameKey}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleRenameKey();
                                                                    if (e.key === 'Escape') setRenamingKey(null);
                                                                }}
                                                                className="h-7 text-[11px] w-48 px-2 font-bold"
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex items-center gap-2 cursor-pointer"
                                                                onDoubleClick={() => setRenamingKey({oldKey: compositeKey, newName: compositeKey.split(':')[1]})}
                                                                title="Double-click to rename"
                                                            >
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded leading-none whitespace-nowrap">
                                                                    {compositeKey.split(':')[0]}
                                                                </span>
                                                                <code className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition-colors whitespace-nowrap">
                                                                    {compositeKey.split(':')[1]}
                                                                </code>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* LANGUAGE CELLS */}
                                                {languages.map(lang => {
                                                    const rawValue = translationData[lang.code]?.[compositeKey];
                                                    const value = typeof rawValue === 'object' ? JSON.stringify(rawValue) : (rawValue || "");
                                                    return (
                                                        <td key={lang.id} className="p-0 border-b border-l border-slate-100 bg-white">
                                                            <textarea
                                                                className={cn(
                                                                    "w-[250px] min-h-[60px] p-3 text-xs bg-transparent border-none outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-100 resize-none transition-all placeholder:text-[9px] placeholder:font-bold placeholder:uppercase placeholder:text-slate-300",
                                                                    !value && "bg-amber-50/10"
                                                                )}
                                                                placeholder={`missing ${lang.name}`}
                                                                value={value}
                                                                onChange={(e) => {
                                                                    const newVal = e.target.value;
                                                                    setTranslationData(prev => ({
                                                                        ...prev,
                                                                        [lang.code]: { ...prev[lang.code], [compositeKey]: newVal }
                                                                    }));
                                                                }}
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== value) {
                                                                        handleUpdateTranslation(lang.code, compositeKey, e.target.value);
                                                                    }
                                                                }}
                                                                dir={lang.isRtl ? "rtl" : "ltr"}
                                                            />
                                                        </td>
                                                    );
                                                })}

                                                {/* ACTIONS CELL — sticky right */}
                                                <td className="sticky right-0 z-30 bg-white group-hover:bg-slate-50 px-3 py-2 border-b border-l border-slate-100 shadow-[-2px_0_5px_rgba(0,0,0,0.04)] text-center transition-colors">
                                                    <div className="flex flex-col gap-1 items-center justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            disabled={isTranslatingRow === compositeKey}
                                                            onClick={() => handleTranslateSingleKey(compositeKey)}
                                                            className={cn(
                                                                "h-7 w-7 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all",
                                                                isTranslatingRow === compositeKey && "animate-pulse bg-indigo-50"
                                                            )}
                                                            title="AI Translate Row"
                                                        >
                                                            {isTranslatingRow === compositeKey
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : <Sparkles className="w-3.5 h-3.5" />
                                                            }
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteKey(compositeKey)}
                                                            className="h-7 w-7 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            title="Delete Key"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredKeys.length === 0 && (
                                            <tr>
                                                <td colSpan={languages.length + 2} className="py-24 text-center bg-white">
                                                    <div className="flex flex-col items-center justify-center space-y-5">
                                                        <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                                            <Search className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <div className="space-y-1.5 text-center">
                                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider leading-none">Isolated Matrix</h3>
                                                            <p className="text-xs text-slate-400 font-medium italic">No active nodes match your search criteria.</p>
                                                        </div>
                                                        <Button variant="outline" onClick={() => setSearchQuery("")} className="h-9 px-6 rounded-lg font-bold text-[10px] uppercase tracking-wider border-slate-200 hover:bg-slate-50 transition-all shadow-sm">Reset Search</Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals — unchanged */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-600" /> Register New Key
                        </DialogTitle>
                        <DialogDescription>Add a new localization token. It will be auto-translated into all active languages.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddKey} className="space-y-5 py-2">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">UI Namespace</Label>
                                <Select
                                    value={formData.namespace}
                                    onValueChange={(val: string) => setFormData({...formData, namespace: val})}
                                    required
                                >
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                        <SelectValue placeholder="Select UI Module" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 shadow-xl font-bold uppercase text-[10px]">
                                        {namespaces.map(ns => <SelectItem key={ns.id} value={ns.name}>{ns.name.toUpperCase()}</SelectItem>)}
                                    <SelectSeparator />
                                    <Button
                                            variant="ghost"
                                            className="w-full text-xs font-bold uppercase text-indigo-600 h-10 justify-start px-2 hover:bg-indigo-50 transition-all"
                                            onClick={(e) => { e.preventDefault(); setShowAddModal(false); setShowNamespaceModal(true); }}
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" /> New Namespace
                                        </Button>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Key Locator</Label>
                                <Input
                                    placeholder="e.g. login_welcome_message"
                                    value={formData.key}
                                    onChange={e => setFormData({...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                                    required
                                    className="h-11 bg-slate-50 border-slate-200 rounded-xl shadow-inner-sm text-xs font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Default English Content</Label>
                                <textarea
                                    className="w-full min-h-[100px] p-4 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-slate-50 transition-all"
                                    placeholder="The default text to be displayed and used as base for auto-translations..."
                                    value={formData.value}
                                    onChange={e => setFormData({...formData, value: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t gap-2">
                            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="px-6 text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={submitting} className="px-8 shadow-lg shadow-indigo-100 bg-indigo-600 text-white hover:bg-indigo-700 transition-all rounded-xl font-bold uppercase text-[10px] tracking-wider">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Register & Sync
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <Undo2 className="w-5 h-5" /> Hard Reset Translations
                        </DialogTitle>
                        <DialogDescription>
                            This will **permanently delete** all existing translations for the <span className="font-bold text-slate-900">"{selectedNamespace}"</span> group (except English) and re-generate them using AI.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                             <p className="text-[11px] font-bold uppercase text-rose-400 tracking-wider">Verification Required</p>
                             <p className="text-sm text-rose-700 font-medium leading-relaxed">Please type <span className="font-bold underline">OK</span> below to proceed with this destructive action.</p>
                        </div>
                        <Input
                            placeholder="Type OK here..."
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            className="h-12 text-center text-lg font-bold border-rose-200 focus:ring-rose-100 rounded-xl uppercase tracking-widest bg-rose-50/20"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4 pt-4 border-t">
                        <Button variant="ghost" onClick={() => setShowResetConfirm(false)} className="flex-1 font-bold text-xs uppercase text-slate-400 rounded-xl">Abort</Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetAll}
                            disabled={isResetting || resetConfirmText !== "OK"}
                            className="flex-1 shadow-lg shadow-rose-100 rounded-xl font-bold uppercase text-[10px] tracking-wider"
                        >
                            {isResetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Confirm Reset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showNamespaceModal} onOpenChange={setShowNamespaceModal}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 uppercase tracking-tight font-bold text-slate-400 text-xs">
                            <Tag className="w-4 h-4 text-indigo-600" /> Manage Localization Groups
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4 text-left">
                        <form onSubmit={handleNamespaceAction} className="flex gap-2 p-1 bg-slate-100 rounded-2xl ring-4 ring-slate-50 transition-all focus-within:ring-slate-100">
                            <Input
                                placeholder={editingNamespace ? "Update name..." : "New group name (e.g. checkout)"}
                                value={newNamespaceName}
                                onChange={e => setNewNamespaceName(e.target.value)}
                                className="flex-1 bg-white border-none shadow-none focus-visible:ring-0 text-xs font-bold h-10 px-4 rounded-xl"
                            />
                            <Button type="submit" size="icon" className="shrink-0 rounded-xl shadow-lg shadow-slate-200 bg-slate-900 text-white hover:bg-slate-800 h-10 w-10">
                                {editingNamespace ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </form>
                        <ScrollArea className="max-h-[300px] border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-inner-sm">
                            <div className="divide-y divide-slate-50">
                                {namespaces.map(ns => (
                                    <div key={ns.id} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-50 transition-all">
                                                <Tag className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{ns.name}</span>
                                                <span className="text-[9px] font-medium text-slate-400">{keys.filter(k => k.startsWith(`${ns.name}:`)).length || 0} nodes defined</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                onClick={() => { setEditingNamespace(ns); setNewNamespaceName(ns.name); }}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button variant="ghost" onClick={() => setShowNamespaceModal(false)} className="w-full text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] hover:text-slate-500 transition-all">Exit Group Manager</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}