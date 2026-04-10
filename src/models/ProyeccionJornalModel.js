/**
 * ═══════════════════════════════════════════════════════════
 * NATURALFOOD - ProyeccionJornalModel.js
 * POM Avanzado — Proyección de Jornal Específico por Faena
 * 
 * Takes base data from "Pruebas de General" (fincas, cuarteles, hectáreas)
 * and builds an editable labor projection per cuartel/faena.
 * Crosses projections with real Sofia API data to compare
 * and suggest new projections.
 * ═══════════════════════════════════════════════════════════
 */

import { SofiaApiModel } from './SofiaApiModel.js';

const STORAGE_KEY = 'nf_proyeccion_jornal';

export class ProyeccionJornalModel {
    static _data = null;

    // Default labor catalog with expected units and typical windows
    static LABOR_CATALOG = [
        // Especificas (Jornales Desglose)
        { id: 'poda', nombre: 'Poda', colRend: 25, colJorn: 32, unidadBase: 'plantas', rendimientoDefault: 300, mesInicio: 6, mesFin: 8, categoria: 'Poda' },
        { id: 'atada', nombre: 'Atada', colRend: 26, colJorn: 33, unidadBase: 'plantas', rendimientoDefault: 400, mesInicio: 8, mesFin: 9, categoria: 'Guiado/Atado' },
        { id: 'desbrote_troncos', nombre: 'Desbrote de troncos', colRend: 27, colJorn: 34, unidadBase: 'plantas', rendimientoDefault: 500, mesInicio: 10, mesFin: 11, categoria: 'Mantenimiento' },
        { id: 'acomodo_brotes', nombre: 'Acomodo de brotes', colRend: 28, colJorn: 35, unidadBase: 'plantas', rendimientoDefault: 300, mesInicio: 10, mesFin: 12, categoria: 'Mantenimiento' },
        { id: 'desniete_deshoje', nombre: 'Desniete Deshoje', colRend: 29, colJorn: 36, unidadBase: 'plantas', rendimientoDefault: 400, mesInicio: 11, mesFin: 1, categoria: 'Mantenimiento' },
        { id: 'desbrote_poda', nombre: 'Desbrote crit. Poda', colRend: 30, colJorn: 37, unidadBase: 'plantas', rendimientoDefault: 500, mesInicio: 11, mesFin: 12, categoria: 'Mantenimiento' },
        { id: 'raleo_racimos', nombre: 'Raleo de Racimos', colRend: 31, colJorn: 38, unidadBase: 'plantas', rendimientoDefault: 1000, mesInicio: 12, mesFin: 1, categoria: 'Mantenimiento' },
        
        // Generales (Faenas Generales)
        { id: 'riego', nombre: 'Riego', colJorn: 45, unidadBase: 'hectareas', rendimientoDefault: 10, mesInicio: 5, mesFin: 4, categoria: 'Riego' },
        { id: 'malezas_mochila', nombre: 'Malezas Mochila', colJorn: 49, unidadBase: 'hectareas', rendimientoDefault: 5, mesInicio: 9, mesFin: 3, categoria: 'Mantenimiento' },
        { id: 'desmalezar_manual', nombre: 'Desmalezar manual', colJorn: 50, unidadBase: 'hectareas', rendimientoDefault: 4, mesInicio: 9, mesFin: 3, categoria: 'Mantenimiento' },
        
        // Cosecha
        { id: 'cosecha', nombre: 'Cosecha', colJorn: 71, unidadBase: 'plantas', rendimientoDefault: 250, mesInicio: 1, mesFin: 3, categoria: 'Cosecha' },
        { id: 'levantado', nombre: 'Levantado', colJorn: 78, unidadBase: 'plantas', rendimientoDefault: 350, mesInicio: 2, mesFin: 4, categoria: 'Cosecha' },
    ];

    // ═══════════════════════════════════════════════════════
    // DATA FROM EXCEL: Build the base table from "Tabla general"
    // ═══════════════════════════════════════════════════════

    /**
     * Loads "Tabla general" from Prueba de Gral.xlsx
     */
    static async loadBaseFromExcel() {
        try {
            const response = await fetch('/Fuentes/Presupuestos/Prueba de Gral.xlsx');
            if (!response.ok) throw new Error('No se pudo cargar el archivo Excel');
            
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            const sheetName = 'Tabla general';
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) throw new Error(`Hoja "${sheetName}" no encontrada`);
            
            const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (raw.length < 2) return [];

            const dataRows = raw.slice(2); 

            const result = [];
            dataRows.forEach(row => {
                if (!row[0] || !row[1]) return; // Skip if no finca or no cuartel

                const rendimientos = {};
                const jornales = {};

                this.LABOR_CATALOG.forEach(l => {
                    if (l.colRend != null) rendimientos[l.id] = parseFloat(row[l.colRend]) || 0;
                    if (l.colJorn != null) jornales[l.id] = parseFloat(row[l.colJorn]) || 0;
                });

                const record = {
                    finca: (row[0] || '').toString().trim(),
                    cuartel: (row[1] || '').toString().trim(),
                    hectareas: parseFloat(row[2]) || 0,
                    variedad: row[3] || '',
                    plantas: parseInt(row[7]) || 0,
                    predio: row[95] ? row[95].toString().trim() : (row[0] || '').toString().trim(),
                    rendimientosOriginales: rendimientos,
                    jornalesOriginales: jornales
                };
                result.push(record);
            });

            return result;
        } catch (error) {
            console.error('[ProyeccionJornal] Error loading Excel base:', error);
            return this.buildCuartelBaseFromSofia();
        }
    }

    /**
     * Build the complete base map of fincas/predios/cuarteles from Sofia data (Fallback).
     */
    static async buildCuartelBaseFromSofia(ciclo = '2025-2026') {
        const allData = await SofiaApiModel.fetchCycleData(ciclo);
        const hectareasData = SofiaApiModel.getHectareasPorPredio(allData);

        const result = [];

        if (hectareasData?.groups) {
            hectareasData.groups.forEach(group => {
                group.predios.forEach(predio => {
                    if (predio.cuartelesList && predio.cuartelesList.length > 0) {
                        predio.cuartelesList.forEach(cuartel => {
                            result.push({
                                finca: group.name,
                                predio: predio.name,
                                cuartel: cuartel.numero || '?',
                                hectareas: cuartel.ha || 0,
                                plantas: cuartel.pl || 0,
                                variedad: cuartel.variedad || '',
                            });
                        });
                    } else {
                        result.push({
                            finca: group.name,
                            predio: predio.name,
                            cuartel: 'General',
                            hectareas: predio.hectareas || 0,
                            plantas: predio.plantas || 0,
                            variedad: '',
                        });
                    }
                });
            });
        }

        return result;
    }

    // ═══════════════════════════════════════════════════════
    // PROJECTION LOGIC
    // ═══════════════════════════════════════════════════════

    /**
     * Calculate projected jornales for a cuartel + labor.
     * Formula: Jornales = BaseTotal / Rendimiento
     */
    static calcularJornalesProyectados(cuartelData, labor, rendimientoOverride = null) {
        const laborCfg = this.LABOR_CATALOG.find(l => l.id === labor.id || l.nombre.toLowerCase() === labor.nombre?.toLowerCase());
        const rendimiento = rendimientoOverride != null ? rendimientoOverride : (labor.rendimiento || laborCfg?.rendimientoDefault || 1);
        const unidad = labor.unidadBase || laborCfg?.unidadBase || 'plantas';

        let baseTotal = 0;
        if (unidad === 'plantas') {
            baseTotal = cuartelData.plantas || 0;
        } else {
            baseTotal = cuartelData.hectareas || 0;
        }

        return rendimiento > 0 ? Math.ceil(baseTotal / rendimiento) : 0;
    }

    /**
     * Build full projection matrix: every cuartel × every labor.
     */
    static buildProjectionMatrix(cuartelBase, labors = null, savedOverrides = null) {
        const laborsToUse = labors || this.LABOR_CATALOG;
        const overrides = savedOverrides || {};
        const matrix = [];

        cuartelBase.forEach(cuartel => {
            laborsToUse.forEach(labor => {
                const key = `${cuartel.finca}|${cuartel.predio}|${cuartel.cuartel}|${labor.id || labor.nombre}`;
                const override = overrides[key] || {};

                // Use original from Excel if available, otherwise catalog default
                const orgRend = (cuartel.rendimientosOriginales && cuartel.rendimientosOriginales[labor.id]) || labor.rendimientoDefault;
                const orgJornales = (cuartel.jornalesOriginales && cuartel.jornalesOriginales[labor.id]) || 0;

                const rendimiento = override.rendimiento != null ? override.rendimiento : orgRend;
                const jornalesAuto = this.calcularJornalesProyectados(cuartel, { ...labor, rendimiento });
                
                // If the user hasn't edited the jornales but the Excel had a value, we might want to respect the Excel value
                // Or if we want strictly formula-based:
                const jornales = override.jornales != null ? override.jornales : (orgJornales > 0 && override.rendimiento == null ? orgJornales : jornalesAuto);

                const currentYear = new Date().getFullYear();
                const fechaInicio = override.fechaInicio || this._buildDefaultDate(labor.mesInicio, currentYear);
                const fechaFin = override.fechaFin || this._buildDefaultDate(labor.mesFin, labor.mesFin < labor.mesInicio ? currentYear + 1 : currentYear);

                matrix.push({
                    key,
                    finca: cuartel.finca,
                    predio: cuartel.predio, // Normalized predio/group
                    cuartel: cuartel.cuartel,
                    hectareas: cuartel.hectareas,
                    plantas: cuartel.plantas,
                    variedad: cuartel.variedad,
                    laborId: labor.id || labor.nombre.toLowerCase(),
                    laborNombre: labor.nombre,
                    laborCategoria: labor.categoria,
                    unidadBase: labor.unidadBase,
                    rendimientoOriginal: orgRend,
                    jornalesOriginal: orgJornales,
                    rendimientoProyectado: rendimiento,
                    jornalesProyectados: jornales,
                    jornalesCalculados: jornalesAuto,
                    fechaInicio,
                    fechaFin,
                    fuente: override.rendimiento || override.jornales ? 'manual' : (orgRend ? 'excel' : 'catalog'),
                    editado: override.rendimiento != null || override.jornales != null,
                    // Real data & Sugerencia
                    rendimientoReal: null,
                    jornalesReales: null,
                    fechaRealInicio: null,
                    fechaRealFin: null,
                    desvioRendimiento: null,
                    desvioJornales: null,
                    desvioTemporal: null,
                    rendimientoSugerido: null,
                    jornalesSugeridos: null,
                });
            });
        });

        return matrix;
    }

    static _buildDefaultDate(month, year) {
        return `${year}-${String(month).padStart(2, '0')}-01`;
    }

    // ═══════════════════════════════════════════════════════
    // CROSS WITH REAL DATA (SOFÍA)
    // ═══════════════════════════════════════════════════════

    /**
     * Fetches real execution data from Sofia and crosses it with projections.
     * Updates each projection record with real values and desvios.
     */
    static async crossWithRealData(projectionMatrix, ciclo = '2025-2026') {
        const allData = await SofiaApiModel.fetchCycleData(ciclo);

        // Group real data by predio + labor
        const realByPredioLabor = {};
        allData.forEach(r => {
            const predio = this._normalizePredioFromClasifica(r.clasifica);
            if (!predio) return;
            const labor = (r.labor_normalized || r.labor || '').toLowerCase();
            const key = `${predio}|${labor}`;

            if (!realByPredioLabor[key]) {
                realByPredioLabor[key] = {
                    jornales: 0,
                    rendimientoTotal: 0,
                    count: 0,
                    fechas: [],
                };
            }
            realByPredioLabor[key].jornales += r.totalJornadas || 0;
            realByPredioLabor[key].rendimientoTotal += r.rendimiento_val || 0;
            realByPredioLabor[key].count++;
            if (r.fecha) realByPredioLabor[key].fechas.push(r.fecha);
        });

        // Cross each projection with real data
        projectionMatrix.forEach(proj => {
            const laborNorm = (proj.laborNombre || '').toLowerCase();
            const key = `${proj.predio}|${laborNorm}`;
            const real = realByPredioLabor[key];

            if (real) {
                // Distribute real jornales proportionally by hectareas
                const predioRecords = projectionMatrix.filter(
                    p => p.predio === proj.predio && p.laborNombre === proj.laborNombre
                );
                const totalHaPredio = predioRecords.reduce((s, p) => s + p.hectareas, 0);
                const proportion = totalHaPredio > 0 ? proj.hectareas / totalHaPredio : 0;

                proj.jornalesReales = Math.round(real.jornales * proportion * 10) / 10;

                // Real rendimiento: plants_or_ha / jornales
                if (proj.jornalesReales > 0) {
                    if (proj.unidadBase === 'plantas') {
                        proj.rendimientoReal = Math.round(proj.plantas / proj.jornalesReales);
                    } else {
                        proj.rendimientoReal = Math.round((proj.hectareas / proj.jornalesReales) * 10) / 10;
                    }
                }

                // Date range from real execution
                const sortedDates = real.fechas.sort();
                if (sortedDates.length > 0) {
                    proj.fechaRealInicio = sortedDates[0];
                    proj.fechaRealFin = sortedDates[sortedDates.length - 1];
                }

                // Desvios
                if (proj.rendimientoProyectado > 0 && proj.rendimientoReal > 0) {
                    proj.desvioRendimiento = ((proj.rendimientoReal - proj.rendimientoProyectado) / proj.rendimientoProyectado * 100);
                }
                if (proj.jornalesProyectados > 0 && proj.jornalesReales > 0) {
                    proj.desvioJornales = ((proj.jornalesReales - proj.jornalesProyectados) / proj.jornalesProyectados * 100);
                }
                if (proj.fechaInicio && proj.fechaRealInicio) {
                    const diffMs = new Date(proj.fechaRealInicio) - new Date(proj.fechaInicio);
                    proj.desvioTemporal = Math.round(diffMs / (1000 * 60 * 60 * 24));
                }

                // Suggested new projection: weighted average (70% real, 30% original)
                if (proj.rendimientoReal > 0) {
                    proj.rendimientoSugerido = Math.round(proj.rendimientoReal * 0.7 + proj.rendimientoProyectado * 0.3);
                    if (proj.unidadBase === 'plantas') {
                        proj.jornalesSugeridos = proj.rendimientoSugerido > 0 ? Math.ceil(proj.plantas / proj.rendimientoSugerido) : proj.jornalesProyectados;
                    } else {
                        proj.jornalesSugeridos = proj.rendimientoSugerido > 0 ? Math.ceil(proj.hectareas / proj.rendimientoSugerido) : proj.jornalesProyectados;
                    }
                }
            }
        });

        return projectionMatrix;
    }

    static _normalizePredioFromClasifica(clasifica) {
        if (!clasifica) return null;
        const upper = clasifica.toUpperCase();
        if (upper.includes('CAMINO TRUNCADO') || upper.includes('TRUNCADO')) return 'Camino Truncado';
        if (upper.includes('CHIMBERA')) return 'La Chimbera';
        if (upper.includes('PUENTE ALTO') || upper.includes('P. ALTO') || upper.includes('P.ALTO')) return 'Puente Alto';
        if (upper.includes('EEIII') || upper.includes('ESPEJO 3') || upper.includes('ESPEJO III')) return 'El Espejo III';
        if (upper.includes('EEI') || upper.includes('ESPEJO 1') || upper.includes('ESPEJO I') || 
            upper.includes('EEII') || upper.includes('ESPEJO 2') || upper.includes('ESPEJO II')) {
            return 'El Espejo I y II';
        }
        if (upper.includes('EL ESPEJO')) return 'El Espejo I y II'; // Default for other Espejo
        if (upper.includes('FINCAS VIEJAS') || upper.includes('F. VIEJAS')) return 'Fincas Viejas';
        if (upper.includes('TERCEROS')) return 'Terceros';
        return null;
    }

    // ═══════════════════════════════════════════════════════
    // AGGREGATION: Summary Views
    // ═══════════════════════════════════════════════════════

    /**
     * Summary by finca: total jornales per finca, per labor, rend avg, etc.
     */
    static getResumenPorFinca(matrix) {
        const map = {};
        matrix.forEach(p => {
            if (!map[p.finca]) {
                map[p.finca] = {
                    finca: p.finca,
                    jornalesProyectados: 0,
                    jornalesReales: 0,
                    jornalesSugeridos: 0,
                    labores: {},
                    predios: new Set(),
                    cuarteles: new Set(),
                    hectareas: 0,
                };
            }
            const f = map[p.finca];
            f.jornalesProyectados += p.jornalesProyectados || 0;
            f.jornalesReales += p.jornalesReales || 0;
            f.jornalesSugeridos += p.jornalesSugeridos || p.jornalesProyectados || 0;
            f.predios.add(p.predio);
            f.cuarteles.add(`${p.predio}|${p.cuartel}`);
            // Avoid double-counting ha
            const haKey = `${p.predio}|${p.cuartel}`;
            if (!f._haSet) f._haSet = new Set();
            if (!f._haSet.has(haKey)) {
                f._haSet.add(haKey);
                f.hectareas += p.hectareas || 0;
            }

            if (!f.labores[p.laborNombre]) {
                f.labores[p.laborNombre] = { jornalesP: 0, jornalesR: 0, jornalesS: 0 };
            }
            f.labores[p.laborNombre].jornalesP += p.jornalesProyectados || 0;
            f.labores[p.laborNombre].jornalesR += p.jornalesReales || 0;
            f.labores[p.laborNombre].jornalesS += p.jornalesSugeridos || p.jornalesProyectados || 0;
        });

        return Object.values(map).map(f => ({
            ...f,
            prediosCount: f.predios.size,
            cuartelesCount: f.cuarteles.size,
            labores: Object.entries(f.labores).map(([nombre, v]) => ({ nombre, ...v }))
                .sort((a, b) => b.jornalesP - a.jornalesP),
            desvioTotal: f.jornalesProyectados > 0 && f.jornalesReales > 0
                ? ((f.jornalesReales - f.jornalesProyectados) / f.jornalesProyectados * 100)
                : null,
        }));
    }

    /**
     * Calendar view: group projections by month for a Gantt-like display.
     */
    static getCalendarioLabores(matrix) {
        const months = [];
        for (let m = 5; m <= 16; m++) {
            const month = m > 12 ? m - 12 : m;
            const year = m > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear();
            months.push({
                month,
                year,
                label: new Date(year, month - 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
                labores: [],
            });
        }

        matrix.forEach(p => {
            if (!p.fechaInicio || !p.fechaFin) return;
            const start = new Date(p.fechaInicio);
            const end = new Date(p.fechaFin);

            months.forEach(m => {
                const monthStart = new Date(m.year, m.month - 1, 1);
                const monthEnd = new Date(m.year, m.month, 0);
                if (start <= monthEnd && end >= monthStart) {
                    m.labores.push({
                        finca: p.finca,
                        predio: p.predio,
                        cuartel: p.cuartel,
                        labor: p.laborNombre,
                        jornales: p.jornalesProyectados,
                        hasReal: p.jornalesReales != null,
                    });
                }
            });
        });

        return months;
    }

    // ═══════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════

    static saveOverrides(ciclo, overrides) {
        const all = this._loadAll();
        all[ciclo] = {
            overrides,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        this._data = all;
    }

    static loadOverrides(ciclo) {
        const all = this._loadAll();
        return all[ciclo]?.overrides || {};
    }

    static _loadAll() {
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
     * Apply a user override to a specific cell.
     */
    static applyOverride(ciclo, key, field, value) {
        const overrides = this.loadOverrides(ciclo);
        if (!overrides[key]) overrides[key] = {};
        overrides[key][field] = value;
        this.saveOverrides(ciclo, overrides);
    }

    /**
     * Save overrides to server for persistence.
     */
    static async saveToServer(ciclo, overrides) {
        this.saveOverrides(ciclo, overrides);
        try {
            const response = await fetch('/api/save-budget-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: `proyeccion_jornal_${ciclo}.json`,
                    data: { overrides, savedAt: new Date().toISOString() }
                })
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('[ProyeccionJornal] Error saving to server:', error);
            return false;
        }
    }

    /**
     * Load overrides from server.
     */
    static async loadFromServer(ciclo) {
        try {
            const response = await fetch(`/Fuentes/Presupuestos/proyeccion_jornal_${ciclo}.json`);
            if (!response.ok) return null;
            const data = await response.json();
            if (data?.overrides) {
                this.saveOverrides(ciclo, data.overrides);
            }
            return data?.overrides || {};
        } catch (e) {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════

    static exportToCSV(matrix, ciclo) {
        let csv = `PROYECCIÓN JORNAL ESPECÍFICO — CICLO ${ciclo}\n\n`;
        csv += 'Finca;Predio;Cuartel;Ha;Plantas;Variedad;Labor;Rend. Proy.;Jorn. Proy.;Rend. Real;Jorn. Reales;Desvío %;Rend. Sugerido;Jorn. Sugeridos;Fecha Inicio;Fecha Fin;Fuente\n';

        matrix.forEach(p => {
            csv += `${p.finca};${p.predio};${p.cuartel};${p.hectareas};${p.plantas};${p.variedad};`;
            csv += `${p.laborNombre};${p.rendimientoProyectado};${p.jornalesProyectados};`;
            csv += `${p.rendimientoReal || '-'};${p.jornalesReales || '-'};`;
            csv += `${p.desvioJornales != null ? p.desvioJornales.toFixed(1) + '%' : '-'};`;
            csv += `${p.rendimientoSugerido || '-'};${p.jornalesSugeridos || '-'};`;
            csv += `${p.fechaInicio || '-'};${p.fechaFin || '-'};${p.fuente}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Proyeccion_Jornal_${ciclo}.csv`;
        link.click();
    }
}
