
import fs from 'fs';

const COLUMNS_MAP = {
    'Fecha': ['Fecha Inicio Aplica', 'Fecha Inicio', 'Fecha', 'Fecha de Aplicación', 'Date', 'Fecha Apl.'],
    'Labor': ['Labor', 'Labor Code', 'Faena', 'Tarea', 'Operación'],
    'Producto': ['Nombre Producto', 'Producto', 'Insumo', 'Product', 'Artículo'],
    'Cantidad': ['Cantidad', 'Real Aplicado', 'Cantidad Periodo', 'Monto', 'Cant.'],
    'Tipo': ['tipo', 'Tipo Registro', 'Tipo', 'Categoría'],
    'Cuartel': ['Cuartel', 'Cuadro', 'Sector', 'Lote', 'Potrero'],
    'CodCuartel': ['Cod Cuartel', 'Código Cuartel', 'ID Cuartel'],
    'Dosis': ['Dosis', 'Dose', 'Dosis/Ha'],
    'Finca': ['Predio', 'Finca', 'Farm', 'Establecimiento'],
    'Clasifica': ['Clasifica', 'Clasificación', 'Sub-Predio', 'Variación'],
    'Estado': ['Estado', 'Status', 'Situación'],
    'Variedad': ['Variedad', 'Cepa', 'Grape Variety'],
    'Costo': ['Total Producto', 'Costo', 'Cost', 'Importe', 'Monto USD', 'Monto en USD', 'Total USD', 'Monto en USDO']
};

const parseNum = (val) => {
    if (!val) return 0;
    let clean = val.toString().replace(/[$\s]/g, '');
    if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }
    return parseFloat(clean) || 0;
};

function parseCSV(csvText, defaultFinca) {
    const lines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
    const header = lines[0].split(';').map(h => h.trim());
    
    const colMap = {};
    Object.keys(COLUMNS_MAP).forEach(key => {
        const possibleNames = COLUMNS_MAP[key];
        let idx = -1;
        for (const name of possibleNames) {
            idx = header.findIndex(h => h.toLowerCase() === name.toLowerCase());
            if (idx !== -1) break;
        }
        if (idx === -1) {
            for (const name of possibleNames) {
                idx = header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
                if (idx !== -1) break;
            }
        }
        if (idx !== -1) colMap[key] = idx;
    });

    const qtyPossibleIndices = header.reduce((acc, h, idx) => {
        if (COLUMNS_MAP['Cantidad'].some(name => h.toLowerCase().includes(name.toLowerCase()))) acc.push(idx);
        return acc;
    }, []);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(c => c.trim().replace(/^['"]|['"]$/g, ''));
        if (cols.length < (header.length * 0.3) || cols.every(c => c === '')) continue;

        let cantidad = 0;
        for (const idx of qtyPossibleIndices) {
            cantidad = parseNum(cols[idx]);
            if (cantidad > 0) break;
        }

        let estado = colMap['Estado'] !== undefined ? cols[colMap['Estado']] : '';
        const estadoLower = estado.toLowerCase();
        if (estadoLower === 'pendiente' && cantidad === 0) continue;

        let producto = colMap['Producto'] !== undefined ? cols[colMap['Producto']] : '';
        if (producto) producto = producto.toUpperCase().trim();

        let tipoRaw = colMap['Tipo'] !== undefined ? cols[colMap['Tipo']] : 'Real';
        let tipo = (tipoRaw || '').toLowerCase();
        if (tipo.includes('presupuestado')) tipo = 'Presupuestado-Pos';
        else tipo = 'Real';

        if (producto === 'BIO-CRECIMIENTO' && tipo === 'Real') {
            rows.push({ producto, cantidad, tipo });
        }
    }
    return rows;
}

const csvText = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1');
const rows = parseCSV(csvText, 'Fincas Viejas');
console.log(`Found ${rows.length} Real BIO-CRECIMIENTO records.`);
const total = rows.reduce((s, r) => s + r.cantidad, 0);
console.log(`Total Quantity: ${total}`);
