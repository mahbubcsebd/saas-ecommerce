'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
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

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchNotifications = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications?limit=50&unreadOnly=${unreadOnly}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, unreadOnly]);

  const renderTime = (value: any) => {
    if (!value) return 'just now';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'just now';
    return formatDistanceToNow(d, { addSuffix: true });
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent fail
    }
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
    if ((n.type === 'PRICE_DROP' || n.type === 'PRODUCT_BACK_IN_STOCK') && (n?.data?.slug || n?.data?.productSlug)) {
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
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button variant={unreadOnly ? 'default' : 'outline'} onClick={() => setUnreadOnly((p) => !p)}>
            {unreadOnly ? 'Showing Unread' : 'Show Unread'}
          </Button>
          <Button variant="outline" onClick={markAllRead} disabled={notifications.every((n) => n.isRead)}>
            Mark all as read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-muted-foreground">No notifications</div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`p-4 rounded-lg border ${n.isRead ? 'bg-muted/30' : 'bg-card'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">{renderTime(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => navigateFromNotification(n)}>
                        Open
                      </Button>
                      {!n.isRead && (
                        <Button size="sm" variant="outline" onClick={() => markOneRead(n.id)}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

