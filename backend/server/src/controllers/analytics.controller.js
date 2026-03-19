const analyticsService = require('../services/analytics.service');
const { successResponse, errorResponse } = require('../utils/response');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * Track user event
 * POST /api/analytics/track
 */
exports.trackEvent = async (req, res) => {
  try {
    const eventData = req.body;

    // Extract headers if needed (e.g. user-agent, ip if not in body)
    // However, usually we expect the frontend to send these or we extract here

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Merge with body
    const payload = {
      ...eventData,
      userAgent: eventData.userAgent || userAgent,
      ipAddress: eventData.ipAddress || ipAddress,
      userId: req.user?.id || eventData.userId, // If authenticated via middleware
    };

    // Fire and forget (optional) or wait
    // Ideally we wait to confirm receipt, but for analytics speed is key.
    // Let's await to catch errors for now.
    const result = await analyticsService.trackEvent(payload);

    return res.status(200).json({
      success: true,
      message: 'Event tracked',
      data: { eventId: result?.id },
    });
  } catch (error) {
    console.error('Track event controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track event',
    });
  }
};

const prisma = require('../config/prisma');

/**
 * Get Admin Dashboard Overview
 * GET /api/v1/analytics/overview
 */
exports.getAdminOverview = async (req, res) => {
  try {
    // 1. KPI Cards
    const totalOrders = await prisma.order.count({
      where: { status: { not: 'CANCELLED' } },
    });

    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    const totalProducts = await prisma.product.count();

    // Calculate Total Revenue from all valid orders (Non-cancelled)
    const revenueAggregation = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } },
    });
    const totalRevenue = revenueAggregation._sum.total || 0;

    // 2. Sales Chart Data (Last 7 Days)
    // Including all non-cancelled orders to reflect real activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentValidOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' },
      },
      select: { createdAt: true, total: true },
    });

    const salesByDate = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesByDate[d.toISOString().split('T')[0]] = 0;
    }

    recentValidOrders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (salesByDate[dateStr] !== undefined) {
        salesByDate[dateStr] += order.total;
      }
    });

    const salesChart = Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount,
    }));

    // 3. Recent Orders
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { email: true, username: true } } },
    });

    // 4. Low Stock Alerts
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 10 } }, // Assuming low stock threshold is 10
      take: 5,
      select: { id: true, name: true, stock: true, sku: true, basePrice: true },
    });

    // 5. Top Selling Products
    // Prisma MongoDB driver has issues with complex groupBys. We will use the pre-calculated `soldCount` on Product.
    const topSellingProducts = await prisma.product.findMany({
      orderBy: { soldCount: 'desc' },
      take: 5,
      select: { id: true, name: true, soldCount: true, sellingPrice: true },
    });

    const topProducts = topSellingProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sales: p.soldCount || 0,
      revenue: (p.soldCount || 0) * (p.sellingPrice || 0),
    }));

    return successResponse(res, {
      data: {
        kpi: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
        },
        salesChart,
        recentOrders,
        topProducts,
        lowStockProducts,
      },
      message: 'Dashboard overview data fetched successfully',
    });
  } catch (error) {
    console.error('getAdminOverview error:', error);
    return errorResponse(res, 'Failed to fetch dashboard overview data', 500, error);
  }
};

/**
 * Get Advanced Sales Analytics
 * GET /api/v1/analytics/advanced?startDate=...&endDate=...&groupBy=...
 */
exports.getAdvancedAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  // Default to last 30 days if no dates provided
  let end = new Date();
  let start = new Date();
  start.setDate(end.getDate() - 30);

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // 1. Fetch Orders within date range
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // 2. Aggregate Overall KPIs
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = orders.reduce(
    (sum, order) => sum + order.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  // 3. Time-Series Data for Charts
  const salesByTime = {};
  const getTimeKey = (date) => {
    if (groupBy === 'hour') return date.toISOString().split(':')[0] + ':00';
    if (groupBy === 'week') {
      const d = new Date(date);
      const day = d.getDay() || 7;
      d.setHours(-24 * (day - 1));
      return d.toISOString().split('T')[0];
    }
    if (groupBy === 'month') return date.toISOString().slice(0, 7);
    return date.toISOString().split('T')[0]; // Default: day
  };

  orders.forEach((order) => {
    const timeKey = getTimeKey(order.createdAt);
    if (!salesByTime[timeKey]) {
      salesByTime[timeKey] = { revenue: 0, orders: 0 };
    }
    salesByTime[timeKey].revenue += order.total;
    salesByTime[timeKey].orders += 1;
  });

  const timeSeriesData = Object.entries(salesByTime).map(([time, stats]) => ({
    time,
    revenue: Number(stats.revenue.toFixed(2)),
    orders: stats.orders,
  }));

  // 4. Category Performance
  const categoryStats = {};
  // 5. Product Stats
  const productStats = {};
  // 6. Payment Method Breakdown
  const paymentStats = {};
  // 7. Status Breakdown
  const statusStats = {};

  orders.forEach((order) => {
    // Payment
    const pm = order.paymentMethod || 'UNKNOWN';
    paymentStats[pm] = (paymentStats[pm] || 0) + order.total;

    // Status
    const status = order.status || 'PENDING';
    statusStats[status] = (statusStats[status] || 0) + 1;

    order.items.forEach((item) => {
      if (item.product) {
        // Product Stats
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            id: item.productId,
            name: item.product.name,
            sales: 0,
            revenue: 0,
          };
        }
        productStats[item.productId].sales += item.quantity;
        productStats[item.productId].revenue += item.totalPrice;

        // Category Stats
        const catName = item.product.category?.name || 'Uncategorized';
        if (!categoryStats[catName]) {
          categoryStats[catName] = { name: catName, revenue: 0, count: 0 };
        }
        categoryStats[catName].revenue += item.totalPrice;
        categoryStats[catName].count += item.quantity;
      }
    });
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const categories = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);

  const paymentMethods = Object.entries(paymentStats).map(([method, amount]) => ({
    method,
    amount: Number(amount.toFixed(2)),
  }));

  return successResponse(res, {
    data: {
      kpi: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        totalItemsSold,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
      timeSeriesData,
      topProducts,
      categories,
      paymentMethods,
      statusStats,
    },
    message: 'Advanced Analytics fetched successfully',
  });
});

/**
 * Get Product Specific Analytics
 * GET /api/v1/analytics/products?startDate=...&endDate=...
 */
exports.getProductAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let end = new Date();
  let start = new Date();
  start.setDate(end.getDate() - 30);

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // 1. Fetch all products with their categories and basic stats
  const products = await prisma.product.findMany({
    include: {
      category: true,
      orderItems: {
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            status: { not: 'CANCELLED' },
          },
        },
      },
    },
  });

  // 2. Aggregate Product Stats
  const productData = products.map((product) => {
    const sales = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = product.orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Profit calculation: (sellingPrice - costPrice) * unitsSold
    // Note: Using current prices as snapshot isn't perfect but works for this level of reporting
    const costPrice = product.costPrice || product.basePrice * 0.7; // Fallback if costPrice missing
    const profitPerUnit = product.sellingPrice - costPrice;
    const totalProfit = profitPerUnit * sales;

    // Stock Turnover Rate (Simplified): Sales / Current Stock
    // A more accurate one would be COGS / Average Inventory
    const turnoverRate = product.stock > 0 ? sales / product.stock : sales > 0 ? 1 : 0;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || 'Uncategorized',
      stock: product.stock,
      sales,
      revenue: Number(revenue.toFixed(2)),
      profit: Number(totalProfit.toFixed(2)),
      turnoverRate: Number(turnoverRate.toFixed(2)),
      createdAt: product.createdAt,
    };
  });

  // 3. Identify Slow-moving Products
  // Criteria: Created > 30 days ago AND sales < 5 in the current period
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const slowMoving = productData
    .filter((p) => new Date(p.createdAt) < thirtyDaysAgo && p.sales < 5)
    .sort((a, b) => a.sales - b.sales)
    .slice(0, 10);

  // 4. Top Performing (by Profit)
  const topByProfit = [...productData].sort((a, b) => b.profit - a.profit).slice(0, 10);

  // 5. Overall Product KPIs
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock <= (p.minStockLevel || 10)).length;
  const totalPeriodProfit = productData.reduce((sum, p) => sum + p.profit, 0);
  const avgProfitMargin =
    productData.length > 0
      ? (productData.reduce((sum, p) => sum + (p.revenue > 0 ? p.profit / p.revenue : 0), 0) /
          productData.length) *
        100
      : 0;

  return successResponse(res, {
    data: {
      kpi: {
        totalProducts,
        lowStockCount,
        totalProfit: Number(totalPeriodProfit.toFixed(2)),
        avgProfitMargin: Number(avgProfitMargin.toFixed(1)),
      },
      productPerformance: productData.sort((a, b) => b.revenue - a.revenue),
      topByProfit,
      slowMoving,
    },
    message: 'Product Analytics fetched successfully',
  });
});

/**
 * Export Sales Report (CSV)
 * GET /api/v1/analytics/export?startDate=...&endDate=...
 */
exports.exportSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let end = new Date();
  let start = new Date();
  start.setDate(end.getDate() - 30);

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const csvRows = [
    [
      'Order Number',
      'Date',
      'Customer',
      'Email',
      'Payment Method',
      'Status',
      'Subtotal',
      'Discount',
      'Total',
    ].join(','),
  ];

  orders.forEach((order) => {
    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.guestInfo?.name || order.walkInName || 'Guest';
    const customerEmail = order.user?.email || order.guestInfo?.email || 'N/A';
    const date = order.createdAt.toISOString().split('T')[0];

    csvRows.push(
      [
        order.orderNumber,
        date,
        `"${customerName}"`,
        customerEmail,
        order.paymentMethod,
        order.status,
        order.subtotal,
        order.discountAmount,
        order.total,
      ].join(',')
    );
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=sales_report_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv`
  );

  return res.status(200).send(csvRows.join('\n'));
});

/**
 * Get Customer Specific Analytics
 * GET /api/v1/analytics/customers?startDate=...&endDate=...
 */
exports.getCustomerAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let end = new Date();
  let start = new Date();
  start.setDate(end.getDate() - 30);

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // 1. Fetch Customers
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: {
      orders: {
        where: { status: { not: 'CANCELLED' } },
        select: { total: true, createdAt: true },
      },
    },
  });

  // 2. Metrics Calculation
  let totalSpent = 0;
  let customersWithOrders = 0;
  let repeatCustomersCount = 0;
  const newCustomersInRange = customers.filter(
    (c) => new Date(c.createdAt) >= start && new Date(c.createdAt) <= end
  ).length;

  const topCustomers = customers
    .map((customer) => {
      const orderCount = customer.orders.length;
      const totalAmount = customer.orders.reduce((sum, o) => sum + o.total, 0);

      if (orderCount > 0) {
        customersWithOrders++;
        totalSpent += totalAmount;
      }
      if (orderCount > 1) {
        repeatCustomersCount++;
      }

      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        orderCount,
        totalSpent: Number(totalAmount.toFixed(2)),
        joinedAt: customer.createdAt,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  const clv = customersWithOrders > 0 ? totalSpent / customersWithOrders : 0;

  // 3. Customer Growth (last 30 days or range)
  const growthData = {};
  const current = new Date(start);
  while (current <= end) {
    growthData[current.toISOString().split('T')[0]] = 0;
    current.setDate(current.getDate() + 1);
  }

  customers.forEach((customer) => {
    const dateKey = new Date(customer.createdAt).toISOString().split('T')[0];
    if (growthData[dateKey] !== undefined) {
      growthData[dateKey]++;
    }
  });

  const customerGrowth = Object.entries(growthData).map(([date, count]) => ({
    date,
    count,
  }));

  return successResponse(res, {
    data: {
      kpi: {
        totalCustomers: customers.length,
        newCustomers: newCustomersInRange,
        repeatCustomers: repeatCustomersCount,
        clv: Number(clv.toFixed(2)),
        cac: 0,
      },
      topCustomers,
      customerGrowth,
    },
    message: 'Customer Analytics fetched successfully',
  });
});

/**
 * Get Tax Specific Analytics
 * GET /api/v1/analytics/tax?startDate=...&endDate=...
 */
exports.getTaxAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let end = new Date();
  let start = new Date();
  start.setDate(end.getDate() - 30);

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // 1. Fetch Orders with Tax Info
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { not: 'CANCELLED' },
    },
    select: {
      orderNumber: true,
      createdAt: true,
      subtotal: true,
      vatPercent: true,
      vatAmount: true,
      tax: true,
      total: true,
      billingAddress: true,
    },
  });

  // 2. Metrics Calculation
  let totalTaxCollected = 0;
  let totalTaxableRevenue = 0;
  const taxByRateMap = {};
  const taxByLocationMap = {};
  const taxByPeriodMap = {};

  // Initialize period map (filling gaps)
  const current = new Date(start);
  while (current <= end) {
    taxByPeriodMap[current.toISOString().split('T')[0]] = 0;
    current.setDate(current.getDate() + 1);
  }

  orders.forEach((order) => {
    const orderTax = (order.vatAmount || 0) + (order.tax || 0);
    totalTaxCollected += orderTax;
    totalTaxableRevenue += order.subtotal;

    // By Rate
    const rate = order.vatPercent || 0;
    if (!taxByRateMap[rate]) {
      taxByRateMap[rate] = { rate: `${rate}%`, amount: 0, count: 0 };
    }
    taxByRateMap[rate].amount += orderTax;
    taxByRateMap[rate].count++;

    // By Location (City from Billing Address)
    let location = 'Unknown';
    try {
      const address =
        typeof order.billingAddress === 'string'
          ? JSON.parse(order.billingAddress)
          : order.billingAddress;
      location = address?.city || address?.state || 'Unknown';
    } catch (e) {}

    if (!taxByLocationMap[location]) {
      taxByLocationMap[location] = 0;
    }
    taxByLocationMap[location] += orderTax;

    // By Period
    const dateKey = order.createdAt.toISOString().split('T')[0];
    if (taxByPeriodMap[dateKey] !== undefined) {
      taxByPeriodMap[dateKey] += orderTax;
    }
  });

  const taxByRate = Object.values(taxByRateMap).sort((a, b) => b.amount - a.amount);
  const taxByLocation = Object.entries(taxByLocationMap)
    .map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
  const taxTrends = Object.entries(taxByPeriodMap).map(([date, amount]) => ({
    date,
    amount: Number(amount.toFixed(2)),
  }));

  const avgTaxRate = totalTaxableRevenue > 0 ? (totalTaxCollected / totalTaxableRevenue) * 100 : 0;

  return successResponse(res, {
    data: {
      kpi: {
        totalTaxCollected: Number(totalTaxCollected.toFixed(2)),
        totalTaxableRevenue: Number(totalTaxableRevenue.toFixed(2)),
        avgTaxRate: Number(avgTaxRate.toFixed(2)),
        orderCount: orders.length,
      },
      taxTrends,
      taxByRate,
      taxByLocation,
      detailedReport: orders
        .map((o) => ({
          orderNumber: o.orderNumber,
          date: o.createdAt,
          taxableAmount: o.subtotal,
          taxPercent: o.vatPercent,
          taxAmount: (o.vatAmount || 0) + (o.tax || 0),
          total: o.total,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 50),
    },
    message: 'Tax Analytics fetched successfully',
  });
});

/**
 * Get Comprehensive Site Analytics
 * GET /api/v1/analytics/site?startDate=...&endDate=...
 */
exports.getSiteAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let end = new Date();
  let start = new Date();
  start.setDate(end.getDate() - 30);

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // 1. Real-time Visitors (Activity in last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const realTimeVisitorsCount = await prisma.analyticsEvent
    .groupBy({
      by: ['sessionId'],
      where: {
        timestamp: { gte: fiveMinutesAgo },
      },
    })
    .then((groups) => groups.length);

  // 2. Aggregate Traffic Sources & Sessions
  const sessions = await prisma.analyticsSession.findMany({
    where: {
      startTime: { gte: start, lte: end },
    },
  });

  const trafficSourcesMap = {};
  const geoDistributionMap = {};
  const deviceDistributionMap = {};

  sessions.forEach((session) => {
    const source = session.source || 'Direct';
    if (!trafficSourcesMap[source]) trafficSourcesMap[source] = 0;
    trafficSourcesMap[source]++;

    const country = session.country || 'Unknown';
    if (!geoDistributionMap[country]) geoDistributionMap[country] = 0;
    geoDistributionMap[country]++;

    const device = session.device || 'desktop';
    if (!deviceDistributionMap[device]) deviceDistributionMap[device] = 0;
    deviceDistributionMap[device]++;
  });

  // 3. Conversion Funnel
  // Stages: page_view -> view_item -> add_to_cart -> purchase
  const funnelStages = ['page_view', 'view_item', 'add_to_cart', 'purchase'];
  const funnelData = await Promise.all(
    funnelStages.map(async (stage) => {
      const count = await prisma.analyticsEvent
        .groupBy({
          by: ['sessionId'],
          where: {
            eventName: stage,
            timestamp: { gte: start, lte: end },
          },
        })
        .then((groups) => groups.length);

      return { stage, count };
    })
  );

  // 4. Engagement Metrics
  const totalSessions = sessions.length;
  const totalPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0);
  const avgPageViews = totalSessions > 0 ? totalPageViews / totalSessions : 0;
  const bounceRate =
    totalSessions > 0 ? (sessions.filter((s) => s.pageViews <= 1).length / totalSessions) * 100 : 0;

  return successResponse(res, {
    data: {
      realTime: {
        activeVisitors: realTimeVisitorsCount,
      },
      kpi: {
        totalSessions,
        totalPageViews,
        avgPageViews: Number(avgPageViews.toFixed(2)),
        bounceRate: Number(bounceRate.toFixed(2)),
      },
      funnel: funnelData,
      trafficSources: Object.entries(trafficSourcesMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      geoDistribution: Object.entries(geoDistributionMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      deviceDistribution: Object.entries(deviceDistributionMap).map(([name, value]) => ({
        name,
        value,
      })),
    },
    message: 'Site Analytics fetched successfully',
  });
});
