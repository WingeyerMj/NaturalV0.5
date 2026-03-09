
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
});

const faenas = [
    { nombre: 'PODA', descripcion: 'Tratamiento de sarmientos y estructura de la vid.', categoria: 'Operativa' },
    { nombre: 'ATADA', descripcion: 'Sujeción de cargadores y brotes al sistema de conducción.', categoria: 'Operativa' },
    { nombre: 'COSECHA', descripcion: 'Recolección de frutos (Uva en fresco o para pasa).', categoria: 'Cosecha' },
    { nombre: 'LEVANTADO', descripcion: 'Proceso de recolección de uva seca de la playa de secado.', categoria: 'Post-Cosecha' },
    { nombre: 'RIEGO', descripcion: 'Operaciones de distribución de agua y mantenimiento de sistemas.', categoria: 'Mantenimiento' },
    { nombre: 'TRATAMIENTOS', descripcion: 'Aplicaciones fitosanitarias y fertilización.', categoria: 'Sanidad' },
    { nombre: 'GENERAL', descripcion: 'Labores administrativas y de supervisión.', categoria: 'Administración' }
];

const laboresRaw = [
    { faena: 'PODA', nombre: 'Poda de Invierno', unidad: 'plantas' },
    { faena: 'PODA', nombre: 'Poda de Formación', unidad: 'plantas' },
    { faena: 'ATADA', nombre: 'Atada de Pitones', unidad: 'plantas' },
    { faena: 'COSECHA', nombre: 'Cosecha Uva Fresca', unidad: 'kg' },
    { faena: 'COSECHA', nombre: 'Cosecha Gawa', unidad: 'kg' },
    { faena: 'LEVANTADO', nombre: 'Levantar Pasa', unidad: 'kg' },
    { faena: 'RIEGO', nombre: 'Turno de Riego', unidad: 'horas' },
    { faena: 'TRATAMIENTOS', nombre: 'Fumigación', unidad: 'ha' },
    { faena: 'GENERAL', nombre: 'Supervisión de Cuadro', unidad: 'horas' }
];

async function seed() {
    try {
        console.log('Seeding faenas...');
        for (const f of faenas) {
            await pool.query(
                'INSERT INTO admin_faenas (nombre, descripcion, categoria, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                [f.nombre, f.descripcion, f.categoria, 'active']
            );
        }

        const faenaMap = {};
        const res = await pool.query('SELECT id, nombre FROM admin_faenas');
        res.rows.forEach(r => faenaMap[r.nombre] = r.id);

        console.log('Seeding labores...');
        for (const l of laboresRaw) {
            const faenaId = faenaMap[l.faena];
            if (faenaId) {
                await pool.query(
                    'INSERT INTO admin_labor (nombre, faena_id, unidad_medida, status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                    [l.nombre, faenaId, l.unidad, 'active']
                );
            }
        }

        console.log('Seed completed successfully!');
    } catch (e) {
        console.error('Seed error:', e);
    } finally {
        await pool.end();
    }
}

seed();
