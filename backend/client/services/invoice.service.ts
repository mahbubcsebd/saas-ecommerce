export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string;
    userId?: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    paidDate?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    createdAt: string;
    updatedAt: string;
    order?: any;
    user?: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const InvoiceService = {
    getInvoices: async (token: string, params: { page?: number; limit?: number; search?: string; status?: string } = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.append('page', params.page.toString());
        if (params.limit) query.append('limit', params.limit.toString());
        if (params.search) query.append('search', params.search);
        if (params.status && params.status !== 'ALL') query.append('status', params.status);

        const response = await fetch(`${API_URL}/invoices?${query.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.json();
    },

    generateInvoice: async (token: string, orderId: string) => {
        const response = await fetch(`${API_URL}/invoices/${orderId}/generate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.json();
    },

    sendInvoiceEmail: async (token: string, invoiceId: string) => {
        const response = await fetch(`${API_URL}/invoices/${invoiceId}/send-email`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.json();
    },

    updateInvoiceStatus: async (token: string, invoiceId: string, status: string) => {
        const response = await fetch(`${API_URL}/invoices/${invoiceId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return response.json();
    },

    downloadInvoice: async (token: string, invoiceId: string) => {
        const response = await fetch(`${API_URL}/invoices/${invoiceId}/download`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
    }
};
