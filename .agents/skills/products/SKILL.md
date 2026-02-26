---
name: products
description: Comprehensive guide for Product Management in Mahbub Shop. Covers SEO metadata, advanced variants, bulk import/export, and image gallery management. Use this skill when modifying product logic or UI.
---

# products - Product Management Deep Dive

This document details the product lifecycle and management capabilities in the Mahbub Shop ecosystem.

## 1. Product Lifecycle & Status
Products move through three main statuses:
- **DRAFT**: Initial state, not visible to customers.
- **PUBLISHED**: Visible and purchasable in the shop.
- **ARCHIVED**: Soft-deleted, hidden from public but kept for historical records/orders.

## 2. Data Structure & SEO
Products support multi-language translations and comprehensive SEO metadata.
- **SEO Fields**: `metaTitle`, `metaDescription`, `metaKeywords` (Multi-select), and `ogImage`.
- **Slugs**: Automatically generated from the product name (default language) using the frontend ✨ Magic button.
- **Translations**: Name and Description are stored in a related `ProductTranslation` table with Auto-Translate support via AI.
- **Presets**: Key SEO tags are provided as presets to ensure consistency.

## 3. Advanced Product Variants
Each product can have multiple variants (e.g., Size: M, Color: Blue).
- **Core Fields**: SKU, Barcode, Base Price, Selling Price, Stock.
- **Attributes**: Stored as a JSON array of attribute/value pairs.
- **Logic**: If a product has variants, the total stock is usually the sum of variant stocks.

## 4. Bulk Operations
Admins can manage large catalogs using CSV files.
- **Export**: Generates a CSV containing basic product info and stock.
- **Import**: Allows creating products in bulk. Format: `Name, SKU, Barcode, BasePrice, SellingPrice, Stock, Category, Status, Brand`.

## 5. Image Management
- **Primary Image**: The first image in the `images` array is treated as the primary thumbnail.
- **Uploads**: Handled via `multer` in the backend and Cloudinary for storage.
- **Variant Images**: Each variant can host its own specific gallery.

## 6. Inventory & Stock Alerts
- **Low Stock Alert**: A threshold defined per product.
- **Stock Movements**: Every manual stock adjustment is logged in the `StockMovement` table for auditing.
- **Auto-Gen**: SKU and Barcodes can be auto-generated in the frontend to maintain unique identifier integrity.

## 7. Display & Shipping Options
- **Home Display**: `isHomeShown` and `homeOrder` control placement in the storefront category sliders.
- **Shipping**: `isFreeShipping` and `isPreOrder` flags for logistics handling.
- **Warranty**: Plain text field for official or shop warranty details.
