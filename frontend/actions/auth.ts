'use server';

import { api } from '@/lib/api-client';
import { cookies } from 'next/headers';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function loginAction(prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0].message,
    };
  }

  const { email, password } = result.data;

  try {
    const data = await api.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    });

    if (data.token) {
      const cookieStore = await cookies();
      cookieStore.set('token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return {
        success: true,
        message: 'Login successful',
        user: data.user,
      };
    }

    return {
      success: false,
      message: 'Invalid credentials',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Server error occurred',
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return { success: true };
}
