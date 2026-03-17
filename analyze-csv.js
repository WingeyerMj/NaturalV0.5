
import fs from 'fs';

const headerLine = 'Predio;I.D. Faena;N° Orden;Cultivo;Variedad;Fecha;E. Fenol;Codigo Producto;Nombre Producto;Ing Activo;N° Autorización SAG;Tratamiento;Cantidad;U. Med.;Moja. Lts x Ha;Tipo Dosis;Dosis;Ha. Aplica;T.Cantidad Ha. Aplica;R.Aplica Calculado;Real Aplicado;Cobertura;N° Aplica Periodo.;N° aplica etiqueta;Clasifica;Cod Cuartel;Cuartel / Potrero;Total Ha.;Fecha Inicio Aplica;Hr. Inicio;Fecha Term. Aplica;Hr. Término;Hr. Reingre;Carencia;Dias Carencias PPPL;Plazo Seguridad;Concentración;Adjunto Productos;Estado;Faena;Labor;Clima;Viento;Temp.;Responsable (Aplicaciones);Dosificador (Aplicaciones);Verificador Técnico (Aplicaciones);Aplicador;Aplicador 2;Observaciones;Usuario Login;Total Producto;Maquinarias;Total Maqui;Maq Cod/GPS;Tot.Maq c/GPS;Tot Orden Aplica;Cantidad Periodo;tipo;has totales;unidades n;unidades p;unidades k;monto en usd';

const headers = headerLine.split(';');

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

const colMap = {};
Object.keys(COLUMNS_MAP).forEach(key => {
    const possibleNames = COLUMNS_MAP[key];
    let idx = -1;
    for (const name of possibleNames) {
        idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
        if (idx !== -1) break;
    }
    if (idx === -1) {
        for (const name of possibleNames) {
            idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
            if (idx !== -1) break;
        }
    }
    if (idx !== -1) colMap[key] = idx;
});

console.log('Column Map:', colMap);

const dataLine = 'Camino Truncado, Puente Alto y La Chimbera;;;;FIESTA;5/3/2026;;;BIO-CRECIMIENTO;litros;1.000,00;31,43;;;ERTILIZACION;;;0;;;;;;;marcelow;$ 0,00;;0;;0;4;318,9;Real;;;;;';
const cols = dataLine.split(';');

console.log('Sample Data Mapping:');
Object.keys(colMap).forEach(key => {
    console.log(`${key} (${colMap[key]}): "${cols[colMap[key]]}"`);
});
