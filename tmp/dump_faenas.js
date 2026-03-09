
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
});

async function dumpTables() {
    try {
        console.log('--- admin_faenas ---');
        const faenas = await pool.query('SELECT * FROM admin_faenas');
        console.log(JSON.stringify(faenas.rows, null, 2));

        console.log('\n--- admin_labor ---');
        const labores = await pool.query('SELECT * FROM admin_labor');
        console.log(JSON.stringify(labores.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

dumpTables();
