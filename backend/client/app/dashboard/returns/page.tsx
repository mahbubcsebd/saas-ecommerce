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
import {
    AlertCircle,
    ArrowUpDown,
    CheckCircle,
    Clock,
    Loader2,
    Plus,
    Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnRequest, ReturnService } from "@/services/return.service";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ReturnsPage() {
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await ReturnService.getAllReturns(accessToken, { limit: 100 });
      if (res.success && res.data) {
        setReturns(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch returns", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchReturns();
    }
  }, [accessToken]);

  const getStatusBadge = (status: ReturnRequest["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Refunded
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
          >
            <AlertCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
    }
  };

  const columns: ColumnDef<ReturnRequest>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            RMA ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium text-primary">
          {row.original.rmaId}
          <div className="text-xs text-muted-foreground font-normal mt-1">
            {format(new Date(row.original.createdAt), "dd MMM, yyyy")}
          </div>
        </div>
      ),
    },
    {
      accessorFn: (row) => `${row.orderNumber} ${row.productName}`,
      id: "orderInfo",
      header: "Order Info",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div>
            <p className="font-medium">{req.orderNumber}</p>
            <p
              className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]"
              title={req.productName}
            >
              {req.productName}
            </p>
          </div>
        );
      },
    },
    {
      accessorFn: (row) => `${row.customerName} ${row.customerEmail}`,
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{req.customerName}</span>
            <span className="text-xs text-muted-foreground">
              {req.customerEmail}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        return (
          <span
            className="text-sm truncate max-w-[150px] inline-block"
            title={row.original.reason}
          >
            {row.original.reason}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: (row, id, value) => {
        return value === "ALL" || row.getValue("status") === value;
      },
      cell: ({ row }) => {
        return getStatusBadge(row.original.status);
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="text-right w-full">
          <Button
            variant="ghost"
            className="h-8 -mr-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <div className="text-right font-bold text-destructive">
            -{amount.toLocaleString()} BDT
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end pr-2">
            <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/returns/${row.original.id}`}>Review</Link>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: returns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Handle Tab Change to filter status
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    table.getColumn("status")?.setFilterValue(val === "ALL" ? "" : val);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Returns & Refunds
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer return requests and RMAs.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/returns/create">
            <Plus className="w-4 h-4 mr-2" /> Create RMA
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="ALL">All Returns</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REFUNDED">Refunded</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div>
              <CardTitle>Return Requests</CardTitle>
              <CardDescription>
                Review and process product returns from customers.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by RMA, Order or Email..."
                className="w-full pl-8"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead key={header.id}>
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
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="py-3">
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
                            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                            No return requests found in this category.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {table.getPageCount() > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4 mt-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                      Showing{" "}
                      {table.getState().pagination.pageIndex *
                        table.getState().pagination.pageSize +
                        1}{" "}
                      to{" "}
                      {Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}{" "}
                      of {table.getFilteredRowModel().rows.length} entries
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
                      <div className="text-sm font-medium px-2">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                      </div>
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
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
