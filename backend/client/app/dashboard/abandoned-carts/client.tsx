"use client";

import { RecoveryModal } from "@/components/abandoned-carts/RecoveryModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Cart, fetchApi } from "@/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
    Calendar,
    Clock,
    Mail,
    MoreHorizontal,
    ShoppingCart,
    User as UserIcon
} from "lucide-react";
import { useState } from "react";

interface AbandonCartClientProps {
  initialData: Cart[];
}

export function AbandonCartClient({ initialData }: AbandonCartClientProps) {
  const [data, setData] = useState<Cart[]>(initialData);
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const handleSendRecovery = async (cartId: string) => {
    try {
      const res: any = await fetchApi(`/abandoned-carts/${cartId}/send-recovery`, {
        method: "POST",
      });

      if (res.success) {
        // Update local state to reflect the sent email
        setData(prev => prev.map(c => c.id === cartId ? {
          ...c,
          recoveryEmailSentAt: res.data.recoveryEmailSentAt,
          recoveryEmailCount: res.data.recoveryEmailCount
        } : c));
      }
    } catch (error: any) {
      console.error("Failed to send recovery email:", error);
      throw error;
    }
  };

  const columns: ColumnDef<Cart>[] = [
    {
      id: "userEmail",
      accessorFn: (row) => row.user?.email || "",
      header: "Customer",
      cell: ({ row }) => {
        const user = row.original.user;
        const fullName = user ? `${user.firstName} ${user.lastName}` : "Guest";
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm truncate">{fullName}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email || "No email"}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted/30 border-none font-bold text-[10px] px-2 py-0">
              {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
            </Badge>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {items.map(it => it.product.name).join(", ")}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "total",
      header: "Value",
      cell: ({ row }) => (
        <span className="font-bold text-sm">
          ${row.original.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      accessorKey: "updatedAt",
      header: "Abandoned",
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            {format(new Date(row.original.updatedAt), "MMM dd, yyyy")}
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(row.original.updatedAt), "hh:mm a")}
          </span>
        </div>
      )
    },
    {
      accessorKey: "recoveryEmailCount",
      header: "Recovery",
      cell: ({ row }) => {
        const count = row.original.recoveryEmailCount;
        const lastSent = row.original.recoveryEmailSentAt;

        if (count === 0) {
          return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none font-bold text-[10px]">NOT SENT</Badge>;
        }

        return (
          <div className="flex flex-col gap-1">
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[10px] w-fit">
              SENT {count} {count === 1 ? "TIME" : "TIMES"}
            </Badge>
            {lastSent && (
              <span className="text-[10px] text-muted-foreground font-medium">
                Last: {format(new Date(lastSent), "dd MMM")}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-2 font-bold text-xs"
          onClick={() => {
            setSelectedCart(row.original);
            setIsRecoveryModalOpen(true);
          }}
        >
          <Mail className="h-3.5 w-3.5" />
          Recover
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Abandoned Carts</h2>
          <p className="text-muted-foreground mt-1">
            Analyze and recover customers who left items without checking out.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abandoned</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Idle for over 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recoverable Value</CardTitle>
            <span className="text-muted-foreground font-bold text-sm">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.reduce((acc, curr) => acc + curr.total, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total potential revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Pulse</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.filter(c => c.recoveryEmailCount > 0).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Carts with recovery contact</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="userEmail"
      />

      <RecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        cart={selectedCart}
        onSend={handleSendRecovery}
      />
    </div>
  );
}
