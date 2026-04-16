
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://naturalfood_db_user:plJPXLHwpgor82vl5vj3ELtbo6FVMcWi@dpg-d6q267s50q8c73aae4b0-a.oregon-postgres.render.com/naturalfood_db',
    ssl: { rejectUnauthorized: false }
});

async function test() {
    try {
        console.log('Testing connection to Render DB...');
        const res = await pool.query('SELECT NOW()');
        console.log('Connection successful! Server time:', res.rows[0]);
    } catch (e) {
        console.error('Connection failed:', e.message);
    } finally {
        await pool.end();
    }
}

test();
