'use client';

import { DashboardAI } from '@/components/ai/DashboardAI';

export default function AIDashboardPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
            </div>
            <DashboardAI />
        </div>
    );
}
