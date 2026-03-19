const prisma = require('../config/prisma');

class GroqDashboardAI {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile';

    if (!this.apiKey) {
      console.warn('⚠️ GROQ_API_KEY not found in environment variables');
    }
  }

  /**
   * ==================== SALES & REVENUE ====================
   */
  async getSalesData({ period = 'month', startDate, endDate }) {
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    } else {
      const now = new Date();
      if (period === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { gte: today };
      } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: monthAgo };
      } else if (period === 'year') {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: yearAgo };
      }
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: dateFilter,
        status: { not: 'CANCELLED' },
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        discountAmount: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
      },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

    // Group by date for trend chart
    const dailySales = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, orders: 0 };
      }
      dailySales[date].revenue += order.total;
      dailySales[date].orders += 1;
    });

    // Payment method breakdown
    const paymentBreakdown = {};
    orders.forEach((order) => {
      const method = order.paymentMethod || 'UNKNOWN';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, revenue: 0 };
      }
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].revenue += order.total;
    });

    // Order status breakdown
    const statusBreakdown = {};
    orders.forEach((order) => {
      const status = order.status || 'UNKNOWN';
      if (!statusBreakdown[status]) {
        statusBreakdown[status] = { count: 0, revenue: 0 };
      }
      statusBreakdown[status].count += 1;
      statusBreakdown[status].revenue += order.total;
    });

    return {
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalOrders,
        avgOrderValue: avgOrderValue.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        period,
      },
      dailyTrend: Object.entries(dailySales)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          revenue: parseFloat(data.revenue.toFixed(2)),
          orders: data.orders,
        })),
      paymentMethods: Object.entries(paymentBreakdown).map(([method, data]) => ({
        method,
        count: data.count,
        revenue: parseFloat(data.revenue.toFixed(2)),
      })),
      orderStatus: Object.entries(statusBreakdown).map(([status, data]) => ({
        status,
        count: data.count,
        revenue: parseFloat(data.revenue.toFixed(2)),
      })),
    };
  }

  /**
   * ==================== PRODUCT PERFORMANCE ====================
   */
  async getProductPerformance({ limit = 10, sortBy = 'revenue', categoryId }) {
    const where = categoryId
      ? {
          order: { status: { not: 'CANCELLED' } },
          product: { categoryId },
        }
      : {
          order: { status: { not: 'CANCELLED' } },
        };

    const orderItems = await prisma.orderItem.findMany({
      include: {
        product: {
          include: { category: true },
        },
        order: {
          select: { status: true, createdAt: true },
        },
      },
      where,
    });

    // Group by product
    const productStats = {};
    orderItems.forEach((item) => {
      const productId = item.productId;
      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          name: item.product?.name || 'Unknown Product',
          category: item.product?.category?.name || 'Uncategorized',
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
      }
      productStats[productId].quantity += item.quantity;
      const itemPrice = item.salePrice || item.unitPrice || 0;
      productStats[productId].revenue += itemPrice * item.quantity;
      productStats[productId].orders += 1;
    });

    let products = Object.values(productStats);

    if (sortBy === 'revenue') {
      products.sort((a, b) => b.revenue - a.revenue);
    } else if (sortBy === 'quantity') {
      products.sort((a, b) => b.quantity - a.quantity);
    }

    return products.slice(0, limit).map((p) => ({
      ...p,
      revenue: parseFloat(p.revenue.toFixed(2)),
    }));
  }

  /**
   * ==================== CUSTOMER ANALYTICS ====================
   */
  async getCustomerAnalytics() {
    const [totalCustomers, activeCustomers, orders] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      }),
      prisma.order.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: {
          userId: true,
          total: true,
          createdAt: true,
        },
      }),
    ]);

    // Customer lifetime value
    const customerSpending = {};
    orders.forEach((order) => {
      if (order.userId) {
        if (!customerSpending[order.userId]) {
          customerSpending[order.userId] = { total: 0, orders: 0 };
        }
        customerSpending[order.userId].total += order.total;
        customerSpending[order.userId].orders += 1;
      }
    });

    const spendingValues = Object.values(customerSpending);
    const avgLifetimeValue =
      spendingValues.length > 0
        ? spendingValues.reduce((sum, c) => sum + c.total, 0) / spendingValues.length
        : 0;

    // Top customers
    const topCustomers = await Promise.all(
      Object.entries(customerSpending)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)
        .map(async ([userId, data]) => {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true },
          });
          return {
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            email: user?.email,
            totalSpent: parseFloat(data.total.toFixed(2)),
            orderCount: data.orders,
          };
        })
    );

    return {
      summary: {
        totalCustomers,
        activeCustomers,
        avgLifetimeValue: avgLifetimeValue.toFixed(2),
      },
      topCustomers,
    };
  }

  /**
   * ==================== INVENTORY STATUS ====================
   */
  async getInventoryStatus({ threshold = 10 }) {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        basePrice: true,
        sellingPrice: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });

    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= threshold);
    const outOfStock = products.filter((p) => p.stock === 0);
    const totalValue = products.reduce((sum, p) => {
      const price = p.sellingPrice || p.basePrice || 0;
      return sum + p.stock * price;
    }, 0);

    return {
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalInventoryValue: totalValue.toFixed(2),
      },
      lowStockProducts: lowStock.slice(0, 10).map((p) => ({
        name: p.name,
        category: p.category?.name,
        stock: p.stock,
      })),
      outOfStockProducts: outOfStock.slice(0, 10).map((p) => ({
        name: p.name,
        category: p.category?.name,
      })),
    };
  }

  /**
   * ==================== REVIEWS & RATINGS ====================
   */
  async getReviewAnalytics({ productId, limit = 10 }) {
    const where = productId ? { productId } : {};

    const [reviews, avgRating] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    // Rating distribution
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDist[r.rating]++;
      }
    });

    return {
      summary: {
        averageRating: avgRating._avg.rating?.toFixed(2) || '0',
        totalReviews: avgRating._count,
      },
      ratingDistribution: Object.entries(ratingDist).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
      })),
      recentReviews: reviews.slice(0, 5).map((r) => ({
        userName: `${r.user.firstName} ${r.user.lastName}`,
        productName: r.product.name,
        rating: r.rating,
        comment: r.comment?.substring(0, 100),
        date: r.createdAt.toISOString().split('T')[0],
      })),
    };
  }

  /**
   * ==================== CATEGORY PERFORMANCE ====================
   */
  async getCategoryPerformance() {
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: { status: { not: 'CANCELLED' } },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    const categoryStats = {};
    orderItems.forEach((item) => {
      const categoryName = item.product?.category?.name || 'Uncategorized';
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { revenue: 0, quantity: 0, products: new Set() };
      }
      const itemPrice = item.salePrice || item.unitPrice || 0;
      categoryStats[categoryName].revenue += itemPrice * item.quantity;
      categoryStats[categoryName].quantity += item.quantity;
      categoryStats[categoryName].products.add(item.productId);
    });

    return Object.entries(categoryStats)
      .map(([name, data]) => ({
        category: name,
        revenue: parseFloat(data.revenue.toFixed(2)),
        quantity: data.quantity,
        productCount: data.products.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * ==================== DISCOUNT EFFECTIVENESS ====================
   */
  async getDiscountAnalytics() {
    const [activeDiscounts, discountUsage] = await Promise.all([
      prisma.discount.findMany({
        where: { isActive: true },
        select: {
          name: true,
          code: true,
          type: true,
          value: true,
          usageCount: true,
          usageLimit: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          status: { not: 'CANCELLED' },
          discountAmount: { gt: 0 },
        },
        _sum: { discountAmount: true },
        _count: true,
      }),
    ]);

    return {
      summary: {
        activeDiscounts: activeDiscounts.length,
        totalDiscountGiven: discountUsage._sum.discountAmount?.toFixed(2) || '0',
        ordersWithDiscount: discountUsage._count,
      },
      topDiscounts: activeDiscounts
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map((d) => ({
          name: d.name,
          code: d.code,
          type: d.type,
          value: d.value,
          used: d.usageCount,
          limit: d.usageLimit || 'Unlimited',
        })),
    };
  }

  /**
   * ==================== ORDER ANALYTICS ====================
   */
  async getOrderAnalytics({ period = 'month', status, limit = 20 }) {
    let dateFilter = {};
    const now = new Date();

    if (period === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: today };
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: monthAgo };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: yearAgo };
    }

    const where = {
      createdAt: dateFilter,
      ...(status && { status }),
    };

    const [orders, totalOrders, totalRevenue] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { name: true, category: { select: { name: true } } } },
            },
          },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { total: true, shippingCost: true, discountAmount: true },
      }),
    ]);

    // Calculate delivery times
    const deliveryTimes = [];
    orders.forEach((order) => {
      if (order.deliveredAt && order.createdAt) {
        const days = Math.ceil((order.deliveredAt - order.createdAt) / (1000 * 60 * 60 * 24));
        deliveryTimes.push(days);
      }
    });

    const avgDeliveryTime =
      deliveryTimes.length > 0
        ? (deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length).toFixed(1)
        : 'N/A';

    // Shipping method breakdown
    const shippingMethods = {};
    orders.forEach((order) => {
      const method = order.shippingMethod || 'Standard';
      if (!shippingMethods[method]) {
        shippingMethods[method] = { count: 0, totalCost: 0 };
      }
      shippingMethods[method].count += 1;
      shippingMethods[method].totalCost += order.shippingCost || 0;
    });

    // Source breakdown (ONLINE vs POS)
    const sourceBreakdown = {};
    orders.forEach((order) => {
      const source = order.source || 'ONLINE';
      if (!sourceBreakdown[source]) {
        sourceBreakdown[source] = { count: 0, revenue: 0 };
      }
      sourceBreakdown[source].count += 1;
      sourceBreakdown[source].revenue += order.total;
    });

    // Recent orders with details
    const recentOrders = orders.slice(0, 10).map((order) => ({
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      customer: order.user
        ? `${order.user.firstName} ${order.user.lastName}`
        : order.guestInfo?.name || order.walkInName || 'Guest',
      email: order.user?.email || order.guestInfo?.email,
      total: parseFloat(order.total.toFixed(2)),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingMethod: order.shippingMethod,
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString().split('T')[0],
      deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString().split('T')[0] : null,
    }));

    // Top selling products from orders
    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productName = item.product?.name || 'Unknown';
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            category: item.product?.category?.name || 'Uncategorized',
            quantity: 0,
            revenue: 0,
            orders: 0,
          };
        }
        productSales[productName].quantity += item.quantity;
        productSales[productName].revenue += item.total;
        productSales[productName].orders += 1;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        revenue: parseFloat(p.revenue.toFixed(2)),
      }));

    return {
      summary: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total?.toFixed(2) || '0',
        totalShippingCost: totalRevenue._sum.shippingCost?.toFixed(2) || '0',
        totalDiscountGiven: totalRevenue._sum.discountAmount?.toFixed(2) || '0',
        avgDeliveryTime: avgDeliveryTime + ' days',
        period,
      },
      recentOrders,
      topProducts,
      shippingMethods: Object.entries(shippingMethods).map(([method, data]) => ({
        method,
        count: data.count,
        avgCost: (data.totalCost / data.count).toFixed(2),
      })),
      sourceBreakdown: Object.entries(sourceBreakdown).map(([source, data]) => ({
        source,
        count: data.count,
        revenue: parseFloat(data.revenue.toFixed(2)),
      })),
    };
  }

  /**
   * ==================== AI CHAT ====================
   */
  async chat(query, sessionId, userId) {
    try {
      if (!this.apiKey) {
        throw new Error('GROQ_API_KEY is not configured');
      }

      // Get conversation history
      const history = await prisma.chatMessage.findMany({
        where: {
          sessionId,
          type: 'ADMIN',
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      // Detect query intent and fetch relevant data
      const contextData = await this.fetchRelevantData(query);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(contextData);

      // Build messages
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role === 'USER' ? 'user' : 'assistant',
          content: h.content,
        })),
        { role: 'user', content: query },
      ];

      // Call Groq API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Groq API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to get response from AI');
      }

      const data = await response.json();
      const aiResponse =
        data.choices?.[0]?.message?.content ||
        "I'm sorry, I couldn't process that question right now.";

      // Save to database
      await prisma.chatMessage.createMany({
        data: [
          {
            sessionId,
            role: 'USER',
            content: query,
            type: 'ADMIN',
            userId,
          },
          {
            sessionId,
            role: 'ASSISTANT',
            content: aiResponse,
            type: 'ADMIN',
            metadata: {
              dataUsed: Object.keys(contextData),
              model: this.model,
            },
          },
        ],
      });

      // Generate charts from data
      const charts = this.generateCharts(contextData);

      return {
        response: aiResponse,
        data: contextData,
        charts,
      };
    } catch (error) {
      console.error('Groq dashboard AI error:', error);
      return {
        response:
          'I apologize, but I encountered an error processing your request. Please try again.',
        error: error.message,
        data: {},
        charts: [],
      };
    }
  }

  /**
   * Fetch relevant data based on query keywords
   */
  async fetchRelevantData(query) {
    const queryLower = query.toLowerCase();
    const data = {};

    // Sales & Revenue
    if (queryLower.match(/sales|revenue|income|earning|profit/)) {
      data.sales = await this.getSalesData({ period: 'month' });
    }

    // Products
    if (queryLower.match(/product|selling|top|best|popular/)) {
      data.products = await this.getProductPerformance({ limit: 10 });
    }

    // Customers
    if (queryLower.match(/customer|client|user|buyer/)) {
      data.customers = await this.getCustomerAnalytics();
    }

    // Inventory
    if (queryLower.match(/inventory|stock|warehouse/)) {
      data.inventory = await this.getInventoryStatus({ threshold: 10 });
    }

    // Reviews
    if (queryLower.match(/review|rating|feedback/)) {
      data.reviews = await this.getReviewAnalytics({ limit: 10 });
    }

    // Categories
    if (queryLower.match(/category|categories|segment/)) {
      data.categories = await this.getCategoryPerformance();
    }

    // Discounts
    if (queryLower.match(/discount|coupon|promo|offer/)) {
      data.discounts = await this.getDiscountAnalytics();
    }

    // Orders (comprehensive)
    if (queryLower.match(/order|purchase|transaction|delivery|shipping/)) {
      data.orders = await this.getOrderAnalytics({ period: 'month', limit: 20 });
    }

    return data;
  }

  /**
   * Build system prompt with data context
   */
  buildSystemPrompt(contextData) {
    let prompt = `You are an AI analytics assistant for an e-commerce dashboard.

**CRITICAL INSTRUCTIONS:**
1. **Language**: Respond in the user's language naturally (বাংলা, English, etc.) - NOT translated, but native
2. **Formatting**: Use markdown formatting:
   - **Bold** for emphasis
   - *Italic* for subtle points
   - Bulleted lists for items
   - **Tables** for comparisons (use markdown table syntax)
3. **Charts**: DO NOT create text-based charts or ASCII art charts
   - Charts will be automatically generated from the data
   - Just describe insights and trends in text
4. **Tables**: When showing comparisons or lists, USE MARKDOWN TABLES:
   Example:
   | Product | Revenue | Units |
   |---------|---------|-------|
   | Item 1  | 5,000   | 10    |
   | Item 2  | 3,000   | 8     |
5. **Numbers**: Format with commas (e.g., 50,000 not 50000)
6. **Length**: Keep responses concise (2-4 paragraphs max)
7. **Insights**: Focus on actionable recommendations and trends

**Available Data:**\n`;

    // Add data summaries
    if (contextData.sales) {
      prompt += `\n**Sales (Last Month):**
- Revenue: ${contextData.sales.summary.totalRevenue} BDT
- Orders: ${contextData.sales.summary.totalOrders}
- Avg Order: ${contextData.sales.summary.avgOrderValue} BDT\n`;
    }

    if (contextData.products) {
      prompt += `\n**Top 5 Products:**\n`;
      contextData.products.slice(0, 5).forEach((p, i) => {
        prompt += `${i + 1}. ${p.name} - ${p.revenue} BDT (${p.quantity} units)\n`;
      });
    }

    if (contextData.customers) {
      prompt += `\n**Customers:**
- Total: ${contextData.customers.summary.totalCustomers}
- Active: ${contextData.customers.summary.activeCustomers}
- Avg Lifetime Value: ${contextData.customers.summary.avgLifetimeValue} BDT\n`;
    }

    if (contextData.inventory) {
      prompt += `\n**Inventory:**
- Total Products: ${contextData.inventory.summary.totalProducts}
- Low Stock: ${contextData.inventory.summary.lowStockCount}
- Out of Stock: ${contextData.inventory.summary.outOfStockCount}\n`;
    }

    if (contextData.reviews) {
      prompt += `\n**Reviews:**
- Average Rating: ${contextData.reviews.summary.averageRating}/5
- Total Reviews: ${contextData.reviews.summary.totalReviews}\n`;
    }

    if (contextData.categories) {
      prompt += `\n**Top Categories:**\n`;
      contextData.categories.slice(0, 3).forEach((c, i) => {
        prompt += `${i + 1}. ${c.category} - ${c.revenue} BDT\n`;
      });
    }

    if (contextData.discounts) {
      prompt += `\n**Discounts:**
- Active: ${contextData.discounts.summary.activeDiscounts}
- Total Given: ${contextData.discounts.summary.totalDiscountGiven} BDT\n`;
    }

    if (contextData.orders) {
      prompt += `\n**Orders:**
- Total Orders: ${contextData.orders.summary.totalOrders}
- Total Revenue: ${contextData.orders.summary.totalRevenue} BDT
- Avg Delivery Time: ${contextData.orders.summary.avgDeliveryTime}
- Shipping Cost: ${contextData.orders.summary.totalShippingCost} BDT\n`;

      if (contextData.orders.recentOrders && contextData.orders.recentOrders.length > 0) {
        prompt += `\n**Recent Orders (Top 5):**\n`;
        contextData.orders.recentOrders.slice(0, 5).forEach((o, i) => {
          prompt += `${i + 1}. ${o.orderNumber} - ${o.customer} - ${o.total} BDT (${o.status})\n`;
        });
      }
    }

    prompt += `\n**Remember**:
- Use markdown tables for data comparisons
- Charts will be auto-generated - don't create text charts
- Provide insights and actionable recommendations
- Keep response natural in user's language`;

    return prompt;
  }

  /**
   * Generate chart configurations from data
   */
  generateCharts(contextData) {
    const charts = [];

    // Sales trend chart
    if (contextData.sales?.dailyTrend) {
      charts.push({
        type: 'line',
        title: 'Sales Trend',
        data: contextData.sales.dailyTrend,
        xAxis: 'date',
        yAxis: 'revenue',
        config: {
          label: 'Revenue (BDT)',
          color: '#3b82f6',
        },
      });
    }

    // Payment method breakdown pie chart
    if (contextData.sales?.paymentMethods && contextData.sales.paymentMethods.length > 0) {
      charts.push({
        type: 'pie',
        title: 'Sales by Payment Method',
        data: contextData.sales.paymentMethods.map((pm) => ({
          label: pm.method,
          value: pm.revenue,
        })),
        config: {
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
        },
      });
    }

    // Order status breakdown pie chart
    if (contextData.sales?.orderStatus && contextData.sales.orderStatus.length > 0) {
      charts.push({
        type: 'pie',
        title: 'Orders by Status',
        data: contextData.sales.orderStatus.map((os) => ({
          label: os.status,
          value: os.count,
        })),
        config: {
          colors: ['#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        },
      });
    }

    // Top products chart
    if (contextData.products && contextData.products.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Top Products by Revenue',
        data: contextData.products.slice(0, 10),
        xAxis: 'name',
        yAxis: 'revenue',
        config: {
          label: 'Revenue (BDT)',
          color: '#10b981',
        },
      });
    }

    // Category performance pie chart
    if (contextData.categories && contextData.categories.length > 0) {
      charts.push({
        type: 'pie',
        title: 'Revenue by Category',
        data: contextData.categories.slice(0, 5).map((c) => ({
          label: c.category,
          value: c.revenue,
        })),
        config: {
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        },
      });
    }

    // Rating distribution
    if (contextData.reviews?.ratingDistribution) {
      charts.push({
        type: 'bar',
        title: 'Rating Distribution',
        data: contextData.reviews.ratingDistribution,
        xAxis: 'rating',
        yAxis: 'count',
        config: {
          label: 'Number of Reviews',
          color: '#f59e0b',
        },
      });
    }

    return charts;
  }
}

module.exports = new GroqDashboardAI();
