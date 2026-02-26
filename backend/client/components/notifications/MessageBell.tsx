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
import { MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const MessageBell = () => {
  const { socket, chatUnreadCount } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { data: session } = useSession();

  const fetchMessages = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=10&unreadOnly=false`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        // Filter only chat messages
        const chatNotis = data.data.notifications.filter((n: any) => n.type === 'NEW_MESSAGE');
        setNotifications(chatNotis);
      }
    } catch (error) {
      console.error('Failed to fetch chat notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNoti = (notification: any) => {
        if (notification.type === 'NEW_MESSAGE') {
            setNotifications((prev) => [notification, ...prev].slice(0, 10));
        }
    };

    socket.on('notification:new', handleNewNoti);

    return () => {
      socket.off('notification:new', handleNewNoti);
    };
  }, [socket]);

  const renderTime = (value: any) => {
    if (!value) return 'just now';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'just now';
    return formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          {chatUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-[10px] font-medium text-white flex items-center justify-center animate-pulse">
              {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Messages</span>
          {chatUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={() => {
                socket?.emit('notification:read-all', 'chat');
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              }}
            >
              Mark as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new messages
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`flex flex-col items-start p-4 cursor-pointer hover:bg-accent ${!n.isRead ? 'bg-primary/5' : ''}`}
                onClick={() => {
                  if (!n.isRead) {
                    socket?.emit('notification:read', n.id);
                  }
                  if (n.data?.conversationId) {
                    router.push(`/dashboard/chat?id=${n.data.conversationId}`);
                  }
                }}
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <span className={`text-sm ${!n.isRead ? 'font-bold text-primary' : 'font-semibold'}`}>{n.title}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {renderTime(n.createdAt)}
                  </span>
                </div>
                <p className={`text-xs ${!n.isRead ? 'text-foreground font-medium' : 'text-muted-foreground'} line-clamp-2 mt-1`}>
                  {n.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
            className="w-full text-center justify-center cursor-pointer text-xs text-primary font-medium"
            onClick={() => router.push('/dashboard/chat')}
        >
          Open Chat Dashboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
