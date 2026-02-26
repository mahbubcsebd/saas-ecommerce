"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, PackageX } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LowStockAlerts() {
    const { data: session } = useSession();
    const token = (session as any)?.accessToken || "";

    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchLowStock = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
                const res = await fetch(`${apiUrl}/inventory/low-stock`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    setAlerts(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch low stock alerts", error);
                toast.error("Failed to load low stock alerts");
            } finally {
                setLoading(false);
            }
        };

        fetchLowStock();
    }, [token]);

    if (loading) {
        return (
            <Card className="border-red-100 shadow-sm animate-pulse h-[300px]">
                <CardHeader className="bg-red-50/50 pb-4">
                    <CardTitle className="text-red-800 flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                        Low Stock Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center text-muted-foreground">
                    Checking inventory levels...
                </CardContent>
            </Card>
        );
    }

    if (alerts.length === 0) {
        return (
            <Card className="border-green-100 shadow-sm">
                <CardHeader className="bg-green-50/50 pb-4">
                    <CardTitle className="text-green-800 flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-green-600" />
                        Low Stock Alerts
                    </CardTitle>
                    <CardDescription>Items running below minimum threshold</CardDescription>
                </CardHeader>
                <CardContent className="p-12 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <PackageX className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-1">Inventory is Healthy</h3>
                    <p className="text-sm text-slate-500">All products are currently above their minimum stock thresholds.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-red-200 shadow-sm overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-red-50 pb-4 border-b border-red-100">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-red-800 flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                            Low Stock Alerts
                        </CardTitle>
                        <CardDescription className="text-red-600/80 mt-1">
                            {alerts.length} item{alerts.length !== 1 && 's'} need restock
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-white border-red-200 hover:bg-red-50 text-red-700">
                        <Link href="/dashboard/purchases/create">
                            Reorder <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[400px]">
                <div className="divide-y divide-slate-100">
                    {alerts.map((item, idx) => (
                        <div key={`${item.id}-${item.variantId || 'base'}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex-1 pr-4">
                                <h4 className="font-medium text-slate-900 line-clamp-1" title={item.name}>
                                    {item.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500 font-mono">SKU: {item.sku || 'N/A'}</span>
                                    {item.category && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{item.category}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold flex items-center justify-end gap-1">
                                    <span className={item.stock === 0 ? "text-red-600" : "text-orange-500"}>
                                        {item.stock}
                                    </span>
                                    <span className="text-xs text-slate-400 font-normal">/ {item.minStockLevel || 5} min</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${item.stock === 0 ? "text-red-600" : "text-orange-500"}`}>
                                    {item.stock === 0 ? "Out of Stock" : "Low Stock"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
