const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');
const csvPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Jornales', 'faenas-labores.csv');

async function debugMapping() {
    // 1. Get Excel Headers
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets['Tabla general'];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers2 = raw[1] || [];
    
    console.log("EXCEL HEADERS (Row 2):");
    headers2.forEach((h, i) => {
        if (h) console.log(`[${i}] ${h}`);
    });

    // 2. Get CSV Labors
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsed = Papa.parse(csvContent, { header: true, delimiter: ';' });
    const labors = parsed.data;

    console.log("\nCSV LABORS (First 20):");
    labors.slice(0, 20).forEach(l => {
        console.log(`Faena: ${l['NOMBRE DE FAENA']}, Labor: ${l['NOMBRE LABOR']}`);
    });

    // 3. Test matching logic
    console.log("\nMATCHING TESTS:");
    const testLabors = ["PODA", "ATADA", "ATADO CUERPO CEPA"];
    testLabors.forEach(tl => {
        const search = tl.toLowerCase().trim();
        const match = headers2.find(h => h && h.toString().toLowerCase().trim() === search);
        console.log(`Search: '${tl}' -> Match: ${match ? 'YES' : 'NO'}`);
    });
}

debugMapping();
