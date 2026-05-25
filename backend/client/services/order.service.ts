const API_URL = typeof window === 'undefined'
  ? 'http://127.0.0.1:5000/api'
  : (process.env.NEXT_PUBLIC_API_URL);

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
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'PARTIAL';
  paymentMethod: string;
  total: number;
  subtotal: number;
  dueAmount?: number;
  tenderedAmount?: number;
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
  ipAddress?: string;
  deviceInfo?: string;
  customerStats?: {
    total: number;
    delivered: number;
    cancelled: number;
    successRate: number;
    resolvedCount: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  // API returns productName, but keeping name as optional fallback
  productName?: string;
  name?: string;
  sku: string;
  quantity: number;
  unitPrice?: number;   // API field
  salePrice?: number;   // legacy/fallback
  totalPrice?: number;  // API field
  total?: number;       // legacy/fallback
  returnedQuantity?: number;
  isRefunded?: boolean;
  warranty?: string | null;
  product?: {
    id?: string;
    name: string;
    slug: string;
    images: string[];
    brand?: string;
    sellingPrice?: number;
  };
  variant?: {
    name: string;
    images: string[];
  } | null;
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

  blockClient: async (token: string, type: 'IP' | 'DEVICE', value: string, reason?: string) => {
    const res = await fetch(`${API_URL}/orders/admin/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, value, reason }),
    });
    return res.json();
  },

  getBlockedClients: async (token: string) => {
    const res = await fetch(`${API_URL}/orders/admin/blocked`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  unblockClient: async (token: string, id: string) => {
    const res = await fetch(`${API_URL}/orders/admin/block/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};

