-- =============================================
-- SISTEM MANAJEMEN BREAKDOWN EQUIPMENT (SMBE)
-- Database Schema - Complete Migration File
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS smbe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smbe_db;

-- =============================================
-- ROLES & USERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    location VARCHAR(100) NULL, -- Location restriction for location-based users
    phone VARCHAR(20),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_location (location)
    -- Note: Foreign key constraint to location_master(name) is not added
    -- because location_master.name might not have UNIQUE constraint
    -- Location validation will be handled at application level
);

-- =============================================
-- MASTER DATA TABLES
-- =============================================

-- Location Master
CREATE TABLE IF NOT EXISTS location_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    address TEXT,
    coordinates VARCHAR(50),
    region VARCHAR(50),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_region (region)
);

-- Equipment Master
CREATE TABLE IF NOT EXISTS equipment_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    category VARCHAR(50),
    brand VARCHAR(50),
    model VARCHAR(50),
    year_manufacture INT,
    serial_number VARCHAR(100),
    plate_number VARCHAR(20),
    customer VARCHAR(100),
    location_id INT,
    purchase_date DATE,
    warranty_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    operating_hours DECIMAL(10,2) DEFAULT 0,
    fuel_capacity DECIMAL(8,2),
    specifications JSON,
    documents JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES location_master(id) ON DELETE SET NULL,
    INDEX idx_equipment_number (equipment_number),
    INDEX idx_location (location_id),
    INDEX idx_customer (customer)
);

-- Mechanic Master
CREATE TABLE IF NOT EXISTS mechanic_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    level VARCHAR(20) DEFAULT 'junior', -- Changed from ENUM to VARCHAR for flexibility
    specialization VARCHAR(100),
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    location_id INT,
    hire_date DATE,
    certifications JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES location_master(id) ON DELETE SET NULL,
    INDEX idx_employee_id (employee_id),
    INDEX idx_level (level),
    INDEX idx_location (location_id)
);

-- Part Master
CREATE TABLE IF NOT EXISTS part_master (
    id INT PRIMARY KEY AUTO_INCREMENT,
    part_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    brand VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'pcs',
    price DECIMAL(15,2) DEFAULT 0,
    minimum_stock INT DEFAULT 0,
    current_stock INT DEFAULT 0,
    location_stock JSON,
    supplier VARCHAR(100),
    supplier_part_number VARCHAR(50),
    lead_time_days INT DEFAULT 0,
    description TEXT,
    specifications JSON,
    compatible_equipment JSON,
    documents JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_part_number (part_number),
    INDEX idx_category (category),
    INDEX idx_stock_level (current_stock)
);

-- Cost Parameters
CREATE TABLE IF NOT EXISTS cost_parameters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    location_from_id INT,
    location_to_id INT,
    distance_km DECIMAL(8,2) DEFAULT 0,
    toll_cost DECIMAL(10,2) DEFAULT 0,
    toll_per_km DECIMAL(8,2) DEFAULT 0, -- Added for backend compatibility
    fuel_cost_per_km DECIMAL(8,2) DEFAULT 0,
    fuel_per_km DECIMAL(8,2) DEFAULT 0, -- Added for backend compatibility
    parking_cost DECIMAL(8,2) DEFAULT 0,
    parking_per_day DECIMAL(8,2) DEFAULT 0, -- Added for backend compatibility
    accommodation_cost DECIMAL(10,2) DEFAULT 0,
    accommodation_per_day DECIMAL(10,2) DEFAULT 0, -- Added for backend compatibility
    meal_allowance DECIMAL(8,2) DEFAULT 0,
    meal_per_day DECIMAL(8,2) DEFAULT 0, -- Added for backend compatibility
    transport_allowance DECIMAL(8,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_from_id) REFERENCES location_master(id) ON DELETE SET NULL,
    FOREIGN KEY (location_to_id) REFERENCES location_master(id) ON DELETE SET NULL,
    INDEX idx_locations (location_from_id, location_to_id),
    INDEX idx_effective_date (effective_date)
);

-- =============================================
-- BREAKDOWN DATA TABLES
-- =============================================

-- Main Breakdown Data
CREATE TABLE IF NOT EXISTS breakdown_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- Tab 1: Data Utama
    tanggal DATE NOT NULL,
    shift VARCHAR(10),
    equipment_id INT NOT NULL,
    equipment_number VARCHAR(50) NOT NULL,
    kode VARCHAR(20),
    lokasi VARCHAR(100),
    hm_breakdown DECIMAL(10,2),
    jam_mulai TIMESTAMP NULL,
    jam_selesai TIMESTAMP NULL,
    kategori_perawatan ENUM('Service', 'PMS', 'Storing') NOT NULL, -- Updated to match backend
    
    -- Tab 2: Informasi Plant
    pelapor_bd VARCHAR(100),
    work_order VARCHAR(50),
    wr_pr VARCHAR(50),
    tipe_bd VARCHAR(50), -- Changed from ENUM to VARCHAR for flexibility
    note_ccr TEXT,
    note_plant TEXT,
    km DECIMAL(10,2),
    komponen VARCHAR(100),
    problem TEXT,
    
    -- Tab 3: Aktivitas & Estimasi
    estimasi_1 TIMESTAMP NULL,
    estimasi_2 TIMESTAMP NULL,
    estimasi_3 TIMESTAMP NULL,
    penerima_rfu VARCHAR(100),
    aktivitas VARCHAR(50), -- Changed from ENUM to VARCHAR
    detail_aktivitas TEXT,
    jam_aktivitas DECIMAL(5,2),
    
    -- Tab 4: Informasi RFU
    rfu VARCHAR(20), -- Changed from ENUM to VARCHAR
    hm_rfu_1 DECIMAL(10,2),
    pelapor_rfu VARCHAR(100),
    
    -- System fields
    status ENUM('breakdown', 'in_progress', 'ready', 'cancelled') DEFAULT 'breakdown',
    total_cost DECIMAL(15,2) DEFAULT 0,
    total_downtime_hours DECIMAL(8,2) DEFAULT 0,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_mechanic_id INT,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (equipment_id) REFERENCES equipment_master(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanic_master(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_tanggal (tanggal),
    INDEX idx_equipment (equipment_id),
    INDEX idx_status (status),
    INDEX idx_kategori (kategori_perawatan),
    INDEX idx_priority (priority)
);

-- Mechanic Activities
CREATE TABLE IF NOT EXISTS mechanic_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    breakdown_id INT NOT NULL,
    mechanic_id INT NOT NULL,
    activity_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    activity_type ENUM('diagnosis', 'repair', 'testing', 'documentation', 'waiting_parts') NOT NULL,
    description TEXT,
    hours_worked DECIMAL(5,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    status ENUM('ongoing', 'completed', 'paused') DEFAULT 'ongoing',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (breakdown_id) REFERENCES breakdown_data(id) ON DELETE CASCADE,
    FOREIGN KEY (mechanic_id) REFERENCES mechanic_master(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_breakdown (breakdown_id),
    INDEX idx_mechanic (mechanic_id),
    INDEX idx_date (activity_date)
);

-- Spare Parts In/Out
CREATE TABLE IF NOT EXISTS spare_parts_inout (
    id INT PRIMARY KEY AUTO_INCREMENT,
    breakdown_id INT,
    part_id INT NOT NULL,
    part_number VARCHAR(50) NOT NULL,
    transaction_type ENUM('in', 'out', 'return') NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(12,2) DEFAULT 0,
    total_price DECIMAL(15,2) DEFAULT 0,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_order VARCHAR(50),
    supplier VARCHAR(100),
    location_id INT,
    warehouse VARCHAR(50),
    condition_status ENUM('new', 'used', 'refurbished', 'damaged') DEFAULT 'new',
    usage_notes TEXT,
    received_by VARCHAR(100),
    approved_by VARCHAR(100),
    document_path TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (breakdown_id) REFERENCES breakdown_data(id) ON DELETE SET NULL,
    FOREIGN KEY (part_id) REFERENCES part_master(id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES location_master(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_breakdown (breakdown_id),
    INDEX idx_part (part_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_reference_order (reference_order)
);

-- Petty Cash / Travel Costs
CREATE TABLE IF NOT EXISTS petty_cash (
    id INT PRIMARY KEY AUTO_INCREMENT,
    breakdown_id INT,
    expense_date DATE NOT NULL,
    expense_type ENUM('tol', 'bensin', 'parkir', 'inap', 'makan', 'lainnya') NOT NULL, -- Updated to match backend
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    location_from_id INT,
    location_to_id INT,
    distance_km DECIMAL(8,2),
    receipt_number VARCHAR(50),
    receipt_image TEXT,
    approved_by VARCHAR(100),
    approval_date DATE,
    mechanic_id INT,
    vehicle_used VARCHAR(50),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (breakdown_id) REFERENCES breakdown_data(id) ON DELETE SET NULL,
    FOREIGN KEY (location_from_id) REFERENCES location_master(id) ON DELETE SET NULL,
    FOREIGN KEY (location_to_id) REFERENCES location_master(id) ON DELETE SET NULL,
    FOREIGN KEY (mechanic_id) REFERENCES mechanic_master(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_breakdown (breakdown_id),
    INDEX idx_expense_date (expense_date),
    INDEX idx_expense_type (expense_type),
    INDEX idx_mechanic (mechanic_id)
);

-- =============================================
-- DEFAULT DATA INSERTION
-- =============================================

-- Insert default roles
-- Insert default roles
INSERT IGNORE INTO roles (role_name, description, permissions) VALUES 
('admin', 'Full system access', '["read", "write", "delete", "manage"]'),
('inputer', 'Data input and view access', '["read", "write"]'),
('viewer', 'Read-only access', '["read"]'),
('report_viewer', 'View-only access to daily breakdown reports', '["read"]');

-- Insert default admin user (password: admin123 - should be hashed in production)
-- For demo purposes, using plain text. In production, use bcrypt hash
INSERT IGNORE INTO users (name, email, password, role, location) VALUES 
('Administrator', 'admin@smbe.com', 'admin123', 'admin', NULL),
('Data Inputer', 'inputer@smbe.com', 'inputer123', 'inputer', NULL),
('Data Viewer', 'viewer@smbe.com', 'viewer123', 'viewer', NULL),
('Report Viewer', 'report_viewer@smbe.com', 'report123', 'report_viewer', NULL),
-- Location-specific inputers (examples)
('Inputer Site A', 'inputer_a@smbe.com', 'inputer123', 'inputer', 'Site A - Jakarta'),
('Inputer Site B', 'inputer_b@smbe.com', 'inputer123', 'inputer', 'Site B - Bekasi'),
('Inputer Site C', 'inputer_c@smbe.com', 'inputer123', 'inputer', 'Site C - Karawang');

-- Insert sample locations
INSERT IGNORE INTO location_master (name, code, address, region) VALUES 
('Site A - Jakarta', 'STA', 'Jakarta Industrial Area', 'Jakarta'),
('Site B - Bekasi', 'STB', 'Bekasi Industrial Park', 'West Java'),
('Site C - Karawang', 'STC', 'Karawang Industrial Zone', 'West Java'),
('Base Camp - Jakarta', 'BASE', 'Main Office Jakarta', 'Jakarta');

-- Insert sample cost parameters
INSERT IGNORE INTO cost_parameters (location_from_id, location_to_id, distance_km, toll_cost, fuel_cost_per_km, parking_cost, accommodation_cost, meal_allowance, toll_per_km, fuel_per_km, parking_per_day, accommodation_per_day, meal_per_day, effective_date) VALUES 
(4, 1, 25, 15000, 2500, 5000, 0, 50000, 600, 2500, 5000, 0, 50000, CURDATE()),
(4, 2, 35, 25000, 2500, 5000, 200000, 75000, 714, 2500, 5000, 200000, 75000, CURDATE()),
(4, 3, 65, 45000, 2500, 10000, 300000, 100000, 692, 2500, 10000, 300000, 100000, CURDATE());

-- Insert sample equipment
INSERT IGNORE INTO equipment_master (equipment_number, name, type, brand, model, year_manufacture, customer, location_id) VALUES 
('EX-001', 'Excavator Komatsu PC200', 'Excavator', 'Komatsu', 'PC200-8', 2018, 'PT. Construction Plus', 1),
('EX-002', 'Excavator Hitachi ZX200', 'Excavator', 'Hitachi', 'ZX200-3', 2019, 'PT. Builder Pro', 2),
('BL-001', 'Bulldozer Cat D6T', 'Bulldozer', 'Caterpillar', 'D6T', 2017, 'PT. Mining Solutions', 3),
('LD-001', 'Wheel Loader Cat 950M', 'Wheel Loader', 'Caterpillar', '950M', 2020, 'PT. Logistics Center', 1);

-- Insert sample mechanics
INSERT IGNORE INTO mechanic_master (employee_id, name, phone, level, specialization, location_id) VALUES 
('MEC001', 'Budi Santoso', '081234567890', 'Senior', 'Hydraulic Systems', 4),
('MEC002', 'Sari Wijaya', '081234567891', 'Senior', 'Engine & Transmission', 4),
('MEC003', 'Ahmad Rahman', '081234567892', 'Junior', 'General Maintenance', 1),
('MEC004', 'Dewi Sartika', '081234567893', 'Senior', 'Electrical Systems', 4),
('MEC005', 'Rudi Hermawan', '081234567894', 'Junior', 'General Maintenance', 2);

-- Insert sample parts
INSERT IGNORE INTO part_master (part_number, name, category, price, current_stock, supplier) VALUES 
('HYD001', 'Hydraulic Oil Filter', 'Hydraulic', 150000, 25, 'PT. Filter Indonesia'),
('ENG001', 'Engine Air Filter', 'Engine', 200000, 15, 'PT. Filter Indonesia'),
('ENG002', 'Engine Oil SAE 15W-40', 'Engine', 85000, 50, 'PT. Oil Solutions'),
('TRK001', 'Track Chain Link', 'Undercarriage', 1250000, 8, 'PT. Heavy Parts'),
('ELC001', 'Alternator 24V', 'Electrical', 2500000, 3, 'PT. Electrical Parts');

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- Equipment Performance View
CREATE OR REPLACE VIEW equipment_performance AS
SELECT 
    em.equipment_number,
    em.name as equipment_name,
    em.customer,
    lm.name as location,
    COUNT(bd.id) as total_breakdowns,
    AVG(bd.total_downtime_hours) as avg_downtime,
    SUM(bd.total_cost) as total_maintenance_cost,
    MAX(bd.tanggal) as last_breakdown_date
FROM equipment_master em
LEFT JOIN breakdown_data bd ON em.id = bd.equipment_id
LEFT JOIN location_master lm ON em.location_id = lm.id
GROUP BY em.id, em.equipment_number, em.name, em.customer, lm.name;

-- Mechanic Utilization View  
CREATE OR REPLACE VIEW mechanic_utilization AS
SELECT 
    mm.employee_id,
    mm.name as mechanic_name,
    mm.level,
    mm.specialization,
    COUNT(DISTINCT ma.breakdown_id) as jobs_handled,
    SUM(ma.hours_worked) as total_hours,
    AVG(ma.hours_worked) as avg_hours_per_job,
    SUM(ma.total_cost) as total_revenue
FROM mechanic_master mm
LEFT JOIN mechanic_activities ma ON mm.id = ma.mechanic_id
WHERE mm.is_active = true
GROUP BY mm.id, mm.employee_id, mm.name, mm.level, mm.specialization;

-- Cost Analysis View
CREATE OR REPLACE VIEW cost_analysis AS
SELECT 
    bd.id as breakdown_id,
    bd.equipment_number,
    bd.tanggal,
    bd.kategori_perawatan,
    COALESCE(parts_cost.total, 0) as spare_parts_cost,
    COALESCE(labor_cost.total, 0) as labor_cost,
    COALESCE(travel_cost.total, 0) as travel_cost,
    bd.total_cost
FROM breakdown_data bd
LEFT JOIN (
    SELECT breakdown_id, SUM(total_price) as total 
    FROM spare_parts_inout 
    WHERE transaction_type = 'out' 
    GROUP BY breakdown_id
) parts_cost ON bd.id = parts_cost.breakdown_id
LEFT JOIN (
    SELECT breakdown_id, SUM(total_cost) as total 
    FROM mechanic_activities 
    GROUP BY breakdown_id
) labor_cost ON bd.id = labor_cost.breakdown_id
LEFT JOIN (
    SELECT breakdown_id, SUM(amount) as total 
    FROM petty_cash 
    GROUP BY breakdown_id
) travel_cost ON bd.id = travel_cost.breakdown_id;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_breakdown_date_status ON breakdown_data(tanggal, status);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment_master(is_active);
CREATE INDEX IF NOT EXISTS idx_mechanic_active ON mechanic_master(is_active);
CREATE INDEX IF NOT EXISTS idx_parts_stock ON part_master(current_stock);
CREATE INDEX IF NOT EXISTS idx_activities_date ON mechanic_activities(activity_date, status);

-- =============================================
-- END OF SCHEMA
-- =============================================

