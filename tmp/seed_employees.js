
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`,
});

async function seed() {
    try {
        console.log('Seeding Employees...');

        const employees = [
            { legajo: 'LEG001', nombre: 'Pedro Sánchez', cargo: 'Capataz', finca: 'El Espejo', salario: 150000, fecha_ingreso: '2023-01-15' },
            { legajo: 'LEG002', nombre: 'Rosa Fernández', cargo: 'Operaria', finca: 'Fincas Viejas', salario: 120000, fecha_ingreso: '2023-02-10' },
            { legajo: 'LEG003', nombre: 'Miguel Ángel Torres', cargo: 'Regador', finca: 'El Espejo', salario: 130000, fecha_ingreso: '2023-03-05' },
            { legajo: 'LEG004', nombre: 'Diego López', cargo: 'Tractorista', finca: 'Fincas Viejas', salario: 140000, fecha_ingreso: '2023-04-12' }
        ];

        for (const e of employees) {
            await pool.query(
                'INSERT INTO empleados (legajo, nombre, cargo, finca, salario, fecha_ingreso, status, name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
                [e.legajo, e.nombre, e.cargo, e.finca, e.salario, e.fecha_ingreso, 'active', e.nombre]
            );
        }

        console.log('Employees seed completed!');
    } catch (e) {
        console.error('Seed error:', e);
    } finally {
        await pool.end();
    }
}

seed();
