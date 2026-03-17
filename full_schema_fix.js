import pool from './src/db.js';

async function migrate() {
    try {
        console.log('Starting full schema migration...');
        
        // 1. Update trabajo_campo_logs
        console.log('Updating trabajo_campo_logs...');
        await pool.query('ALTER TABLE trabajo_campo_logs ADD COLUMN IF NOT EXISTS hora_inicio TIME;');
        await pool.query('ALTER TABLE trabajo_campo_logs ADD COLUMN IF NOT EXISTS hora_fin TIME;');
        await pool.query('ALTER TABLE trabajo_campo_logs ADD COLUMN IF NOT EXISTS total_jornadas DECIMAL(10,2) DEFAULT 0;');
        await pool.query('ALTER TABLE trabajo_campo_logs ADD COLUMN IF NOT EXISTS usuario_cargo_id INT REFERENCES users(id);');
        console.log('✓ trabajo_campo_logs updated.');

        // 2. Create stock_movimientos
        console.log('Creating stock_movimientos table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_movimientos (
                id SERIAL PRIMARY KEY,
                producto_id INT REFERENCES admin_productos(id) ON DELETE CASCADE,
                tipo_movimiento VARCHAR(50) NOT NULL, -- 'entrada', 'salida', 'consumo', 'ajuste'
                cantidad DECIMAL(12,2) NOT NULL,
                nro_comprobante VARCHAR(100),
                usuario_id INT REFERENCES users(id),
                notas TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ stock_movimientos table created.');

        console.log('Migration completed successfully!');
    } catch (e) {
        console.error('Error during migration:', e);
    } finally {
        process.exit();
    }
}

migrate();
