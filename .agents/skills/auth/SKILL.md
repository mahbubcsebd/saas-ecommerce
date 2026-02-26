---
name: auth
description: Detailed explanation of the JWT authentication flow, including refresh token rotation, user model fields, middleware, and security considerations. Use this skill when working on login, session management, or route protection.
---

# auth - Authentication Deep Dive

This document details exactly how authentication works in the Mahbub Shop project.

## Core Logic
We use a **Refresh Token Rotation** pattern to balance security and user experience.

### 1. User Model Fields
The `User` model in `prisma/schema.prisma` contains:
- `refreshToken`: Stores the current valid refresh token.
- `refreshTokenExpires`: Expiry timestamp for the refresh token.
- `role`: (CUSTOMER, STAFF, ADMIN, SUPER_ADMIN).

### 2. Login Flow
1. User provides `email`/`username` and `password`.
2. Server validates password using `bcryptjs`.
3. Server generates:
   - **Access Token**: Short-lived (e.g., 15m), contains `id` and `role`.
   - **Refresh Token**: Long-lived (e.g., 7d), randomly generated string.
4. `refreshToken` is saved to the User record in DB.
5. Server sends both to the client (Dashboard/Shop).

### 3. Middleware (`src/middlewares/auth.middleware.js`)
- **protect / authMiddleware**: Verifies the `Authorization: Bearer <token>` header. If valid, attaches `req.user` to the request object.
- **isStaff / isAdmin**: Checks the `role` attached to `req.user` to restrict access to sensitive routes.

### 4. Refresh Flow
When the `accessToken` expires:
1. Client sends a request to `/api/auth/refresh` with the `refreshToken`.
2. Server checks if the token exists in the DB and hasn't expired.
3. If valid, server generates a **new** Access Token and a **new** Refresh Token (Rotation).
4. Old Refresh Token is replaced in the DB.

> [!CAUTION]
> If a Refresh Token is used after it has been rotated, the system should invalidate all sessions for that user as a security precaution (potential reuse attack).
