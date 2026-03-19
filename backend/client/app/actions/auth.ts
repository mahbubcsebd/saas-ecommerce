'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || 'Login failed' };
    }

    // Set Access Token Cookie for SSR
    const cookieStore = await cookies();
    cookieStore.set('accessToken', data.data.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 15 * 60, // 15 mins
    });

    // Ideally we also forward refreshToken logic, but for now this suffices for Dashboard access.
    return { success: true, message: 'Login successful! Redirecting...' };
  } catch (err) {
    console.error(err);
    return { error: 'Network error. Please try again.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  redirect('/login');
}
