/**
 * PresupuestoModel.js
 * Manages budget projections based on real cycle data.
 * Two axes: Jornales (labor days) and Gastos/Consumos (expenses/inputs).
 */

import { SofiaImportModel } from './SofiaModel.js';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'nf_presupuesto';

export class PresupuestoModel {
    static _data = null;

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
