
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
});

async function seed() {
    try {
        console.log('Seeding Master Data...');

        // Fincas
        const fincas = [
            { nombre: 'El Espejo', ubicacion: 'Sarmiento, San Juan', hectareas: 400 },
            { nombre: 'Fincas Viejas', ubicacion: 'Sarmiento, San Juan', hectareas: 250 }
        ];

        for (const f of fincas) {
            await pool.query(
                'INSERT INTO admin_fincas (nombre, ubicacion, hectareas, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                [f.nombre, f.ubicacion, f.hectareas, 'active']
            );
        }

        const fincaMap = {};
        const fRes = await pool.query('SELECT id, nombre FROM admin_fincas');
        fRes.rows.forEach(r => fincaMap[r.nombre] = r.id);

        // Predios
        const predios = [
            { finca: 'Fincas Viejas', nombre: 'Camino Truncado', superficie: 80 },
            { finca: 'Fincas Viejas', nombre: 'La Chimbera', superficie: 90 },
            { finca: 'Fincas Viejas', nombre: 'Puente Alto', superficie: 80 },
            { finca: 'El Espejo', nombre: 'EEI', superficie: 130 },
            { finca: 'El Espejo', nombre: 'EEII', superficie: 130 },
            { finca: 'El Espejo', nombre: 'EEIII', superficie: 140 }
        ];

        for (const p of predios) {
            const fincaId = fincaMap[p.finca];
            if (fincaId) {
                await pool.query(
                    'INSERT INTO admin_predios (nombre, finca_id, superficie, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                    [p.nombre, fincaId, p.superficie, 'active']
                );
            }
        }

        const predioMap = {};
        const pRes = await pool.query('SELECT id, nombre FROM admin_predios');
        pRes.rows.forEach(r => predioMap[r.nombre] = r.id);

        // Cuarteles (Simplified - one per predio for now)
        for (const [name, id] of Object.entries(predioMap)) {
            await pool.query(
                'INSERT INTO admin_cuarteles (numero, predio_id, superficie, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                [1, id, 10, 'active']
            );
        }

        console.log('Master Data seed completed!');
    } catch (e) {
        console.error('Seed error:', e);
    } finally {
        await pool.end();
    }
}

seed();
