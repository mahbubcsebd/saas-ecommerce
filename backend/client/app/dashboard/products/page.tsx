"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { Download, Edit, Eye, Filter, LayoutGrid, List, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    description?: string;
    slug: string;
    sku: string;
    basePrice: number;
    sellingPrice: number;
    stock: number;
    lowStockAlert: number;
    status: string;
    images: string[];
    category: {
        id: string;
        name: string;
    };
    variants?: {
        id: string;
        name: string;
        sku: string;
        stock: number;
        sellingPrice: number;
        attributes: any;
    }[];
    brand?: string;
}

const getStockStatus = (stock: number, lowStockAlert: number) => {
  if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
  if (stock <= lowStockAlert) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
  return { label: "In Stock", color: "bg-green-100 text-green-800" };
};

const getStatusBadge = (status: string) => {
  const colors: Record<string, string> = {
    PUBLISHED: "bg-green-100 text-green-800",
    DRAFT: "bg-gray-100 text-gray-800",
    ARCHIVED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minStock: "",
    maxStock: "",
    status: "all",
    brand: "",
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { t } = useLanguage();
  const { alert } = useConfirm();
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    if (session?.accessToken) {
      fetchProducts();
    }
  }, [pagination.pageIndex, pagination.pageSize, session, filters, globalFilter]);

  const fetchProducts = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
      });

      if (globalFilter) params.append("search", globalFilter);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minStock) params.append("minStock", filters.minStock);
      if (filters.maxStock) params.append("maxStock", filters.maxStock);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.brand) params.append("brand", filters.brand);

      const res = await fetch(
        `${API_URL}/products?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
        console.log("Meta Data:", data.meta); // Debug
        setRowCount(data.meta?.total || 0); // Set total row count from backend
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteProductId(id);
  };

  const confirmDelete = async () => {
    if (!deleteProductId || !session?.accessToken) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/products/${deleteProductId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (res.ok) {
        fetchProducts();
        setDeleteProductId(null);
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_URL}/products/admin/export`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleImport = async () => {
    if (!importFile || !session?.accessToken) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("images", importFile); // Using 'images' as the fieldname because existing middleware handles it

      const res = await fetch(`${API_URL}/products/admin/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        fetchProducts();
        setIsImportOpen(false);
        setImportFile(null);
        toast.success(result.message || "Products imported successfully");
        if (result.data?.failed > 0) {
          console.warn("Import warning:", result.data.errors);
        }
      } else {
        const error = await res.json();
        toast.error(error.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "images",
      header: "Image",
      cell: ({ row }) => (
        <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
          {row.original.images[0] ? (
            <Image
              src={row.original.images[0]}
              alt={row.original.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{t(row.original, 'name')}</div>
          <div className="text-sm text-gray-500">SKU: {row.original.sku}</div>
        </div>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{t(row.original.category, 'name') || "N/A"}</span>
      ),
    },
    {
      accessorKey: "basePrice",
      header: "Price",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">${row.original.sellingPrice}</div>
          {row.original.basePrice !== row.original.sellingPrice && (
            <div className="text-sm text-gray-500 line-through">${row.original.basePrice}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stockStatus = getStockStatus(row.original.stock, row.original.lowStockAlert);
        return (
          <div>
            <div className="font-medium">{row.original.stock}</div>
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${stockStatus.color}`}>
              {stockStatus.label}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(row.original.status)}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewProduct(row.original)}
                title="View Details"
            >
                <Eye className="h-4 w-4" />
            </Button>
            <Link href={`/dashboard/products/${row.original.id}`}>
                <Button variant="ghost" size="icon" title="Edit">
                    <Edit className="h-4 w-4" />
                </Button>
            </Link>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(row.original.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Delete"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    rowCount, // Pass the total row count to the table
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true, // Enable manual pagination
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Please login to continue...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download size={18} /> Export
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload size={18} /> Import
          </Button>
          <Link
            href="/dashboard/products/add"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            <Plus size={18} /> Add Product
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2 border rounded-lg p-1 bg-white">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} /> Filters
          </Button>
          <div className="w-[1px] h-6 bg-gray-200 mx-1" />
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8 w-8 p-0"
          >
            <List size={18} />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
          >
            <LayoutGrid size={18} />
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full text-sm border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full text-sm border p-2 rounded"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Stock Levels</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minStock}
                onChange={(e) => setFilters({ ...filters, minStock: e.target.value })}
                className="w-full text-sm border p-2 rounded"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxStock}
                onChange={(e) => setFilters({ ...filters, maxStock: e.target.value })}
                className="w-full text-sm border p-2 rounded"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full text-sm border p-2 rounded h-[38px]"
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button
                variant="ghost"
                className="flex-1 text-gray-500"
                onClick={() => setFilters({ minPrice: "", maxPrice: "", minStock: "", maxStock: "", status: "all", brand: "" })}
            >
              <X size={16} className="mr-2" /> Clear All
            </Button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "table" ? (
        <div className={`bg-white rounded-lg shadow overflow-hidden transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {loading ? "Loading..." : "No products found"}
            </div>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-200 ${loading ? 'opacity-50' : ''}`}>
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border group overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-square bg-gray-100">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={() => setViewProduct(product)}>
                    <Eye size={16} />
                  </Button>
                  <Link href={`/dashboard/products/${product.id}`}>
                    <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm">
                      <Edit size={16} />
                    </Button>
                  </Link>
                </div>
                <div className="absolute bottom-2 left-2">
                   <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm ${getStatusBadge(product.status)}`}>
                    {product.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-gray-500 mb-1">{t(product.category, 'name')}</div>
                <h3 className="font-semibold text-gray-900 truncate mb-1">{t(product, 'name')}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm font-bold text-blue-600">${product.sellingPrice}</div>
                  <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStockStatus(product.stock, product.lowStockAlert).color}`}>
                    {product.stock} in stock
                  </div>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500">
              {loading ? "Loading..." : "No products found"}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
             (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
             rowCount // Use rowCount instead of products.length
           )}{" "}
          of {rowCount} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>


      {/* View Product Modal */}
      <Dialog open={!!viewProduct} onOpenChange={(open) => !open && setViewProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            {viewProduct && (
                <div className="grid gap-6">
                    <div className="flex gap-4">
                        <div className="relative h-32 w-32 flex-shrink-0 rounded-lg overflow-hidden border">
                            {viewProduct.images?.[0] ? (
                                <Image
                                    src={viewProduct.images[0]}
                                    alt={viewProduct.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{t(viewProduct, 'name')}</h3>
                            <p className="text-sm text-gray-500">SKU: {viewProduct.sku}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(viewProduct.status)}`}>
                                    {viewProduct.status}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStockStatus(viewProduct.stock, viewProduct.lowStockAlert).color}`}>
                                    {getStockStatus(viewProduct.stock, viewProduct.lowStockAlert).label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold">Category</p>
                            <p>{t(viewProduct.category, 'name')}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Brand</p>
                            <p>{viewProduct.brand || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-semibold">Price</p>
                            <div className="flex gap-2">
                                <span className="font-medium">${viewProduct.sellingPrice}</span>
                                {viewProduct.basePrice > viewProduct.sellingPrice && (
                                    <span className="text-gray-500 line-through">${viewProduct.basePrice}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold">Stock</p>
                            <p>{viewProduct.stock} units</p>
                        </div>
                    </div>

                    {t(viewProduct, 'description') && (
                         <div>
                            <p className="font-semibold mb-1">Description</p>
                            <div className="text-sm text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: t(viewProduct, 'description') }} />
                        </div>
                    )}

                    {viewProduct.variants && viewProduct.variants.length > 0 && (
                        <div>
                            <p className="font-semibold mb-2">Variants ({viewProduct.variants.length})</p>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Name</th>
                                            <th className="px-3 py-2 text-left">SKU</th>
                                            <th className="px-3 py-2 text-right">Price</th>
                                            <th className="px-3 py-2 text-right">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {viewProduct.variants.map((variant) => (
                                            <tr key={variant.id}>
                                                <td className="px-3 py-2">{variant.name}</td>
                                                <td className="px-3 py-2 text-gray-500">{variant.sku}</td>
                                                <td className="px-3 py-2 text-right">${variant.sellingPrice}</td>
                                                <td className="px-3 py-2 text-right">{variant.stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Product</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete this product? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteProductId(null)} disabled={isDeleting}>
                    Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import products.
              Expected format: Name, SKU, Barcode, BasePrice, SellingPrice, Stock, Category, Status, Brand
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full text-sm border p-2 rounded"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? "Importing..." : "Start Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
