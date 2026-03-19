'use client';

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/actions/notifications';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
  data?: Record<string, any>;
};

interface NotificationListProps {
  initialNotifications: NotificationItem[];
  unreadOnly: boolean;
  onToggleUnread: () => void;
}

export default function NotificationList({
  initialNotifications: notifications,
  unreadOnly,
  onToggleUnread,
}: NotificationListProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const renderTime = (value: any) => {
    if (!value) return 'just now';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'just now';
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const handleMarkAllRead = async () => {
    setIsPending(true);
    const result = await markAllNotificationsReadAction();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsPending(false);
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationReadAction(id);
  };

  const navigateFromNotification = (n: NotificationItem) => {
    const url = n?.data?.url as string | undefined;
    if (url) {
      router.push(url);
      return;
    }
    if (n.type === 'ORDER_UPDATE' && n?.data?.orderId) {
      router.push(`/orders/${n.data.orderId}`);
      return;
    }
    if (
      (n.type === 'PRICE_DROP' || n.type === 'PRODUCT_BACK_IN_STOCK') &&
      (n?.data?.slug || n?.data?.productSlug)
    ) {
      const slug = n.data.slug || n.data.productSlug;
      router.push(`/products/${slug}`);
      return;
    }
    if ((n.type || '').startsWith('PAYMENT_') && n?.data?.orderId) {
      router.push(`/orders/${n.data.orderId}`);
      return;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            onClick={onToggleUnread}
            disabled={isPending}
          >
            {unreadOnly ? 'Showing Unread' : 'Show Unread'}
          </Button>
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={isPending || notifications.every((n) => n.isRead)}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg">
          No notifications found
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 rounded-lg border transition-colors ${n.isRead ? 'bg-muted/30' : 'bg-card shadow-sm border-primary/20'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {renderTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigateFromNotification(n)}>
                    Open
                  </Button>
                  {!n.isRead && (
                    <Button size="sm" variant="outline" onClick={() => handleMarkRead(n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
