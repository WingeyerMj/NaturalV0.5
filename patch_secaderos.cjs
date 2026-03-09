const fs = require('fs');

const orig = fs.readFileSync('C:/Users/usuario/Desktop/Antigravity/dashboard/app.js', 'utf8');

let renderHarvestMatch = orig.match(/function renderHarvestRecommendations[\s\S]*?\n}\n/m);
let fn1 = renderHarvestMatch ? renderHarvestMatch[0] : '';
let renderSecaderosMatch = orig.match(/function renderSecaderosGantt[\s\S]*?\n}\n/m);
let fn2 = renderSecaderosMatch ? renderSecaderosMatch[0] : '';

let controller = fs.readFileSync('./src/controllers/SecaderosController.js', 'utf8');

const sIdx = controller.indexOf('const formatKgSimple = (val) =>');
const eIdx = controller.lastIndexOf('}'); // end of class

let newBody = controller.substring(0, sIdx) +
    `    const getTargetSecadero = (fincaName) => {
        const fn = (fincaName||'').toLowerCase();
        if (fn.includes('truncado') || fn.includes('puente alto') || fn.includes('pa')) return 'Camino Truncado';
        if (fn.includes('chimbera') || fn.includes('lch')) return 'La Chimbera';
        if (fn.includes('espejo') || fn.includes('ullum') || fn.includes('ee')) return 'Ullum';
        return 'Camino Truncado';
    };

    this.renderHarvestRecommendations(processedPlayas, regionalAggregates, getTargetSecadero);
}

static getFincaInitials(finca) {
    if (!finca) return 'UNK';
    const fn = finca.toUpperCase();
    if (fn.includes('PUENTE ALTO')) return 'PA';
    if (fn.includes('LA CHIMBERA')) return 'LCH';
    if (fn.includes('EL ESPEJO I') && !fn.includes('III') && !fn.includes('II')) return 'EEI';
    if (fn.includes('EL ESPEJO II') && !fn.includes('III')) return 'EEII';
    if (fn.includes('EL ESPEJO III')) return 'EEIII';
    const words = finca.split(' ').filter(w => w.length > 0);
    return words.length === 1 ? words[0].substring(0, 3) : words.map(w => w[0]).join('').substring(0, 3);
}

` +
    fn1
        .replace('function renderHarvestRecommendations', 'static renderHarvestRecommendations')
        .replace(/state\./g, 'this.state.')
        .replace(/renderSecaderosGantt/g, 'this.renderSecaderosGantt')
        .replace(/toggleRegionDetails/g, 'window.secaderosControllerRef.toggleRegionDetails')
        .replace(/toggleSecaderoDetails/g, 'window.secaderosControllerRef.toggleSecaderoDetails')
        .replace(/getFincaInitials/g, 'this.getFincaInitials')
        .replace(/formatKgSimple/g, "(v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v)")
    + '\n' +
    fn2
        .replace('function renderSecaderosGantt', 'static renderSecaderosGantt')
        .replace(/state\./g, 'this.state.')
        .replace(/toggleRegionDetails/g, 'window.secaderosControllerRef.toggleRegionDetails')
        .replace(/toggleSecaderoDetails/g, 'window.secaderosControllerRef.toggleSecaderoDetails')
        .replace(/formatKgSimple/g, "(v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v)")
    + '\n}\n\n// Global expose\nif (typeof window !== "undefined") {\n    window.secaderosControllerRef = SecaderosController;\n}\n';

fs.writeFileSync('./src/controllers/SecaderosController.js', newBody);
console.log('Update Complete.');
