const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Tabla general';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Row 0:', JSON.stringify(data[0]));
    console.log('Row 1:', JSON.stringify(data[1]));
    console.log('Row 2:', JSON.stringify(data[2]));
} catch (error) {
    console.error('Error:', error.message);
}
