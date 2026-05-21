"use client";

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
import { format } from "date-fns";
import { ChevronDown, Download, FileText, Loader2, Mail, MoreHorizontal, Printer, RefreshCw, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OrderService } from "@/services/order.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
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
import { Invoice, InvoiceService } from "@/services/invoice.service";

export default function InvoicesPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Bulk Print State
  const [rowSelection, setRowSelection] = useState({});
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [bulkPrintingLoading, setBulkPrintingLoading] = useState(false);
  const [bulkInvoiceData, setBulkInvoiceData] = useState<any[]>([]);

  // Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchInvoices = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await InvoiceService.getInvoices(accessToken, {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter,
        status: (table.getColumn("status")?.getFilterValue() as string) || "ALL"
      });
      if (res.success) {
        setInvoices(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch invoices", error);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [accessToken, pagination.pageIndex, pagination.pageSize, globalFilter, columnFilters]);

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setProcessingId(invoiceId + "-download");
      const blob = await InvoiceService.downloadInvoice(accessToken, invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Invoice downloaded successfully!");
    } catch (error) {
      toast.error("Download failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    try {
      setProcessingId(invoiceId + "-email");
      const res = await InvoiceService.sendInvoiceEmail(accessToken, invoiceId);
      if (res.success) {
        toast.success("Invoice email sent to customer");
      } else {
        toast.error(res.message || "Failed to send email");
      }
    } catch (error) {
      toast.error("Error sending email");
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      setProcessingId(invoiceId + "-status");
      const res = await InvoiceService.updateInvoiceStatus(accessToken, invoiceId, newStatus);
      if (res.success) {
        toast.success(`Invoice status updated to ${newStatus}`);
        fetchInvoices();
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkPrint = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedInvoices = selectedRows.map(row => row.original);

    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice to print");
      return;
    }

    try {
      setBulkPrintingLoading(true);
      const dataList = [];

      for (const inv of selectedInvoices) {
        const res = await OrderService.getOrder(accessToken, inv.orderId);
        if (res.success) {
          const order = res.data;
          const customerName = order.user
            ? `${order.user.firstName} ${order.user.lastName}`
            : order.walkInName || order.guestInfo?.name || 'Guest';
          const customerEmail = order.user?.email || order.guestInfo?.email || '';
          const customerPhone = order.user?.phone || order.guestInfo?.phone || order.walkInPhone || '';
          dataList.push({
            invoice: inv,
            order,
            customerName,
            customerEmail,
            customerPhone
          });
        }
      }

      if (dataList.length === 0) {
        toast.error("Failed to load details for the selected invoices");
        return;
      }

      setBulkInvoiceData(dataList);
      setIsBulkPrinting(true);

      // Wait for React to render the printable container
      setTimeout(() => {
        window.print();
        setIsBulkPrinting(false);
        setRowSelection({});
      }, 500);
    } catch (error) {
      console.error("Bulk print failed", error);
      toast.error("An error occurred while preparing invoices for print");
    } finally {
      setBulkPrintingLoading(false);
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary/60" />
          <span className="font-semibold">{row.original.invoiceNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: "order",
      header: "Order Reference",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.order?.orderNumber || "N/A"}
        </span>
      )
    },
    {
      accessorKey: "issueDate",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.issueDate), "dd MMM yyyy"),
    },
    {
      accessorKey: "user",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.user;
        const name = user ? `${user.firstName} ${user.lastName}` : "Guest";
        return (
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{user?.email || "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="font-bold">
          {row.original.amount.toLocaleString()} BDT
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant="outline"
            className={
              status === "PAID"
                ? "bg-green-50 text-green-700 border-green-200"
                : status === "OVERDUE"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const inv = row.original;
        const isDownloading = processingId === inv.id + "-download";
        const isSending = processingId === inv.id + "-email";

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleDownload(inv.id, inv.invoiceNumber)}
              disabled={!!processingId}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Manage Invoice</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleSendEmail(inv.id)} disabled={!!processingId}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isSending ? "Sending..." : "Send via Email"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleStatusUpdate(inv.id, "PAID")}>
                  Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate(inv.id, "PENDING")}>
                  Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusUpdate(inv.id, "CANCELLED")}>
                  Cancel Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: -1 // Handled by backend if we had the count meta properly
  });

  return (
    <>
      <div className={`space-y-6 ${isBulkPrinting ? "print:hidden print-hidden" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-1">Manage and track customer billings.</p>
          </div>
          <div className="flex items-center gap-2">
            {Object.keys(rowSelection).length > 0 && (
              <Button
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20 border-none gap-2 h-9"
                onClick={handleBulkPrint}
                disabled={bulkPrintingLoading}
              >
                {bulkPrintingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Print Selected ({Object.keys(rowSelection).length})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div>
              <CardTitle>All Invoices</CardTitle>
              <CardDescription>View, download, and email invoices to customers.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? "ALL"}
                onValueChange={(value) => table.getColumn("status")?.setFilterValue(value)}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search invoices..."
                  className="w-full pl-8"
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        Loading invoices...
                      </TableCell>
                    </TableRow>
                  ) : invoices.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printable container for bulk printing */}
      {isBulkPrinting && (
        <div className="hidden print:block p-6 bg-white text-black min-h-screen">
          {bulkInvoiceData.map((data, index) => (
            <div
              key={data.invoice.id}
              className={`invoice-print-page w-full max-w-4xl mx-auto bg-white p-8 ${index > 0 ? "break-before-page" : ""
                }`}
              style={{
                pageBreakBefore: index > 0 ? 'always' : 'auto',
                breakBefore: index > 0 ? 'page' : 'auto'
              }}
            >
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-wider">Invoice</h2>
                  <p className="text-sm font-mono text-slate-500 mt-1">#{data.invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-lg text-slate-800">Mahbub Shop</h3>
                  <p className="text-xs text-slate-500">Dhaka, Bangladesh</p>
                  <p className="text-xs text-slate-500">support@mahbubshop.com</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6 my-6 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bill To:</p>
                  <p className="font-semibold text-slate-800 mt-1">{data.customerName}</p>
                  <p className="text-slate-600">{data.customerEmail || "N/A"}</p>
                  <p className="text-slate-600">{data.customerPhone || ""}</p>
                </div>
                <div className="text-right text-slate-700">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Details:</p>
                  <p className="mt-1"><span className="text-slate-500">Order Ref:</span> <span className="font-medium">{data.order.orderNumber}</span></p>
                  <p><span className="text-slate-500">Date:</span> {format(new Date(data.invoice.issueDate), "dd MMM yyyy")}</p>
                  <p><span className="text-slate-500">Due Date:</span> {format(new Date(data.invoice.dueDate), "dd MMM yyyy")}</p>
                  <p><span className="text-slate-500">Status:</span> <span className="font-bold uppercase text-primary">{data.invoice.status}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-sm my-6 border-collapse">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-slate-600 font-semibold text-left">
                    <th className="py-2.5 pl-2">Product</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right pr-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.order.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-100 text-slate-700">
                      <td className="py-3 pl-2">
                        <p className="font-medium text-slate-900">{item.productName || item.name}</p>
                        {item.sku && <span className="text-xs text-slate-400 font-mono">{item.sku}</span>}
                      </td>
                      <td className="py-3 text-right">{(item.unitPrice ?? item.salePrice)?.toLocaleString()} ৳</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right pr-2 font-medium text-slate-900">{(item.totalPrice ?? item.total)?.toLocaleString()} ৳</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{data.order.subtotal?.toLocaleString()} ৳</span>
                  </div>
                  {(data.order.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>−{data.order.discountAmount?.toLocaleString()} ৳</span>
                    </div>
                  )}
                  {(data.order.vatAmount || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>VAT</span>
                      <span>{data.order.vatAmount?.toLocaleString()} ৳</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Shipping</span>
                    <span>{data.order.shippingCost?.toLocaleString() ?? 0} ৳</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-base text-slate-900">
                    <span>Total</span>
                    <span className="text-primary">{data.invoice.amount.toLocaleString()} ৳</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
