const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'Tabla general';
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const fincas = [...new Set(data.slice(2).map(r => r[0]))];
    console.log('Fincas (Col 0):', fincas);
} catch (error) {
    console.error('Error:', error.message);
}
