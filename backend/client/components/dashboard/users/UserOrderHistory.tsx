'use client';

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Order } from '@/services/order.service';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface UserOrderHistoryProps {
  orders: Order[];
}

export const UserOrderHistory: React.FC<UserOrderHistoryProps> = ({ orders }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
        No orders found for this customer.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>{format(new Date(order.createdAt), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {order.status.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'} className={order.paymentStatus === 'PAID' ? 'bg-green-600' : ''}>
                  {order.paymentStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold">৳{order.total.toLocaleString()}</TableCell>
              <TableCell>
                <Link href={`/dashboard/orders/${order.id}`}>
                  <ExternalLink className="w-4 h-4 text-blue-600 cursor-pointer" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
