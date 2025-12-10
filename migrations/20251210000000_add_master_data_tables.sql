-- =============================================
-- MIGRATION: Add Master Data Tables for Equipment, Parts, and Mechanics
-- Date: 2025-12-10
-- Description: 
--   Create master data tables for:
--   1. Equipment Type, Brand, Category, Model, Customer
--   2. Specialization (for mechanics)
--   3. Part Category, Unit, Brand
-- =============================================

USE smbe_db;

-- =============================================
-- 1. EQUIPMENT MASTER DATA TABLES
-- =============================================

-- Equipment Type Master
CREATE TABLE IF NOT EXISTS equipment_type_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Equipment Brand Master
CREATE TABLE IF NOT EXISTS equipment_brand_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Equipment Category Master
CREATE TABLE IF NOT EXISTS equipment_category_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Equipment Model Master
CREATE TABLE IF NOT EXISTS equipment_model_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    brand_id INT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES equipment_brand_master(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_brand (brand_id)
);

-- Customer Master
CREATE TABLE IF NOT EXISTS customer_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_code (code)
);

-- =============================================
-- 2. MECHANIC MASTER DATA TABLES
-- =============================================

-- Specialization Master
CREATE TABLE IF NOT EXISTS specialization_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- =============================================
-- 3. PART MASTER DATA TABLES
-- =============================================

-- Part Category Master
CREATE TABLE IF NOT EXISTS part_category_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Part Unit Master
CREATE TABLE IF NOT EXISTS part_unit_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Part Brand Master
CREATE TABLE IF NOT EXISTS part_brand_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- =============================================
-- 4. INSERT DEFAULT DATA
-- =============================================

-- Equipment Types
INSERT IGNORE INTO equipment_type_master (name) VALUES 
('Excavator'),
('Bulldozer'),
('Wheel Loader'),
('Motor Grader'),
('Dump Truck'),
('Crane'),
('Compactor'),
('Forklift');

-- Equipment Brands
INSERT IGNORE INTO equipment_brand_master (name) VALUES 
('Komatsu'),
('Caterpillar'),
('Hitachi'),
('Volvo'),
('Liebherr'),
('Doosan'),
('Hyundai'),
('Kobelco');

-- Equipment Categories
INSERT IGNORE INTO equipment_category_master (name) VALUES 
('Heavy Equipment'),
('Light Equipment'),
('Transportation'),
('Lifting Equipment'),
('Earth Moving');

-- Equipment Models (sample)
INSERT IGNORE INTO equipment_model_master (name, brand_id) VALUES 
('PC200-8', (SELECT id FROM equipment_brand_master WHERE name = 'Komatsu' LIMIT 1)),
('PC300-8', (SELECT id FROM equipment_brand_master WHERE name = 'Komatsu' LIMIT 1)),
('D6T', (SELECT id FROM equipment_brand_master WHERE name = 'Caterpillar' LIMIT 1)),
('950M', (SELECT id FROM equipment_brand_master WHERE name = 'Caterpillar' LIMIT 1)),
('ZX200-3', (SELECT id FROM equipment_brand_master WHERE name = 'Hitachi' LIMIT 1));

-- Customers (sample)
INSERT IGNORE INTO customer_master (name, code) VALUES 
('PT. Construction Plus', 'CUST001'),
('PT. Builder Pro', 'CUST002'),
('PT. Mining Solutions', 'CUST003'),
('PT. Logistics Center', 'CUST004');

-- Specializations
INSERT IGNORE INTO specialization_master (name) VALUES 
('Hydraulic Systems'),
('Engine & Transmission'),
('Electrical Systems'),
('General Maintenance'),
('Welding & Fabrication'),
('Diagnostics & Troubleshooting'),
('Pneumatic Systems'),
('Hydraulics & Pneumatics');

-- Part Categories
INSERT IGNORE INTO part_category_master (name) VALUES 
('Hydraulic'),
('Engine'),
('Electrical'),
('Undercarriage'),
('Body & Frame'),
('Filter'),
('Lubricant'),
('Seal & Gasket'),
('Bearing'),
('Fastener');

-- Part Units
INSERT IGNORE INTO part_unit_master (name) VALUES 
('pcs'),
('kg'),
('liter'),
('meter'),
('set'),
('box'),
('roll'),
('unit');

-- Part Brands
INSERT IGNORE INTO part_brand_master (name) VALUES 
('OEM'),
('Aftermarket'),
('Komatsu Genuine'),
('Caterpillar Genuine'),
('Hitachi Genuine'),
('Generic'),
('Premium'),
('Standard');

-- =============================================
-- END OF MIGRATION
-- =============================================


