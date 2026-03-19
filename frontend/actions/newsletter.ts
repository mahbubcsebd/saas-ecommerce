'use server';

import { api } from '@/lib/api-client';
import { revalidatePath } from 'next/cache';

export type NewsletterState = {
  success?: boolean;
  message?: string;
  errors?: {
    email?: string[];
  };
};

export async function subscribeToNewsletter(
  prevState: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
      errors: {
        email: ['Invalid email format'],
      },
    };
  }

  try {
    await api.post('/newsletter/subscribe', { email });

    revalidatePath('/');
    return {
      success: true,
      message: 'Thank you for subscribing to our newsletter!',
    };
  } catch (error: any) {
    console.error('Newsletter Subscription Error:', error);

    return {
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        'Failed to subscribe. Please try again later.',
    };
  }
}
