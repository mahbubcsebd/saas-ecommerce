// Matches ProductVariant model in Prisma
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  basePrice?: number;
  sellingPrice?: number;
  costPrice?: number;
  stock: number;
  attributes: Record<string, string> | { type: string; value: string }[]; // Support both formats
  images: string[];
  isActive: boolean;
}

export interface Discount {
    id: string;
    name: string;
    code?: string;
    description?: string;
    type: 'PERCENTAGE' | 'FLAT' | 'BUY_X_GET_Y' | 'FREE_SHIPPING';
    value: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;

  // New Pricing Fields
  basePrice: number;
  sellingPrice: number;
  price: number; // For backward compatibility, mapped to sellingPrice
  costPrice?: number;

  // Stock & Inventory
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockAlert?: number;
  trackInventory: boolean;

  // Product Info
  images: string[];
  colors?: string[]; // Available color options
  categoryId: string;
  category: string | { name: string; slug: string }; // The category object or name depending on API response
  brand?: string;
  tags: string[];

  // Weight & Dimensions
  weight?: number;
  length?: number;
  width?: number;
  height?: number;

  // Status
  status: string;
  isNewArrival: boolean;
  isFeatured: boolean;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;

  // Analytics
  viewCount: number;
  soldCount: number;

  // Relations
  variants?: ProductVariant[];
  discounts?: Discount[]; // Array of applicable discounts
  discount?: Discount; // Primary discount to display (calculated on backend or frontend)

  // Computed or Legacy
  originalPrice?: number; // Mapped to basePrice
  rating: number;
  numReviews: number;

  createdAt: string;
  updatedAt: string;

  // Optional: Allow flexible extendability
  specifications?: Record<string, string>;
}
