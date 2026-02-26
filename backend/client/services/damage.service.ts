export const DamageService = {
  createDamageReport: async (token: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/damage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDamageReports: async (token: string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/damage?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  getDamageSummary: async (token: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/damage/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
