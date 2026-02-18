# API Guide

Generated: 2026-02-18 02:19:12.433813

---

# 1. Overview

This document describes the Enterprise Asset Management API.

The API provides secure, multi-tenant management of:

- Organizations
- Units
- Users
- Assets
- Transfers
- Inventory cycles
- Maintenance operations
- Audit logs

The API follows REST principles and uses JSON for request and response payloads.

---

# 2. Base URL

Development:

http://localhost:8080

Production:

https://api.yourdomain.com

---

# 3. Authentication

The API uses JWT (JSON Web Token) authentication.

After successful login, the client must include the token in every request.

Header:

Authorization: Bearer <JWT_TOKEN>

---

# 4. Authentication Endpoints

## POST /auth/login

Authenticates user and returns access token.

Request:

{
  "email": "user@company.com",
  "password": "password"
}

Response:

{
  "accessToken": "JWT_TOKEN",
  "tokenType": "Bearer",
  "expiresIn": 3600
}

Error Responses:

401 Unauthorized – invalid credentials

403 Forbidden – user inactive or blocked

---

# 5. Organization Endpoints

## POST /organizations

Creates a new organization.

Requires admin privileges.

## GET /organizations

Returns list of organizations accessible to user.

## GET /organizations/{id}

Returns organization details.

---

# 6. Unit Endpoints

## POST /units

Creates a new unit.

## GET /units

Returns units accessible to user.

## GET /units/{id}

Returns unit details.

---

# 7. User Endpoints

## POST /users

Creates a new user.

## GET /users

Returns list of users.

## GET /users/{id}

Returns user details.

---

# 8. Asset Endpoints

## POST /assets

Creates new asset.

## GET /assets

Returns list of assets.

Supports filtering.

## GET /assets/{id}

Returns asset details.

---

# 9. Transfer Endpoints

## POST /transfers

Creates transfer request.

## GET /transfers

Returns transfers.

---

# 10. Inventory Endpoints

## POST /inventory

Starts inventory cycle.

## GET /inventory

Returns inventory cycles.

---

# 11. Maintenance Endpoints

## POST /maintenance

Creates maintenance request.

## GET /maintenance

Returns maintenance records.

---

# 12. Audit Endpoints

## GET /audit

Returns audit logs.

Restricted to authorized users.

---

# 13. HTTP Status Codes

200 OK – successful request

201 Created – resource created

400 Bad Request – validation error

401 Unauthorized – authentication required

403 Forbidden – insufficient permission

404 Not Found – resource not found

500 Internal Server Error – server error

---

# 14. Error Response Format

Standard format:

{
  "errors": [
    {
      "field": "fieldName",
      "message": "error description",
      "code": "ERROR_CODE"
    }
  ]
}

---

# 15. Security Considerations

- All endpoints require authentication except login
- Access is restricted by role and tenant
- Cross-tenant access is forbidden
- All actions generate audit logs

---

# 16. Versioning

API versioning strategy:

/api/v1/

Future versions will maintain backward compatibility.

---

# 17. Multi-Tenant Behavior

All requests operate within the user's organization scope.

Data is automatically filtered by organization.

Cross-tenant access is not allowed.

