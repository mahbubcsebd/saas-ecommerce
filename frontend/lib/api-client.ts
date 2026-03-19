const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

type FetchOptions = RequestInit & {
  tags?: string[];
  revalidate?: number;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiClient<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { tags, revalidate, ...rest } = options;

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(rest.headers);
  const isFormData =
    rest.body instanceof FormData ||
    (rest.body && typeof rest.body === 'object' && rest.body.constructor?.name === 'FormData') ||
    (rest.body && typeof (rest.body as any).append === 'function');

  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject locale header
  if (typeof window === 'undefined') {
    try {
      // Dynamic import to avoid client-side bundling issues
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const locale = cookieStore.get('next-locale')?.value || 'en';
      headers.set('x-lang', locale);
    } catch (e) {
      console.error('Failed to read cookies on server', e);
    }
  } else {
    // Client-side: read from document.cookie
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/next-locale=([^;]+)/);
      if (match) headers.set('x-lang', match[1]);
    }
  }

  const response = await fetch(url, {
    ...rest,
    method: rest.method || 'GET',
    headers,
    body: isFormData ? (rest.body as any) : JSON.stringify(rest.body),
    credentials: 'include',
    next: {
      tags,
      revalidate,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error' };
    }
    throw new ApiError(response.status, errorData.message || 'Something went wrong', errorData);
  }

  const json = await response.json();
  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any, options?: FetchOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    }),

  put: <T>(endpoint: string, body: any, options?: FetchOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    }),

  patch: <T>(endpoint: string, body: any, options?: FetchOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
