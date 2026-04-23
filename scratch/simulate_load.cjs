const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');
const csvPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Jornales', 'faenas-labores.csv');

async function simulateLoad() {
    // 1. Load Catalog
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsed = Papa.parse(csvContent, { header: true, delimiter: ';' });
    const catalog = parsed.data.map(row => {
        const laborName = (row['NOMBRE LABOR'] || '').trim();
        const faenaName = (row['NOMBRE DE FAENA'] || '').trim();
        return {
            id: row['ID'] || laborName.toLowerCase().replace(/\s+/g, '_'),
            nombre: laborName,
            faena: faenaName
        };
    });

    // 2. Load Excel
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets['Tabla general'];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers2 = raw[1] || [];

    // 3. Map columns
    const assignedCols = new Set();
    catalog.forEach(l => {
        const searchName = l.nombre.toLowerCase().trim();
        const searchFaena = (l.faena || '').toLowerCase().trim();
        for (let j = 0; j < headers2.length; j++) {
            const h = (headers2[j] || '').toString().toLowerCase().trim();
            if (!h || assignedCols.has(j)) continue;
            if (h === searchName || h === searchFaena) {
                l.colJorn = j;
                assignedCols.add(j);
                break;
            }
        }
    });

    // 4. Process row 3
    const row3 = raw[2];
    const jornalesOriginales = {};
    catalog.forEach(l => {
        if (l.colJorn != null) {
            jornalesOriginales[l.id] = parseFloat(row3[l.colJorn]) || 0;
        }
    });

    console.log("MAPPED JORNALES for Row 3:");
    let total = 0;
    Object.keys(jornalesOriginales).forEach(id => {
        if (jornalesOriginales[id] > 0) {
            const l = catalog.find(x => x.id === id);
            console.log(`Labor: ${l.nombre}, Value: ${jornalesOriginales[id]}`);
            total += jornalesOriginales[id];
        }
    });
    console.log("TOTAL MAPPED:", total);
}

simulateLoad();
