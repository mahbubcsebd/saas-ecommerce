// lib/api.ts
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export async function fetchApi<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const session = await getServerSession(authOptions);
  // Extract token from session. Ensure your session callback puts accessToken in session.accessToken
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
    cache: options.cache || 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) {
      console.warn('Unauthorized request to', path);
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message
        ? `${errorData.message} (${JSON.stringify(errorData.error)})`
        : `API Error: ${res.statusText}`,
    );
  }

  const responseFull = await res.json();
  return responseFull;
}

// User Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER' | 'USER'; // USER is legacy
  avatar?: string;
  bio?: string;
  website?: string;
  isActive?: boolean;
  status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  orderCount?: number;
  totalSpent?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: {
    name: string;
    images?: string[];
    sellingPrice?: number;
    slug: string;
  };
  variant?: {
    id: string;
    name: string;
    sellingPrice?: number;
  };
}

export interface Cart {
  id: string;
  userId?: string;
  user?: User;
  items: CartItem[];
  subtotal: number;
  total: number;
  recoveryEmailSentAt?: string;
  recoveryEmailCount: number;
  isRecovered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
