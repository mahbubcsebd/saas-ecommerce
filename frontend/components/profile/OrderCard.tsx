import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

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

interface OrderCardProps {
  order: Order;
  formatPrice: (price: number) => string;
}

export default function OrderCard({ order, formatPrice }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'default';
      case 'processing': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <Card>
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
          <span className="font-bold text-foreground text-lg">{formatPrice(order.total)}</span>
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
  );
}
