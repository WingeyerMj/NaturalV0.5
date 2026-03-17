
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    try {
        const res = await pool.query(`SELECT count(*) FROM historicos."2024-2025" WHERE raw_data::text ILIKE '%jornada%'`);
        console.log('Records with "jornada" string in raw_data (2024-2025):', res.rows[0].count);
    } catch (e) { console.error(e); } finally { await pool.end(); }
}
test();
