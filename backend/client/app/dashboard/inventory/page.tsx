"use client";

import LowStockAlerts from "@/app/dashboard/inventory/components/LowStockAlerts";
import { DamageReportModal } from "@/components/inventory/DamageReportModal";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { StockHistoryModal } from "@/components/inventory/StockHistoryModal";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { ProductService } from "@/services/product.service";
import { AlertCircle, AlertTriangle, Edit, Eye, History, Package, PackagePlus, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  images: string[];
  stock: number;
  category: {
    name: string;
  };
  variants: ProductVariant[];
}

export default function InventoryPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [summary, setSummary] = useState({
      totalProducts: 0,
      outOfStock: 0,
      lowStock: 0
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modals state
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [selectedItemForHistory, setSelectedItemForHistory] = useState<InventoryItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedItemForDamage, setSelectedItemForDamage] = useState<InventoryItem | null>(null);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) queryParams.append("search", searchTerm);
      if (statusFilter) queryParams.append("status", statusFilter);

      const res = await fetch(`${API_URL}/inventory?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.data);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchInventory();
    }
  }, [session, page, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (session?.accessToken) {
        setPage(1);
        fetchInventory();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: "Out of Stock", class: "bg-red-100 text-red-800 border-red-200" };
    if (stock <= 10) return { label: "Low Stock", class: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    return { label: "In Stock", class: "bg-green-100 text-green-800 border-green-200" };
  };

  const handleAdjustClick = (item: InventoryItem) => {
    setSelectedItemForAdjust(item);
    setIsAdjustModalOpen(true);
  };

  const handleHistoryClick = (item: InventoryItem) => {
    setSelectedItemForHistory(item);
    setIsHistoryModalOpen(true);
  };

  const handleDamageClick = (item: InventoryItem) => {
    setSelectedItemForDamage(item);
    setIsDamageModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Monitor stock levels and manage product inventory</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="bg-white" asChild>
                <Link href="/dashboard/inventory/movements">
                    <History className="mr-2 h-4 w-4" /> Movement Logs
                </Link>
            </Button>
            <Button asChild>
                <Link href="/dashboard/products/create">
                    <PackagePlus className="mr-2 h-4 w-4" /> Add Product
                </Link>
            </Button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-white p-5 rounded-lg border shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500">Total Products</p>
               <div className="flex items-center gap-2">
                   <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalProducts}</p>
                   <Link href="/dashboard/inventory/movements" className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1">
                      <History className="w-3 h-3" /> View Logs
                   </Link>
               </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Package className="w-6 h-6" />
            </div>
         </div>
         <div className="bg-white p-5 rounded-lg border shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500">Low Stock Alert</p>
               <div className="flex items-center gap-2">
                   <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.lowStock}</p>
                   <a href="#alerts" className="text-xs text-blue-600 hover:underline mt-2">View Details</a>
               </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
               <AlertCircle className="w-6 h-6" />
            </div>
         </div>
         <div className="bg-white p-5 rounded-lg border shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500">Out of Stock</p>
               <p className="text-2xl font-bold text-red-600 mt-1">{summary.outOfStock}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
               <XCircle className="w-6 h-6" />
            </div>
         </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[150px]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Low Stock Alerts and Inventory Table Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Low Stock Alerts Sidebar/Top widget */}
          <div className="xl:col-span-1" id="alerts">
              <LowStockAlerts />
          </div>

          <div className="xl:col-span-3">
            {/* Inventory Table */}
            <div className="rounded-md border bg-white overflow-hidden shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 uppercase text-xs font-semibold text-gray-600">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const totalStock = item.variants.length > 0
                  ? item.variants.reduce((acc, v) => acc + v.stock, 0)
                  : item.stock;

                const status = getStockStatus(totalStock);

                return (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.images?.[0] ? (
                          <div className="flex-shrink-0 w-10 h-10 border rounded bg-gray-50 p-0.5">
                            <Image
                                src={item.images[0]}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded object-contain w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                            No Img
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1" title={item.name}>
                            {item.name}
                          </p>
                          {item.variants.length > 0 && (
                            <p className="text-xs text-blue-600 mt-0.5">
                              {item.variants.length} Variants
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.sku || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {item.category?.name || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                       <span className={`text-lg font-bold ${totalStock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                         {totalStock}
                       </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.class} flex items-center w-fit gap-1`}
                      >
                        {totalStock <= 10 && <AlertTriangle className="w-3 h-3" />}
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          title="View Product"
                          asChild
                        >
                          <Link href={`/dashboard/products?search=${item.sku}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          title="Edit Product"
                          asChild
                        >
                          <Link href={`/dashboard/products`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-600"
                          title="Report Damage"
                          onClick={() => handleDamageClick(item)}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                         <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleHistoryClick(item)}
                        >
                          <History className="w-3.5 h-3.5 text-gray-500" />
                          <span className="hidden sm:inline">History</span>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAdjustClick(item)}
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Adjust</span>
                        </Button>
                         <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          title="Delete Product"
                          onClick={async () => {
                              if (await confirm({
                                  title: "Delete Product",
                                  message: "Are you sure you want to delete this product? This action cannot be undone.",
                                  type: "danger",
                                  confirmText: "Delete"
                              })) {
                                  // Implementation of delete...
                                  const res = await ProductService.deleteProduct(session?.accessToken || "", item.id);
                                  if (res.success) {
                                      toast.success("Product deleted successfully");
                                      fetchInventory();
                                  } else {
                                      toast.error(res.message || "Failed to delete");
                                  }
                              }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing page <span className="font-medium text-gray-900">{page}</span> of{" "}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
          </div>
      </div>

      {selectedItemForAdjust && (
        <StockAdjustmentModal
          product={selectedItemForAdjust}
          open={isAdjustModalOpen}
          onOpenChange={(val: boolean) => setIsAdjustModalOpen(val)}
          onSuccess={fetchInventory}
          token={session?.accessToken || ""}
        />
      )}

      {selectedItemForHistory && (
        <StockHistoryModal
          item={selectedItemForHistory}
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}

      {selectedItemForDamage && (
        <DamageReportModal
          isOpen={isDamageModalOpen}
          onClose={() => setIsDamageModalOpen(false)}
          product={selectedItemForDamage}
          token={session?.accessToken || ""}
          onSuccess={fetchInventory}
        />
      )}
    </div>
  );
}
