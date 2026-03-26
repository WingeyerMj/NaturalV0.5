/**
 * PresupuestoModel.js
 * Manages budget projections based on real cycle data.
 * Two axes: Jornales (labor days) and Gastos/Consumos (expenses/inputs).
 */

import { SofiaImportModel } from './SofiaModel.js';

const STORAGE_KEY = 'nf_presupuesto';

export class PresupuestoModel {
    static _data = null;

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
            const predio = r.clasifica || 'Sin Predio';
            const jornales = r.totalJornadas || 0;
            const costo = r.costo_ars || 0;

            totalJornales += jornales;
            totalCostoArs += costo;

            // By Labor
            if (!byLabor[labor]) {
                byLabor[labor] = { labor, jornales: 0, costoArs: 0, count: 0 };
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

        const laborList = Object.values(byLabor).sort((a, b) => b.jornales - a.jornales);
        const predioList = Object.values(byPredio).sort((a, b) => b.jornales - a.jornales);

        return {
            byLabor: laborList,
            byPredio: predioList,
            totals: { totalJornales, totalCostoArs }
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
        all[targetCiclo] = {
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
}
