-- V8: Fix audit_events_type_check constraint
-- The original constraint in V1 was missing MAINTENANCE_* and TRANSFER_* event types,
-- causing a DataIntegrityViolationException (and full transaction rollback) on every
-- transfer/maintenance mutating operation.

ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_type_check;

ALTER TABLE public.audit_events
    ADD CONSTRAINT audit_events_type_check CHECK (
        (type)::text = ANY (ARRAY[
            -- Organization
            'ORGANIZATION_CREATED'::character varying,
            'ORGANIZATION_STATUS_CHANGED'::character varying,
            'ORGANIZATION_UPDATED'::character varying,
            'ORGANIZATION_ACTIVATED'::character varying,
            'ORGANIZATION_INACTIVATED'::character varying,
            -- Unit
            'UNIT_CREATED'::character varying,
            'UNIT_STATUS_CHANGED'::character varying,
            'UNIT_UPDATED'::character varying,
            'UNIT_ACTIVATED'::character varying,
            'UNIT_INACTIVATED'::character varying,
            -- User
            'USER_CREATED'::character varying,
            'USER_STATUS_CHANGED'::character varying,
            'USER_LGPD_ACCEPTED'::character varying,
            'USER_UPDATED'::character varying,
            'USER_ACTIVATED'::character varying,
            'USER_INACTIVATED'::character varying,
            'USER_BLOCKED'::character varying,
            -- Asset
            'ASSET_CREATED'::character varying,
            'ASSET_ASSIGNED'::character varying,
            'ASSET_UNASSIGNED'::character varying,
            'ASSET_TRANSFERRED'::character varying,
            'ASSET_STATUS_CHANGED'::character varying,
            'ASSET_RETIRED'::character varying,
            'ASSET_UPDATED'::character varying,
            -- Maintenance
            'MAINTENANCE_OPENED'::character varying,
            'MAINTENANCE_STARTED'::character varying,
            'MAINTENANCE_COMPLETED'::character varying,
            'MAINTENANCE_CANCELLED'::character varying,
            -- Transfer
            'TRANSFER_REQUESTED'::character varying,
            'TRANSFER_APPROVED'::character varying,
            'TRANSFER_REJECTED'::character varying,
            'TRANSFER_COMPLETED'::character varying,
            'TRANSFER_CANCELLED'::character varying
        ]::text[])
    );
