const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join('c:', 'Users', 'usuario', 'Documents', 'GitHub', 'NaturalV0.5', 'Fuentes', 'Presupuestos', 'Prueba de Gral.xlsx');

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets['Compilado'];
if (!sheet) {
    console.log("Sheet 'Compilado' not found");
} else {
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("Sheet 'Compilado' Row 110 index 96 (CS):", raw[109] ? raw[109][96] : 'N/A');
    
    // Check for 75072 in Row 110 of Compilado
    const row110 = raw[109] || [];
    row110.forEach((val, i) => {
        if (val != null && typeof val === 'number' && Math.abs(val - 75072.8) < 1) {
            console.log(`FOUND 75072.8 in Compilado Row 110 at Index ${i} (${XLSX.utils.encode_col(i)})`);
        }
    });
}
