-- =============================================
-- MIGRATION: Add Location to Users and Support Report Viewer Role
-- Date: 2025-12-09
-- Description: 
--   1. Add location field to users table for location-based access control
--   2. Support for report_viewer role
--   3. Update existing roles if needed
-- =============================================

USE smbe_db;

-- =============================================
-- 1. ADD LOCATION COLUMN TO USERS TABLE
-- =============================================

-- Check if column exists, if not add it
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'smbe_db' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'location'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN location VARCHAR(100) NULL AFTER role',
    'SELECT "Column location already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for location
SET @idx_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'smbe_db' 
    AND TABLE_NAME = 'users' 
    AND INDEX_NAME = 'idx_location'
);

SET @sql_idx = IF(@idx_exists = 0,
    'ALTER TABLE users ADD INDEX idx_location (location)',
    'SELECT "Index idx_location already exists" AS message'
);

PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- Note: Foreign key constraint is NOT added because location_master.name is not UNIQUE
-- Foreign key constraints require the referenced column to be PRIMARY KEY or UNIQUE
-- Location validation will be handled at application level instead
-- This provides more flexibility and avoids constraint errors

-- =============================================
-- 2. UPDATE ROLES TABLE TO INCLUDE REPORT_VIEWER
-- =============================================

-- Insert report_viewer role if it doesn't exist
INSERT IGNORE INTO roles (role_name, description, permissions) VALUES 
('report_viewer', 'View-only access to daily breakdown reports', '["read"]');

-- =============================================
-- 3. UPDATE DEFAULT USERS WITH LOCATION SUPPORT
-- =============================================

-- Update existing users to have null location (they can access all locations)
-- Only if location column was just added
UPDATE users 
SET location = NULL 
WHERE location IS NULL AND role IN ('admin', 'inputer', 'viewer');

-- =============================================
-- 4. INSERT EXAMPLE LOCATION-BASED USERS
-- =============================================

-- Insert report_viewer user (if not exists)
INSERT IGNORE INTO users (name, email, password, role, location) VALUES 
('Report Viewer', 'report_viewer@smbe.com', 'report123', 'report_viewer', NULL);

-- Insert location-specific inputers (examples)
-- Note: These will only work if the location names match exactly with location_master.name
INSERT IGNORE INTO users (name, email, password, role, location) VALUES 
('Inputer Site A', 'inputer_a@smbe.com', 'inputer123', 'inputer', 'Site A - Jakarta'),
('Inputer Site B', 'inputer_b@smbe.com', 'inputer123', 'inputer', 'Site B - Bekasi'),
('Inputer Site C', 'inputer_c@smbe.com', 'inputer123', 'inputer', 'Site C - Karawang');

-- =============================================
-- 5. VERIFY MIGRATION
-- =============================================

-- Show users with their locations
SELECT id, name, email, role, location, is_active 
FROM users 
ORDER BY role, location;

-- Show updated roles
SELECT * FROM roles;

-- =============================================
-- END OF MIGRATION
-- =============================================

