"use client";

import { useConfirm } from "@/hooks/use-confirm";
import { format } from "date-fns";
import { ArrowLeft, Loader2, ShieldAlert, Trash2, Globe, Monitor, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderService } from "@/services/order.service";

interface BlockedItem {
  id: string;
  type: "IP" | "DEVICE";
  value: string;
  reason?: string;
  createdAt: string;
}

export default function BlockedClientsPage() {
  const { confirm } = useConfirm();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken;

  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlocked = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await OrderService.getBlockedClients(accessToken);
      if (res.success) {
        setBlockedItems(res.data || []);
      } else {
        toast.error("Failed to load blocked list");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading blocked list");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchBlocked();
    }
  }, [accessToken, fetchBlocked]);

  const handleUnblock = async (item: BlockedItem) => {
    if (!accessToken) return;

    if (!await confirm({
      title: `Unblock ${item.type}`,
      message: `Are you sure you want to unblock this ${item.type.toLowerCase()} (${item.value})? They will immediately be allowed to place orders again.`,
      type: "info",
      confirmText: "Unblock Client"
    })) return;

    try {
      setUnblockingId(item.id);
      const res = await OrderService.unblockClient(accessToken, item.id);
      if (res.success) {
        toast.success(`${item.type} unblocked successfully!`);
        setBlockedItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        toast.error(res.message || "Failed to unblock client");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error unblocking client");
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-lg">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blocked Clients</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage IP addresses and Device Agents blocked from placing orders.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBlocked} disabled={loading} className="cursor-pointer">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading && "animate-spin"}`} />
          Refresh List
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IP Addresses</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {blockedItems.filter((i) => i.type === "IP").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique IP address records blocked from checkouts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {blockedItems.filter((i) => i.type === "DEVICE").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique device identifiers barred from shopping</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Wrapper */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="animate-spin text-primary/60 h-8 w-8" />
            </div>
          ) : blockedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2 p-6">
              <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-zinc-700 animate-pulse" />
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">No Blocked Clients</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm">
                No fraudulent IP addresses or devices have been blocked yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-zinc-900/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 font-semibold text-slate-700 dark:text-zinc-300 w-[140px]">Block Type</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-700 dark:text-zinc-300">Value (IP / User-Agent)</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-700 dark:text-zinc-300">Block Reason</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-700 dark:text-zinc-300 w-[200px]">Date Blocked</TableHead>
                  <TableHead className="py-4 font-semibold text-slate-700 dark:text-zinc-300 text-right w-[100px] pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/40 transition-colors">
                    <TableCell className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          item.type === "IP"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                            : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30"
                        }`}
                      >
                        {item.type === "IP" ? <Globe className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 max-w-[280px]">
                      <p className="font-mono text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate" title={item.value}>
                        {item.value}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">
                        {item.reason || <span className="text-slate-400 dark:text-zinc-600 italic">No reason provided</span>}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          {format(new Date(item.createdAt), "hh:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer h-8 w-8"
                        onClick={() => handleUnblock(item)}
                        disabled={unblockingId === item.id}
                      >
                        {unblockingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
