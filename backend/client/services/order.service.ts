const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface Order {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  userId?: string;
  source: 'ONLINE' | 'POS';
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'COMPLETED'
    | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: string;
  total: number;
  subtotal: number;
  discountAmount?: number;
  shippingCost?: number;
  vatAmount?: number;
  items: OrderItem[];
  user?: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
  guestInfo?: any;
  walkInName?: string;
  walkInPhone?: string;
  shippingAddress?: any;
  createdAt: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  total: number;
  product?: {
    name: string;
    slug: string;
    images: string[];
  };
  variant?: {
    name: string;
    images: string[];
  };
}

export interface OrderParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}

export const OrderService = {
  getAllOrders: async (token: string, params: OrderParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL')
      query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.paymentMethod)
      query.append('paymentMethod', params.paymentMethod);

    const res = await fetch(`${API_URL}/orders/admin/all?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getOrder: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  updateStatus: async (token: string, id: string, status: string) => {
    const res = await fetch(`${API_URL}/orders/admin/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  getMyOrders: async (token: string) => {
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  downloadInvoice: async (token: string, orderId: string) => {
    const res = await fetch(`${API_URL}/invoices/${orderId}/download`, {
      // Correct endpoint based on invoice.routes.js
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to download invoice');
    return res.blob();
  },

  bulkUpdateStatus: async (token: string, ids: string[], status: string) => {
    const res = await fetch(`${API_URL}/orders/admin/bulk-status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids, status }),
    });
    return res.json();
  },

  createOrder: async (token: string, payload: any) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
