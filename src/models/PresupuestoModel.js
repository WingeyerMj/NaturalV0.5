/**
 * PresupuestoModel.js
 * Manages budget projections based on real cycle data.
 * Two axes: Jornales (labor days) and Gastos/Consumos (expenses/inputs).
 * Supports confirmation workflow: once confirmed, budget is frozen as reference.
 * Includes production estimation: kg uva/ha → kg pasa (÷4).
 */

import { SofiaImportModel } from './SofiaModel.js';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'nf_presupuesto';
const PRODUCTION_KEY = 'nf_produccion_estimada';
const RACIMOS_KEY = 'nf_conteo_racimos';

export class PresupuestoModel {
    static _data = null;
    static _prodData = null;
    static _racimosData = null;
    static FACTOR_UVA_PASA = 4; // kg of grapes / 4 = kg of raisins
    static DEFAULT_PESO_RACIMO_KG = 0.35; // Default estimated weight per cluster (kg)

    /**
     * Categorizes a labor string into a broader group.
     */
    static classifyLabor(labor) {
        const lab = (labor || '').toLowerCase();
        if (lab.includes('riego')) return 'Riego';
        if (lab.includes('poda')) return 'Poda';
        if (lab.includes('cosech')) return 'Cosecha';
        if (lab.includes('curaci') || lab.includes('aplicaci') || lab.includes('sulfat') || lab.includes('herbicid')) return 'Curaciones';
        if (lab.includes('desmalez') || lab.includes('carpida') || lab.includes('limpieza')) return 'Mantenimiento';
        if (lab.includes('atada') || lab.includes('atado') || lab.includes('guiado')) return 'Guiado/Atado';
        if (lab.includes('fertiliz')) return 'Fertilización';
        return 'Otras Labores';
    }

    /**
     * Build a budget summary from real jornales data (from SofiaApiModel).
     * Groups by labor and predio, calculating totals.
     * @param {Array} jornalesData - Raw jornales records from SofiaApiModel.fetchJornales()
     * @returns {{ byLabor: Array, byPredio: Array, totals: Object }}
     */
    static buildJornalesSummary(jornalesData) {
        const byLabor = {};
        const byPredio = {};
        let totalJornales = 0;
        let totalCostoArs = 0;

        jornalesData.forEach(r => {
            const labor = r.labor_normalized || r.labor || 'Sin Labor';
            const cat = this.classifyLabor(labor);
            const predio = r.clasifica || 'Sin Predio';
            const jornales = r.totalJornadas || 0;
            const costo = r.costo_ars || 0;

            totalJornales += jornales;
            totalCostoArs += costo;

            // By Labor (with Category)
            if (!byLabor[labor]) {
                byLabor[labor] = { labor, categoria: cat, jornales: 0, costoArs: 0, count: 0 };
            }
            byLabor[labor].jornales += jornales;
            byLabor[labor].costoArs += costo;
            byLabor[labor].count++;

            // By Predio
            if (!byPredio[predio]) {
                byPredio[predio] = { predio, jornales: 0, costoArs: 0, count: 0 };
            }
            byPredio[predio].jornales += jornales;
            byPredio[predio].costoArs += costo;
            byPredio[predio].count++;
        });

        const laborList = Object.values(byLabor).sort((a, b) => {
            // Sort by Category first, then by jornales desc
            if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
            return b.jornales - a.jornales;
        });
        const predioList = Object.values(byPredio).sort((a, b) => b.jornales - a.jornales);

        return {
            byLabor: laborList,
            byPredio: predioList,
            totals: { totalJornales, totalCostoArs }
        };
    }

    /**
     * PREDIO_CONFIG shared for normalization.
     */
    static PREDIO_CONFIG = [
        { keyword: 'Camino Truncado', group: 'Fincas Viejas', name: 'Camino Truncado' },
        { keyword: 'La Chimbera', group: 'Fincas Viejas', name: 'La Chimbera' },
        { keyword: 'Puente Alto', group: 'Fincas Viejas', name: 'Puente Alto' },
        { keyword: 'EEIII', group: 'El Espejo', name: 'El Espejo 3' },
        { keyword: 'EEII', group: 'El Espejo', name: 'El Espejo 2' },
        { keyword: 'EEI', group: 'El Espejo', name: 'El Espejo 1' }
    ];

    /**
     * Normalizes a raw clasifica string to a canonical predio name and finca group.
     * Returns { predio, finca } or null if not recognized.
     */
    static normalizePredio(rawClasifica) {
        if (!rawClasifica) return null;
        const upper = rawClasifica.toUpperCase();
        // Must check EEIII before EEII before EEI (longest match first)
        const orderedConfig = [
            { keyword: 'CAMINO TRUNCADO', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'TRUNCADO', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'CHIMBERA', group: 'Fincas Viejas', name: 'La Chimbera' },
            { keyword: 'PUENTE ALTO', group: 'Fincas Viejas', name: 'Puente Alto' },
            { keyword: 'P. ALTO', group: 'Fincas Viejas', name: 'Puente Alto' },
            { keyword: 'P.ALTO', group: 'Fincas Viejas', name: 'Puente Alto' },
            { keyword: 'EEIII', group: 'El Espejo', name: 'El Espejo 3' },
            { keyword: 'ESPEJO 3', group: 'El Espejo', name: 'El Espejo 3' },
            { keyword: 'EEII', group: 'El Espejo', name: 'El Espejo 2' },
            { keyword: 'ESPEJO 2', group: 'El Espejo', name: 'El Espejo 2' },
            { keyword: 'EEI', group: 'El Espejo', name: 'El Espejo 1' },
            { keyword: 'ESPEJO 1', group: 'El Espejo', name: 'El Espejo 1' }
        ];
        for (const cfg of orderedConfig) {
            if (upper.includes(cfg.keyword)) {
                return { predio: cfg.name, finca: cfg.group };
            }
        }
        return null;
    }

    /**
     * Build a budget summary grouped BY FINCA → Predio → Labor.
     * This is the main structure for creating per-finca budgets.
     * @param {Array} jornalesData - Raw jornales records
     * @returns {{ byFinca: Object, totals: Object }}
     * 
     * byFinca structure:
     * {
     *   'El Espejo': {
     *     finca: 'El Espejo',
     *     jornales: 0, costoArs: 0,
     *     byPredio: {
     *       'El Espejo 1': { predio, jornales, costoArs, byLabor: [...] },
     *       ...
     *     },
     *     byLabor: [{ labor, categoria, jornales, costoArs }]
     *   },
     *   'Fincas Viejas': { ... }
     * }
     */
    static buildJornalesSummaryByFinca(jornalesData) {
        const fincaMap = {};
        let totalJornales = 0;
        let totalCostoArs = 0;

        jornalesData.forEach(r => {
            const rawClasifica = r.clasifica || r.clasificacion || '';
            const norm = this.normalizePredio(rawClasifica);
            if (!norm) return; // skip unknown predios

            const fincaName = norm.finca;
            const predioName = norm.predio;
            const labor = r.labor_normalized || r.labor || 'Sin Labor';
            const cat = this.classifyLabor(labor);
            const jornales = r.totalJornadas || 0;
            const costo = r.costo_ars || 0;

            totalJornales += jornales;
            totalCostoArs += costo;

            // Init finca
            if (!fincaMap[fincaName]) {
                fincaMap[fincaName] = {
                    finca: fincaName,
                    jornales: 0,
                    costoArs: 0,
                    byPredio: {},
                    laborMap: {}
                };
            }
            const finca = fincaMap[fincaName];
            finca.jornales += jornales;
            finca.costoArs += costo;

            // Labor acumulada por finca
            if (!finca.laborMap[labor]) {
                finca.laborMap[labor] = { labor, categoria: cat, jornales: 0, costoArs: 0, count: 0 };
            }
            finca.laborMap[labor].jornales += jornales;
            finca.laborMap[labor].costoArs += costo;
            finca.laborMap[labor].count++;

            // Init predio within finca
            if (!finca.byPredio[predioName]) {
                finca.byPredio[predioName] = {
                    predio: predioName,
                    finca: fincaName,
                    jornales: 0,
                    costoArs: 0,
                    laborMap: {}
                };
            }
            const predio = finca.byPredio[predioName];
            predio.jornales += jornales;
            predio.costoArs += costo;

            // Labor by predio
            if (!predio.laborMap[labor]) {
                predio.laborMap[labor] = { labor, categoria: cat, jornales: 0, costoArs: 0 };
            }
            predio.laborMap[labor].jornales += jornales;
            predio.laborMap[labor].costoArs += costo;
        });

        // Convert laborMaps to sorted arrays
        const sortLabors = (map) => Object.values(map).sort((a, b) => {
            if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
            return b.jornales - a.jornales;
        });

        Object.values(fincaMap).forEach(f => {
            f.byLabor = sortLabors(f.laborMap);
            delete f.laborMap;
            Object.values(f.byPredio).forEach(p => {
                p.byLabor = sortLabors(p.laborMap);
                delete p.laborMap;
            });
        });

        return {
            byFinca: fincaMap,
            totals: { totalJornales, totalCostoArs }
        };
    }

    /**
     * Calculates maintenance cost per hectare for each predio and finca.
     * Combines jornales cost data with hectareas data from SofiaApiModel.getHectareasPorPredio().
     * @param {Object} fincaSummary - Output of buildJornalesSummaryByFinca()
     * @param {Object} hectareasData - Output of SofiaApiModel.getHectareasPorPredio()
     * @returns {{ byPredio: Array, byFinca: Array }}
     */
    static getCostoMantenimientoHa(fincaSummary, hectareasData) {
        if (!fincaSummary || !hectareasData) return { byPredio: [], byFinca: [] };

        // Build hectareas lookup from hectareasData
        const haMap = {}; // predioName -> hectareas
        hectareasData.groups.forEach(g => {
            g.predios.forEach(p => {
                haMap[p.name] = p.hectareas;
            });
        });

        const predioResults = [];
        const fincaResults = [];

        Object.values(fincaSummary.byFinca).forEach(finca => {
            let fincaHa = 0;
            let fincaCosto = 0;
            let fincaJornales = 0;

            Object.values(finca.byPredio).forEach(predio => {
                const ha = haMap[predio.predio] || 0;
                const costoHa = ha > 0 ? predio.costoArs / ha : 0;
                const jornalesHa = ha > 0 ? predio.jornales / ha : 0;

                predioResults.push({
                    predio: predio.predio,
                    finca: finca.finca,
                    hectareas: ha,
                    costoArs: predio.costoArs,
                    costoHa,
                    jornales: predio.jornales,
                    jornalesHa,
                    laboresCount: predio.byLabor.length
                });

                fincaHa += ha;
                fincaCosto += predio.costoArs;
                fincaJornales += predio.jornales;
            });

            fincaResults.push({
                finca: finca.finca,
                hectareas: fincaHa,
                costoArs: fincaCosto,
                costoHa: fincaHa > 0 ? fincaCosto / fincaHa : 0,
                jornales: fincaJornales,
                jornalesHa: fincaHa > 0 ? fincaJornales / fincaHa : 0,
                prediosCount: Object.keys(finca.byPredio).length
            });
        });

        return {
            byPredio: predioResults.sort((a, b) => b.costoHa - a.costoHa),
            byFinca: fincaResults.sort((a, b) => b.costoHa - a.costoHa)
        };
    }

    /**
     * Build a gastos/consumos summary from SofiaImportModel (aplicaciones CSV data).
     * Groups by category and product.
     * @param {string} cicloFilter - Optional cycle filter (e.g. '2025-2026')
     * @returns {{ byCategoria: Array, byProducto: Array, totals: Object }}
     */
    static buildGastosSummary(cicloFilter = '') {
        const registros = SofiaImportModel.REGISTROS || [];
        const byCategoria = {};
        const byProducto = {};
        let totalCosto = 0;
        let totalCantidad = 0;

        registros.forEach(r => {
            // Filter by cycle if specified
            if (cicloFilter && r.ciclo !== cicloFilter) return;
            // Only count Real applications (not budgets)
            const tipo = (r.tipo_registro || '').toLowerCase();
            if (tipo.includes('presupuestado')) return;

            const categoria = r.categoria || 'Otros';
            const producto = r.producto || 'Desconocido';
            const costo = r.costo_total || 0;
            const cantidad = r.cantidad || 0;

            totalCosto += costo;
            totalCantidad += cantidad;

            // By Categoria
            if (!byCategoria[categoria]) {
                byCategoria[categoria] = { categoria, costo: 0, cantidad: 0, count: 0, productos: {} };
            }
            byCategoria[categoria].costo += costo;
            byCategoria[categoria].cantidad += cantidad;
            byCategoria[categoria].count++;

            // By Producto (nested inside category)
            if (!byCategoria[categoria].productos[producto]) {
                byCategoria[categoria].productos[producto] = { producto, categoria, costo: 0, cantidad: 0, count: 0 };
            }
            byCategoria[categoria].productos[producto].costo += costo;
            byCategoria[categoria].productos[producto].cantidad += cantidad;
            byCategoria[categoria].productos[producto].count++;

            // Flat by Producto
            if (!byProducto[producto]) {
                byProducto[producto] = { producto, categoria, costo: 0, cantidad: 0, count: 0 };
            }
            byProducto[producto].costo += costo;
            byProducto[producto].cantidad += cantidad;
            byProducto[producto].count++;
        });

        // Convert nested products to arrays
        const categoriaList = Object.values(byCategoria).map(cat => ({
            ...cat,
            productos: Object.values(cat.productos).sort((a, b) => b.cantidad - a.cantidad)
        })).sort((a, b) => b.costo - a.costo);

        const productoList = Object.values(byProducto).sort((a, b) => b.cantidad - a.cantidad);

        return {
            byCategoria: categoriaList,
            byProducto: productoList,
            totals: { totalCosto, totalCantidad }
        };
    }

    /**
     * Save the user's budget projection edits.
     * @param {string} targetCiclo - e.g. '2026-2027'
     * @param {Object} data - { jornales: { [labor]: projectedValue }, gastos: { [producto]: projectedValue } }
     */
    static save(targetCiclo, data) {
        const all = this.loadAll();
        const existing = all[targetCiclo] || {};
        all[targetCiclo] = {
            ...existing,
            ...data,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        this._data = all;
    }

    /**
     * Load all saved budgets.
     */
    static loadAll() {
        if (this._data) return this._data;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            this._data = stored ? JSON.parse(stored) : {};
        } catch (e) {
            this._data = {};
        }
        return this._data;
    }

    /**
     * Load budget for specific cycle.
     */
    static load(targetCiclo) {
        const all = this.loadAll();
        return all[targetCiclo] || null;
    }

    /**
     * Check if a budget cycle is confirmed (frozen).
     */
    static isConfirmed(targetCiclo) {
        const budget = this.load(targetCiclo);
        return budget?.confirmed === true;
    }

    /**
     * Confirm (freeze) a budget. Once confirmed, it becomes the reference.
     * All charts and reports will compare against this frozen snapshot.
     * @param {string} targetCiclo
     * @param {Object} snapshot - Complete snapshot of { jornales, gastos, produccion, totals }
     */
    static confirm(targetCiclo, snapshot) {
        const all = this.loadAll();
        all[targetCiclo] = {
            ...all[targetCiclo],
            ...snapshot,
            confirmed: true,
            confirmedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        this._data = all;
    }

    /**
     * Unconfirm a budget, returning it to editable state.
     */
    static unconfirm(targetCiclo) {
        const all = this.loadAll();
        if (all[targetCiclo]) {
            all[targetCiclo].confirmed = false;
            all[targetCiclo].confirmedAt = null;
            all[targetCiclo].updatedAt = new Date().toISOString();
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        this._data = all;
    }

    /**
     * Save budget to server as JSON file for persistent cross-device storage.
     */
    static async saveToServer(targetCiclo, data) {
        // First save to local storage as fallback
        this.save(targetCiclo, data);

        try {
            const filename = `budget_draft_${targetCiclo}.json`;
            const response = await fetch('/api/save-budget-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, data })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('[PresupuestoModel] Error saving to server:', error);
            return false;
        }
    }

    /**
     * Load budget from server JSON file.
     */
    static async loadFromServer(targetCiclo) {
        try {
            const filename = `/Fuentes/Presupuestos/budget_draft_${targetCiclo}.json`;
            const response = await fetch(filename);
            if (!response.ok) return null;
            
            const data = await response.json();
            // Also update local storage cache
            this.save(targetCiclo, data);
            return data;
        } catch (error) {
            // Probably doesn't exist yet
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════
    // PRODUCTION ESTIMATION (UVA → PASA)
    // ═══════════════════════════════════════════════════════


    /**
     * Save production estimates per predio.
     * @param {string} ciclo
     * @param {Array} estimates - [{ predio, group, hectareas, kgUvaHa }]
     */
    static saveProductionEstimates(ciclo, estimates) {
        const all = this._loadProductionAll();
        const enriched = estimates.map(e => ({
            predio: e.predio,
            group: e.group,
            hectareas: e.hectareas || 0,
            kgUvaHa: e.kgUvaHa || 0,
            kgUvaTotal: (e.hectareas || 0) * (e.kgUvaHa || 0),
            kgPasaEstimado: ((e.hectareas || 0) * (e.kgUvaHa || 0)) / this.FACTOR_UVA_PASA
        }));
        all[ciclo] = {
            estimates: enriched,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(PRODUCTION_KEY, JSON.stringify(all));
        this._prodData = all;
        return enriched;
    }

    /**
     * Load production estimates for a cycle.
     */
    static loadProductionEstimates(ciclo) {
        const all = this._loadProductionAll();
        return all[ciclo]?.estimates || [];
    }

    static _loadProductionAll() {
        if (this._prodData) return this._prodData;
        try {
            const stored = localStorage.getItem(PRODUCTION_KEY);
            this._prodData = stored ? JSON.parse(stored) : {};
        } catch (e) {
            this._prodData = {};
        }
        return this._prodData;
    }

    /**
     * Build default production estimates from hectareas data.
     * @param {Object} hectareasData - Output of SofiaApiModel.getHectareasPorPredio()
     * @param {number} defaultKgHa - Default kg uva/ha to use if no saved estimate exists
     */
    static buildDefaultProductionEstimates(hectareasData, defaultKgHa = 15000) {
        const estimates = [];
        if (hectareasData?.groups) {
            hectareasData.groups.forEach(g => {
                g.predios.forEach(p => {
                    estimates.push({
                        predio: p.name,
                        group: g.name,
                        hectareas: p.hectareas,
                        kgUvaHa: defaultKgHa
                    });
                });
            });
        }
        return estimates;
    }

    // ═══════════════════════════════════════════════════════
    // CONTEO DE RACIMOS (Post-Floración)
    // ═══════════════════════════════════════════════════════

    /**
     * Save grape cluster counts per cuartel.
     * @param {string} ciclo
     * @param {Array} conteos - [{ predio, cuartel, racimosPlanta, pesoRacimoKg, plantas, hectareas, aplicarEstimacion, notasIngeniero }]
     * @returns {Array} enriched conteos with calculated yields
     */
    static saveRacimosCounts(ciclo, conteos) {
        const all = this._loadRacimosAll();
        const enriched = conteos.map(c => {
            const racimosPlanta = c.racimosPlanta || 0;
            const pesoRacimoKg = c.pesoRacimoKg || this.DEFAULT_PESO_RACIMO_KG;
            const plantas = c.plantas || 0;
            const hectareas = c.hectareas || 0;
            const kgUvaCuartel = racimosPlanta * pesoRacimoKg * plantas;
            const kgUvaHaEstimado = hectareas > 0 ? kgUvaCuartel / hectareas : 0;
            const kgPasaCuartel = kgUvaCuartel / this.FACTOR_UVA_PASA;
            return {
                predio: c.predio,
                group: c.group || '',
                cuartel: c.cuartel,
                racimosPlanta,
                pesoRacimoKg,
                plantas,
                hectareas,
                kgUvaCuartel: Math.round(kgUvaCuartel),
                kgUvaHaEstimado: Math.round(kgUvaHaEstimado),
                kgPasaCuartel: Math.round(kgPasaCuartel),
                aplicarEstimacion: c.aplicarEstimacion || false,
                notasIngeniero: c.notasIngeniero || ''
            };
        });
        all[ciclo] = {
            conteos: enriched,
            updatedAt: new Date().toISOString(),
            updatedBy: 'ingeniero'
        };
        localStorage.setItem(RACIMOS_KEY, JSON.stringify(all));
        this._racimosData = all;
        return enriched;
    }

    /**
     * Load grape cluster counts for a cycle.
     */
    static loadRacimosCounts(ciclo) {
        const all = this._loadRacimosAll();
        return all[ciclo]?.conteos || [];
    }

    /**
     * Get the racimos-based kg/ha for a specific predio.
     * Aggregates all cuarteles for that predio where aplicarEstimacion is true.
     * Returns null if no conteo available or none applied.
     */
    static getRacimosEstimateForPredio(ciclo, predioName) {
        const conteos = this.loadRacimosCounts(ciclo);
        const predioConteos = conteos.filter(c => c.predio === predioName && c.aplicarEstimacion);
        if (predioConteos.length === 0) return null;

        const totalKgUva = predioConteos.reduce((s, c) => s + c.kgUvaCuartel, 0);
        const totalHa = predioConteos.reduce((s, c) => s + c.hectareas, 0);
        const totalPlantas = predioConteos.reduce((s, c) => s + c.plantas, 0);
        return {
            kgUvaTotal: totalKgUva,
            kgUvaHa: totalHa > 0 ? Math.round(totalKgUva / totalHa) : 0,
            kgPasaTotal: Math.round(totalKgUva / this.FACTOR_UVA_PASA),
            totalHa,
            totalPlantas,
            cuartelesCount: predioConteos.length
        };
    }

    static _loadRacimosAll() {
        if (this._racimosData) return this._racimosData;
        try {
            const stored = localStorage.getItem(RACIMOS_KEY);
            this._racimosData = stored ? JSON.parse(stored) : {};
        } catch (e) {
            this._racimosData = {};
        }
        return this._racimosData;
    }

    /**
     * Get execution comparison for a confirmed budget.
     * Compares the confirmed (frozen) values against real data.
     * @param {string} ciclo - The cycle to compare
     * @param {Object} realJornalesSummary - { byLabor, byPredio, totals }
     * @param {Object} realGastosSummary - { byCategoria, byProducto, totals }
     * @param {Array} realCosechaData - Array of cosecha records
     * @returns {Object} comparison data for charts
     */
    static getExecutionComparison(ciclo, realJornalesSummary, realGastosSummary, realCosechaData) {
        const budget = this.load(ciclo);
        if (!budget || !budget.confirmed) return null;

        const savedJornales = budget.jornales || {};
        const savedGastos = budget.gastos || {};
        const savedProduccion = this.loadProductionEstimates(ciclo);

        // Jornales comparison
        const jornalesComparison = [];
        Object.entries(savedJornales).forEach(([labor, planificado]) => {
            const real = realJornalesSummary?.byLabor?.find(r => r.labor === labor);
            const consumido = real ? real.jornales : 0;
            const pct = planificado > 0 ? (consumido / planificado * 100) : 0;
            jornalesComparison.push({
                labor,
                planificado,
                consumido,
                diferencia: consumido - planificado,
                porcentaje: pct,
                estado: pct > 100 ? 'excedido' : pct >= 80 ? 'alerta' : 'ok'
            });
        });

        // Gastos comparison  
        const gastosComparison = [];
        Object.entries(savedGastos).forEach(([producto, planificado]) => {
            const real = realGastosSummary?.byProducto?.find(r => r.producto === producto);
            const consumido = real ? real.cantidad : 0;
            const pct = planificado > 0 ? (consumido / planificado * 100) : 0;
            gastosComparison.push({
                producto,
                planificado,
                consumido,
                diferencia: consumido - planificado,
                porcentaje: pct,
                estado: pct > 100 ? 'excedido' : pct >= 80 ? 'alerta' : 'ok'
            });
        });

        // Production comparison
        const produccionComparison = savedProduccion.map(est => {
            // Find real cosecha data for this predio
            const realKg = this._getRealCosechaForPredio(est.predio, realCosechaData);
            const pctUva = est.kgUvaTotal > 0 ? (realKg / est.kgUvaTotal * 100) : 0;
            const realPasa = realKg / this.FACTOR_UVA_PASA;
            const pctPasa = est.kgPasaEstimado > 0 ? (realPasa / est.kgPasaEstimado * 100) : 0;
            return {
                predio: est.predio,
                group: est.group,
                hectareas: est.hectareas,
                kgUvaHa: est.kgUvaHa,
                planificadoUva: est.kgUvaTotal,
                planificadoPasa: est.kgPasaEstimado,
                realUva: realKg,
                realPasa,
                pctUva,
                pctPasa,
                estado: pctUva > 100 ? 'superado' : pctUva >= 70 ? 'bueno' : 'bajo'
            };
        });

        return {
            confirmed: true,
            confirmedAt: budget.confirmedAt,
            jornales: jornalesComparison,
            gastos: gastosComparison,
            produccion: produccionComparison,
            totals: {
                jornalesPlan: jornalesComparison.reduce((s, j) => s + j.planificado, 0),
                jornalesReal: jornalesComparison.reduce((s, j) => s + j.consumido, 0),
                gastosPlan: gastosComparison.reduce((s, g) => s + g.planificado, 0),
                gastosReal: gastosComparison.reduce((s, g) => s + g.consumido, 0),
                uvaPlan: produccionComparison.reduce((s, p) => s + p.planificadoUva, 0),
                uvaReal: produccionComparison.reduce((s, p) => s + p.realUva, 0),
                pasaPlan: produccionComparison.reduce((s, p) => s + p.planificadoPasa, 0),
                pasaReal: produccionComparison.reduce((s, p) => s + p.realPasa, 0)
            }
        };
    }

    /**
     * Helper: Get real cosecha kg for a specific predio from cosecha data array.
     */
    static _getRealCosechaForPredio(predioName, cosechaData) {
        if (!cosechaData || !Array.isArray(cosechaData)) return 0;
        const PREDIO_KEYWORDS = {
            'Camino Truncado': ['CAMINO TRUNCADO', 'TRUNCADO'],
            'La Chimbera': ['CHIMBERA'],
            'Puente Alto': ['PUENTE ALTO', 'P. ALTO', 'P.ALTO'],
            'El Espejo 3': ['EEIII'],
            'El Espejo 2': ['EEII'],
            'El Espejo 1': ['EEI']
        };
        const keywords = PREDIO_KEYWORDS[predioName] || [];
        let total = 0;
        cosechaData.forEach(r => {
            if (!r.isCosecha) return;
            const clasif = (r.clasifica || '').toUpperCase();
            if (clasif.includes('PASA H') || clasif.includes('HUMEDA')) return;
            if (keywords.some(k => clasif.includes(k))) {
                total += r.rendimiento_val || 0;
            }
        });
        return total;
    }

    /**
     * Generate CSV export of the budget.
     * @param {string} targetCiclo
     * @param {Array} jornalesRows - [{ labor, real, projected, delta }]
     * @param {Array} gastosRows - [{ categoria, producto, realQty, projectedQty, realCosto, projectedCosto }]
     */
    static exportCSV(targetCiclo, jornalesRows, gastosRows) {
        let csv = `PRESUPUESTO ${targetCiclo}\n\n`;

        // Jornales section
        csv += 'JORNALES\n';
        csv += 'Labor;Real (Ciclo Anterior);Proyectado;Variación %;Costo Real ARS;Costo Proyectado ARS\n';
        jornalesRows.forEach(r => {
            const delta = r.real > 0 ? (((r.projected - r.real) / r.real) * 100).toFixed(1) : '0';
            const costoProj = r.real > 0 ? (r.costoArs * (r.projected / r.real)).toFixed(0) : '0';
            csv += `${r.labor};${r.real.toFixed(1)};${r.projected.toFixed(1)};${delta}%;${r.costoArs.toFixed(0)};${costoProj}\n`;
        });

        csv += '\nGASTOS Y CONSUMOS\n';
        csv += 'Categoría;Producto;Cantidad Real;Cantidad Proyectada;Variación %;Costo Real;Costo Proyectado\n';
        gastosRows.forEach(r => {
            const delta = r.realQty > 0 ? (((r.projectedQty - r.realQty) / r.realQty) * 100).toFixed(1) : '0';
            const costoProj = r.realQty > 0 ? (r.realCosto * (r.projectedQty / r.realQty)).toFixed(0) : '0';
            csv += `${r.categoria};${r.producto};${r.realQty.toFixed(1)};${r.projectedQty.toFixed(1)};${delta}%;${r.realCosto.toFixed(0)};${costoProj}\n`;
        });

        // Download
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Presupuesto_${targetCiclo}.csv`;
        link.click();
    }

    /**
     * Loads the "Prueba de Gral.xlsx" file from Fuentes/Presupuestos.
     * Parses the "Compilado" sheet and returns structured data.
     */
    static async loadExcelBudget() {
        try {
            const response = await fetch('/Fuentes/Presupuestos/Prueba de Gral.xlsx');
            if (!response.ok) throw new Error('No se pudo cargar el archivo Excel');
            
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            const sheetName = 'Compilado';
            if (!workbook.SheetNames.includes(sheetName)) {
                throw new Error(`La hoja "${sheetName}" no existe en el archivo`);
            }
            
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet);
            
            // Map data to a more friendly format
            const formatted = rawData.map(r => ({
                item: r['Items'] || '',
                mes: r['Mes'] || '',
                usd: parseFloat(r['USD']) || 0,
                finca: r['FINCA'] || '',
                gasto: r['Gastos'] || '',
                importeArs: parseFloat(r['Importe en $']) || 0,
                fechaRef: r['Fecha Ref'] || ''
            }));

            // Summary by Finca and Gasto
            const byFinca = {};
            formatted.forEach(r => {
                const key = r.finca || 'Otros';
                if (!byFinca[key]) byFinca[key] = { finca: key, usd: 0, ars: 0, items: [] };
                byFinca[key].usd += r.usd;
                byFinca[key].ars += r.importeArs;
                byFinca[key].items.push(r);
            });

            return {
                raw: formatted,
                byFinca: Object.values(byFinca).sort((a, b) => b.usd - a.usd)
            };
        } catch (error) {
            console.error('[PresupuestoModel] Error loading Excel budget:', error);
            throw error;
        }
    }

    /**
     * Builds a comprehensive Mixed Budget.
     * Takes Sofia/Jornales data (Real) and combines it with the Excel Budget structure.
     */
    static async buildMixedBudget(cicloBase, fincaFilter) {
        const { SofiaApiModel } = await import('./SofiaApiModel.js');
        
        // 1. Fetch Sofia Jornales (for Labores/Faenas)
        const filters = { ciclo: cicloBase };
        if (fincaFilter) filters.finca = fincaFilter;
        const rawJornales = await SofiaApiModel.fetchJornales(filters);
        const jornalesSummary = this.buildJornalesSummary(rawJornales);

        // 2. Load Excel Budget (General Expenses)
        const excelData = await this.loadExcelBudget();
        
        let filteredExcel = excelData.raw;
        if (fincaFilter) {
            filteredExcel = excelData.raw.filter(r => r.finca.toLowerCase().includes(fincaFilter.toLowerCase()));
        }

        // 3. Combine Labores (Sofia) + Gastos (Excel)
        return {
            ciclo: cicloBase,
            finca: fincaFilter || 'Todas',
            jornales: jornalesSummary.byLabor, // Real from Sofia
            gastosGral: filteredExcel.sort((a,b) => a.finca.localeCompare(b.finca)),
            totals: {
                jornales: jornalesSummary.totals.totalJornales,
                costoMo: jornalesSummary.totals.totalCostoArs,
                usdGral: filteredExcel.reduce((s, r) => s + r.usd, 0),
                arsGral: filteredExcel.reduce((s, r) => s + r.importeArs, 0)
            }
        };
    }

    /**
     * Export budget to Excel (XLSX) format
     */
    static exportToExcel(data, filename = 'Presupuesto_NaturalFood.xlsx') {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Labores (From Sofia)
        const laboresData = data.jornales.map(l => ({
            'Labor / Faena': l.labor,
            'Jornales Reales': l.jornales,
            'Costo Est. ARS': l.costoArs
        }));
        const wsLabores = XLSX.utils.json_to_sheet(laboresData);
        XLSX.utils.book_append_sheet(wb, wsLabores, "Labores y Faenas");

        // Sheet 2: Gastos Generales (From Excel)
        const gastosData = data.gastosGral.map(g => ({
            'Finca': g.finca,
            'Categoría': g.gasto,
            'Mes': g.mes,
            'USD': g.usd,
            'ARS': g.importeArs,
            'Item': g.item
        }));
        const wsGastos = XLSX.utils.json_to_sheet(gastosData);
        XLSX.utils.book_append_sheet(wb, wsGastos, "Gastos Generales");

        XLSX.writeFile(wb, filename);
    }

    /**
     * Export to CSV
     */
    static exportToCSV(data) {
        let csv = `PRESUPUESTO NATURALFOOD - CICLO ${data.ciclo}\n`;
        csv += `Finca: ${data.finca}\n\n`;
        
        csv += 'SECCION: LABORES (ORIGEN SOFIA)\n';
        csv += 'Labor;Jornales;Costo ARS\n';
        data.jornales.forEach(l => {
            csv += `${l.labor};${l.jornales.toFixed(2)};${l.costoArs.toFixed(0)}\n`;
        });

        csv += '\nSECCION: GASTOS GENERALES (ORIGEN EXCEL)\n';
        csv += 'Finca;Categoria;Mes;USD;ARS;Item\n';
        data.gastosGral.forEach(g => {
            csv += `${g.finca};${g.gasto};${g.mes};${g.usd.toFixed(2)};${g.importeArs.toFixed(0)};${g.item}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Presupuesto_Mixto_${data.ciclo}.csv`;
        link.click();
    }
}
