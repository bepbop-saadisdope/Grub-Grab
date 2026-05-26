-- =====================================================
-- Migration 001 — SuperAdmin role + CNIC + IsFeatured
-- Run once in SSMS against the existing Grub DB.
-- Idempotent: safe to re-run.
-- =====================================================

USE Grub;
GO

-- 1. Allow SuperAdmin in the Users.Role CHECK constraint.
--    The original constraint was unnamed; find it dynamically and replace.
DECLARE @cn NVARCHAR(200) = (
    SELECT TOP 1 name
    FROM   sys.check_constraints
    WHERE  parent_object_id = OBJECT_ID('Users')
      AND  definition LIKE '%Role%'
      AND  name <> 'CK_Users_Role'        -- skip the new one if migration already ran
);
IF @cn IS NOT NULL EXEC ('ALTER TABLE Users DROP CONSTRAINT ' + @cn);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('Users') AND name = 'CK_Users_Role'
)
ALTER TABLE Users ADD CONSTRAINT CK_Users_Role
    CHECK (Role IN ('Admin', 'Customer', 'DeliveryPerson', 'SuperAdmin'));
GO

-- 2. CNIC column (nullable; existing rows untouched).
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'Cnic'
)
ALTER TABLE Users ADD Cnic NVARCHAR(15) NULL;
GO

-- 3. IsFeatured on MenuItems (default 0; existing items not featured).
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'MenuItems' AND COLUMN_NAME = 'IsFeatured'
)
ALTER TABLE MenuItems ADD IsFeatured BIT NOT NULL
    CONSTRAINT DF_MenuItems_IsFeatured DEFAULT 0;
GO

PRINT 'Migration 001 applied.';
PRINT '  Users.Role now allows: Admin, Customer, DeliveryPerson, SuperAdmin';
PRINT '  Users.Cnic added (NVARCHAR(15) NULL)';
PRINT '  MenuItems.IsFeatured added (BIT NOT NULL DEFAULT 0)';
GO

-- =====================================================
-- Bootstrap the first SuperAdmin (one-time)
-- Edit the WHERE clause to point at your existing admin row,
-- then UNCOMMENT and run.
-- =====================================================
-- UPDATE Users SET Role = 'SuperAdmin' WHERE Email = 'admin@grubgrab.test';
