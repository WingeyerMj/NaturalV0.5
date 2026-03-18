
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function alterTables() {
    let client;
    try {
        client = await pool.connect();
        console.log('Adding "tipo" column to admin_predios...');
        
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_predios' AND column_name='tipo') THEN
                    ALTER TABLE admin_predios ADD COLUMN tipo VARCHAR(50) DEFAULT 'Productivo';
                END IF;
            END $$;
        `);
        console.log('admin_predios updated with "tipo"');
        console.log('Migration complete.');
    } catch (err) {
        console.error('Error altering table:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

alterTables();
