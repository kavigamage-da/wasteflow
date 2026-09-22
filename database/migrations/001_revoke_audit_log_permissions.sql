-- ============================================================================
-- WasteFlow Audit Log Security Migration
-- 
-- Purpose: Revoke UPDATE and DELETE permissions on audit_logs table
-- to ensure audit trail immutability.
--
-- This migration should be run by the database owner (e.g., postgres or wasteflow)
-- and will revoke permissions from the application role (wasteflow).
-- ============================================================================

-- Revoke UPDATE and DELETE on audit_logs from the application role
-- Note: Replace 'wasteflow' with the actual application role name if different
REVOKE UPDATE, DELETE ON audit_logs FROM wasteflow;

-- Verify the permissions were revoked
-- This should show only SELECT and INSERT privileges
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'audit_logs AND grantee = 'wasteflow';

-- Grant SELECT and INSERT explicitly (to ensure they exist)
GRANT SELECT, INSERT ON audit_logs TO wasteflow;
