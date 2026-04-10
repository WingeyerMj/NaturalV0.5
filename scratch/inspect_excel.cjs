const XLSX = require('xlsx');
const path = require('path');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    const workbook = XLSX.readFile(filePath);
    console.log('Sheets:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(name => {
        console.log(`\nSheet: ${name}`);
        const worksheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length > 0) {
            console.log('Headers:', data[0]);
            console.log('First 2 rows of data:');
            console.log(data.slice(1, 3));
        }
    });
} catch (error) {
    console.error('Error:', error.message);
}
