const prisma = require('../../config/prisma');
const NotificationService = require('../../services/notification.service');

module.exports = (io, socket) => {
  // Admin/Staff: Subscribe to order updates
  socket.on('orders:subscribe', () => {
    if (['ADMIN', 'MANAGER', 'STAFF'].includes(socket.user.role)) {
      socket.join('orders:updates');
      socket.emit('orders:subscribed');
    }
  });

  // Real-time order status updates are sent from controllers
  // This is just for listening
};

/**
 * Customer-facing: emit order status update (no staff persistent notify here)
 */
async function emitOrderUpdate(io, orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) return;

    // Notify customer
    if (order.userId) {
      io.to(`user:${order.userId}`).emit('order:update', order);

      // Map status to NotificationType
      let type = 'ORDER_UPDATE'; // Fallback
      let message = `Your order #${order.orderNumber} is now ${order.status}`;

      switch (order.status) {
          case 'PROCESSING': type = 'ORDER_PROCESSING'; message = `Your order #${order.orderNumber} is being packed.`; break;
          case 'SHIPPED': type = 'ORDER_SHIPPED'; message = `Your order #${order.orderNumber} has been shipped.`; break;
          case 'DELIVERED': type = 'ORDER_DELIVERED'; message = `Your order #${order.orderNumber} has been delivered.`; break;
          case 'COMPLETED': type = 'ORDER_DELIVERED'; message = `Your order #${order.orderNumber} is completed.`; break;
          case 'CANCELLED': type = 'ORDER_CANCELLED'; message = `Your order #${order.orderNumber} was cancelled.`; break;
          case 'REFUNDED': type = 'ORDER_REFUND_COMPLETED'; message = `Refund for #${order.orderNumber} completed.`; break;
      }

      await NotificationService.notifyUser(
          order.userId,
          type,
          'Order Update',
          message,
          { orderId: order.id, url: `/orders/${order.id}` }
      );
    }

    // Broadcast order update to staff roles for real-time table updates (no persistent staff notifications here)
    const staffRoles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF', 'STAFFER'];
    staffRoles.forEach((role) =>
      io.to(`role:${role}`).emit('order:update', order),
    );
  } catch (error) {
    console.error('Emit order update error:', error);
  }
}

/**
 * Staff-facing: emit new order placed (persistent staff notifications)
 */
async function emitStaffOrderPlaced(io, orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true } },
      },
    });
    if (!order) return;

    const productNames = order.items
      .map((i) => i.product?.name || 'Item')
      .slice(0, 3);
    const productList =
      productNames.join(', ') +
      (order.items.length > 3 ? ` +${order.items.length - 3} more` : '');

    // Notify Admins
    await NotificationService.notifyAdmins(
        'NEW_ORDER',
        'New Order Received',
        `#${order.orderNumber} · ${productList}`,
        { orderId: order.id },
        ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'STAFF']
    );

    // Real-time broadcast for staff dashboards/tables
    staffRoles.forEach((role) =>
      io.to(`role:${role}`).emit('order:new', order),
    );
  } catch (e) {
    console.error('Emit staff order placed error:', e);
  }
}

module.exports.emitOrderUpdate = emitOrderUpdate;
module.exports.emitStaffOrderPlaced = emitStaffOrderPlaced;
