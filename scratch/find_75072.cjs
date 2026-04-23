const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets['Tabla general'];
const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const row110 = raw[109];
console.log("Row 110 length:", row110.length);
row110.forEach((val, i) => {
    if (val != null && val !== '') {
        console.log(`[${i}] ${val}`);
    }
});
