export const SupplierPaymentService = {
  createPayment: async (token: string, data: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/supplier-payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getLedger: async (token: string, supplierId: string, params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/supplier-payments/ledger/${supplierId}${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  }
};
