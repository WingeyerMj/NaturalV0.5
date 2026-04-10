const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames.map(n => `"${n}"`).join(', '));
} catch (error) {
    console.error('Error:', error.message);
}
