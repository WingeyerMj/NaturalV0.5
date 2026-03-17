
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
        const tabsRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'historicos'");
        for (const row of tabsRes.rows) {
            const table = row.table_name;
            const res = await pool.query(`SELECT count(*) FROM historicos."${table}" WHERE total_jornadas > 0`);
            console.log(`Table ${table}: ${res.rows[0].count} records with total_jornadas > 0`);
        }
    } catch (e) { console.error(e); } finally { await pool.end(); }
}
test();
