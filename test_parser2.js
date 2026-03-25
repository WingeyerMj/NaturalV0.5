import fs from 'fs';
import { SofiaImportModel } from './src/models/SofiaModel.js';

const csv = fs.readFileSync('E:/antigravity/NaturalV0.5/Fuentes/Aplicaciones/FV_aplicaciones.csv', 'utf8');
const result = SofiaImportModel.parseCSV(csv, 'Fincas Viejas');
SofiaImportModel.REGISTROS = result.rows;

const comp = SofiaImportModel.getFertilizacionUnidades({ budgetType: 'pos' }, 'fincasviejas');
console.log(comp.filter(c => c.name.includes('La Chimbera')));
