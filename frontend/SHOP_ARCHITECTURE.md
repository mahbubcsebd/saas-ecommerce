# Mahbub Shop - Frontend Architecture & Implementation Roadmap

This document outlines all the necessary features and pages that should exist in the Customer-facing Frontend/Shop to maintain consistency and full functionality with the Admin Dashboard.

## 🏠 Public Pages (Accessible without Authentication)

### Homepage (`/`)

- Hero Slider/Banner (Data comes from dashboard's Hero Slides)
- Featured Categories
- Flash Sales section (with countdown timer)
- Top/Best Selling Products
- New Arrivals
- Blog posts preview
- Newsletter signup

### Shop/Products Page (`/products`)

- All products grid/list view
- Filter by category, price range, rating, availability
- Sort (price, popularity, newest)
- Search bar
- Pagination

### Product Details (`/products/[slug]`)

- Product images gallery
- Name, description, price
- Variants (size, color) selection
- Add to cart / Buy now
- Wishlist button
- Stock status
- Customer reviews & ratings
- Related products

### Category Page (`/categories/[slug]`)

- Category banner
- Products under that category
- Sub-categories
- Filter & sort

### Search Results (`/search`)

- Search query results
- Filter & sort
- No results state

---

## 🔐 Auth Pages

### Login (`/login`)

- Email & password login
- Social login (optional)
- Forgot password link

### Register (`/register`)

- Name, email, password
- Phone number
- Terms & conditions accept

### Forgot Password (`/forgot-password`)

- Reset Password (`/reset-password`)

---

## 👤 Customer Account Pages (Login required)

### Account Dashboard (`/profile`)

- Order summary
- Recent orders
- Profile quick view

### Profile Details (`/profile/edit`)

- Name, email, phone edit
- Password change
- Avatar upload

### Orders (`/profile/orders`)

- All orders list
- Order status tracking

### Order Details (`/profile/orders/[id]`)

- Items, price breakdown
- Shipping info
- Status timeline
- Invoice download
- Return request button

### Wishlist (`/profile/wishlist`)

- Wishlisted products
- Add to cart from wishlist
- Remove from wishlist

### Addresses (`/profile/address`)

- Saved addresses list
- Add/edit/delete address
- Default address set

### Returns (`/profile/returns`)

- Return request history
- New return request
- Return status tracking

---

## 🛒 Shopping Flow Pages

### Cart (`/cart`)

- Cart items list
- Quantity update/remove
- Coupon code apply
- Price summary
- Proceed to checkout

### Checkout (`/checkout`)

- Shipping address (saved or new)
- Delivery method selection
- Payment method selection (bKash, Nagad, Stripe, COD)
- Order summary
- Place order

### Order Confirmation (`/checkout/success/[id]`)

- Success message
- Order details summary
- Continue shopping button

---

## 📝 Content Pages

### Blog (`/blog`)

- All blog posts
- Category filter
- Search

### Blog Post (`/blog/[slug]`)

- Full post content
- Related posts
- Share buttons

### Static Pages

- `/about` — About Us
- `/contact` — Contact form + info
- `/terms` — Terms & Conditions
- `/privacy` — Privacy Policy
- `/faq` — FAQ

### Landing Pages (`/lp/[slug]`)

- Campaign-specific landing pages
- Managed from Dashboard's Landing Pages module

---

## 🚨 Utility Pages

- `404` - Page Not Found
- `500` - Server Error
- `/maintenance` - Maintenance Mode
- `/coming-soon` - Coming Soon

---

## 🔗 Dashboard Connection Map

| Frontend Feature    | Managed from Dashboard Path  |
| :------------------ | :--------------------------- |
| Hero Banner         | `/dashboard/hero`            |
| Flash Sales         | `/dashboard/flash-sales`     |
| Coupons             | `/dashboard/coupons`         |
| Products            | `/dashboard/products`        |
| Categories          | `/dashboard/categories`      |
| Reviews             | `/dashboard/reviews`         |
| Blog                | `/dashboard/posts`           |
| Static Pages        | `/dashboard/pages`           |
| Orders              | `/dashboard/orders`          |
| Returns             | `/dashboard/returns`         |
| Live Chat widget    | `/dashboard/chat`            |
| Email notifications | `/dashboard/email-templates` |

---

## 📌 Implementation Priority

### Phase 1 — Core Shop

Homepage, Shop, Product Details, Cart, Checkout, Auth pages.

### Phase 2 — Account

Account dashboard, Orders, Wishlist, Addresses, Returns.

### Phase 3 — Content

Blog, Static pages, Landing pages, Search.

### Phase 4 — Advanced

Live chat widget, Flash sales, Abandoned cart recovery, Reviews.
