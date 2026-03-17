import pool from './src/db.js';

async function migrate() {
    try {
        await pool.query('ALTER TABLE trabajo_campo_logs ADD COLUMN IF NOT EXISTS usuario_cargo_id INTEGER;');
        console.log('Migración exitosa: Columna usuario_cargo_id agregada.');
    } catch (e) {
        console.error('Error en migración:', e);
    } finally {
        process.exit();
    }
}

migrate();
