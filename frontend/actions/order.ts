'use server';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { api } from '@/lib/api-client';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export type OrderState = {
  success?: boolean;
  message?: string;
  orderId?: string;
  errors?: Record<string, string[]>;
};

export async function createOrderAction(
  prevState: OrderState,
  formData: any // Using any for now to allow structured data from the form
): Promise<OrderState> {
  const session = await getServerSession(authOptions);
  
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';

  // Headers need to include token if available
  const headersObj: Record<string, string> = {};
  if (session?.accessToken) {
    headersObj['Authorization'] = `Bearer ${session.accessToken}`;
  }

  // Pass custom security headers so the Express backend can resolve the real client
  if (clientIp) {
    headersObj['x-client-ip'] = clientIp.split(',')[0].trim();
  }
  if (userAgent) {
    headersObj['x-client-device'] = userAgent;
  }

  try {
    const response = await api.post<any>('/orders', formData, {
      headers: headersObj,
    });

    if (response) {
      revalidatePath('/profile/orders');
      return {
        success: true,
        message: 'Order placed successfully.',
        orderId: response.id,
      };
    }

    return { success: false, message: 'Failed to place order.' };
  } catch (error: any) {
    console.error('Order Action Error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred during checkout.',
    };
  }
}
