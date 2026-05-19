const API_URL = typeof window === 'undefined'
  ? 'http://127.0.0.1:5000/api'
  : (process.env.NEXT_PUBLIC_API_URL || 'https://api.mahbuburrahman.xyz/api');

export const UserService = {
  searchUsers: async (token: string, query: string, limit: number = 10) => {
    const res = await fetch(`${API_URL}/user?search=${query}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getUser: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  createUser: async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
