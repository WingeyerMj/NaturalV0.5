
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runAlters() {
    const client = await pool.connect();
    try {
        console.log('🔄 Iniciando actualización de esquema para asegurar persistencia total...');

        // 1. admin_fincas
        await client.query(`
            ALTER TABLE admin_fincas ADD COLUMN IF NOT EXISTS tiene_bodega VARCHAR(50) DEFAULT 'No';
        `);

        // 2. admin_predios
        await client.query(`
            ALTER TABLE admin_predios ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'Productivo';
            ALTER TABLE admin_predios ADD COLUMN IF NOT EXISTS tiene_bodega VARCHAR(50) DEFAULT 'No';
        `);

        // 3. admin_cuarteles
        await client.query(`
            ALTER TABLE admin_cuarteles ADD COLUMN IF NOT EXISTS sistema_riego VARCHAR(100);
            ALTER TABLE admin_cuarteles ADD COLUMN IF NOT EXISTS estado VARCHAR(100) DEFAULT 'Activo';
            ALTER TABLE admin_cuarteles ADD COLUMN IF NOT EXISTS plantas_por_hilera INT DEFAULT 0;
            -- hileras e hileras ya están en el SQL pero nos aseguramos
            ALTER TABLE admin_cuarteles ADD COLUMN IF NOT EXISTS hileras INT DEFAULT 0;
        `);

        // 4. empleados (Asegurar que existan los nombres de columnas que usa el frontend o viceversa)
        // El frontend usa 'position' y 'start_date'. El SQL usa 'cargo' y 'fecha_ingreso'.
        // Vamos a añadir los campos faltantes para no romper nada.
        await client.query(`
            ALTER TABLE empleados ADD COLUMN IF NOT EXISTS position VARCHAR(100);
            ALTER TABLE empleados ADD COLUMN IF NOT EXISTS start_date DATE;
            ALTER TABLE empleados ADD COLUMN IF NOT EXISTS salary DECIMAL(12,2) DEFAULT 0;
        `);

        console.log('✅ Esquema actualizado correctamente.');
    } catch (err) {
        console.error('❌ Error actualizando esquema:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runAlters();
