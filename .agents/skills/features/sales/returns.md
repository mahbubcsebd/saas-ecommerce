---
name: sales-returns
description: Specialized documentation for Returns and RMA. Covers return policy enforcement (7 days), RMA generation, and refund processing. Use this when working on return requests or refund logic.
---

# sales-returns - Returns & RMA

This module manages product returns and financial refunds.

## Core Rules
- **Return Policy**: Default is 7 days from the `createdAt` date of the order.
- **RMA ID**: Unique identifier (e.g., `RET-001`) generated for each request.
- **Refund Limit**: `refundAmount` cannot exceed the original item price * quantity.

## Flow
1. **Creation**: Customer or Admin creates a request. Status: `PENDING`.
2. **Review**: Admin reviews images/notes. Moves to `APPROVED` or `REJECTED`.
3. **Completion**: If approved, moves to `REFUNDED`. This triggers:
   - **Stock Addition**: Item quantity added back to inventory.
   - **Financial Record**: Update order's payment status to `REFUNDED` or `PARTIALLY_REFUNDED`.

## Components
- **Backend**: `return.controller.js`, `schema.prisma` (`ReturnRequest` model).
- **Dashboard**: `/dashboard/returns`, `ReturnService.ts`.
