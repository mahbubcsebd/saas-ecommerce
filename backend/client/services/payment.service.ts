const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface PaymentRecord {
    id: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
    paymentDate: string;
    recordedBy?: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

export const PaymentService = {
    getOrderPayments: async (token: string, orderId: string) => {
        const res = await fetch(`${API_URL}/payments/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.json();
    },

    addOrderPayment: async (token: string, orderId: string, data: { amount: number; paymentMethod: string; transactionId?: string; notes?: string }) => {
        const res = await fetch(`${API_URL}/payments/order/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};
