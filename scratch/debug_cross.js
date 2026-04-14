
const { ProyeccionJornalModel } = require('./src/models/ProyeccionJornalModel.js');
const { SofiaApiModel } = require('./src/models/SofiaApiModel.js');
const fs = require('fs');

async function debugCross() {
    console.log('--- DEBUG START ---');
    
    // 1. Check Excel base
    const base = await ProyeccionJornalModel.loadBaseFromExcel();
    const matrix = ProyeccionJornalModel.buildProjectionMatrix(base);
    
    const excelPredios = [...new Set(matrix.map(p => p.predio))];
    const excelLabors = [...new Set(matrix.map(p => p.laborNombre))];
    
    console.log('Predios in Excel Matrix:', excelPredios);
    console.log('Labors in Excel Matrix:', excelLabors);

    // 2. Check Sofia Data
    const ciclo = '2025-2026';
    const allData = await SofiaApiModel.fetchCycleData(ciclo);
    console.log('Total Sofia records:', allData.length);
    
    const sofiaClasificas = [...new Set(allData.map(r => r.clasifica))];
    const sofiaLabors = [...new Set(allData.map(r => r.labor_normalized || r.labor))];
    
    console.log('Unique Clasificas in Sofia:', sofiaClasificas);
    // console.log('Unique Labors in Sofia:', sofiaLabors);

    // 3. Test Normalization
    console.log('\nNormalization Test:');
    sofiaClasificas.forEach(c => {
        const norm = ProyeccionJornalModel._normalizePredioFromClasifica(c);
        console.log(`  "${c}" -> "${norm}"`);
    });

    console.log('--- DEBUG END ---');
}

// Since we are in Node, and the models use ES modules/fetch, this might fail if not careful.
// I'll check if the models are compatible with Node or if I need a different approach.
