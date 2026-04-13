import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        
        console.log("Creating inversiones_propuestas...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS inversiones_propuestas (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                area_estrategica VARCHAR(100),
                tipo_inversion VARCHAR(100),
                ciclo_agricola VARCHAR(50),
                estado VARCHAR(50) DEFAULT 'Idea',
                prioridad VARCHAR(50) DEFAULT 'Media',
                responsable_id INT,
                costo_estimado DECIMAL(14,2) DEFAULT 0,
                costo_real DECIMAL(14,2) DEFAULT 0,
                moneda VARCHAR(10) DEFAULT 'USD',
                fecha_inicio_estimada DATE,
                fecha_ejecucion_real DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Creating inversiones_justificacion...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS inversiones_justificacion (
                inversion_id INT PRIMARY KEY REFERENCES inversiones_propuestas(id) ON DELETE CASCADE,
                problema_resuelve TEXT,
                objetivo_esperado TEXT,
                indicador_impacto VARCHAR(255),
                ahorro_estimado_anual DECIMAL(14,2) DEFAULT 0,
                payback_meses INT DEFAULT 0,
                fuente_financiamiento VARCHAR(100)
            );
        `);

        console.log("Creating inversiones_fincas...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS inversiones_fincas (
                inversion_id INT REFERENCES inversiones_propuestas(id) ON DELETE CASCADE,
                finca_id INT,
                PRIMARY KEY (inversion_id, finca_id)
            );
        `);

        await client.query('COMMIT');
        console.log("Tables created successfully.");
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error("Error creating tables:", e);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

run();
