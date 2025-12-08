const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'smbe_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smbe_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
        }
    }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

// =============================================
// AUTHENTICATION ROUTES
// =============================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Query user from database
        const [users] = await pool.execute(
            'SELECT id, name, email, password, role, location, phone, avatar, is_active FROM users WHERE email = ? AND is_active = true',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        // Check if password is hashed (starts with $2) or plain text (for backward compatibility)
        let passwordMatch = false;
        
        if (user.password.startsWith('$2')) {
            // Password is hashed, use bcrypt
            passwordMatch = await bcrypt.compare(password, user.password);
        } else {
            // Plain text password (for backward compatibility during migration)
            passwordMatch = user.password === password;
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update last login
        await pool.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role, 
                location: user.location || null 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// BREAKDOWN ROUTES
// =============================================

// Get all breakdowns
app.get('/api/breakdown', authenticateToken, async (req, res) => {
    try {
        const { status, equipment, location, date_from, date_to, limit = 50, offset = 0 } = req.query;
        
        // Location-based access control
        const userLocation = req.user.location;
        let locationFilter = location;
        
        // If user has location restriction and is not admin, filter by user location
        if (userLocation && req.user.role !== 'admin') {
            locationFilter = userLocation;
        }
        
        // Build WHERE clause for both count and data queries
        let whereClause = 'WHERE 1=1';
        const params = [];
        const countParams = [];

        if (status) {
            whereClause += ' AND bd.status = ?';
            params.push(status);
            countParams.push(status);
        }

        if (equipment) {
            whereClause += ' AND bd.equipment_number LIKE ?';
            params.push(`%${equipment}%`);
            countParams.push(`%${equipment}%`);
        }

        if (locationFilter) {
            whereClause += ' AND bd.lokasi LIKE ?';
            params.push(`%${locationFilter}%`);
            countParams.push(`%${locationFilter}%`);
        }

        if (date_from) {
            whereClause += ' AND bd.tanggal >= ?';
            params.push(date_from);
            countParams.push(date_from);
        }

        if (date_to) {
            whereClause += ' AND bd.tanggal <= ?';
            params.push(date_to);
            countParams.push(date_to);
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM breakdown_data bd
            ${whereClause}
        `;
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Get paginated data
        const dataQuery = `
            SELECT bd.*, em.name as equipment_name, em.customer, lm.name as location_name
            FROM breakdown_data bd
            LEFT JOIN equipment_master em ON bd.equipment_id = em.id
            LEFT JOIN location_master lm ON bd.lokasi = lm.name
            ${whereClause}
            ORDER BY bd.created_at DESC 
            LIMIT ? OFFSET ?
        `;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(dataQuery, params);
        
        res.json({
            data: rows,
            total: total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get breakdowns error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get breakdown by ID
app.get('/api/breakdown/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT * FROM breakdown_data WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Breakdown not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Get breakdown error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new breakdown
app.post('/api/breakdown', authenticateToken, requireRole(['admin', 'inputer']), async (req, res) => {
    try {
        const {
            tanggal, shift, equipment_number, kode, lokasi, hm_breakdown,
            jam_mulai, jam_selesai, kategori_perawatan, pelapor_bd, work_order,
            wr_pr, tipe_bd, note_ccr, note_plant, km, komponen, problem,
            estimasi_1, estimasi_2, estimasi_3, penerima_rfu, aktivitas,
            detail_aktivitas, jam_aktivitas, rfu, hm_rfu_1, pelapor_rfu
        } = req.body;

        // Get equipment ID
        const [equipmentRows] = await pool.execute(
            'SELECT id FROM equipment_master WHERE equipment_number = ?',
            [equipment_number]
        );

        if (equipmentRows.length === 0) {
            return res.status(400).json({ message: 'Equipment not found' });
        }

        const equipment_id = equipmentRows[0].id;

        // Normalize kategori_perawatan to match database ENUM format (Service, PMS, Storing)
        let normalizedKategori = kategori_perawatan;
        if (kategori_perawatan) {
            const kategoriLower = kategori_perawatan.toLowerCase();
            if (kategoriLower === 'service') {
                normalizedKategori = 'Service';
            } else if (kategoriLower === 'pms') {
                normalizedKategori = 'PMS';
            } else if (kategoriLower === 'storing') {
                normalizedKategori = 'Storing';
            }
        }

        const [result] = await pool.execute(`
            INSERT INTO breakdown_data (
                tanggal, shift, equipment_id, equipment_number, kode, lokasi, hm_breakdown,
                jam_mulai, jam_selesai, kategori_perawatan, pelapor_bd, work_order,
                wr_pr, tipe_bd, note_ccr, note_plant, km, komponen, problem,
                estimasi_1, estimasi_2, estimasi_3, penerima_rfu, aktivitas,
                detail_aktivitas, jam_aktivitas, rfu, hm_rfu_1, pelapor_rfu,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tanggal, shift, equipment_id, equipment_number, kode, lokasi, hm_breakdown,
            jam_mulai, jam_selesai, normalizedKategori, pelapor_bd, work_order,
            wr_pr, tipe_bd, note_ccr, note_plant, km, komponen, problem,
            estimasi_1, estimasi_2, estimasi_3, penerima_rfu, aktivitas,
            detail_aktivitas, jam_aktivitas, rfu, hm_rfu_1, pelapor_rfu,
            req.user.id
        ]);

        res.status(201).json({ id: result.insertId, message: 'Breakdown created successfully' });
    } catch (error) {
        console.error('Create breakdown error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update breakdown
app.put('/api/breakdown/:id', authenticateToken, requireRole(['admin', 'inputer']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove id from updateData if present
        delete updateData.id;
        
        // Normalize kategori_perawatan if present
        if (updateData.kategori_perawatan) {
            const kategoriLower = updateData.kategori_perawatan.toLowerCase();
            if (kategoriLower === 'service') {
                updateData.kategori_perawatan = 'Service';
            } else if (kategoriLower === 'pms') {
                updateData.kategori_perawatan = 'PMS';
            } else if (kategoriLower === 'storing') {
                updateData.kategori_perawatan = 'Storing';
            }
        }
        
        // Add updated_by field
        updateData.updated_by = req.user.id;

        const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        values.push(id);

        const [result] = await pool.execute(
            `UPDATE breakdown_data SET ${fields} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Breakdown not found' });
        }

        res.json({ message: 'Breakdown updated successfully' });
    } catch (error) {
        console.error('Update breakdown error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete breakdown
app.delete('/api/breakdown/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM breakdown_data WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Breakdown not found' });
        }

        res.json({ message: 'Breakdown deleted successfully' });
    } catch (error) {
        console.error('Delete breakdown error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// MASTER DATA ROUTES
// =============================================

// Equipment Master
app.get('/api/master/equipment', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT em.*, lm.name as location_name 
            FROM equipment_master em
            LEFT JOIN location_master lm ON em.location_id = lm.id
            WHERE em.is_active = true
            ORDER BY em.equipment_number
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/master/equipment', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const {
            equipment_number, name, type, category, brand, model, year_manufacture,
            serial_number, plate_number, customer, location_id, specifications
        } = req.body;

        const [result] = await pool.execute(`
            INSERT INTO equipment_master (
                equipment_number, name, type, category, brand, model, year_manufacture,
                serial_number, plate_number, customer, location_id, specifications
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            equipment_number, name, type, category, brand, model, year_manufacture,
            serial_number, plate_number, customer, location_id, JSON.stringify(specifications)
        ]);

        res.status(201).json({ id: result.insertId, message: 'Equipment created successfully' });
    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/master/equipment/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            equipment_number, name, type, category, brand, model, year_manufacture,
            serial_number, plate_number, customer, location_id, specifications
        } = req.body;

        const [result] = await pool.execute(`
            UPDATE equipment_master SET
                equipment_number = ?, name = ?, type = ?, category = ?, brand = ?, model = ?,
                year_manufacture = ?, serial_number = ?, plate_number = ?, customer = ?,
                location_id = ?, specifications = ?
            WHERE id = ?
        `, [
            equipment_number, name, type, category, brand, model, year_manufacture,
            serial_number, plate_number, customer, location_id, JSON.stringify(specifications), id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        res.json({ message: 'Equipment updated successfully' });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/master/equipment/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE equipment_master SET is_active = false WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mechanic Master
app.get('/api/master/mechanics', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT mm.*, lm.name as location_name 
            FROM mechanic_master mm
            LEFT JOIN location_master lm ON mm.location_id = lm.id
            WHERE mm.is_active = true
            ORDER BY mm.name
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get mechanics error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/master/mechanics', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const {
            employee_id, name, phone, email, level, specialization,
            hourly_rate, location_id, hire_date, certifications
        } = req.body;

        const [result] = await pool.execute(`
            INSERT INTO mechanic_master (
                employee_id, name, phone, email, level, specialization,
                hourly_rate, location_id, hire_date, certifications
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            employee_id, name, phone, email, level, specialization,
            hourly_rate, location_id, hire_date, JSON.stringify(certifications)
        ]);

        res.status(201).json({ id: result.insertId, message: 'Mechanic created successfully' });
    } catch (error) {
        console.error('Create mechanic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/master/mechanics/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            employee_id, name, phone, email, level, specialization,
            hourly_rate, location_id, hire_date, certifications
        } = req.body;

        const [result] = await pool.execute(`
            UPDATE mechanic_master SET
                employee_id = ?, name = ?, phone = ?, email = ?, level = ?, specialization = ?,
                hourly_rate = ?, location_id = ?, hire_date = ?, certifications = ?
            WHERE id = ?
        `, [
            employee_id, name, phone, email, level, specialization,
            hourly_rate, location_id, hire_date, JSON.stringify(certifications), id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        res.json({ message: 'Mechanic updated successfully' });
    } catch (error) {
        console.error('Update mechanic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/master/mechanics/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE mechanic_master SET is_active = false WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }

        res.json({ message: 'Mechanic deleted successfully' });
    } catch (error) {
        console.error('Delete mechanic error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Parts Master
app.get('/api/master/parts', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM part_master 
            WHERE is_active = true
            ORDER BY part_number
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get parts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/master/parts', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const {
            part_number, name, category, subcategory, brand, unit, price,
            minimum_stock, supplier, description, specifications
        } = req.body;

        const [result] = await pool.execute(`
            INSERT INTO part_master (
                part_number, name, category, subcategory, brand, unit, price,
                minimum_stock, current_stock, supplier, description, specifications
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        `, [
            part_number, name, category, subcategory, brand, unit, price,
            minimum_stock, supplier, description, JSON.stringify(specifications)
        ]);

        res.status(201).json({ id: result.insertId, message: 'Part created successfully' });
    } catch (error) {
        console.error('Create part error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/master/parts/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            part_number, name, category, subcategory, brand, unit, price,
            minimum_stock, supplier, description, specifications
        } = req.body;

        const [result] = await pool.execute(`
            UPDATE part_master SET
                part_number = ?, name = ?, category = ?, subcategory = ?, brand = ?, unit = ?,
                price = ?, minimum_stock = ?, supplier = ?, description = ?, specifications = ?
            WHERE id = ?
        `, [
            part_number, name, category, subcategory, brand, unit, price,
            minimum_stock, supplier, description, JSON.stringify(specifications), id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Part not found' });
        }

        res.json({ message: 'Part updated successfully' });
    } catch (error) {
        console.error('Update part error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/master/parts/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE part_master SET is_active = false WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Part not found' });
        }

        res.json({ message: 'Part deleted successfully' });
    } catch (error) {
        console.error('Delete part error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Locations Master
app.get('/api/master/locations', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM location_master 
            WHERE is_active = true
            ORDER BY name
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/master/locations', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, code, address, coordinates, region, contact_person, contact_phone } = req.body;

        const [result] = await pool.execute(`
            INSERT INTO location_master (name, code, address, coordinates, region, contact_person, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, code, address, coordinates, region, contact_person, contact_phone]);

        res.status(201).json({ id: result.insertId, message: 'Location created successfully' });
    } catch (error) {
        console.error('Create location error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/master/locations/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, address, coordinates, region, contact_person, contact_phone } = req.body;

        const [result] = await pool.execute(`
            UPDATE location_master SET
                name = ?, code = ?, address = ?, coordinates = ?, region = ?,
                contact_person = ?, contact_phone = ?
            WHERE id = ?
        `, [name, code, address, coordinates, region, contact_person, contact_phone, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/master/locations/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE location_master SET is_active = false WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/master/cost-parameters', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { toll_per_km, fuel_per_km, parking_per_day, accommodation_per_day, meal_per_day } = req.body;

        // Update or insert default cost parameters
        // This is a simplified version - you may need to adjust based on your schema
        res.json({ message: 'Cost parameters updated successfully' });
    } catch (error) {
        console.error('Update cost parameters error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Cost Parameters
app.get('/api/master/cost-parameters', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT cp.*, 
                   lf.name as location_from_name,
                   lt.name as location_to_name
            FROM cost_parameters cp
            LEFT JOIN location_master lf ON cp.location_from_id = lf.id
            LEFT JOIN location_master lt ON cp.location_to_id = lt.id
            WHERE cp.is_active = true
            ORDER BY lf.name, lt.name
        `);
        res.json(rows);
    } catch (error) {
        console.error('Get cost parameters error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// SPARE PARTS ROUTES
// =============================================

app.get('/api/spare-parts', authenticateToken, async (req, res) => {
    try {
        const { breakdown_id, part_number, transaction_type, date_from, date_to, limit = 10, offset = 0 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        const countParams = [];

        if (breakdown_id) {
            whereClause += ' AND spi.breakdown_id = ?';
            params.push(breakdown_id);
            countParams.push(breakdown_id);
        }

        if (part_number) {
            whereClause += ' AND spi.part_number LIKE ?';
            params.push(`%${part_number}%`);
            countParams.push(`%${part_number}%`);
        }

        if (transaction_type) {
            whereClause += ' AND spi.transaction_type = ?';
            params.push(transaction_type);
            countParams.push(transaction_type);
        }

        if (date_from) {
            whereClause += ' AND DATE(spi.transaction_date) >= ?';
            params.push(date_from);
            countParams.push(date_from);
        }

        if (date_to) {
            whereClause += ' AND DATE(spi.transaction_date) <= ?';
            params.push(date_to);
            countParams.push(date_to);
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM spare_parts_inout spi
            ${whereClause}
        `;
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Get paginated data
        const dataQuery = `
            SELECT spi.*, pm.name as part_name, bd.equipment_number
            FROM spare_parts_inout spi
            LEFT JOIN part_master pm ON spi.part_id = pm.id
            LEFT JOIN breakdown_data bd ON spi.breakdown_id = bd.id
            ${whereClause}
            ORDER BY spi.transaction_date DESC
            LIMIT ? OFFSET ?
        `;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(dataQuery, params);
        
        res.json({
            data: rows,
            total: total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get spare parts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/spare-parts', authenticateToken, requireRole(['admin', 'inputer']), async (req, res) => {
    try {
        const {
            breakdown_id, part_id, part_number, transaction_type, quantity,
            unit_price, reference_order, supplier, location_id, condition_status,
            usage_notes, received_by
        } = req.body;

        const total_price = quantity * unit_price;

        const [result] = await pool.execute(`
            INSERT INTO spare_parts_inout (
                breakdown_id, part_id, part_number, transaction_type, quantity,
                unit_price, total_price, transaction_date, reference_order,
                supplier, location_id, condition_status, usage_notes,
                received_by, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
        `, [
            breakdown_id, part_id, part_number, transaction_type, quantity,
            unit_price, total_price, reference_order, supplier, location_id,
            condition_status, usage_notes, received_by, req.user.id
        ]);

        res.status(201).json({ id: result.insertId, message: 'Spare parts transaction created successfully' });
    } catch (error) {
        console.error('Create spare parts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/spare-parts/:id', authenticateToken, requireRole(['admin', 'inputer']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.quantity && updateData.unit_price) {
            updateData.total_price = updateData.quantity * updateData.unit_price;
        }

        const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        values.push(id);

        const [result] = await pool.execute(
            `UPDATE spare_parts_inout SET ${fields} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Update spare parts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/spare-parts/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM spare_parts_inout WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete spare parts error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// PETTY CASH ROUTES
// =============================================

app.get('/api/petty-cash', authenticateToken, async (req, res) => {
    try {
        const { breakdown_id, expense_type, date_from, date_to, limit = 10, offset = 0 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        const countParams = [];

        if (breakdown_id) {
            whereClause += ' AND pc.breakdown_id = ?';
            params.push(breakdown_id);
            countParams.push(breakdown_id);
        }

        if (expense_type) {
            whereClause += ' AND pc.expense_type = ?';
            params.push(expense_type);
            countParams.push(expense_type);
        }

        if (date_from) {
            whereClause += ' AND pc.expense_date >= ?';
            params.push(date_from);
            countParams.push(date_from);
        }

        if (date_to) {
            whereClause += ' AND pc.expense_date <= ?';
            params.push(date_to);
            countParams.push(date_to);
        }

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM petty_cash pc
            ${whereClause}
        `;
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Get paginated data
        const dataQuery = `
            SELECT pc.*, bd.equipment_number,
                   lf.name as location_from_name,
                   lt.name as location_to_name,
                   mm.name as mechanic_name
            FROM petty_cash pc
            LEFT JOIN breakdown_data bd ON pc.breakdown_id = bd.id
            LEFT JOIN location_master lf ON pc.location_from_id = lf.id
            LEFT JOIN location_master lt ON pc.location_to_id = lt.id
            LEFT JOIN mechanic_master mm ON pc.mechanic_id = mm.id
            ${whereClause}
            ORDER BY pc.expense_date DESC
            LIMIT ? OFFSET ?
        `;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(dataQuery, params);
        
        res.json({
            data: rows,
            total: total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get petty cash error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/petty-cash', authenticateToken, requireRole(['admin', 'inputer']), async (req, res) => {
    try {
        const {
            breakdown_id, expense_date, expense_type, description, amount,
            location_from_id, location_to_id, distance_km, receipt_number,
            mechanic_id, vehicle_used, notes
        } = req.body;

        const [result] = await pool.execute(`
            INSERT INTO petty_cash (
                breakdown_id, expense_date, expense_type, description, amount,
                location_from_id, location_to_id, distance_km, receipt_number,
                mechanic_id, vehicle_used, notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            breakdown_id, expense_date, expense_type, description, amount,
            location_from_id, location_to_id, distance_km, receipt_number,
            mechanic_id, vehicle_used, notes, req.user.id
        ]);

        res.status(201).json({ id: result.insertId, message: 'Petty cash transaction created successfully' });
    } catch (error) {
        console.error('Create petty cash error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/petty-cash/:id', authenticateToken, requireRole(['admin', 'inputer']), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        values.push(id);

        const [result] = await pool.execute(
            `UPDATE petty_cash SET ${fields} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Update petty cash error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/petty-cash/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM petty_cash WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete petty cash error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// USER MANAGEMENT ROUTES (Admin Only)
// =============================================

// Get all users with pagination
app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { search, role, location, is_active, limit = 10, offset = 0 } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        const countParams = [];

        if (search) {
            whereClause += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
            countParams.push(`%${search}%`, `%${search}%`);
        }

        if (role) {
            whereClause += ' AND role = ?';
            params.push(role);
            countParams.push(role);
        }

        if (location) {
            whereClause += ' AND location LIKE ?';
            params.push(`%${location}%`);
            countParams.push(`%${location}%`);
        }

        if (is_active !== undefined && is_active !== '') {
            whereClause += ' AND is_active = ?';
            params.push(is_active === 'true' ? 1 : 0);
            countParams.push(is_active === 'true' ? 1 : 0);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        // Get paginated data
        const dataQuery = `
            SELECT id, name, email, role, location, phone, avatar, is_active, 
                   last_login, created_at, updated_at
            FROM users 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(dataQuery, params);
        
        res.json({
            data: rows,
            total: total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user by ID
app.get('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT id, name, email, role, location, phone, avatar, is_active, last_login, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new user
app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, email, password, role, location, phone, avatar, is_active = true } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password, and role are required' });
        }

        // Check if email already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(`
            INSERT INTO users (name, email, password, role, location, phone, avatar, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, email, hashedPassword, role, location || null, phone || null, avatar || null, is_active ? 1 : 0]);

        const [newUser] = await pool.execute(
            'SELECT id, name, email, role, location, phone, avatar, is_active, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({ 
            user: newUser[0],
            message: 'User created successfully' 
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user
app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, location, phone, avatar, is_active } = req.body;

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id, email FROM users WHERE id = ?',
            [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is being changed and if new email already exists
        if (email && email !== existingUsers[0].email) {
            const [emailCheck] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );

            if (emailCheck.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }
        if (role) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }
        if (location !== undefined) {
            updateFields.push('location = ?');
            updateValues.push(location || null);
        }
        if (phone !== undefined) {
            updateFields.push('phone = ?');
            updateValues.push(phone || null);
        }
        if (avatar !== undefined) {
            updateFields.push('avatar = ?');
            updateValues.push(avatar || null);
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active ? 1 : 0);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(id);

        const [result] = await pool.execute(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const [updatedUser] = await pool.execute(
            'SELECT id, name, email, role, location, phone, avatar, is_active, updated_at FROM users WHERE id = ?',
            [id]
        );

        res.json({ 
            user: updatedUser[0],
            message: 'User updated successfully' 
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete user (soft delete by setting is_active = false)
app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const [result] = await pool.execute(
            'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// DASHBOARD ROUTES
// =============================================

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // Mock dashboard stats - replace with real queries
        const stats = {
            totalEquipment: 48,
            equipmentBroken: 5,
            equipmentReady: 43,
            totalMechanics: 12,
            totalCost: 125000000,
            averageRepairTime: 4.5
        };

        res.json(stats);
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// =============================================
// FILE UPLOAD ROUTES
// =============================================

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        res.json({
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            size: req.file.size
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'File upload failed' });
    }
});

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large' });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// =============================================
// SERVER STARTUP
// =============================================

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
    try {
        await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
        console.log('Uploads directory created/verified');
    } catch (error) {
        console.error('Error creating uploads directory:', error);
    }
};

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

// Start server
const startServer = async () => {
    await createUploadsDir();
    await testConnection();
    
    app.listen(PORT, () => {
        console.log(`SMBE Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Database: ${dbConfig.host}/${dbConfig.database}`);
        console.log('API Endpoints:');
        console.log('  POST /api/auth/login - User authentication');
        console.log('  GET  /api/breakdown - Get breakdown data');
        console.log('  POST /api/breakdown - Create breakdown');
        console.log('  GET  /api/master/* - Master data endpoints');
        console.log('  GET  /api/dashboard/stats - Dashboard statistics');
    });
};

startServer().catch(console.error);

module.exports = app;