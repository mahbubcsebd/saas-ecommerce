---
name: database
description: Database schema and patterns for Mahbub Shop. Covers MongoDB/Prisma usage, core collections, and inventory adjustment patterns. Use this skill when modifying schemas or implementing data flow.
---

# database - Database Schema & Patterns

This document describes the data layer for Mahbub Shop.

## Tech Stack
- **Engine**: MongoDB (Atlas)
- **ORM**: Prisma Client

## Core Collections
- **User**: Authentication, profile, and roles.
- **Product**: Catalog data including variants, stock, and descriptions.
- **Order**: Transaction records, items, and status history.
- **ReturnRequest**: RMA data, reasons, and status tracking.
- **Invoice**: Financial snapshots of orders.

## Common Patterns
### 1. Stock Movements
Every change in inventory (Sale, Return, Adjustment) must be logged in the `StockMovement` collection.
```javascript
await prisma.stockMovement.create({
  data: {
    productId,
    type: "SALE",
    quantity: -itemQty,
    previousQty,
    newQty: previousQty - itemQty,
    reason: `Order #${orderNumber}`
  }
});
```

### 2. Soft-Deletion (Where Applicable)
Most records use an `isActive` or `status` field instead of hard deleting to maintain historical integrity (especially for Orders and Invoices).
