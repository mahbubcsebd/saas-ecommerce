---
name: sales-orders
description: Deep dive into the Order management system. Covers order lifecycle, status transitions, and stock reversal logic. Use this when working on order processing, tracking, or bulk actions.
---

# sales-orders - Order Management

This module handles the complete lifecycle of a customer order.

## Lifecycle & Statuses
1. **PENDING**: Order placed, waiting for payment.
2. **CONFIRMED**: Payment successful.
3. **PROCESSING**: Order being packed.
4. **SHIPPED**: Out for delivery.
5. **DELIVERED**: Successfully received by customer.
6. **CANCELLED**: Order aborted. Trigger's automatic **stock reversal**.

## Key Logic
- **Stock Reversal**: When status changes to `CANCELLED`, the system iterates through `orderItems` and adds quantity back to product stock.
- **Sold Count**: When status changes to `DELIVERED`, the product's `soldCount` is incremented.

## Components & Controllers
- **Backend**: `order.controller.js`, `order.routes.js`
- **Dashboard**: `/dashboard/orders`, `OrderService.ts`
