
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
});

async function run() {
    try {
        console.log('Adding constraints...');
        await pool.query('ALTER TABLE admin_fincas ADD CONSTRAINT unique_finca_nombre UNIQUE (nombre)');
        await pool.query('ALTER TABLE admin_predios ADD CONSTRAINT unique_predio_finca_nombre UNIQUE (finca_id, nombre)');
        await pool.query('ALTER TABLE admin_cuarteles ADD CONSTRAINT unique_cuartel_predio_numero UNIQUE (predio_id, numero)');
        await pool.query('ALTER TABLE admin_faenas ADD CONSTRAINT unique_faena_nombre UNIQUE (nombre)');
        await pool.query('ALTER TABLE admin_labor ADD CONSTRAINT unique_labor_faena_nombre UNIQUE (faena_id, nombre)');
        console.log('Constraints added successfully!');
    } catch (e) {
        if (e.code === '42P07') {
            console.log('Constraints already exist.');
        } else {
            console.error('Error adding constraints:', e);
        }
    } finally {
        await pool.end();
    }
}

run();
