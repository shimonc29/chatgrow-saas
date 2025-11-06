const bcrypt = require('bcryptjs');
const { pool } = require('../config/postgres');

class ServiceProvider {
    constructor(data = {}) {
        this.id = data.id;
        this.fullName = data.full_name || data.fullName;
        this.businessName = data.business_name || data.businessName;
        this.email = data.email?.toLowerCase();
        this.password = data.password;
        this.serviceType = data.service_type || data.serviceType;
        this.phone = data.phone;
        this.address = data.address;
        this.settings = data.settings || {};
        this.analytics = data.analytics || { totalEvents: 0, totalRevenue: 0 };
        this.isActive = data.is_active !== undefined ? data.is_active : true;
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
    }

    async save() {
        if (!this.password.startsWith('$2a$')) {
            this.password = await bcrypt.hash(this.password, 12);
        }

        if (this.id) {
            const query = `
                UPDATE service_providers SET 
                full_name = $1, business_name = $2, email = $3, password = $4,
                service_type = $5, phone = $6, address = $7, settings = $8,
                analytics = $9, is_active = $10, updated_at = NOW()
                WHERE id = $11 RETURNING *
            `;
            const values = [
                this.fullName, this.businessName, this.email, this.password,
                this.serviceType, this.phone, this.address, 
                JSON.stringify(this.settings), JSON.stringify(this.analytics),
                this.isActive, this.id
            ];
            const result = await pool.query(query, values);
            return new ServiceProvider(result.rows[0]);
        } else {
            const providerId = 'prov_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
            const query = `
                INSERT INTO service_providers (
                    id, full_name, business_name, email, password,
                    service_type, phone, address, settings, analytics, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            const values = [
                providerId, this.fullName, this.businessName, this.email, this.password,
                this.serviceType, this.phone, this.address,
                JSON.stringify(this.settings), JSON.stringify(this.analytics),
                this.isActive
            ];
            const result = await pool.query(query, values);
            return new ServiceProvider(result.rows[0]);
        }
    }

    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    toJSON() {
        const obj = {
            id: this.id,
            fullName: this.fullName,
            businessName: this.businessName,
            email: this.email,
            serviceType: this.serviceType,
            phone: this.phone,
            address: this.address,
            settings: this.settings,
            analytics: this.analytics,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
        return obj;
    }

    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM service_providers WHERE email = $1 LIMIT 1';
            const result = await pool.query(query, [email.toLowerCase()]);
            return result.rows.length > 0 ? new ServiceProvider(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding provider by email:', error);
            return null;
        }
    }

    static async findById(id) {
        try {
            const query = 'SELECT * FROM service_providers WHERE id = $1 LIMIT 1';
            const result = await pool.query(query, [id]);
            return result.rows.length > 0 ? new ServiceProvider(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding provider by ID:', error);
            return null;
        }
    }

    static async getAll() {
        try {
            const query = 'SELECT * FROM service_providers ORDER BY created_at DESC';
            const result = await pool.query(query);
            return result.rows.map(row => new ServiceProvider(row));
        } catch (error) {
            console.error('Error getting all providers:', error);
            return [];
        }
    }

    static async createTable() {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS service_providers (
                    id VARCHAR(255) PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    business_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    service_type VARCHAR(255),
                    phone VARCHAR(50),
                    address TEXT,
                    settings JSONB DEFAULT '{}',
                    analytics JSONB DEFAULT '{"totalEvents": 0, "totalRevenue": 0}',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_providers_email ON service_providers(email);
                CREATE INDEX IF NOT EXISTS idx_providers_active ON service_providers(is_active);
            `;
            await pool.query(query);
            console.log('✅ ServiceProviders table created successfully');
        } catch (error) {
            console.error('❌ Error creating service_providers table:', error);
            throw error;
        }
    }
}

module.exports = ServiceProvider;
