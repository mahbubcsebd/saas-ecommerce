'use client';

import { RecoveryModal } from '@/components/abandoned-carts/RecoveryModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Cart, fetchApi } from '@/lib/api';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
    Calendar,
    Clock,
    Mail,
    ShoppingCart,
    User as UserIcon
} from 'lucide-react';
import { useState } from 'react';

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
        method: 'POST',
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
      console.error('Failed to send recovery email:', error);
      throw error;
    }
  };

  const columns: ColumnDef<Cart>[] = [
    {
      id: 'userEmail',
      accessorFn: (row) => row.user?.email || '',
      header: 'Customer',
      cell: ({ row }) => {
        const user = row.original.user;
        const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest';
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{fullName}</span>
              <span className="text-xs text-muted-foreground">{user?.email || 'No email'}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ShoppingCart className="w-3 h-3" />
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </Badge>
            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
              {items.map(it => it.product.name).join(', ')}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'total',
      header: 'Value',
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          ${row.original.total.toFixed(2)}
        </span>
      )
    },
    {
      accessorKey: 'updatedAt',
      header: 'Abandoned Date',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(row.original.updatedAt), 'MMM dd, yyyy')}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(row.original.updatedAt), 'hh:mm a')}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'recoveryEmailCount',
      header: 'Recovery Status',
      cell: ({ row }) => {
        const count = row.original.recoveryEmailCount;
        const lastSent = row.original.recoveryEmailSentAt;

        if (count === 0) {
          return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Not Sent</Badge>;
        }

        return (
          <div className="flex flex-col gap-1">
            <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
              Sent {count} {count === 1 ? 'time' : 'times'}
            </Badge>
            {lastSent && (
              <span className="text-[10px] text-muted-foreground">
                Last: {format(new Date(lastSent), 'MMM dd')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10 gap-1"
            onClick={() => {
              setSelectedCart(row.original);
              setIsRecoveryModalOpen(true);
            }}
          >
            <Mail className="h-4 w-4" />
            Recover
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Abandoned Carts</h2>
          <p className="text-muted-foreground">
            View and recover customers who left items in their cart without checking out.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Abandoned</h3>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{data.length}</div>
          <p className="text-xs text-muted-foreground">Showing carts idle for &gt; 24h</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Potential Revenue</h3>
            <span className="text-muted-foreground">$</span>
          </div>
          <div className="text-2xl font-bold">
            ${data.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Recoverable value</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Recovery Sent</h3>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">
            {data.filter(c => c.recoveryEmailCount > 0).length}
          </div>
          <p className="text-xs text-muted-foreground">Carts contacted</p>
        </div>
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
