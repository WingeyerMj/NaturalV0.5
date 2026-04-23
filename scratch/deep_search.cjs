const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');

const workbook = XLSX.readFile(excelPath);

console.log("Searching for 75072.8 in all sheets...");

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    raw.forEach((row, rowIndex) => {
        row.forEach((val, colIndex) => {
            if (val != null && typeof val === 'number' && Math.abs(val - 75072.8) < 1) {
                const colLetter = XLSX.utils.encode_col(colIndex);
                console.log(`FOUND in Sheet: "${sheetName}", Cell: ${colLetter}${rowIndex + 1}, Value: ${val}`);
            }
        });
    });
});
