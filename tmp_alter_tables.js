
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function alterTables() {
    let client;
    try {
        client = await pool.connect();
        console.log('Altering tables...');
        
        // Add tiene_bodega to admin_fincas
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_fincas' AND column_name='tiene_bodega') THEN
                    ALTER TABLE admin_fincas ADD COLUMN tiene_bodega VARCHAR(50) DEFAULT 'No';
                END IF;
            END $$;
        `);
        console.log('admin_fincas updated');

        // Add tiene_bodega to admin_predios
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_predios' AND column_name='tiene_bodega') THEN
                    ALTER TABLE admin_predios ADD COLUMN tiene_bodega VARCHAR(50) DEFAULT 'No';
                END IF;
            END $$;
        `);
        console.log('admin_predios updated');

        // Add columns to admin_cuarteles
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_cuarteles' AND column_name='sistema_riego') THEN
                    ALTER TABLE admin_cuarteles ADD COLUMN sistema_riego VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_cuarteles' AND column_name='estado') THEN
                    ALTER TABLE admin_cuarteles ADD COLUMN estado VARCHAR(50) DEFAULT 'Activo';
                END IF;
            END $$;
        `);
        console.log('admin_cuarteles updated');

        console.log('All tables altered successfully.');
    } catch (err) {
        console.error('Error altering tables:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

alterTables();
