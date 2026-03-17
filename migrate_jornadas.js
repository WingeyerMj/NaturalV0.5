import pool from './src/db.js';

async function migrate() {
    try {
        await pool.query('ALTER TABLE trabajo_campo_logs ADD COLUMN IF NOT EXISTS total_jornadas NUMERIC DEFAULT 0;');
        console.log('Migración exitosa: Columna total_jornadas agregada.');
    } catch (e) {
        console.error('Error en migración:', e);
    } finally {
        process.exit();
    }
}

migrate();
