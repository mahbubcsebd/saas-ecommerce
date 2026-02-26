"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface OrderItem {
    id: string;
    product: {
        name: string;
        images: string[];
        slug: string;
    };
    variant?: {
        name: string;
        images?: string[];
    };
    quantity: number;
    salePrice: number;
}

interface Order {
    id: string;
    createdAt: string;
    total: number;
    status: string;
    items: OrderItem[];
}

export default function OrdersPage() {
  const { formatPrice } = useCurrency();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await fetch(`${API_URL}/orders/my-orders`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const data = await res.json();
        if (res.ok) {
            setOrders(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session]);

  const getStatusColor = (status: string) => {
      switch(status.toLowerCase()) {
          case 'delivered': return 'default'; // dark/black
          case 'processing': return 'secondary'; // gray
          case 'cancelled': return 'destructive'; // red
          default: return 'outline';
      }
  }

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                You haven&apos;t placed any orders yet.
            </div>
        ) : (
            orders.map((order) => (
                <Card key={order.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium">Order #{order.id.slice(-6).toUpperCase()}</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(order.status) as any}>
                                {order.status}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/orders/${order.id}/invoice`}>
                                    Invoice
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground mb-4">
                            <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="font-bold text-foreground text-lg">৳{order.total}</span>
                        </div>
                        <div className="space-y-3">
                            {order.items?.map((item, idx) => {
                                const displayImage = item.variant?.images?.[0] || item.product?.images?.[0];
                                return (
                                <div key={idx} className="flex gap-4 items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                    <Link href={`/products/${item.product?.slug}`} className="relative w-12 h-12 shrink-0 overflow-hidden rounded border bg-muted hover:opacity-80 transition-opacity">
                                        {displayImage && (
                                            <Image
                                                src={displayImage}
                                                alt={item.product?.name || "Product"}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </Link>
                                    <div className="flex-1">
                                        <Link href={`/products/${item.product?.slug}`} className="font-medium hover:text-primary transition-colors">
                                            {item.product?.name || "Product"}
                                        </Link>
                                        {item.variant && (
                                            <p className="text-[10px] text-muted-foreground">
                                                Variant: {item.variant.name}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">{item.quantity}x {formatPrice(item.salePrice)}</p>
                                    </div>
                                    <span className="font-semibold">{formatPrice(item.salePrice * item.quantity)}</span>
                                </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}
