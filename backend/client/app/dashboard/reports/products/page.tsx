import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import ProductReportClient from './client';

export const metadata = {
    title: 'Product Reports | Mahbub Shop',
    description: 'Detailed product performance and stock analysis',
};

export default function ProductReportsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <ProductReportClient />
            </Suspense>
        </div>
    );
}
