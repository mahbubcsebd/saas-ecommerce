'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    CheckCircle2,
    CreditCard,
    Package,
    PartyPopper,
    ShieldAlert,
    ShoppingBag,
    TrendingDown
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const NotificationBell = () => {
  const { socket, unreadCount } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const { data: session } = useSession();
  const router = useRouter();
  const renderTime = (value: any) => {
    if (!value) return 'just now';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'just now';
    return formatDistanceToNow(d, { addSuffix: true });
  };
  const localUnread = notifications.reduce(
    (acc, n) => acc + (n?.isRead ? 0 : 1),
    0,
  );
  const badgeCount = localUnread > 0 ? localUnread : unreadCount;

  const fetchNotifications = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('notification:new', (notification: any) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 10));
      toast.info(notification.title, {
        description: notification.message,
      });
    });

    return () => {
      socket.off('notification:new');
    };
  }, [socket]);

  useEffect(() => {
    fetchNotifications();
  }, [session?.accessToken]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-in zoom-in">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 z-[100]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {badgeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => {
                // Optimistic UI: mark all read locally
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true })),
                );
                socket?.emit('notification:read-all');
              }}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications
            .filter((n) => n.type !== 'NEW_MESSAGE')
            .map((n) => {
              let Icon = Bell;
              let iconColor = 'text-primary';
              let bgColor = 'bg-primary/10';

              if (n.type?.startsWith('ORDER_')) {
                 Icon = n.type === 'ORDER_DELIVERED' ? CheckCircle2 : Package;
                 iconColor = 'text-blue-600';
                 bgColor = 'bg-blue-100 dark:bg-blue-900/20';
              } else if (n.type?.startsWith('PAYMENT_')) {
                 Icon = CreditCard;
                 iconColor = n.type === 'PAYMENT_FAILED' ? 'text-red-600' : 'text-green-600';
                 bgColor = n.type === 'PAYMENT_FAILED' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20';
              } else if (n.type === 'PRICE_DROP') {
                 Icon = TrendingDown;
                 iconColor = 'text-green-600';
                 bgColor = 'bg-green-100 dark:bg-green-900/20';
              } else if (n.type === 'PRODUCT_BACK_IN_STOCK') {
                 Icon = ShoppingBag;
                 iconColor = 'text-amber-600';
                 bgColor = 'bg-amber-100 dark:bg-amber-900/20';
              } else if (n.type === 'WELCOME') {
                 Icon = PartyPopper;
                 iconColor = 'text-purple-600';
                 bgColor = 'bg-purple-100 dark:bg-purple-900/20';
              } else if (n.type === 'LOGIN_NEW_DEVICE') {
                 Icon = ShieldAlert;
                 iconColor = 'text-orange-600';
                 bgColor = 'bg-orange-100 dark:bg-orange-900/20';
              }

              return (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start p-3 cursor-pointer mb-1 rounded-md ${!n.isRead ? 'bg-muted/50' : ''}`}
                onClick={() => {
                  if (!n.isRead) {
                    setNotifications((prev) =>
                      prev.map((x) =>
                        x.id === n.id ? { ...x, isRead: true } : x,
                      ),
                    );
                    socket?.emit('notification:read', n.id);
                  }
                  const url = n?.data?.url as string | undefined;
                  if (url) {
                    router.push(url);
                    return;
                  }
                  if (n?.type?.startsWith('ORDER_') && n?.data?.orderId) {
                    router.push(`/orders/${n.data.orderId}`);
                    return;
                  }
                  if (
                    (n?.type === 'PRICE_DROP' ||
                      n?.type === 'PRODUCT_BACK_IN_STOCK') &&
                    (n?.data?.slug || n?.data?.productSlug)
                  ) {
                    const slug = n.data.slug || n.data.productSlug;
                    router.push(`/products/${slug}`);
                    return;
                  }
                }}
              >
                <div className="flex w-full gap-3">
                   <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${bgColor} ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                   </div>
                   <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {renderTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                   </div>
                </div>
              </DropdownMenuItem>
            )})
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="w-full text-center justify-center cursor-pointer text-xs text-primary font-medium p-2"
        >
          <Link href="/profile/notifications">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
