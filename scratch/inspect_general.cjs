const XLSX = require('xlsx');

try {
    const filePath = 'Fuentes/Presupuestos/Prueba de Gral.xlsx';
    console.log('Opening file:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = 'GENERAL';
    console.log('Loading sheet:', sheetName);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
        console.log('Sheet NOT found');
    } else {
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Rows found:', data.length);
        if (data.length > 0) {
            console.log('Headers:', data[0]);
            console.log('Row 1:', data[1]);
        }
    }
} catch (error) {
    console.error('Error:', error.message);
}
