export interface AnalyticsOverview {
  kpi: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
  };
  salesChart: Array<{
    date: string;
    amount: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user?: {
      email: string;
      username: string;
    };
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    basePrice: number;
  }>;
}

export const DashboardService = {
  getOverviewStats: async (token: string): Promise<{ success: boolean; data?: AnalyticsOverview; message?: string }> => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/overview`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      return await res.json();
    } catch (error) {
      console.error("Failed to fetch overview stats:", error);
      return { success: false, message: "Network error" };
    }
  }
};
