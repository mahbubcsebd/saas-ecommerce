export const InventoryService = {
  // Reports
  getOverview: async (token: string) => {
    const [valueRes, lowStockRes, outOfStockRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/value`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/reports/low-stock`, {
          headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/reports/out-of-stock`, {
          headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const value = await valueRes.json();
    const lowStock = await lowStockRes.json();
    const outOfStock = await outOfStockRes.json();

    return {
      value: value.data,
      lowStock: lowStock.data,
      outOfStock: outOfStock.data
    };
  },

  getMovements: async (token: string, params: any) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/movements?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  adjustStock: async (token: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/adjust`, {
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
