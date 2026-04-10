import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Pool Configuration
const isLocalhost = (process.env.DB_HOST === 'localhost' || !process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
    ssl: (!isLocalhost || process.env.NODE_ENV === 'production' || (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'))) 
        ? { rejectUnauthorized: false } 
        : false
});

export default pool;
