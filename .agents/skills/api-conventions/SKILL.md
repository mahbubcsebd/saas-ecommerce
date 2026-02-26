---
name: api-conventions
description: Guidelines for developing and consuming APIs in the Mahbub Shop ecosystem. Standardizes response formats and URL structures. Use this skill when creating new API endpoints.
---

# api-conventions - API Standards

Guidelines for developing and consuming APIs in the Mahbub Shop ecosystem.

## 1. Response Format
Always use the centralized `responseHandler.js` in the backend server.

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "OPTIONAL_ERROR_CODE or details"
}
```

## 2. HTTP Methods
- **GET**: Retrieve data.
- **POST**: Create new resources.
- **PATCH**: Update existing resources (partial).
- **PUT**: Replace existing resources.
- **DELETE**: Remove resources.

## 3. URL Structure
- Collections: `GET /api/products` (plural)
- Single Item: `GET /api/products/:id`
- Actions: `PATCH /api/orders/:id/status`

## 4. Query Parameters
- Pagination: `page`, `limit`
- Searching: `search`
- Filtering: `status`, `category`
- Sorting: `sortBy`, `order` (asc/desc)
