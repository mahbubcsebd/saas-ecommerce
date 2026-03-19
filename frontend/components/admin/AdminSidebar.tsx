'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Ticket,
  Truck,
  TruckIcon,
  Users,
} from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'POS',
    href: '/admin/pos',
    icon: Store,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },

  {
    title: 'Categories',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    title: 'Discounts',
    href: '/admin/discounts',
    icon: Tags,
  },
  {
    title: 'Coupons',
    href: '/admin/coupons',
    icon: Ticket,
  },
  {
    title: 'Hero Slides',
    href: '/admin/hero-slides',
    icon: ImageIcon,
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    title: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
  },
  {
    title: 'Suppliers',
    href: '/admin/suppliers',
    icon: TruckIcon,
  },
  {
    title: 'Purchases',
    href: '/admin/purchases',
    icon: ShoppingBag,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full border-r bg-muted/20">
      <div className="h-14 flex items-center px-6 border-b">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Store className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <div className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Link href="/">
          <Button variant="outline" className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Back to Store
          </Button>
        </Link>
      </div>
    </div>
  );
}
