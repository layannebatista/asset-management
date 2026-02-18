# Database Schema

Generated: 2026-02-18 02:26:46.026668

---

# 1. Overview

This document describes the database schema used by the Enterprise Asset Management System.

The database uses PostgreSQL and follows a relational model.

The schema supports:

- Multi-tenant isolation
- Asset lifecycle management
- Transfers
- Inventory management
- Maintenance tracking
- Audit logging

Database integrity is enforced using foreign keys and constraints.

---

# 2. Core Tables

## organizations

Represents tenants.

Fields:

- id (primary key)
- name
- status
- created_at
- updated_at

Each organization is a tenant.

---

## units

Represents organizational units.

Fields:

- id (primary key)
- organization_id (foreign key)
- name
- status
- created_at
- updated_at

Each unit belongs to one organization.

---

## users

Represents system users.

Fields:

- id (primary key)
- organization_id (foreign key)
- unit_id (foreign key)
- email
- password_hash
- role
- status
- created_at
- updated_at

Each user belongs to one organization and unit.

---

## assets

Represents managed assets.

Fields:

- id (primary key)
- organization_id (foreign key)
- unit_id (foreign key)
- asset_number
- name
- description
- status
- created_at
- updated_at

Asset numbers are unique and immutable.

---

## transfers

Represents asset transfers.

Fields:

- id (primary key)
- asset_id (foreign key)
- source_unit_id
- destination_unit_id
- status
- created_at
- completed_at

Tracks asset movement history.

---

## inventory_cycles

Represents inventory processes.

Fields:

- id (primary key)
- organization_id (foreign key)
- unit_id (foreign key)
- status
- started_at
- completed_at

Tracks inventory verification cycles.

---

## maintenance_requests

Represents maintenance operations.

Fields:

- id (primary key)
- asset_id (foreign key)
- status
- requested_at
- completed_at

Tracks asset maintenance lifecycle.

---

## audit_logs

Represents audit records.

Fields:

- id (primary key)
- organization_id (foreign key)
- user_id (foreign key)
- entity_type
- entity_id
- operation
- timestamp

Provides full audit trail.

---

# 3. Relationships

Relationships:

organization → units

organization → users

organization → assets

units → users

units → assets

assets → transfers

assets → maintenance_requests

organization → audit_logs

users → audit_logs

---

# 4. Multi-Tenant Design

Multi-tenant isolation is enforced using:

organization_id field in tables.

All queries must filter by organization_id.

This prevents cross-tenant data access.

---

# 5. Constraints

Database constraints include:

- Primary key constraints
- Foreign key constraints
- Unique constraints on asset_number
- NOT NULL constraints
- Referential integrity constraints

These ensure data integrity.

---

# 6. Indexing Strategy

Indexes are used for:

- Primary keys
- Foreign keys
- asset_number
- organization_id
- frequently queried fields

Indexes improve performance.

---

# 7. Migration Strategy

Database migrations are managed using Flyway.

Migration files located in:

db/migration/

Migration ensures consistent schema across environments.

---

# 8. Audit and Traceability

Audit logs provide:

- Operation history
- User activity tracking
- Security monitoring

Audit logs are immutable.

---

# 9. Security Considerations

Database access must be restricted.

Requirements:

- Strong authentication
- Restricted access
- Secure credentials

Sensitive data must be protected.

---

# 10. Summary

The database schema ensures:

- Multi-tenant isolation
- Data integrity
- Traceability
- Scalability
- Enterprise-grade reliability

