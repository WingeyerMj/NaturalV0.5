const fs = require('fs');
const orig = fs.readFileSync('C:/Users/usuario/Desktop/Antigravity/dashboard/app.js', 'utf8');

const s1 = orig.indexOf('function renderHarvestRecommendations');
const e1 = orig.indexOf('function toggleSecaderoDisplay');
const fn1 = orig.substring(s1, e1);

const s2 = orig.indexOf('function renderSecaderosGantt');
const e2 = orig.indexOf('function toggleRegionDetails');
const fn2 = orig.substring(s2, e2);

let controller = fs.readFileSync('./src/controllers/SecaderosController.js', 'utf8');

const classClosingIdx = controller.lastIndexOf('}');

const cleanFn1 = fn1.replace('function renderHarvestRecommendations', 'static renderHarvestRecommendations')
    .replace(/state\./g, 'this.state.')
    .replace(/renderSecaderosGantt/g, 'this.renderSecaderosGantt')
    .replace(/toggleRegionDetails/g, 'window.secaderosControllerRef.toggleRegionDetails')
    .replace(/toggleSecaderoDetails/g, 'window.secaderosControllerRef.toggleSecaderoDetails')
    .replace(/getFincaInitials/g, 'this.getFincaInitials')
    .replace(/formatKgSimple/g, '(v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v)');

const cleanFn2 = fn2.replace('function renderSecaderosGantt', 'static renderSecaderosGantt')
    .replace(/state\./g, 'this.state.')
    .replace(/toggleRegionDetails/g, 'window.secaderosControllerRef.toggleRegionDetails')
    .replace(/toggleSecaderoDetails/g, 'window.secaderosControllerRef.toggleSecaderoDetails')
    .replace(/formatKgSimple/g, '(v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v)');

// We replace everything from "this.renderHarvestRecommendations(..." until the end of the class.
// But earlier I mistakenly left the previous code inside the class.
// Let's just grab the actual ending brace of SecaderosController class.
// Let's find "static getFincaInitials"
let customIdx = controller.indexOf('static getFincaInitials');
let baseController = controller.substring(0, customIdx);
// Let's find the closing brace of the baseController
let closeIdx = baseController.lastIndexOf('}');

const newContent = controller.substring(0, closeIdx) +
    '\n\n' + cleanFn1 + '\n\n' + cleanFn2 + '\n' +
    controller.substring(customIdx);

fs.writeFileSync('./src/controllers/SecaderosController.js', newContent);
console.log('Update Complete.');
