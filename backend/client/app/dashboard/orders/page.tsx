"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
    ArrowUpDown,
    ChevronDown,
    Download,
    Eye,
    Loader2,
    MoreHorizontal,
    Package,
    Search,
    ShoppingCart,
    Trash,
    ShieldAlert,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Order, OrderService } from "@/services/order.service";

export default function OrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [data, setData] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchOrders = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        paymentMethod: paymentFilter !== "ALL" ? paymentFilter : undefined,
        search: searchTerm || undefined,
      };

      const res = await OrderService.getAllOrders(accessToken, params);
      if (res.success) {
        setData(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [accessToken, pagination.page, pagination.limit, statusFilter, paymentFilter, searchTerm]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleBulkUpdate = async (status: string) => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => (row.original as Order).id);
    if (selectedIds.length === 0) return;

    try {
      const res = await OrderService.bulkUpdateStatus(accessToken, selectedIds, status);
      if (res.success) {
        toast.success(`Successfully updated ${selectedIds.length} orders`);
        fetchOrders();
        setRowSelection({});
        window.dispatchEvent(new CustomEvent('refresh-sidebar-counts'));
      } else {
        toast.error(res.message || "Bulk update failed");
      }
    } catch (error) {
      toast.error("An error occurred during bulk update");
    }
  };

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderNumber",
      header: "Order #",
      cell: ({ row }) => (
        <div className="font-medium whitespace-nowrap">
          {row.getValue("orderNumber")}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="flex flex-col gap-0.5 px-4">
            <span className="font-medium whitespace-nowrap">{format(date, "dd MMM yyyy")}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{format(date, "hh:mm a")}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original;
        const name = order.user?.firstName ? `${order.user.firstName} ${order.user.lastName || ''}` : (order.user?.username || order.walkInName || "Guest");
        const email = order.user?.email || order.walkInPhone || "";
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-medium truncate">{name}</span>
            <span className="text-xs text-muted-foreground truncate">{email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        switch (status) {
          case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
          case "PROCESSING": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
          case "SHIPPED": return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Shipped</Badge>;
          case "DELIVERED": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
          case "COMPLETED": return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
          case "CANCELLED": return <Badge variant="destructive">Cancelled</Badge>;
          default: return <Badge variant="outline">{status}</Badge>;
        }
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => (
        <div className="text-xs uppercase font-semibold text-muted-foreground">
          {row.getValue("paymentMethod")}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("total"));
        return <div className="text-right font-bold">{amount.toLocaleString()} BDT</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    OrderService.downloadInvoice(accessToken, order.id)
                      .then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `Invoice-${order.orderNumber}.pdf`;
                        a.click();
                      })
                      .catch(() => toast.error("Failed to download invoice"));
                  }}
                >
                  <Download className="mr-2 h-4 w-4" /> Download Invoice
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash className="mr-2 h-4 w-4" /> Delete (Admin Only)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders across all channels.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden md:flex" asChild>
                <Link href="/dashboard/orders/blocked-clients">
                    <ShieldAlert className="mr-2 h-4 w-4 text-red-500" /> Managed Blocked IPs
                </Link>
            </Button>
            <Button variant="outline" className="hidden md:flex">
                <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total || data.length}</div>
            <p className="text-xs text-muted-foreground">Total orders in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {data.filter(o => o.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">Requiring immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {data.filter(o => o.status === 'PROCESSING').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently being prepared</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {data.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully fulfilled</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex flex-1 items-center space-x-2 w-full md:max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order #, customer, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50/50 border-none focus-visible:ring-1"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-slate-50/50 border-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[140px] bg-slate-50/50 border-none">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Payments</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="COD">COD</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="BKASH">bKash</SelectItem>
              <SelectItem value="NAGAD">Nagad</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
            </SelectContent>
          </Select>

          {Object.keys(rowSelection).length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                  Bulk Actions ({Object.keys(rowSelection).length}) <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleBulkUpdate("PROCESSING")}>Mark as Processing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkUpdate("SHIPPED")}>Mark as Shipped</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkUpdate("DELIVERED")}>Mark as Delivered</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkUpdate("CANCELLED")} className="text-destructive font-medium">Cancel Orders</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto border-dashed">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="py-4">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                     <TableCell colSpan={columns.length} className="h-32 text-center">
                        <div className="flex flex-col justify-center items-center gap-3">
                           <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                           <span className="text-sm text-muted-foreground font-medium">Fetching orders...</span>
                        </div>
                     </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="group cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('[role="checkbox"]') ||
                          target.closest('button') ||
                          target.closest('[aria-haspopup]') ||
                          target.closest('[data-state]')
                        ) {
                          return;
                        }
                        router.push(`/dashboard/orders/${(row.original as Order).id}`);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingCart className="h-8 w-8 text-slate-200" />
                        <p>No orders match your criteria.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex-1 text-sm text-muted-foreground font-medium">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-muted-foreground">Rows per page</p>
            <Select
              value={`${pagination.limit}`}
              onValueChange={(value) => {
                setPagination(p => ({ ...p, limit: Number(value), page: 1 }));
              }}
            >
              <SelectTrigger className="h-9 w-[70px] border-none bg-slate-50">
                <SelectValue placeholder={pagination.limit} />
              </SelectTrigger>
              <SelectContent align="end">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-semibold text-slate-700">
            Page {pagination.page} / {pagination.pages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-9 w-9 p-0"
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              className="h-9 w-9 p-0"
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
