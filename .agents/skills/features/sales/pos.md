---
name: sales-pos
description: Documentation for the Point of Sale system. Covers barcode scanning, rapid checkout, and thermal receipt printing. Use this when working on the in-store sales interface.
---

# sales-pos - Point of Sale (POS)

In-store sales interface for physical retail operations.

## Key Features
- **Rapid Checkout**: One-click "Confirm Order" for cash transactions.
- **Barcode Support**: Direct SKU input via scanner.
- **Thermal Printing**: Specialized CSS/Layout for receipt printers.
- **Customer Search**: Live search for existing members or guest checkout.

## Technical Details
- **Frontend**: `POSPage.tsx`, Uses `OrderService` to create orders with `type: 'POS'`.
- **Payment**: Supports Cash, Card, and Mobile Payment.
