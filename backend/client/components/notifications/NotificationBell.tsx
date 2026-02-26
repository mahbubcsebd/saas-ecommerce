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
  AlertTriangle,
  Bell,
  CreditCard,
  ShoppingCart,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const NotificationBell = () => {
  const { socket, unreadCount } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const localUnread = notifications.reduce(
    (acc, n) => acc + (n?.isRead ? 0 : 1),
    0,
  );
  const badgeCount = localUnread > 0 ? localUnread : unreadCount;
  const renderTime = (value: any) => {
    if (!value) return 'just now';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'just now';
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const router = useRouter();
  const { data: session } = useSession();

  const fetchNotifications = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [session?.accessToken]);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gray-900 text-[10px] font-medium text-white flex items-center justify-center">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
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

              if (n.type === 'NEW_ORDER' || n.type === 'ORDER_PLACED') {
                 Icon = ShoppingCart;
                 iconColor = 'text-blue-600';
                 bgColor = 'bg-blue-100 dark:bg-blue-900/20';
              } else if (n.type === 'STOCK_LOW' || n.type === 'STOCK_OUT') {
                 Icon = AlertTriangle;
                 iconColor = 'text-orange-600';
                 bgColor = 'bg-orange-100 dark:bg-orange-900/20';
              } else if (n.type === 'STAFF_LOGIN') {
                 Icon = UserCheck;
                 iconColor = 'text-green-600';
                 bgColor = 'bg-green-100 dark:bg-green-900/20';
              } else if (n.type === 'NEW_CUSTOMER') {
                 Icon = UserPlus;
                 iconColor = 'text-purple-600';
                 bgColor = 'bg-purple-100 dark:bg-purple-900/20';
              } else if (n.type?.startsWith('PAYMENT_')) {
                 Icon = CreditCard;
                 iconColor = 'text-emerald-600';
                 bgColor = 'bg-emerald-100 dark:bg-emerald-900/20';
              }

              return (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start p-3 cursor-pointer mb-1 rounded-md hover:bg-accent ${!n.isRead ? 'bg-muted/50' : ''}`}
                onClick={() => {
                  // Optimistic mark-as-read
                  if (!n.isRead) {
                    setNotifications((prev) =>
                      prev.map((x) =>
                        x.id === n.id ? { ...x, isRead: true } : x,
                      ),
                    );
                    socket?.emit('notification:read', n.id);
                  }

                  if (n.type === 'NEW_MESSAGE' && n.data?.conversationId) {
                      // Should be filtered out, but just in case
                    router.push(`/dashboard/chat?id=${n.data.conversationId}`);
                  } else if (n.data?.orderId) {
                    router.push(`/dashboard/orders/${n.data.orderId}`);
                  } else if (n.data?.productId) {
                    router.push(`/dashboard/products/${n.data.productId}`);
                  } else if (n.data?.userId) {
                    router.push(`/dashboard/users/${n.data.userId}`);
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
        <DropdownMenuItem className="w-full text-center justify-center cursor-pointer text-xs text-primary font-medium">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
