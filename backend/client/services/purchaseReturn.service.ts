export const PurchaseReturnService = {
  getPurchaseReturns: async (token: string, params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchase-returns${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  getPurchaseReturn: async (token: string, id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchase-returns/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  createPurchaseReturn: async (token: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchase-returns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
