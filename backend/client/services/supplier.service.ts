export const SupplierService = {
  getSuppliers: async (token: string, params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  getSupplier: async (token: string, id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  createSupplier: async (token: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSupplier: async (token: string, id: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteSupplier: async (token: string, id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/suppliers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
