import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

async function checkBiocrecimiento() {
    try {
        const res = await pool.query('SELECT * FROM historicos."2025-2026" WHERE labor ILIKE \'%Bio-crecimiento%\' OR raw_data::text ILIKE \'%Bio-crecimiento%\' LIMIT 10');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkBiocrecimiento();
