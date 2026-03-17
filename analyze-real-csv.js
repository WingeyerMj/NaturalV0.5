
import fs from 'fs';

const headerLine = 'Predio;I.D. Faena;N° Orden;Cultivo;Variedad;Fecha;E. Fenologico;Codigo Producto;Nombre Producto;Ing Activo;N° Autorización SAG;Tratamiento;Cantidad;U. Med.;Moja. Lts x Ha;Tipo Dosis;Dosis;Ha. Aplica;T.Cantidad Ha. Aplica;R.Aplica Calculado;Real Aplicado;Cobertura;N° Aplica Periodo.;N° aplica etiqueta;Clasifica;Cod Cuartel;Cuartel / Potrero;Total Ha.;Fecha Inicio Aplica;Hr. Inicio;Fecha Term. Aplica;Hr. Término;Hr. Reingre;Carencia;Dias Carencias PPPL;Plazo Seguridad;Concentración;Adjunto Productos;Estado;Faena;Labor;Clima;Viento;Temp.;Responsable (Aplicaciones);Dosificador (Aplicaciones);Verificador Técnico (Aplicaciones);Aplicador;Aplicador 2;Observaciones;Usuario Login;Total Producto;Maquinarias;Total Maqui;Maq Cod/GPS;Tot.Maq c/GPS;Tot Orden Aplica;Cantidad Periodo;tipo;has totales;unidades n;unidades p;unidades k;monto en usd';
const headers = headerLine.split(';');

const dataLine = fs.readFileSync('tmp_real_line.txt', 'utf8').trim();
const cols = dataLine.split(';');

console.log(`Column Count: ${cols.length}`);
headers.forEach((h, i) => {
    console.log(`${i}: [${h}] -> "${cols[i] || ''}"`);
});
