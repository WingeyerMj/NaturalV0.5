const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets['Resumen de Jornales'];
if (!sheet) {
    console.log("Sheet 'Resumen de Jornales' not found");
} else {
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = raw[0] || [];
    console.log("Sheet 'Resumen de Jornales' Headers:");
    headers.forEach((h, i) => {
        if (h) console.log(`[${i}] ${h}`);
    });
    
    console.log("\nRow 110 index 96 (CS):", raw[109] ? raw[109][96] : 'N/A');
}
