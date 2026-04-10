const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Tabla general';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const espejoRow = data.find(r => r && r[0] && r[0].includes('Espejo'));
    if (espejoRow) {
        console.log('Row:', JSON.stringify(espejoRow));
        console.log('Col 0:', espejoRow[0]);
        console.log('Col 95:', espejoRow[95]);
    }
} catch (error) {
    console.error('Error:', error.message);
}
