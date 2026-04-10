const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Tabla general';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const predios = [...new Set(data.slice(2).map(r => r[95]))];
    console.log('Predios (Col 95):', predios);
} catch (error) {
    console.error('Error:', error.message);
}
