import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import NotificationList from '@/components/profile/NotificationList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ unreadOnly?: string }>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const { unreadOnly } = await searchParams;
  const isUnreadOnly = unreadOnly === 'true';

  if (!session) {
    redirect('/auth/login?callbackUrl=/profile/notifications');
  }

  let notifications = [];
  try {
    const data = await api.get<any>(`/notifications?limit=50&unreadOnly=${isUnreadOnly}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      revalidate: 0,
    });
    notifications = data?.notifications || [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationList
            initialNotifications={notifications}
            unreadOnly={isUnreadOnly}
            // Logic for toggle: Just a simple link or redirect in a real app,
            // but for this component we'll pass a function that client can handle
            // or just use a link to refresh the RSC
            onToggleUnread={async () => {
              'use server';
              redirect(`/profile/notifications?unreadOnly=${!isUnreadOnly}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
