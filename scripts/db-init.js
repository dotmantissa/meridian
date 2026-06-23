const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CmM6xcaDpsO5@ep-restless-wind-atucut32-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
    console.log('Connecting to Neon PostgreSQL...');
    const client = new Client({
        connectionString,
    });
    
    try {
        await client.connect();
        console.log('Connected. Creating tables if they do not exist...');

        // 1. Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✔ Users table checked.');

        // 2. Offers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS offers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(255) NOT NULL,
                company VARCHAR(255) NOT NULL,
                city VARCHAR(255) NOT NULL,
                experience_years INTEGER NOT NULL,
                base_salary NUMERIC NOT NULL,
                equity VARCHAR(255),
                sign_on NUMERIC DEFAULT 0,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                raw_text TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✔ Offers table checked.');

        // 3. Analysis Reports table
        await client.query(`
            CREATE TABLE IF NOT EXISTS analysis_reports (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                offer_id UUID UNIQUE REFERENCES offers(id) ON DELETE CASCADE,
                tx_hash VARCHAR(255),
                contract_address VARCHAR(255),
                market_salary_min NUMERIC NOT NULL,
                market_salary_max NUMERIC NOT NULL,
                market_salary_median NUMERIC NOT NULL,
                recommended_base NUMERIC NOT NULL,
                equity_rating VARCHAR(50),
                equity_advice TEXT,
                negotiation_leverage TEXT,
                full_report_json JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✔ Analysis reports table checked.');

        console.log('Database initialization completed successfully!');
    } catch (err) {
        console.error('Error running migrations:', err);
    } finally {
        await client.end();
    }
}

main();
