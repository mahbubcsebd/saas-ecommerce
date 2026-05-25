'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Banknote,
  Plus,
  Search,
  Trash2,
  Loader2,
  Calendar,
  Filter,
  Receipt,
  FileText,
} from 'lucide-react';

import { useConfirm } from '@/hooks/use-confirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { fetchApiClient } from '@/lib/api-client';

interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  category: {
    name: string;
  };
  date: string;
  reference?: string | null;
  notes?: string | null;
  recordedBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface ExpenseFormData {
  title: string;
  amount: string;
  categoryId: string;
  date: string;
  reference: string;
  notes: string;
}

export default function ExpensesPage() {
  const { confirm } = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Total summary from metadata
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    amount: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await fetchApiClient<{ success: boolean; data: ExpenseCategory[] }>('/expenses/categories');
      if (res.success) {
        // Only active categories can be mapped to new expenses
        setCategories(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchQuery) query.append('search', searchQuery);
      if (selectedCategory) query.append('categoryId', selectedCategory);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      query.append('limit', '100'); // Retrieve extensive list

      const res = await fetchApiClient<{
        success: boolean;
        data: Expense[];
        meta?: { totalAmount: number; total: number };
      }>(`/expenses?${query.toString()}`);

      if (res.success) {
        setExpenses(res.data || []);
        setTotalAmount(res.meta?.totalAmount || 0);
        setTotalRecords(res.meta?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to retrieve operational expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [searchQuery, selectedCategory, startDate, endDate]);

  const openCreateModal = () => {
    const activeCategories = categories.filter((c) => c.isActive);
    setFormData({
      title: '',
      amount: '',
      categoryId: activeCategories.length > 0 ? activeCategories[0].id : '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select a category.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchApiClient<{ success: boolean }>('/expenses', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setShowModal(false);
        fetchExpenses();
        toast.success('Expense recorded successfully!');
      }
    } catch (error: any) {
      console.error('Record expense error:', error);
      toast.error(error.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: 'Delete Expense Log',
        message: 'Are you sure you want to delete this expense record? This action is permanent and cannot be undone.',
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }))
    )
      return;

    try {
      const res = await fetchApiClient<{ success: boolean }>(`/expenses/${id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        fetchExpenses();
        toast.success('Expense record deleted successfully.');
      }
    } catch (error: any) {
      console.error('Delete expense error:', error);
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Banknote className="h-6 w-6" />
            </div>
            Operational Expenses
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and log day-to-day operational business expenses.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto font-semibold" disabled={activeCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Record Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden bg-white dark:bg-slate-950">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-500">Total Operational Cost</p>
              <h2 className="text-3xl font-extrabold text-red-600 dark:text-red-500">
                ৳ {totalAmount.toLocaleString()}
              </h2>
            </div>
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl">
              <Banknote className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden bg-white dark:bg-slate-950">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-500">Total Expense Logs</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalRecords} Record{totalRecords !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Receipt className="h-7 w-7" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-950 p-4 border rounded-xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filter Expenses
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">Search Title / Ref</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">Category</Label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 border rounded-xl p-16 text-center space-y-4 shadow-sm">
          <Receipt className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Expense Logs Found</h3>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            {searchQuery || selectedCategory || startDate || endDate
              ? 'No expense logs match your filter criteria. Reset parameters to find matches.'
              : 'Add your first operational expense to track and analyze your operational costs.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="hidden lg:table-cell">Reference</TableHead>
                <TableHead className="hidden md:table-cell">Recorded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    <div className="max-w-[180px] sm:max-w-xs truncate" title={e.title}>
                      {e.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                      {e.category?.name || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-red-600 dark:text-red-500">
                    ৳ {e.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(e.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-slate-500 font-mono">
                    {e.reference || '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500">
                    {e.recordedBy?.firstName} {e.recordedBy?.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(e.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50"
                      title="Delete Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Record Expense Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Operational Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="title">Expense Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Electric bill April"
                  required
                />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="amount">Amount (৳) <span className="text-red-500">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 4500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Expense Category <span className="text-red-500">*</span></Label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Expense Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference # (Receipt/Invoice ID)</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g. INV-2026-908"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes regarding the expense payment..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...
                  </>
                ) : (
                  'Record Expense'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
