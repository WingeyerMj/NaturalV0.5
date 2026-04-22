/**
 * JornalesBudgetModel.js
 * Manages the "Estimated Journals" (Projections) uploaded via CSV.
 */

import { SofiaApiModel } from './SofiaApiModel.js';

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

            const rawLabor = cols[idxLabor].trim();
            newRecords.push({
                finca: cols[idxFinca].trim(),
                predio: cols[idxPredio].trim(),
                // Normalize on import to match the single source of truth (faenas.csv)
                labor: SofiaApiModel.normalizeLabor(rawLabor),
                faena: SofiaApiModel.normalizeFaena(rawLabor),
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
            const pVal = filters.predio.startsWith('FINCA:') ? '' : filters.predio;
            if (pVal) {
                subset = subset.filter(r => r.predio.toLowerCase() === pVal.toLowerCase());
            }
        }

        if (filters.labor && filters.labor !== '') {
            subset = subset.filter(r => (r.labor_normalized || r.labor).toLowerCase() === filters.labor.toLowerCase());
        }

        return subset.reduce((sum, r) => sum + r.jornales, 0);
    }

    /**
     * Gets comparison stats per faena for the Consumed Journals chart.
     */
    static getComparisonByFaena(dataReal, filters = {}) {
        // Group real data by normalized faena
        const realByFaena = {};
        dataReal.forEach(r => {
            const faena = SofiaApiModel.normalizeFaena(r.faena || r.labor);
            if (!realByFaena[faena]) realByFaena[faena] = 0;
            realByFaena[faena] += (parseFloat(r.totalJornadas) || 0);
        });

        // Group budget data by normalized faena
        const budgetByFaena = {};
        let budgetSubset = this.REGISTROS;
        if (filters.finca) budgetSubset = budgetSubset.filter(r => r.finca === filters.finca);
        if (filters.predio) budgetSubset = budgetSubset.filter(r => r.predio === filters.predio);

        budgetSubset.forEach(r => {
            const faena = SofiaApiModel.normalizeFaena(r.faena || r.labor);
            if (!budgetByFaena[faena]) budgetByFaena[faena] = 0;
            budgetByFaena[faena] += r.jornales;
        });

        // Merge labels from both sources
        const labels = [...new Set([...Object.keys(realByFaena), ...Object.keys(budgetByFaena)])].sort();

        return {
            labels,
            datasets: [
                {
                    label: 'Presupuestado',
                    data: labels.map(l => budgetByFaena[l] || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Real (Sofía)',
                    data: labels.map(l => realByFaena[l] || 0),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        };
    }

    /**
     * Gets comparison stats per specific labor.
     */
    static getComparisonByLabor(dataReal, filters = {}) {
        // Group real data by normalized labor
        const realByLabor = {};
        dataReal.forEach(r => {
            const labor = SofiaApiModel.normalizeLabor(r.labor_normalized || r.labor);
            if (!realByLabor[labor]) realByLabor[labor] = 0;
            realByLabor[labor] += (parseFloat(r.totalJornadas) || 0);
        });

        // Group budget data by normalized labor
        const budgetByLabor = {};
        let budgetSubset = this.REGISTROS;
        if (filters.finca) budgetSubset = budgetSubset.filter(r => r.finca === filters.finca);
        if (filters.predio) budgetSubset = budgetSubset.filter(r => r.predio === filters.predio);

        budgetSubset.forEach(r => {
            const labor = SofiaApiModel.normalizeLabor(r.labor);
            if (!budgetByLabor[labor]) budgetByLabor[labor] = 0;
            budgetByLabor[labor] += r.jornales;
        });

        // Merge labels
        const labels = [...new Set([...Object.keys(realByLabor), ...Object.keys(budgetByLabor)])].sort();

        return {
            labels,
            datasets: [
                {
                    label: 'Presupuestado',
                    data: labels.map(l => budgetByLabor[l] || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Real (Sofía)',
                    data: labels.map(l => realByLabor[l] || 0),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        };
    }
}
