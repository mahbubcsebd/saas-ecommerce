'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
} from 'lucide-react';

import { useConfirm } from '@/hooks/use-confirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import { fetchApiClient } from '@/lib/api-client';

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    expenses: number;
  };
}

interface CategoryFormData {
  id?: string;
  name: string;
  description: string;
  isActive: boolean;
}

export default function ExpenseCategoriesPage() {
  const { alert, confirm } = useConfirm();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetchApiClient<{ success: boolean; data: ExpenseCategory[] }>('/expenses/categories');
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch expense categories:', error);
      toast.error('Failed to retrieve expense categories listing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category name is required.');
      return;
    }

    setSaving(true);
    try {
      const url = formData.id ? `/expenses/categories/${formData.id}` : '/expenses/categories';
      const method = formData.id ? 'PUT' : 'POST';

      const res = await fetchApiClient<{ success: boolean; message?: string }>(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setShowModal(false);
        fetchCategories();
        toast.success(formData.id ? 'Expense category updated!' : 'Expense category created!');
      }
    } catch (error: any) {
      console.error('Save category error:', error);
      toast.error(error.message || 'Failed to save expense category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const hasExpenses = categories.find((c) => c.id === id)?._count?.expenses || 0;
    if (hasExpenses > 0) {
      await alert({
        title: 'Cannot Delete Category',
        message: 'This category is currently mapped to existing expense records and cannot be deleted.',
        type: 'warning',
      });
      return;
    }

    if (
      !(await confirm({
        title: 'Delete Expense Category',
        message: 'Are you sure you want to delete this category? This action is permanent and cannot be undone.',
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }))
    )
      return;

    try {
      const res = await fetchApiClient<{ success: boolean }>(`/expenses/categories/${id}`, {
        method: 'DELETE',
      });

      if (res.success) {
        fetchCategories();
        toast.success('Expense category deleted successfully.');
      }
    } catch (error: any) {
      console.error('Delete category error:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const handleToggleStatus = async (category: ExpenseCategory) => {
    try {
      const res = await fetchApiClient<{ success: boolean }>(`/expenses/categories/${category.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          isActive: !category.isActive,
        }),
      });

      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c))
        );
        toast.success(`Category ${category.name} is now ${!category.isActive ? 'Active' : 'Inactive'}`);
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error('Failed to toggle category status');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-slate-900 rounded-lg text-indigo-600 dark:text-indigo-400">
              <FolderTree className="h-6 w-6" />
            </div>
            Expense Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Define categories for tracking your business operational expenses.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto font-semibold">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 border rounded-xl p-12 text-center space-y-4 shadow-sm">
          <FolderTree className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Categories Found</h3>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            {searchQuery
              ? 'No categories match your search term. Try another query.'
              : 'Add your first operational expense category to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    {c.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-slate-500 max-w-xs truncate">
                    {c.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-[10px]">
                      {c.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(c)}
                        className="h-8 w-8 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(c)}
                        className={`h-8 w-8 ${c.isActive ? 'text-green-500 hover:bg-green-50/50' : 'text-slate-400 hover:bg-slate-100/50'}`}
                        title={c.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {c.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-650 hover:bg-red-50/50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Save Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Edit Expense Category' : 'Add Expense Category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Office rent, Utilities, Salaries"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of operational costs covered"
                rows={3}
              />
            </div>
            {formData.id && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="font-semibold text-sm">Status</Label>
                  <p className="text-xs text-muted-foreground">Toggle to enable/disable category</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            )}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Category'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
