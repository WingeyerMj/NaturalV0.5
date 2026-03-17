import fs from 'fs';
import Papa from 'papaparse';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:wingeyer@localhost:5432/naturalfood_db'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findCsvFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findCsvFiles(filePath, fileList);
        } else if (filePath.endsWith('.csv')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function getCycleFromDate(dateStr) {
    if (!dateStr) return null;
    
    // Attempt to parse standard formats like "1/9/2021", "2021-09-01", etc.
    let parsedDate = null;
    
    // Quick handle for DD/MM/YYYY or D/M/YYYY
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10);
            let year = parseInt(parts[2], 10);

            // Handle US format edge cases or YY format
            if (year < 100) year += 2000;
            
            // Assume DD/MM/YYYY for Latin America normally provided
            if (month > 12 && day <= 12) {
                // swapped US format
                const temp = day;
                day = month;
                month = temp;
            }
            parsedDate = new Date(year, month - 1, day);
        }
    } else {
        parsedDate = new Date(dateStr);
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
        const month = parsedDate.getMonth(); // 0-11
        const year = parsedDate.getFullYear();
        // Ciclo agrícola: May 1 -> April 30
        if (month < 4) { // Jan-Apr
            return `${year - 1}-${year}`;
        } else {
            return `${year}-${year + 1}`;
        }
    }
    return null;
}

async function main() {
    const fuentesDir = path.join(__dirname, 'public/Fuentes');
    const csvFiles = await findCsvFiles(fuentesDir);
    
    console.log(`Encontrados ${csvFiles.length} archivos CSV para importar.`);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        // Usamos esquema aparte y borramos el anterior para recargar TODO limpio
        await client.query('DROP SCHEMA IF EXISTS historicos CASCADE');
        await client.query('CREATE SCHEMA historicos');
        
        // Agrupar filas por ciclo
        const recordsByCycle = {};

        for (const file of csvFiles) {
            const fileName = path.basename(file);
            console.log(`Procesando archivo: ${fileName}...`);
            
            let fileContent;
            try {
                fileContent = fs.readFileSync(file, 'latin1'); // Use latin1 for Excel CSVs (iso-8859-1)
            } catch (e) {
                console.error(`  Error leyendo archivo: ${e.message}`);
                continue;
            }

            const parsed = Papa.parse(fileContent, {
                delimiter: ';',
                header: true,
                skipEmptyLines: true
            });
            
            // Re-try with comma if semicolon failed to parse properly (1 column only)
            if (parsed.meta.fields && parsed.meta.fields.length <= 1) {
                const parsedComma = Papa.parse(fileContent, {
                    delimiter: ',',
                    header: true,
                    skipEmptyLines: true
                });
                if (parsedComma.meta.fields && parsedComma.meta.fields.length > parsed.meta.fields.length) {
                    parsed.data = parsedComma.data;
                    parsed.meta = parsedComma.meta;
                }
            }

            const records = parsed.data;
            if (!records || records.length === 0) continue;

            const category = file.replace(fuentesDir, '').replace(/[\/\\]/g, ' - ').replace(/^\s-\s/, '').replace('.csv', '');

            for (let row of records) {
                // Intentar sacar el ciclo
                let ciclo = (row['Ciclo'] || row['ciclo'] || '').trim();
                
                // Si viene del Budget/Planificación, saltear como dato "histórico" consumado si no tiene ciclo válido explícito.
                const ano = (row['Año'] || row['año'] || '').trim();
                if (ano.toUpperCase().includes('BP')) continue; 

                // Intentar derivar por fecha si no hay ciclo
                let rawFecha = row['Fecha'] || row['fecha'] || row['Date'] || row['date'] || null;
                
                if (!ciclo || !ciclo.includes('-')) {
                    ciclo = getCycleFromDate(rawFecha);
                }

                // Default si no se pudo derivar nada
                if (!ciclo) ciclo = 'Sin-Ciclo';

                // Limpieza del archivo
                if (!recordsByCycle[ciclo]) recordsByCycle[ciclo] = [];

                // Determinar is_cosecha
                const isCosecha = fileName.toLowerCase().includes('cosecha') || (row['Labor'] || '').toLowerCase().includes('cosecha');
                
                // Determinar Kilos
                const kgStr = (row['Kg'] || row['kg'] || row['Kilos'] || row['kilos'] || '0').toString().replace(/\./g, '').replace(',', '.').trim();
                const kg = parseFloat(kgStr) || 0;
                
                // Determinar Ha
                const hasStr = (row['Has'] || row['has'] || row['Hectareas'] || '0').toString().replace(',', '.').trim();
                const has = parseFloat(hasStr) || 0;

                // Finca, Cuartel, Predio
                const finca = (row['Finca'] || row['finca'] || '').trim();
                const predio = (row['Predio'] || row['predio'] || row['Clasificacion'] || row['Clasifica'] || '').trim() || finca;
                const cuartel = (row['Cuartel'] || row['cuartel'] || '').trim();
                const variedad = (row['Variedad'] || row['variedad'] || '').trim();
                const labor = (row['Labor'] || row['labor'] || category).trim();
                
                // Costos y Jornadas (si existen)
                const jornadas = parseFloat((row['Total Jornadas'] || row['Jornadas'] || row['jornadas'] || '0').toString().replace(',', '.')) || 0;
                const costoArs = parseFloat((row['Valor Total Jornada'] || row['costo'] || '0').toString().replace(/[^0-9,.-]/g, '').replace(',', '.')) || 0;

                recordsByCycle[ciclo].push({
                    finca,
                    rawFecha,
                    labor,
                    cuartel,
                    persona: row['Persona'] || row['Empleado'] || '',
                    rendimiento: kg,
                    total_jornadas: jornadas,
                    costo_ars: costoArs,
                    hectareas: has,
                    clasifica: predio,
                    variedad,
                    is_cosecha: isCosecha,
                    origen_archivo: category,
                    raw_data: row
                });
            }
        }

        // Insertar a DB
        for (const [ciclo, rows] of Object.entries(recordsByCycle)) {
            const tableName = `historicos."${ciclo}"`;
            console.log(`Creando e insertando tabla: ${tableName} (${rows.length} registros)`);
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id SERIAL PRIMARY KEY,
                    finca VARCHAR(255),
                    fecha VARCHAR(255),
                    labor VARCHAR(255),
                    cuartel VARCHAR(255),
                    persona VARCHAR(255),
                    rendimiento NUMERIC,
                    total_jornadas NUMERIC,
                    costo_ars NUMERIC,
                    hectareas NUMERIC,
                    clasifica VARCHAR(255),
                    variedad VARCHAR(255),
                    is_cosecha BOOLEAN,
                    origen_archivo VARCHAR(255),
                    raw_data JSONB,
                    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            for (let item of rows) {
                await client.query(`
                    INSERT INTO ${tableName} (
                        finca, fecha, labor, cuartel, persona, rendimiento, total_jornadas, costo_ars, hectareas, clasifica, variedad, is_cosecha, origen_archivo, raw_data
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                `, [
                    item.finca,
                    item.rawFecha || null,
                    item.labor,
                    item.cuartel,
                    item.persona,
                    item.rendimiento,
                    item.total_jornadas,
                    item.costo_ars,
                    item.hectareas,
                    item.clasifica,
                    item.variedad,
                    item.is_cosecha,
                    item.origen_archivo,
                    JSON.stringify(item.raw_data)
                ]);
            }
        }

        await client.query('COMMIT');
        console.log(`Importación histórica completada. Se generaron las tablas particionadas por año en el esquema 'historicos'.`);
    } catch(err) {
        await client.query('ROLLBACK');
        console.error("Error importando datos históricos: ", err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
