'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { hasRole, Role } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  FileBarChart,
  FileText,
  FolderOpen,
  FolderTree,
  Globe,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Package,
  PackageCheck,
  PanelLeft,
  PanelRight,
  PlusCircle,
  Receipt,
  RotateCcw,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  roles?: Role[];
  badge?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Sales',
    href: '#sales',
    icon: ShoppingCart,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    children: [
      {
        title: 'Orders',
        href: '/dashboard/orders',
        icon: ShoppingBag,
        badge: '12',
      },
      {
        title: 'POS',
        href: '/dashboard/pos',
        icon: Store,
      },
      {
        title: 'Invoices',
        href: '/dashboard/invoices',
        icon: FileText,
      },
      {
        title: 'Returns',
        href: '/dashboard/returns',
        icon: RotateCcw,
        badge: '3',
      },
    ],
  },
  {
    title: 'Products',
    href: '#products',
    icon: Package,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: 'All Products',
        href: '/dashboard/products',
        icon: Package,
      },
      {
        title: 'Add Product',
        href: '/dashboard/products/add',
        icon: PlusCircle,
      },
      {
        title: 'Categories',
        href: '/dashboard/categories',
        icon: FolderTree,
      },
      {
        title: 'Reviews',
        href: '/dashboard/reviews',
        icon: Star,
        badge: '5',
      },
      {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: Wallet,
      },
      {
        title: 'Purchases',
        href: '/dashboard/purchases',
        icon: ShoppingBag,
      },
      {
        title: 'Suppliers',
        href: '/dashboard/suppliers',
        icon: Truck,
      },
    ],
  },
  {
    title: 'Customers',
    href: '#customers',
    icon: Users,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: 'All Customers',
        href: '/dashboard/users',
        icon: Users,
      },
      {
        title: 'Customer Groups',
        href: '/dashboard/customer-groups',
        icon: UserCog,
      },
      {
        title: 'Wishlist',
        href: '/dashboard/wishlist',
        icon: Heart,
      },
    ],
  },
  {
    title: 'Marketing',
    href: '#marketing',
    icon: Megaphone,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: 'Campaigns',
        href: '/dashboard/campaigns',
        icon: Megaphone,
      },
      {
        title: 'Coupons',
        href: '/dashboard/coupons',
        icon: Tag,
      },
      {
        title: 'Flash Sales',
        href: '/dashboard/flash-sales',
        icon: Zap,
      },
      {
        title: 'Landing Pages',
        href: '/dashboard/landing-pages',
        icon: Globe,
      },
      {
        title: 'Hero Slides',
        href: '/dashboard/hero',
        icon: ImageIcon,
      },
      {
        title: 'Email Templates',
        href: '/dashboard/email-templates',
        icon: Mail,
      },
      {
        title: 'Abandoned Carts',
        href: '/dashboard/abandoned-carts',
        icon: ShoppingCart,
        badge: '8',
      },
    ],
  },
  {
    title: 'Content',
    href: '#content',
    icon: FileText,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: 'Blog Posts',
        href: '/dashboard/posts',
        icon: FileText,
      },
      {
        title: 'Pages',
        href: '/dashboard/pages',
        icon: FileText,
      },
      {
        title: 'Media Library',
        href: '/dashboard/media',
        icon: FolderOpen,
      },
    ],
  },
  {
    title: 'Reports',
    href: '#reports',
    icon: FileBarChart,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: 'Sales Report',
        href: '/dashboard/reports/sales',
        icon: TrendingUp,
      },
      {
        title: 'Product Report',
        href: '/dashboard/reports/products',
        icon: Package,
      },
      {
        title: 'Customer Report',
        href: '/dashboard/reports/customers',
        icon: Users,
      },
      {
        title: 'Tax Report',
        href: '/dashboard/reports/tax',
        icon: Receipt,
      },
    ],
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    title: 'Communication',
    href: '#communication',
    icon: MessageCircle,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    children: [
      {
        title: 'Live Chat',
        href: '/dashboard/chat',
        icon: MessageCircle,
        badge: '3',
      },
      {
        title: 'Support Tickets',
        href: '/dashboard/tickets',
        icon: LifeBuoy,
        badge: '2',
      },
      {
        title: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ],
  },
  {
    title: 'Logistics',
    href: '#logistics',
    icon: Truck,
    roles: ['ADMIN', 'MANAGER'],
    children: [
      {
        title: 'Shipping Zones',
        href: '/dashboard/shipping-zones',
        icon: MapPin,
      },
      {
        title: 'Delivery Methods',
        href: '/dashboard/delivery-methods',
        icon: Truck,
      },
      {
        title: 'Couriers',
        href: '/dashboard/couriers',
        icon: PackageCheck,
      },
    ],
  },
  {
    title: 'AI Assistant',
    href: '/dashboard/ai',
    icon: Bot,
  },
  {
    title: 'Staff',
    href: '#staff',
    icon: UserCog,
    roles: ['ADMIN'],
    children: [
      {
        title: 'Team Members',
        href: '/dashboard/staff',
        icon: Users,
      },
      {
        title: 'Roles & Permissions',
        href: '/dashboard/permissions',
        icon: Shield,
      },
      {
        title: 'Activity Logs',
        href: '/dashboard/activity-logs',
        icon: ScrollText,
      },
    ],
  },
  {
    title: 'Settings',
    href: '#settings',
    icon: Settings,
    roles: ['ADMIN'],
    children: [
      {
        title: 'General',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        title: 'Store Settings',
        href: '/dashboard/settings/store',
        icon: Store,
      },
      {
        title: 'Payment Gateways',
        href: '/dashboard/settings/payments',
        icon: CreditCard,
      },
      {
        title: 'Tax Settings',
        href: '/dashboard/settings/tax',
        icon: Receipt,
      },
      {
        title: 'Shipping Settings',
        href: '/dashboard/settings/shipping',
        icon: Truck,
      },
      {
        title: 'Email Settings',
        href: '/dashboard/settings/email',
        icon: Mail,
      },
      {
        title: 'SMS Settings',
        href: '/dashboard/settings/sms',
        icon: MessageSquare,
      },
      {
        title: 'Languages',
        href: '/dashboard/settings/languages',
        icon: Globe,
      },
      {
        title: 'Integrations',
        href: '/dashboard/settings/integrations',
        icon: Settings,
      },
      {
        title: 'Backup & Export',
        href: '/dashboard/settings/backup',
        icon: Download,
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState<string | null>(null);

  const user = session?.user;

  // Helper to check if a route is active
  const isPathActive = (href: string) => {
    if (href.startsWith('#')) return false;
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href === '/dashboard') return false; // Don't match /dashboard for sub-routes
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Helper to check if any child of a parent is active
  const isParentActive = (item: SidebarItem) => {
    if (item.children) {
      return item.children.some((child) => isPathActive(child.href));
    }
    return isPathActive(item.href);
  };

  // Automatically expand the parent of the active item
  useEffect(() => {
    if (isCollapsed) return;

    for (const item of sidebarItems) {
      if (item.children && isParentActive(item)) {
        setExpanded(item.title);
        return; // Only expand the first matching parent (though there should only be one)
      }
    }
  }, [pathname, isCollapsed]); // Re-run when pathname changes or sidebar is expanded

  const toggleExpand = (title: string) => {
    if (isCollapsed) return;
    setExpanded((prev) => (prev === title ? null : title));
  };

  const checkRole = (item: SidebarItem) => {
    if (!item.roles) return true;
    return item.roles.some((role) => hasRole(user, role));
  };

  const handleLogout = async () => {
    try {
      const BACKEND_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Backend logout failed', e);
    }
    await signOut({ callbackUrl: '/auth/login' });
  };

  const renderItem = (item: SidebarItem, isMobile = false) => {
    if (!checkRole(item)) return null;

    const isActive = isPathActive(item.href);
    const isParent = isParentActive(item); // True if this item OR any child is active
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded === item.title;

    // Collapsed view - icons only with tooltip
    if (isCollapsed && !isMobile) {
      const menuButton = (
        <Button
          variant={isParent ? 'default' : 'ghost'}
          className={cn(
            'w-full justify-center p-2 h-10 relative',
            isParent
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
          asChild={!hasChildren}
          onClick={() => {
            if (!hasChildren && !isMobile) {
              onClose();
            }
          }}
        >
          {hasChildren ? (
            <div className="relative cursor-pointer">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
            </div>
          ) : (
            <Link href={item.href}>
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          )}
        </Button>
      );

      return (
        <TooltipProvider key={item.title} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{item.title}</span>
              {item.badge && (
                <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
              {hasChildren && <ChevronRight className="h-3 w-3 opacity-50" />}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Expanded view - full menu
    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between font-medium',
              isParent // Highlight parent if any child is active
                ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
            onClick={() => toggleExpand(item.title)}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-transform duration-200',
                  isExpanded && 'rotate-180',
                )}
              />
            </div>
          </Button>

          {/* Submenu with CSS transition */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out relative',
              isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            {/* Vertical Line for Tree View */}
            <div className="absolute left-[22px] top-0 bottom-2 w-px bg-border group-hover:bg-primary/50 transition-colors" />

            <div className="ml-8 space-y-1 py-1">
              {item.children!.map((child) => {
                const isChildActive = isPathActive(child.href);
                return (
                  <div key={child.href} className="relative group">
                    {/* Curved Line Connector */}
                    <div className="absolute -left-3.5 top-[18px] w-3 h-px bg-border group-hover:bg-primary/50 transition-colors" />
                    {/* Optional: Small corner curve */}
                    {/* <div className="absolute -left-3.5 top-0 w-px h-[18px] bg-border group-hover:bg-primary/50" /> */}

                    <Link
                      href={child.href}
                      onClick={() => isMobile && onClose()}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors relative',
                        isChildActive
                          ? 'text-primary bg-primary/5 font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                      )}
                    >
                      {/* <child.icon className="h-4 w-4" /> */}
                      <span className="flex-1">{child.title}</span>
                      {child.badge && (
                        <span className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                          {child.badge}
                        </span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Single Item
    return (
      <Button
        key={item.href}
        variant={isActive ? 'default' : 'ghost'}
        className={cn(
          'w-full justify-start gap-3 font-medium',
          isActive
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
        asChild
        onClick={() => isMobile && onClose()}
      >
        <Link href={item.href}>
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate flex-1">{item.title}</span>
          {item.badge && (
            <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full font-semibold">
              {item.badge}
            </span>
          )}
        </Link>
      </Button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Desktop Expand Button (when collapsed) */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex fixed left-[65px] top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all z-50 items-center justify-center"
        >
          <PanelRight className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex flex-col h-screen w-64 bg-background border-r lg:hidden transition-transform duration-300 ease-in-out overflow-hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b h-16 flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 min-w-0"
            onClick={onClose}
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg truncate">Mahbub Shop</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-3 py-4 space-y-1">
            {sidebarItems.map((item) => renderItem(item, true))}
          </div>
        </ScrollArea>

        {/* Logout */}
        <div className="border-t p-3 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 hidden lg:flex flex-col h-screen bg-background border-r transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0">
          {!isCollapsed ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 min-w-0"
              >
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg truncate">Mahbub Shop</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="flex-shrink-0"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Link href="/dashboard">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Menu */}
        <ScrollArea className="flex-1 min-h-0">
          <div
            className={cn('space-y-1', isCollapsed ? 'px-2 py-4' : 'px-3 py-4')}
          >
            {sidebarItems.map((item) => renderItem(item, false))}
          </div>
        </ScrollArea>

        {/* Logout */}
        <div className="border-t p-3 flex-shrink-0">
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
