const bcrypt = require('bcryptjs');

// Placeholder for PostgreSQL pool connection. In a real application, this would be configured and imported.
// For demonstration purposes, we'll assume 'pool' is available globally or imported from a config file.
// Example: const { pool } = require('./db'); 

// Mock pool for demonstration if not provided
const pool = {
    query: async (sql, values) => {
        console.log('Executing query:', sql, values);
        // Mocking a database response for createTable
        if (sql.includes('CREATE TABLE IF NOT EXISTS subscribers')) {
            console.log('Mock: Subscribers table creation simulated.');
            return { rows: [] };
        }
        // Mocking a database response for INSERT
        if (sql.includes('INSERT INTO subscribers')) {
            console.log('Mock: Subscriber insertion simulated.');
            return { rows: [{ id: 1, ...values }] };
        }
        // Mocking a database response for UPDATE
        if (sql.includes('UPDATE subscribers')) {
            console.log('Mock: Subscriber update simulated.');
            return { rows: [{ id: values[10], ...values }] };
        }
        // Mocking a database response for SELECT by email
        if (sql.includes('SELECT * FROM subscribers WHERE email = $1')) {
            console.log('Mock: Finding subscriber by email simulated.');
            if (values[0] === 'test@example.com') {
                return { rows: [{ id: 1, email: 'test@example.com', password: await bcrypt.hash('password123', 12), profile: {}, subscription: {}, referral: {}, analytics: {}, registrations: [], connected_providers: [], is_email_verified: false }] };
            }
            return { rows: [] };
        }
        // Mocking a database response for SELECT by ID
        if (sql.includes('SELECT * FROM subscribers WHERE id = $1')) {
            console.log('Mock: Finding subscriber by ID simulated.');
            if (values[0] === 1) {
                 return { rows: [{ id: 1, email: 'test@example.com', password: await bcrypt.hash('password123', 12), profile: {}, subscription: {}, referral: {}, analytics: {}, registrations: [], connected_providers: [], is_email_verified: false }] };
            }
            return { rows: [] };
        }
        // Mocking a database response for SELECT by referral code
        if (sql.includes("SELECT * FROM subscribers WHERE referral->>'referralCode' = $1")) {
            console.log('Mock: Finding subscriber by referral code simulated.');
            if (values[0] === 'REFCODE123') {
                return { rows: [{ id: 1, email: 'test@example.com', password: await bcrypt.hash('password123', 12), profile: {}, subscription: {}, referral: { referralCode: 'REFCODE123' }, analytics: {}, registrations: [], connected_providers: [], is_email_verified: false }] };
            }
            return { rows: [] };
        }
        // Mocking a database response for subscription stats
        if (sql.includes('SELECT subscription->>')) {
            console.log('Mock: Getting subscription stats simulated.');
            return { rows: [{ plan: 'free', count: '10', active_count: '8' }, { plan: 'basic', count: '5', active_count: '4' }] };
        }
        return { rows: [] };
    }
};


// PostgreSQL Subscriber model
class Subscriber {
    constructor(data = {}) {
        this.id = data.id;
        this.email = data.email?.toLowerCase();
        this.password = data.password;
        this.profile = data.profile || {};
        this.subscription = data.subscription || { plan: 'free', status: 'active' };
        this.referral = data.referral || {};
        this.analytics = data.analytics || {};
        this.registrations = data.registrations || [];
        this.connectedProviders = data.connectedProviders || [];
        this.isEmailVerified = data.isEmailVerified || false;
        this.emailVerificationToken = data.emailVerificationToken;
        this.subscriptionStatus = data.subscriptionStatus || data.subscription_status || 'FREE';
        this.maxCustomers = data.maxCustomers || data.max_customers || 200;
        this.currentCustomerCount = data.currentCustomerCount || data.current_customer_count || 0;
        this.isWhitelabel = data.isWhitelabel || data.is_whitelabel || false;
        this.paymentProviderId = data.paymentProviderId || data.payment_provider_id || null;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    async save() {
        if (!this.password.startsWith('$2a$')) {
            this.password = await bcrypt.hash(this.password, 12);
        }

        if (!this.referral.referralCode) {
            this.referral.referralCode = 'REF' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 8).toUpperCase();
        }

        if (this.id) {
            // Update existing
            const query = `
                UPDATE subscribers SET 
                email = $1, password = $2, profile = $3, subscription = $4,
                referral = $5, analytics = $6, registrations = $7, 
                connected_providers = $8, is_email_verified = $9,
                email_verification_token = $10, subscription_status = $11,
                max_customers = $12, current_customer_count = $13,
                is_whitelabel = $14, payment_provider_id = $15, updated_at = NOW()
                WHERE id = $16 RETURNING *
            `;
            const values = [
                this.email, this.password, JSON.stringify(this.profile),
                JSON.stringify(this.subscription), JSON.stringify(this.referral),
                JSON.stringify(this.analytics), JSON.stringify(this.registrations),
                JSON.stringify(this.connectedProviders), this.isEmailVerified,
                this.emailVerificationToken, this.subscriptionStatus,
                this.maxCustomers, this.currentCustomerCount,
                this.isWhitelabel, this.paymentProviderId, this.id
            ];
            const result = await pool.query(query, values);
            return new Subscriber(result.rows[0]);
        } else {
            // Create new
            const query = `
                INSERT INTO subscribers (
                    email, password, profile, subscription, referral,
                    analytics, registrations, connected_providers,
                    is_email_verified, email_verification_token,
                    subscription_status, max_customers, current_customer_count,
                    is_whitelabel, payment_provider_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;
            const values = [
                this.email, this.password, JSON.stringify(this.profile),
                JSON.stringify(this.subscription), JSON.stringify(this.referral),
                JSON.stringify(this.analytics), JSON.stringify(this.registrations),
                JSON.stringify(this.connectedProviders), this.isEmailVerified,
                this.emailVerificationToken, this.subscriptionStatus,
                this.maxCustomers, this.currentCustomerCount,
                this.isWhitelabel, this.paymentProviderId
            ];
            const result = await pool.query(query, values);
            return new Subscriber(result.rows[0]);
        }
    }

    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    get fullName() {
        return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
    }

    toJSON() {
        const obj = { ...this };
        delete obj.password;
        delete obj.emailVerificationToken;
        return obj;
    }

    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM subscribers WHERE email = $1 LIMIT 1';
            const result = await pool.query(query, [email.toLowerCase()]);
            return result.rows.length > 0 ? new Subscriber(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding subscriber by email:', error);
            return null;
        }
    }

    static async findById(id) {
        try {
            const query = 'SELECT * FROM subscribers WHERE id = $1 LIMIT 1';
            const result = await pool.query(query, [id]);
            return result.rows.length > 0 ? new Subscriber(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding subscriber by ID:', error);
            return null;
        }
    }

    static async findByReferralCode(code) {
        try {
            const query = "SELECT * FROM subscribers WHERE referral->>'referralCode' = $1 LIMIT 1";
            const result = await pool.query(query, [code]);
            return result.rows.length > 0 ? new Subscriber(result.rows[0]) : null;
        } catch (error) {
            console.error('Error finding subscriber by referral code:', error);
            return null;
        }
    }

    static async getSubscriptionStats() {
        try {
            const query = `
                SELECT 
                    subscription->>'plan' as plan,
                    COUNT(*) as count,
                    COUNT(CASE WHEN subscription->>'status' = 'active' THEN 1 END) as active_count
                FROM subscribers 
                GROUP BY subscription->>'plan'
            `;
            const result = await pool.query(query);
            return result.rows.map(row => ({
                _id: row.plan,
                count: parseInt(row.count),
                activeCount: parseInt(row.active_count)
            }));
        } catch (error) {
            console.error('Error getting subscription stats:', error);
            return [];
        }
    }

    static async createTable() {
        try {
            const query = `
                CREATE TABLE IF NOT EXISTS subscribers (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    profile JSONB DEFAULT '{}',
                    subscription JSONB DEFAULT '{"plan": "free", "status": "active"}',
                    referral JSONB DEFAULT '{}',
                    analytics JSONB DEFAULT '{}',
                    registrations JSONB DEFAULT '[]',
                    connected_providers JSONB DEFAULT '[]',
                    is_email_verified BOOLEAN DEFAULT FALSE,
                    email_verification_token VARCHAR(255),
                    subscription_status VARCHAR(20) DEFAULT 'FREE',
                    max_customers INTEGER DEFAULT 200,
                    current_customer_count INTEGER DEFAULT 0,
                    is_whitelabel BOOLEAN DEFAULT FALSE,
                    payment_provider_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
                CREATE INDEX IF NOT EXISTS idx_subscribers_referral_code ON subscribers USING GIN ((referral->>'referralCode'));
                CREATE INDEX IF NOT EXISTS idx_subscribers_subscription_status ON subscribers(subscription_status);
            `;
            await pool.query(query);
            console.log('✅ Subscribers table created successfully');
        } catch (error) {
            console.error('❌ Error creating subscribers table:', error);
        }
    }

    static async migrateAddFreemiumFields() {
        try {
            const query = `
                ALTER TABLE subscribers 
                ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'FREE',
                ADD COLUMN IF NOT EXISTS max_customers INTEGER DEFAULT 200,
                ADD COLUMN IF NOT EXISTS current_customer_count INTEGER DEFAULT 0,
                ADD COLUMN IF NOT EXISTS is_whitelabel BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS payment_provider_id VARCHAR(255);

                CREATE INDEX IF NOT EXISTS idx_subscribers_subscription_status ON subscribers(subscription_status);
            `;
            await pool.query(query);
            console.log('✅ Freemium fields migration completed successfully');
        } catch (error) {
            console.error('❌ Error migrating freemium fields:', error);
        }
    }
}

module.exports = Subscriber;