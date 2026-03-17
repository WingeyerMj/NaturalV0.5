
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
    'Costo': ['Total Producto', 'Costo', 'Cost', 'Importe', 'Monto USD', 'Monto en USD', 'Total USD', 'Monto en USDO'],
    'N': ['Unidades N', 'N', 'Nitrogeno', 'Units N', 'Unid N', 'Nitrógeno'],
    'P': ['Unidades P', 'P', 'Fosforo', 'Units P', 'Unid P', 'Fósforo', 'P2O5'],
    'K': ['Unidades K', 'K', 'Unidades K2O', 'K20', 'K2O', 'Potasio', 'Units K', 'Unid K'],
    'Ca': ['Unidades Ca', 'Ca', 'Calcio', 'Calcium'],
    'Has': ['Has Totales', 'Hectáreas', 'Area', 'Hectareas', 'Ha']
};

const header = fs.readFileSync('Fuentes/Aplicaciones/FV_aplicaciones.csv', 'latin1').split(/\r\n|\r|\n/)[0].split(';');

const colMap = {};
Object.keys(COLUMNS_MAP).forEach(key => {
    const possibleNames = COLUMNS_MAP[key];
    let idx = -1;
    for (const name of possibleNames) {
        idx = header.findIndex(h => h.trim().toLowerCase() === name.toLowerCase());
        if (idx !== -1) break;
    }
    if (idx === -1) {
        for (const name of possibleNames) {
            idx = header.findIndex(h => h.trim().toLowerCase().includes(name.toLowerCase()));
            if (idx !== -1) break;
        }
    }
    if (idx !== -1) colMap[key] = idx;
});

console.log(JSON.stringify(colMap, null, 2));
