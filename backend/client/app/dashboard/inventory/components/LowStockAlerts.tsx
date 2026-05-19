'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, PackageX, Loader2, Package } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function LowStockAlerts() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || '';

  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api';
        const res = await fetch(`${apiUrl}/inventory/low-stock`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          setAlerts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch low stock alerts', error);
        toast.error('Failed to load low stock alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyzing inventory levels...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
          <Package className="h-8 w-8" />
        </div>
        <div>
           <h3 className="text-lg font-bold text-slate-900">Inventory is Healthy</h3>
           <p className="text-sm text-slate-500 max-w-[240px] mx-auto mt-1">All products are currently above their minimum stock thresholds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {alerts.map((item) => (
          <div
            key={`${item.id}-${item.variantId || 'base'}`}
            className="group relative bg-white p-4 rounded-2xl border border-slate-200/60 transition-all hover:shadow-sm hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                     <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                     <Badge variant="outline" className={`h-5 text-[10px] font-bold uppercase tracking-widest border-none ${
                        item.stock === 0 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                     }`}>
                        {item.stock === 0 ? 'Empty' : 'Critical'}
                     </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU: {item.sku || 'N/A'}</span>
                     {item.category && (
                        <>
                           <span className="text-slate-200">•</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</span>
                        </>
                     )}
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-xl font-black text-slate-900">
                     {item.stock}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                     Min: {item.minStockLevel || 5}
                  </div>
               </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
               <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
               </div>
               <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50" asChild>
                  <Link href={`/dashboard/products?search=${item.sku}`}>
                     Manage Stock <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
               </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-6 bg-slate-50 border-t border-slate-200/60">
         <Button className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-12 font-bold uppercase tracking-widest text-xs shadow-lg" asChild>
            <Link href="/dashboard/purchases/create">
               Create Purchase Order
            </Link>
         </Button>
      </div>
    </div>
  );
}
