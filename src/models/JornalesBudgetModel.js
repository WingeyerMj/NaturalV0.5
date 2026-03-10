/**
 * JornalesBudgetModel.js
 * Manages the "Estimated Journals" (Projections) uploaded via CSV.
 */

export class JornalesBudgetModel {
    static REGISTROS = [];

    /**
     * Imports records from a CSV.
     * Expected format: Finca;Predio;Labor;Jornales
     */
    static importFromCSV(csvText) {
        if (!csvText) return { success: false, message: 'Archivo vacío' };

        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return { success: false, message: 'El archivo no contiene datos' };

        const header = lines[0].split(';').map(h => h.trim().toLowerCase());
        const idxFinca = header.findIndex(h => h === 'finca' || h === 'fincas');
        const idxPredio = header.findIndex(h => h === 'predio' || h === 'predios');
        const idxLabor = header.findIndex(h => h === 'labor' || h === 'labores' || h === 'faena' || h === 'faenas');
        const idxJornales = header.findIndex(h => h === 'jornales' || h === 'presupuestado' || h === 'cantidad');

        if (idxFinca === -1 || idxPredio === -1 || idxLabor === -1 || idxJornales === -1) {
            console.warn('[JornalesBudgetModel] Missing columns in CSV header:', header);
            return {
                success: false,
                message: 'Formato inválido. Se esperan columnas equivalentes a: Finca;Predio;Labor;Jornales'
            };
        }

        const newRecords = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(';');
            if (cols.length < header.length) continue;

            newRecords.push({
                finca: cols[idxFinca].trim(),
                predio: cols[idxPredio].trim(),
                labor: cols[idxLabor].trim(),
                jornales: parseFloat(cols[idxJornales].replace(',', '.')) || 0
            });
        }

        this.REGISTROS = newRecords;
        this.saveToStorage();
        return { success: true, count: newRecords.length };
    }

    static saveToStorage() {
        localStorage.setItem('nf_jornales_budget', JSON.stringify(this.REGISTROS));
    }

    static loadFromStorage() {
        const stored = localStorage.getItem('nf_jornales_budget');
        if (stored) {
            try {
                this.REGISTROS = JSON.parse(stored);
            } catch (e) {
                this.REGISTROS = [];
            }
        }
    }

    /**
     * Calculates total estimated journals for a set of filters.
     */
    static getEstimatedJornales(filters = {}) {
        let subset = this.REGISTROS;

        if (filters.finca && filters.finca !== '') {
            subset = subset.filter(r => r.finca.toLowerCase() === filters.finca.toLowerCase());
        }

        if (filters.predio && filters.predio !== '') {
            // Handle farm-wide selections (FINCA: prefix used in UI)
            const pVal = filters.predio.startsWith('FINCA:') ? '' : filters.predio;
            if (pVal) {
                subset = subset.filter(r => r.predio.toLowerCase() === pVal.toLowerCase());
            }
        }

        if (filters.labor && filters.labor !== '') {
            subset = subset.filter(r => r.labor.toLowerCase() === filters.labor.toLowerCase());
        }

        return subset.reduce((sum, r) => sum + r.jornales, 0);
    }

    /**
     * Gets comparison stats per faena for the Consumed Journals chart.
     */
    static getComparisonByFaena(dataReal, filters = {}) {
        const normalize = (l) => (l || 'Sin Faena').trim().toUpperCase();

        // Group real data by faena
        const realByFaena = {};
        dataReal.forEach(r => {
            const faena = normalize(r.faena);
            if (faena) realByFaena[faena] = (realByFaena[faena] || 0) + r.totalJornadas;
        });

        // Group budget data by labor (which acts as faena in this context)
        let budgetSubset = this.REGISTROS;
        if (filters.finca) budgetSubset = budgetSubset.filter(r => r.finca.toLowerCase() === filters.finca.toLowerCase());
        if (filters.predio && !filters.predio.startsWith('FINCA:')) {
            budgetSubset = budgetSubset.filter(r => r.predio.toLowerCase() === filters.predio.toLowerCase());
        }

        const budgetByFaena = {};
        budgetSubset.forEach(r => {
            // we use the 'labor' field from the CSV, since user maps faenas there
            const faena = normalize(r.labor);
            if (faena) budgetByFaena[faena] = (budgetByFaena[faena] || 0) + r.jornales;
        });

        // Combined labels (sort by Real descending conceptually, but map sorting can be tricky. Default sorting alphabetically)
        const allFaenas = [...new Set([...Object.keys(realByFaena), ...Object.keys(budgetByFaena)])]
            .sort((a, b) => (realByFaena[b] || 0) - (realByFaena[a] || 0)); // Sort by highest real execution

        return {
            labels: allFaenas,
            real: allFaenas.map(l => realByFaena[l] || 0),
            budget: allFaenas.map(l => budgetByFaena[l] || 0)
        };
    }

    /**
     * Gets comparison stats per labor for the Consumed Journals chart.
     */
    static getComparisonByLabor(dataReal, filters = {}) {
        const normalize = (l) => (l || '').trim().toUpperCase();

        // Group real data by labor
        const realByLabor = {};
        dataReal.forEach(r => {
            const lab = normalize(r.labor_normalized || r.labor);
            if (lab) realByLabor[lab] = (realByLabor[lab] || 0) + r.totalJornadas;
        });

        // Group budget data by labor (applying finca/predio filters)
        let budgetSubset = this.REGISTROS;
        if (filters.finca) budgetSubset = budgetSubset.filter(r => r.finca.toLowerCase() === filters.finca.toLowerCase());
        if (filters.predio && !filters.predio.startsWith('FINCA:')) {
            budgetSubset = budgetSubset.filter(r => r.predio.toLowerCase() === filters.predio.toLowerCase());
        }

        const budgetByLabor = {};
        budgetSubset.forEach(r => {
            const lab = normalize(r.labor);
            if (lab) budgetByLabor[lab] = (budgetByLabor[lab] || 0) + r.jornales;
        });

        // Combined labels (sort by Real descending)
        const allLabors = [...new Set([...Object.keys(realByLabor), ...Object.keys(budgetByLabor)])]
            .sort((a, b) => (realByLabor[b] || 0) - (realByLabor[a] || 0));

        return {
            labels: allLabors,
            real: allLabors.map(l => realByLabor[l] || 0),
            budget: allLabors.map(l => budgetByLabor[l] || 0)
        };
    }
}
