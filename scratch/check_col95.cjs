const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Tabla general';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Col 93:', data[1][93]);
    console.log('Col 94:', data[1][94]);
    console.log('Col 95:', data[1][95]);
} catch (error) {
    console.error('Error:', error.message);
}
