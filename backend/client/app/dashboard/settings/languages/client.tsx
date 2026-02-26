'use client';

import { useConfirm } from '@/hooks/use-confirm';
import {
    ArrowLeft,
    CheckCircle2,
    Edit,
    Globe,
    Key,
    Languages,
    Loader2,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Language {
    id: string;
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    isDefault: boolean;
    isActive: boolean;
    isRtl: boolean;
}

const PREDEFINED_LANGUAGES = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", isRtl: false },
    { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", isRtl: false },
    { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", isRtl: false },
    { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", isRtl: false },
    { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", isRtl: false },
    { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", isRtl: true },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", isRtl: false },
    { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", isRtl: false },
    { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", isRtl: false },
    { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", isRtl: false },
    { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", isRtl: false },
    { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", isRtl: false },
    { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", isRtl: false },
    { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", isRtl: false },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", isRtl: false },
    { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", isRtl: false },
    { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", isRtl: false },
    { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", isRtl: false },
    { code: "fa", name: "Persian", nativeName: "فারসী", flag: "🇮🇷", isRtl: true },
    { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", isRtl: true },
];

export default function LanguageSettingsClient() {
    const { confirm } = useConfirm();
    const { data: session } = useSession();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLang, setSelectedLang] = useState<Language | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

    const fetchData = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/languages`, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                setLanguages(data.data || []);
            }
        } catch (error) {
            toast.error('Failed to load languages');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.accessToken) fetchData();
    }, [session?.accessToken]);

    const handleToggleActive = async (id: string, currentState: boolean) => {
        setLanguages(prev => prev.map(l => l.id === id ? { ...l, isActive: !currentState } : l));
        try {
            const res = await fetch(`${API_URL}/languages/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ isActive: !currentState }),
            });
            if (!res.ok) throw new Error();
            toast.success("Status updated");
        } catch (e) {
            setLanguages(prev => prev.map(l => l.id === id ? { ...l, isActive: currentState } : l));
            toast.error("Update failed");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/languages/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({ isDefault: true, isActive: true }),
            });
            if (res.ok) {
                toast.success("Default language updated");
                fetchData();
            } else {
                throw new Error();
            }
        } catch (e) {
            toast.error("Failed to update default");
        }
    };

    const handleAddLanguage = async (lang: any) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/languages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(lang),
            });
            if (res.ok) {
                toast.success(`${lang.name} added. Auto-translation started in background.`);
                fetchData();
                setShowAddModal(false);
            } else {
                const error = await res.json();
                toast.error(error.message || "Failed to add language");
            }
        } catch (e) {
            toast.error("Communication error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateLanguage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLang) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/languages/${selectedLang.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({
                    name: selectedLang.name,
                    nativeName: selectedLang.nativeName,
                    flag: selectedLang.flag,
                    isRtl: selectedLang.isRtl
                }),
            });
            if (res.ok) {
                toast.success("Language details updated");
                fetchData();
                setShowEditModal(false);
            } else {
                toast.error("Update failed");
            }
        } catch (e) {
            toast.error("Communication error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({
            title: 'Delete Language',
            message: 'Are you sure you want to delete this language profile? This will permanently remove all associated translations.',
            type: 'danger',
            confirmText: 'Delete Language'
        })) return;
        try {
            const res = await fetch(`${API_URL}/languages/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
            });
            if (res.ok) {
                toast.success("Language deleted");
                setLanguages(prev => prev.filter(l => l.id !== id));
            } else {
                const err = await res.json();
                toast.error(err.message || "Delete failed");
            }
        } catch (e) {
            toast.error("Failed to reach server");
        }
    };

    const availablePredefined = PREDEFINED_LANGUAGES.filter(
        pre => !languages.some(l => l.code === pre.code)
    ).filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Synchronizing Language Matrix...</p>
            </div>
        );
    }

    return (
        <div className="p-0 lg:p-6 max-w-7xl mx-auto space-y-8">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm shrink-0">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-3">
                        <Link href="/dashboard/settings">
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1.5 text-[10px] font-bold uppercase tracking-wider -ml-2 text-slate-400 hover:text-primary transition-all">
                                <ArrowLeft className="w-3 h-3" /> System
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100">
                             <Languages className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase leading-none">
                                Language <span className="text-indigo-600">Settings</span>
                            </h1>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
                                <Globe className="w-3 h-3 text-indigo-400" /> Global Localization Hub
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/dashboard/settings/languages/keys">
                        <Button variant="outline" className="h-12 px-6 rounded-xl bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold group">
                            <Key className="w-4 h-4 mr-2 text-indigo-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs uppercase tracking-wider font-bold">Manage Keys</span>
                        </Button>
                    </Link>
                    <Button onClick={() => setShowAddModal(true)} className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-wider shadow-xl shadow-indigo-50 bg-slate-900 hover:bg-slate-800 border-none transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-4 h-4 mr-2" /> Add Language
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="shadow-sm border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border shadow-sm">
                                    <Globe className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold">Active Profiles</CardTitle>
                                    <CardDescription className="text-xs">Locally activated languages for your storefront.</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={fetchData} className="text-slate-400">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/30 border-b text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Language Profile</th>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4 text-center">RTL</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {languages.map((lang) => (
                                        <tr key={lang.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{lang.flag}</span>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                            {lang.name}
                                                            {lang.isDefault && (
                                                                <Badge className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20 font-bold px-1.5 uppercase">Primary</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{lang.nativeName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs px-2 py-0.5 bg-slate-100 rounded font-mono text-slate-600">{lang.code}</code>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {lang.isRtl ? (
                                                    <Badge variant="outline" className="text-[9px] border-purple-200 bg-purple-50 text-purple-600 font-bold px-2">RTL</Badge>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Switch
                                                    checked={lang.isActive}
                                                    onCheckedChange={() => handleToggleActive(lang.id, lang.isActive)}
                                                    disabled={lang.isDefault}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Language Options</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => { setSelectedLang(lang); setShowEditModal(true); }}>
                                                            <Edit className="w-4 h-4 mr-2" /> Edit Profile
                                                        </DropdownMenuItem>
                                                        <Link href={`/dashboard/settings/languages/${lang.code}`}>
                                                            <DropdownMenuItem>
                                                                <Languages className="w-4 h-4 mr-2" /> Translate UI
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        {!lang.isDefault && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleSetDefault(lang.id)} className="text-primary font-bold">
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Set as Default
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDelete(lang.id)} className="text-destructive font-bold">
                                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>Add New Language</DialogTitle>
                        <DialogDescription>Select from available system languages to activate.</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 border-b bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-white"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto p-4 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availablePredefined.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleAddLanguage(lang)}
                                disabled={isSubmitting}
                                className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all text-left group disabled:opacity-50"
                            >
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-colors">{lang.flag}</span>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{lang.name}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{lang.nativeName} • {lang.code}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-primary">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                </div>
                            </button>
                        ))}
                    </div>
                    <DialogFooter className="p-6 border-t bg-slate-50/50">
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Language Profile</DialogTitle>
                        <DialogDescription>Update metadata and regional settings for {selectedLang?.name}.</DialogDescription>
                    </DialogHeader>
                    {selectedLang && (
                        <form onSubmit={handleUpdateLanguage} className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Public Name</Label>
                                    <Input
                                        value={selectedLang.name}
                                        onChange={e => setSelectedLang({...selectedLang, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Native Title</Label>
                                    <Input
                                        value={selectedLang.nativeName}
                                        onChange={e => setSelectedLang({...selectedLang, nativeName: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Emoji Flag</Label>
                                    <Input
                                        value={selectedLang.flag}
                                        onChange={e => setSelectedLang({...selectedLang, flag: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase">Text Direction</Label>
                                    <div className="flex items-center gap-3 pt-2">
                                        <Switch
                                            checked={selectedLang.isRtl}
                                            onCheckedChange={val => setSelectedLang({...selectedLang, isRtl: val})}
                                        />
                                        <span className="text-xs font-medium text-slate-600 uppercase">RTL Support</span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Apply Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
