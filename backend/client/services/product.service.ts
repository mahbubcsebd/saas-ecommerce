const API_URL = typeof window === 'undefined'
  ? 'http://127.0.0.1:5000/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api');

export const ProductService = {
  getProducts: async (token?: string, params?: any) => {
    // Filter out undefined or null params
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v != null && v !== ''),
        )
      : {};

    const query =
      Object.keys(cleanParams).length > 0
        ? `?${new URLSearchParams(cleanParams as any).toString()}`
        : '';

    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}/products${query}`, { headers });
    return res.json();
  },

  getProduct: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createProduct: async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateProduct: async (token: string, id: string, data: any) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteProduct: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};
