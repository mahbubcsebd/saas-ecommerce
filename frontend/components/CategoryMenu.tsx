import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useSettings } from "@/context/SettingsContext"
import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function CategoryMenu() {
    const { settings } = useSettings();
    const [categories, setCategories] = useState<any[]>([]);
    const shopType = settings?.general?.shopType || "GADGET";

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
                const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
                const res = await fetch(`${apiUrl}/categories`);
                const data = await res.json();
                if (data.success) {
                    // Filter root categories (parentId is null)
                    const rootCategories = data.data.filter((c: any) => !c.parentId);
                    // Sort by order if available
                    rootCategories.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
                    setCategories(rootCategories);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();
    }, []);

    // --- GADGET STYLE (Star Tech) ---
    const renderGadgetSubCategory = (category: any) => {
        if (category.children && category.children.length > 0) {
            return (
                <DropdownMenuSub key={category.id}>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                        <span>{category.name}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem asChild>
                            <Link href={`/${category.slug}`} className="font-semibold cursor-pointer w-full">
                                All {category.name}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {category.children.map((child: any) => renderGadgetSubCategory(child))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            )
        }
        return (
            <DropdownMenuItem key={category.id} asChild>
                <Link href={`/${category.slug}`} className="cursor-pointer w-full">
                    {category.name}
                </Link>
            </DropdownMenuItem>
        )
    }

    const GadgetMenu = () => (
        <div className="flex items-center gap-1">
            {categories.slice(0, 8).map((category) => (
                <div key={category.id}>
                    {category.children && category.children.length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 px-4 py-2 hover:bg-transparent hover:text-primary font-medium">
                                    {category.name}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link href={`/${category.slug}`} className="font-bold w-full cursor-pointer">
                                        All {category.name}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {category.children.map((child: any) => renderGadgetSubCategory(child))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild variant="ghost" className="h-9 px-4 py-2 hover:bg-transparent hover:text-primary font-medium">
                            <Link href={`/${category.slug}`}>
                                {category.name}
                            </Link>
                        </Button>
                    )}
                </div>
            ))}
            {categories.length > 8 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 px-4 py-2 hover:bg-transparent hover:text-primary font-medium">
                            More <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {categories.slice(8).map(renderGadgetSubCategory)}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );

    // --- CLOTHING STYLE (Aarong / Mega Menu) ---
    const ClothingMenu = () => {
        return (
            <div className="flex items-center gap-6">
                {categories.slice(0, 7).map((category) => (
                    <div key={category.id} className="group relative">
                        <Link
                            href={`/${category.slug}`}
                            className="text-sm font-medium uppercase tracking-wide hover:text-primary py-4 block"
                        >
                            {category.name}
                        </Link>

                        {/* Mega Menu Dropdown */}
                        {category.children && category.children.length > 0 && (
                            <div className="absolute top-full left-0 w-[600px] bg-background border shadow-lg rounded-b-md p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 grid grid-cols-3 gap-6">
                                {category.children.map((child: any) => (
                                    <div key={child.id} className="flex flex-col gap-2">
                                        <Link href={`/${child.slug}`} className="font-bold text-sm hover:underline">
                                            {child.name}
                                        </Link>
                                        <div className="flex flex-col gap-1 pl-0">
                                            {child.children?.map((sub: any) => (
                                                <Link
                                                    key={sub.id}
                                                    href={`/${sub.slug}`}
                                                    className="text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    };

    if (categories.length === 0) return null;

    return shopType === "CLOTHING" ? <ClothingMenu /> : <GadgetMenu />;
}
