
import pg from 'pg';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const SOFIA_API = "http://apisofia.sofiagestionagricola.cl/trabajvsfaenas";
const API_PARAMS = {
    nombre_usuario: "NATURALFOOD",
    key_usuario: "12345NC5xQdXAxT6jj8WrPH26krbn2y7sf6tt8mf"
};

async function syncPeriod(dateStart, dateEnd, ciclo) {
    console.log(`Fetching ${dateStart} to ${dateEnd}...`);
    try {
        const response = await axios.get(SOFIA_API, {
            params: {
                ...API_PARAMS,
                fecha_inicial: dateStart,
                fecha_final: dateEnd
            }
        });

        const data = response.data;
        if (!Array.isArray(data)) {
            console.log(`  Error en respuesta para ${dateStart}:`, data);
            return 0;
        }

        if (data.length === 0) return 0;

        const client = await pool.connect();
        try {
            const tableName = `historicos."${ciclo}"`;
            let inserted = 0;
            for (const item of data) {
                const totalJornadas = parseFloat(item.valor_total_jornada) || 0;
                const isCosecha = (item.id_tipo_faena === 'C' || (item.nombre_labor || '').toLowerCase().includes('cosecha'));

                await client.query(`
                    INSERT INTO ${tableName} (
                        finca, fecha, labor, cuartel, persona, rendimiento, total_jornadas, 
                        costo_ars, hectareas, clasifica, variedad, is_cosecha, 
                        origen_archivo, raw_data
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                `, [
                    item.nombre_predio, item.fecha, item.nombre_labor, item.nombre_cuartel,
                    item.nombre_trabajador, parseFloat(item.rendimiento) || 0,
                    totalJornadas, parseFloat(item.costo_total_jornada) || 0,
                    parseFloat(item.hectareas) || 0, item.nombre_predio, 
                    item.nombre_variedad, isCosecha, 'Sincronización API Sofía',
                    JSON.stringify(item)
                ]);
                inserted++;
            }
            return inserted;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error(`  Error en fetch: ${e.message}`);
        return 0;
    }
}

async function syncCiclo(ciclo) {
    const [startYear, endYear] = ciclo.split('-').map(Number);
    console.log(`\n--- Sincronizando Ciclo ${ciclo} ---`);
    
    // Generar meses (Mayo a Abril del año siguiente)
    const periods = [];
    for (let m = 5; m <= 12; m++) {
        periods.push({
            start: `${startYear}-${m.toString().padStart(2, '0')}-01`,
            end: `${startYear}-${m.toString().padStart(2, '0')}-31` // Sofia handles 31 even for Feb/Apr usually
        });
    }
    for (let m = 1; m <= 4; m++) {
        periods.push({
            start: `${endYear}-${m.toString().padStart(2, '0')}-01`,
            end: `${endYear}-${m.toString().padStart(2, '0')}-31`
        });
    }

    let totalInserted = 0;
    for (const p of periods) {
        // Fix end date for Feb/Apr etc if needed, but 31 usually works by overflow or just use exact
        const lastDay = new Date(parseInt(p.start.split('-')[0]), parseInt(p.start.split('-')[1]), 0).getDate();
        const endDay = `${p.start.substring(0, 8)}${lastDay}`;
        
        const count = await syncPeriod(p.start, endDay, ciclo);
        totalInserted += count;
    }
    console.log(`Total Ciclo ${ciclo}: ${totalInserted} registros.`);
}

async function main() {
    const ciclos = ['2023-2024', '2024-2025'];
    for (const c of ciclos) {
        await syncCiclo(c);
    }
    console.log("\nSincronización finalizada.");
    process.exit(0);
}
main();
