import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cn } from '@/lib/utils';
import { ExternalLink, Info, RotateCcw } from 'lucide-react';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getReturns(accessToken: string) {
  try {
    const res = await fetch(`${API_URL}/returns`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error('Failed to fetch returns');
    return (await res.json()).data;
  } catch (error) {
    console.error('Returns fetch error:', error);
    return [];
  }
}

export default async function ReturnsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile/returns');
  }

  const returns = await getReturns(session.accessToken as string);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Returns & Exchanges
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Track your return requests and manage replacements.
          </p>
        </div>

        <Link
          href="/profile/orders"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-all"
        >
          New Return Request
        </Link>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-6 rounded-2xl flex gap-4">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Return Policy</p>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400 leading-relaxed">
            You can request a return within 7 days of delivery for eligible items. Items must be in
            their original condition with tags and packaging.
          </p>
        </div>
      </div>

      {/* Returns List */}
      <div className="space-y-6">
        {returns.length > 0 ? (
          returns.map((request: any) => (
            <div
              key={request.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {request.rmaId}
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-right">
                    <div className="hidden md:block">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Refund Amount
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        ৳{request.amount?.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
                        request.status === 'REFUNDED'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : request.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                      )}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Item Info
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {request.productName} (Qty: {request.quantity})
                    </p>
                  </div>
                  <Link
                    href={`/profile/orders/${request.orderId}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group"
                  >
                    View Original Order{' '}
                    <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>

                {request.reason && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium">" {request.reason} "</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                No Returns Found
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                You haven't requested any returns yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
