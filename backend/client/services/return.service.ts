export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  amount: number;
  quantity: number;
  images: string[];
  rmaId: string;
  adminNotes?: string;
  createdAt: string;
}

export interface ReturnParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}


export const ReturnService = {
  getAllReturns: async (token: string, params: ReturnParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return res.json();
  },

  getReturn: async (token: string, id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.json();
  },

  createReturn: async (token: string, data: any) => {
      // Assuming FormData will be sent to handle images
      const isFormData = data instanceof FormData;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns`, {
        method: "POST",
        headers: {
             Authorization: `Bearer ${token}`,
             ...(isFormData ? {} : { "Content-Type": "application/json" })
        },
        body: isFormData ? data : JSON.stringify(data)
      });

      return res.json();
  },

  updateStatus: async (token: string, id: string, status: string, adminNotes?: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, adminNotes })
    });
    return res.json();
  }
};
