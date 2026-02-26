'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, MousePointerClick, Target, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function LandingPageAnalytics({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/landing-pages/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
       <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Compiling Data...</p>
       </div>
    );
  }

  const conversionRate = analytics?.conversionRate || 0;
  const page = analytics?.page || {};

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link href="/dashboard/landing-pages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{page.title}</h1>
          <p className="text-slate-500 font-medium">Performance metrics and funnel insights</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
             <Eye className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Views</p>
          <div className="text-3xl font-black text-slate-900">
            {page.viewCount?.toLocaleString() || 0}
          </div>
          <div className="mt-4 flex items-center text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-full">
             +12.5% vs last week
          </div>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
             <Target className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Conversions</p>
          <div className="text-3xl font-black text-slate-900">
            {page.orderCount?.toLocaleString() || 0}
          </div>
           <div className="mt-4 flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-full">
             Conversion goal active
          </div>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <TrendingUp className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Conversion Rate</p>
          <div className="text-3xl font-black text-white">
            {conversionRate.toFixed(2)}%
          </div>
          <div className="mt-4 flex items-center text-[10px] font-bold text-orange-400 bg-white/10 w-fit px-2 py-1 rounded-full">
             High performance
          </div>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-6 bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-6 opacity-5">
             <MousePointerClick className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Events</p>
          <div className="text-3xl font-black text-slate-900">
            {analytics?.totalEvents?.toLocaleString() || 0}
          </div>
          <div className="mt-4 flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 w-fit px-2 py-1 rounded-full">
             Event tracking live
          </div>
        </Card>
      </div>

      {/* Event Breakdown */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b p-6">
          <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Event Analysis</CardTitle>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactions over time</p>
        </CardHeader>
        <CardContent className="p-8">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics?.eventCounts || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="event"
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 10, fontWeight: 900, fill: '#94A3B8'}}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 10, fontWeight: 900, fill: '#94A3B8'}}
              />
              <Tooltip
                cursor={{fill: '#F8FAF8'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="_count" fill="#f97316" radius={[8, 8, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
