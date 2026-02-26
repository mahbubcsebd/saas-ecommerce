# DECISIONS.md - Architectural & Technical Rationale

This document tracks significant technical decisions made throughout the project's development.

## 1. Project Structure: Multi-Repo in a Mono-Layout
- **Decision**: Keeping `frontend`, `backend/server`, and `backend/client` in one main directory but as separate projects.
- **Rationale**: Simplifies context sharing for AI and developers while allowing independent deployment cycles.

## 2. Authentication: JWT with Refresh Tokens
- **Decision**: Use a stateful Refresh Token stored in the database and HTTP-only cookies, with stateless Access Tokens in memory/headers.
- **Rationale**: Higher security (revocable sessions) without sacrificing performance for API requests.

## 3. Database: MongoDB with Prisma
- **Decision**: NoSQL flexibility with Type-safe ORM.
- **Rationale**: Ecommerce schemas often evolve (new product attributes). Prisma provides the safety of a relational DB with the flexibility of MongoDB.

## 4. UI Framework: Next.js + Tailwind + Shadcn/UI
- **Decision**: Standardizing on Shadcn/UI for both User and Admin interfaces.
- **Rationale**: Speed of development, accessibility out-of-the-box, and a premium "wow" aesthetic.

## 5. State Management: TanStack (React) Query
- **Decision**: Using TanStack Table and Query for data-heavy sections.
- **Rationale**: Efficient caching, easy pagination, and robust handling of server state in the Dashboard.
