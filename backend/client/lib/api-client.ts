// lib/api-client.ts
import { getSession } from 'next-auth/react';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api';

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function fetchApiClient<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  // Safe client-side session extraction without Node.js packages dependency
  const session = await getSession();
  const token = (session as any)?.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message
        ? `${errorData.message}`
        : `API Error: ${res.statusText}`,
    );
  }

  const responseFull = await res.json();
  return responseFull;
}
