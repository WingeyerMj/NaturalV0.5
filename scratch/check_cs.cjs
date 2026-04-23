const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets['Tabla general'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log("COL CS (index 96) VALUES:");
for(let i=2; i<10; i++) {
    console.log(`Row ${i+1}: Finca: ${raw[i][0]}, Cuartel: ${raw[i][1]}, Col CS: ${raw[i][96]}`);
}
console.log(`Row 110: Finca: ${raw[109][0]}, Col CS: ${raw[109][96]}`);
