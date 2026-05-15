'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExpenseCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expense Categories</h1>
        <p className="text-muted-foreground">Define categories for your operational expenses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Expense categories will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
