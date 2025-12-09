-- =============================================
-- SMBE Database Migration
-- Add perlu_petty_cash field to breakdown_data
-- Date: 2025-12-09
-- =============================================

USE smbe_db;

-- Add perlu_petty_cash field to breakdown_data table
-- This field tracks whether a breakdown requires petty cash allocation
ALTER TABLE breakdown_data 
ADD COLUMN perlu_petty_cash ENUM('yes', 'no') NULL DEFAULT NULL AFTER kategori_perawatan;

-- Add index for better query performance
CREATE INDEX idx_perlu_petty_cash ON breakdown_data(perlu_petty_cash);

-- Add comment to document the field
ALTER TABLE breakdown_data 
MODIFY COLUMN perlu_petty_cash ENUM('yes', 'no') NULL DEFAULT NULL 
COMMENT 'Indicates if the breakdown requires petty cash allocation (for Service, PMS, or Storing categories)';

-- =============================================
-- Verification Query
-- =============================================
-- Run this to verify the migration was successful:
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = 'smbe_db' AND TABLE_NAME = 'breakdown_data' AND COLUMN_NAME = 'perlu_petty_cash';

-- =============================================
-- Rollback Query (if needed)
-- =============================================
-- If you need to rollback this migration, run:
-- ALTER TABLE breakdown_data DROP COLUMN perlu_petty_cash;
-- DROP INDEX idx_perlu_petty_cash ON breakdown_data;
