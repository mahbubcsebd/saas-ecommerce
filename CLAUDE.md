# CLAUDE.md - AI Context & Instructions

This file provides critical context for AI models (Claude, Antigravity, Gemini, etc.) to understand the project structure, features, and development workflow.

## Project Structure
- `frontend/`: Customer-facing shop (Next.js).
- `backend/server/`: Main API (Node.js/Express/Prisma/MongoDB).
- `backend/client/`: Admin dashboard (Next.js/TanStack).

## Common Commands
### Backend Server
- `cd backend/server`
- `npm run dev`: Start dev server.
- `npx prisma generate`: Update Prisma client.
- `npx prisma db push`: Sync schema to MongoDB.

### Backend Dashboard
- `cd backend/client`
- `npm run dev`: Start dev server.

## Code Style & Conventions
- **Naming**: Use camelCase for variables/functions, PascalCase for components.
- **Backend API**: Always use `src/utils/responseHandler.js` for consistent JSON replies.
- **Frontend UI**: Use Shadcn/UI components and Tailwind CSS.
- **Responsiveness**: Ensure all designs are fully responsive (Mobile-first approach) and functional across all device sizes (Desktop, Tablet, Mobile).
- **State Management**: TanStack Table/Query for dashboard data.

## System Architecture
The system follows a Client-Server architecture with two distinct clients sharing one primary Express API.
- **API (backend/server)**: Business logic, DB schemas, and integrations.
- **Dashboard (backend/client)**: Admin portal for inventory, finance, and CRM.
- **Storefront (frontend)**: End-consumer experience.
- **Database**: MongoDB with Prisma.
- **Real-time**: Socket.io for orders and chat.


## AI Documentation Discovery
> [!IMPORTANT]
> **AI Instruction**: Before starting any task, search `.agents/skills/features/` to find the specific documentation for the target module. Do not rely on memory; always read the `SKILL.md` of the relevant feature first.

## Feature Documentation Map
To keep context focused, detailed feature logic is separated into specialized skills:

### 🛍️ Sales & Finance
- **Orders**: [orders.md](file:///d:/mahbub-shop/.agents/skills/features/sales/orders.md) - Lifecycle, cancellation, stock reversal.
- **Returns**: [returns.md](file:///d:/mahbub-shop/.agents/skills/features/sales/returns.md) - RMA policy (7-day), approval flow, refunds.
- **POS**: [pos.md](file:///d:/mahbub-shop/.agents/skills/features/sales/pos.md) - In-store sales, barcode scanning, thermal printing.

### 📦 Inventory & Products
- **Products**: [products.md](file:///d:/mahbub-shop/.agents/skills/features/inventory/products.md) - CRUD, variants, images. (Planned)
- **Categories**: [categories.md](file:///d:/mahbub-shop/.agents/skills/features/inventory/categories.md) - Hierarchy management. (Planned)

### 📣 Marketing & Growth
- **Coupons**: [coupons.md](file:///d:/mahbub-shop/.agents/skills/features/marketing/coupons.md) - Discount engine rules. (Planned)
- **Campaigns**: [campaigns.md](file:///d:/mahbub-shop/.agents/skills/features/marketing/campaigns.md) - Email/SMS targeting. (Planned)



## Documentation Policy
1. **Feature-as-a-Skill**: Every major feature (e.g., Returns, POS, Orders) must have its own directory in `.agents/skills/features/` with a `SKILL.md`.
2. **Contextual Reading**: When working on a feature, the AI must first read the corresponding `SKILL.md` to understand its business logic, routes, and state management.
3. **Master Guide (`CLAUDE.md`)**: Keep this file for architecture and high-level routing. Summarize features here with links to their deep-dive files.
4. **Consistency**: Ensure all `.md` files use the same naming conventions and structure for easier AI parsing.

## API & Core Skills
- **[auth](file:///d:/mahbub-shop/.agents/skills/auth/SKILL.md)**: JWT & Session logic.
- **[database](file:///d:/mahbub-shop/.agents/skills/database/SKILL.md)**: Schema & Stock patterns.
- **[api-conventions](file:///d:/mahbub-shop/.agents/skills/api-conventions/SKILL.md)**: Response standards.
- **[ui-conventions](file:///d:/mahbub-shop/.agents/skills/ui-conventions/SKILL.md)**: Global responsive UI standards.
- **[dashboard-ui](file:///d:/mahbub-shop/backend/client/skills/dashboard-ui/SKILL.md)**: Centralized Dashboard Table & Button standards.

## Dashboard Feature Skills
- **[sales-orders](file:///d:/mahbub-shop/.agents/skills/features/sales/orders.md)**: Order lifecycle and status.
- **[sales-returns](file:///d:/mahbub-shop/.agents/skills/features/sales/returns.md)**: RMA & Refund logic.
- **[sales-pos](file:///d:/mahbub-shop/.agents/skills/features/sales/pos.md)**: In-store sales flow.
- **[inventory-products](file:///d:/mahbub-shop/.agents/skills/features/inventory/products.md)**: Catalog management.
- **[marketing-coupons](file:///d:/mahbub-shop/.agents/skills/features/marketing/coupons.md)**: Discount engine.

## Roadmap & Decisions
- **[TASKS.md](file:///d:/mahbub-shop/TASKS.md)**: Current roadmap and completed features.
- **[DECISIONS.md](file:///d:/mahbub-shop/DECISIONS.md)**: Technical rationale and architecture logs.
