export const PurchaseService = {
  getPurchases: async (token: string, params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  getPurchase: async (token: string, id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  createPurchase: async (token: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deletePurchase: async (token: string, id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  updatePurchase: async (token: string, id: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
