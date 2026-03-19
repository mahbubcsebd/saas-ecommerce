'use server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { api } from '@/lib/api-client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

export async function markAllNotificationsReadAction() {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await api.post(
      '/notifications/read-all',
      {},
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    revalidatePath('/profile/notifications');
    return { success: true, message: 'All notifications marked as read.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to mark all as read.' };
  }
}

export async function markNotificationReadAction(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Unauthorized' };

  try {
    await api.patch(
      `/notifications/${id}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );
    revalidatePath('/profile/notifications');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to mark as read.' };
  }
}
