/**
 * ═══════════════════════════════════════════════════════════
 * NATURALFOOD - Sofia API Model
 * Handles JSON data from Sofia Platform (Jornales & Cosecha)
 * ═══════════════════════════════════════════════════════════
 */

export class SofiaApiModel {
    static DATA_JORNALES = [];
    static DATA_COSECHA = [];

    /**
     * Extracts Hectares and Plants from Sofia's cuartel string
     * e.g. "21 - Ha:2.200, Pl:3584" -> { ha: 2.2, pl: 3584 }
     */
    static parseCuartelInfo(cuartelStr) {
        if (!cuartelStr) return { ha: 0, pl: 0, code: '?', predio: '', variedad: '' };

        const parts = cuartelStr.split('-').map(p => p.trim());
        const code = parts[0] || '?';
        const predio = parts[1] || '';
        const variedad = parts[2] && !parts[2].includes('Ha:') ? parts[2] : '';

        const haMatch = cuartelStr.match(/Ha:([\d.]+)/);
        const plMatch = cuartelStr.match(/Pl:([\d.,]+)/);

        let ha = 0;
        if (haMatch) {
            let val = haMatch[1];
            // Sofia's Cuartel string often contains hectares like "2.200" (meaning 2.2) 
            // or "144.830" (meaning 144.83).
            // If we have a dot and no comma, it's ALMOST CERTAINLY a decimal.
            if (!val.includes(',') && val.includes('.')) {
                // If there's exactly one dot, treat it as decimal regardless of digits count
                // (parseFloat handles this naturally)
                ha = parseFloat(val) || 0;
            } else if (val.includes(',') && val.includes('.')) {
                // Classic format: 1.234,56 -> remove dot, change comma to dot
                ha = parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
            } else {
                // Only comma: 2,2 -> 2.2
                ha = parseFloat(val.replace(',', '.')) || 0;
            }
            
            // SECURITY CHECK: If resulting HA is suspiciously high (thousands), and originated from a dot-format, 
            // it's likely a misinterpretation of a 3-digit decimal as thousands.
            // But we already handle that in the first condition.
        }

        let pl = 0;
        if (plMatch) {
            // Remove both dots and commas for plant counts
            pl = parseInt(plMatch[1].replace(/[.,]/g, '')) || 0;
        }

        return { code, ha, pl, predio, variedad };
    }

    static API_KEYS = {
        'Fincas Viejas': '12345NC5xQdXAxT6jj8WrPH26krbn2y7sf6tt8mf',
        'El Espejo': '123450S8fgNhWDfKUNxnzFr7xb6DK1us2OqJK2'
    };

    static BASE_URL = '/sofia-api/trabajvsfaenas';

    static getCycleRanges(ciclo) {
        // Ciclo Agrícola: 1 Mayo -> 30 Abril
        const [startYear] = ciclo.split('-').map(Number);
        const ranges = [];

        let current = new Date(startYear, 4, 1); // May 1st
        const end = new Date();
        const cycleEnd = new Date(startYear + 1, 3, 30); // Apr 30th Next Year
        const limit = end < cycleEnd ? end : cycleEnd;

        while (current <= limit) {
            const rangeStart = current.toISOString().split('T')[0];
            const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0); // Last day of month
            const rangeEnd = nextMonth.toISOString().split('T')[0];

            ranges.push({ desde: rangeStart, hasta: rangeEnd });

            current = new Date(current.getFullYear(), current.getMonth() + 1, 1); // Next month 1st
        }
        return ranges;
    }

    /**
     * Universal fetcher from Sofia API
     */
    static async fetchFromSofia(finca, desde, hasta) {
        const key = this.API_KEYS[finca];
        if (!key) return [];

        const url = `${this.BASE_URL}?nombre_usuario=NATURALFOOD&key_usuario=${key}&fecha_inicial=${desde}&fecha_final=${hasta}`;

        try {
            console.log(`[Sofia API] Fetching: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`[Sofia API] Error: ${response.status} ${response.statusText}`);
                return [];
            }
            const data = await response.json();
            console.log(`[Sofia API] Received ${Array.isArray(data) ? data.length : 0} records for ${finca}`);
            return Array.isArray(data) ? data.map(r => ({ ...r, finca })) : [];
        } catch (e) {
            console.error(`[Sofia API] Exception fetching Sofia for ${finca}:`, e);
            return [];
        }
    }

    /**
     * Connects to the Sofia API and fetches ALL data for a cycle
     */
    /**
     * Connects to the Sofia API and fetches ALL data for a cycle
     * Implements caching to avoid redundant network requests.
     */
    static _cyclesCache = new Map();
    static _dbPromise = null;
    static _csvData = null;
    static _csvAuxiliaresData = null;

    // ── ALL CYCLES: desde CSV histórico hasta API actual ──
    static ALL_CYCLES = [
        '2012-2013', '2013-2014', '2014-2015', '2015-2016',
        '2016-2017', '2017-2018', '2018-2019', '2019-2020',
        '2020-2021', '2021-2022', '2022-2023', '2023-2024',
        '2024-2025', '2025-2026'
    ];

    // Ciclos que están cubiertos por la API de Sofía (solo el ciclo actual en curso)
    static API_CYCLES = ['2025-2026'];

    static async loadCSVAuxiliares() {
        if (this._csvAuxiliaresData) return this._csvAuxiliaresData;

        const results = [];
        const files = [
            { path: '/Fuentes/Auxiliares/EE_aplicacion.csv', finca: 'El Espejo', type: 'aplicacion' },
            { path: '/Fuentes/Auxiliares/FV_aplicacion.csv', finca: 'Fincas Viejas', type: 'aplicacion' },
            { path: '/Fuentes/Auxiliares/pasaHumeda_EE.csv', finca: 'El Espejo', type: 'pasa_humeda' }
        ];

        for (const file of files) {
            try {
                const response = await fetch(file.path);
                if (!response.ok) continue;

                const buffer = await response.arrayBuffer();
                const text = new TextDecoder('iso-8859-1').decode(buffer);
                const lines = text.split(/\r?\n/).filter(l => l.trim());
                if (lines.length < 2) continue;

                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(';').map(c => c.replace(/^"|"$/g, '').trim());
                    
                    if (file.type === 'pasa_humeda') {
                        if (cols.length < 10) continue;
                        
                        let fechaStr = cols[2];
                        if (!fechaStr) continue;
                        fechaStr = fechaStr.replace(/\//g, '-');
                        const parts = fechaStr.split('-');
                        if (parts.length !== 3) continue;
                        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                        const m = parts[1].padStart(2, '0');
                        const d = parts[0].padStart(2, '0');
                        const fecha = `${y}-${m}-${d}`;

                        const qty = parseFloat((cols[9] || '0').replace(/\./g, '').replace(',', '.')) || 0;
                        const jornadas = parseFloat((cols[18] || '0').replace(',', '.')) || 0;
                        
                        // Extract sector name (e.g. "001")
                        const cuartelParts = cols[4].split('-');
                        const sectorCode = cuartelParts[0].trim();
                        const nombre = `Sector ${sectorCode}`;

                        results.push({
                            finca: file.finca,
                            fecha: fecha,
                            clasifica: cols[3], // "Pasa Húmeda"
                            cuartel: cols[4],
                            nombre: nombre,
                            variedad: cols[5] || '',
                            labor: cols[7],
                            jornada: jornadas,
                            rendimiento: qty,
                            persona: cols[17] || '',
                            valor_total_jornada: 0,
                            origen_archivo: 'CSV Pasa Humeda',
                            isPasaHumeda: true
                        });
                    } else {
                        if (cols.length < 13) continue;

                        let fechaStr = cols[2];
                        if (!fechaStr) continue;
                        fechaStr = fechaStr.replace(/\//g, '-');
                        const parts = fechaStr.split('-');
                        if (parts.length !== 3) continue;
                        const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                        const m = parts[1].padStart(2, '0');
                        const d = parts[0].padStart(2, '0');
                        const fecha = `${y}-${m}-${d}`;

                        let jVal = parseFloat((cols[12] || '0').replace(',', '.')) || 0;
                        if (jVal === 0) jVal = 1;

                        // Also extract sector name for applications if needed (not strictly for harvest but better consistency)
                        const cuartelParts = cols[5].split('-');
                        const sectorCode = cuartelParts[0].trim();
                        const nombre = sectorCode.includes('Playa') ? sectorCode : `Sector ${sectorCode}`;

                        results.push({
                            finca: file.finca,
                            fecha: fecha,
                            clasifica: cols[3],
                            cuartel: cols[5],
                            nombre: nombre,
                            variedad: cols[7],
                            labor: cols[9],
                            jornada: jVal,
                            rendimiento: 0,
                            persona: cols[13] || cols[14] || cols[15] || '',
                            valor_total_jornada: parseFloat((cols[10] || '0').replace('$', '').replace(/\./g, '').replace(',', '.')) || 0,
                            origen_archivo: 'CSV Auxiliar'
                        });
                    }
                }
            } catch (e) {
                console.warn(`[Auxiliares] Error al cargar ${file.path}:`, e);
            }
        }

        this._csvAuxiliaresData = results;
        return results;
    }

    /**
     * Carga y parsea el archivo CSV histórico Cosecha 13-25.csv
     * Retorna un objeto agrupado por ciclo, ej: { '2012-2013': [{finca, cuartel, variedad, has, kg}, ...] }
     */
    static async loadCSVHistorico() {
        if (this._csvData) return this._csvData;

        try {
            const response = await fetch('/Fuentes/secadero/Cosecha 12-25.csv');
            if (!response.ok) throw new Error('CSV not found');

            const buffer = await response.arrayBuffer();
            // Decodificar como latin1 (iso-8859-1) para los acentos
            const text = new TextDecoder('iso-8859-1').decode(buffer);

            const lines = text.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) throw new Error('CSV vacío');

            // Header: Finca;Predio;Cuartel;Variedad;Has;Año;Ciclo;Kg;Estado;Referencia
            const header = lines[0].split(';').map(h => h.trim());
            const idxFinca = header.indexOf('Finca');
            const idxPredio = header.indexOf('Predio');
            const idxCuartel = header.indexOf('Cuartel');
            const idxVariedad = header.indexOf('Variedad');
            const idxHas = header.indexOf('Has');
            const idxCiclo = header.indexOf('Ciclo');
            const idxKg = header.indexOf('Kg');
            const idxAno = header.indexOf('Año');

            const grouped = {};

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(';');
                if (cols.length < 7) continue;

                let ciclo = (cols[idxCiclo] || '').trim();
                const ano = idxAno >= 0 ? (cols[idxAno] || '').trim() : '';
                let isEstimado = false;

                // Detectar filas BP2026 (presupuesto/estimado)
                if ((!ciclo || !ciclo.includes('-')) && ano.toUpperCase().includes('BP')) {
                    ciclo = '2025-2026';
                    isEstimado = true;
                }

                if (!ciclo || !ciclo.includes('-')) continue;

                const kgStr = (cols[idxKg] || '0').replace(/\./g, '').replace(',', '.').trim();
                const kg = parseFloat(kgStr) || 0;
                const hasStr = (cols[idxHas] || '0').replace(',', '.').trim();
                const has = parseFloat(hasStr) || 0;

                // Agrupar BP separadamente como 'BP-2025-2026'
                const groupKey = isEstimado ? 'BP-2025-2026' : ciclo;

                if (!grouped[groupKey]) grouped[groupKey] = [];
                grouped[groupKey].push({
                    finca: (cols[idxFinca] || '').trim(),
                    predio: idxPredio >= 0 ? (cols[idxPredio] || '').trim() : (cols[idxFinca] || '').trim(),
                    cuartel: (cols[idxCuartel] || '').trim(),
                    variedad: (cols[idxVariedad] || '').trim(),
                    has,
                    kg,
                    isEstimado
                });
            }

            this._csvData = grouped;
            console.log('[CSV Histórico] Cargados ciclos:', Object.keys(grouped).join(', '));
            return grouped;
        } catch (e) {
            console.warn('[CSV Histórico] Error cargando CSV:', e);
            this._csvData = {};
            return {};
        }
    }

    /**
     * Obtiene los kg totales agrupados por finca desde el CSV para un ciclo dado
     */
    static getCSVCycleTotalsByFinca(csvData, ciclo) {
        const rows = csvData[ciclo] || [];
        const byFinca = {};
        rows.forEach(r => {
            if (!byFinca[r.finca]) byFinca[r.finca] = 0;
            byFinca[r.finca] += r.kg;
        });
        return byFinca;
    }

    static getDB() {
        if (!this._dbPromise) {
            this._dbPromise = new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    reject(new Error("IndexedDB no está soportado en este navegador"));
                    return;
                }
                const request = window.indexedDB.open('NaturalFoodDB', 1);
                request.onerror = event => {
                    console.warn("Error abriendo IndexedDB", event);
                    reject(event.target.error);
                };
                request.onupgradeneeded = event => {
                    const db = event.target.result;
                    // Creamos el ObjectStore general: conceptualmente almacena nuestras "tablas" de ciclos históricos
                    if (!db.objectStoreNames.contains('cyclesDatos')) {
                        db.createObjectStore('cyclesDatos');
                    }
                };
                request.onsuccess = event => resolve(event.target.result);
            });
        }
        return this._dbPromise;
    }

    static async getLocalCycle(ciclo) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['cyclesDatos'], 'readonly');
                const store = tx.objectStore('cyclesDatos');
                const request = store.get(ciclo);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn("IndexedDB read error:", e);
            return null;
        }
    }

    static async saveLocalCycle(ciclo, data) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(['cyclesDatos'], 'readwrite');
                const store = tx.objectStore('cyclesDatos');
                const request = store.put(data, ciclo);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.warn("IndexedDB write error:", e);
        }
    }

    static getCurrentCycle() {
        const now = new Date();
        const year = now.getFullYear();
        // Ciclo Agrícola en Sofía: 1 de Mayo al 30 de Abril
        if (now.getMonth() < 4) { // Menor a Mayo (0-3)
            return `${year - 1}-${year}`;
        }
        return `${year}-${year + 1}`;
    }

    static async fetchCycleData(ciclo, forceRefresh = false) {
        // 1. Omitir red si ya está en Memoria RAM
        if (this._cyclesCache.has(ciclo) && !forceRefresh) {
            return this._cyclesCache.get(ciclo);
        }

        const activeCycle = this.getCurrentCycle();
        const isManualHistorical = localStorage.getItem(`manualHistory_${ciclo}`) === 'true';
        const isHistorical = (ciclo !== activeCycle) || isManualHistorical;

        // 2. Intentar backend oficial histórico de PostgreSQL (solo si es histórico o forzamos)
        // Prioridad: Si NO es el ciclo activo o si fue archivado manualmente, buscamos en DB.
        if (isHistorical && !forceRefresh) {
            try {
                const histRes = await fetch(`/api/historical-data/${ciclo}`);
                if (histRes.ok) {
                    const json = await histRes.json();
                    if (json.success && json.data.length > 0) {
                        const mappedData = json.data.map(row => {
                            let parsed = row.raw_data;
                            if (typeof parsed === 'string') parsed = JSON.parse(parsed);

                            return {
                                ...parsed,
                                finca: row.finca,
                                fecha: row.fecha || `${ciclo.split('-')[1]}-02-15`, // Ficticia compatible
                                labor: row.labor,
                                labor_normalized: row.labor,
                                cuartel: row.cuartel,
                                persona: row.persona,
                                rendimiento_val: parseFloat(row.rendimiento) || 0,
                                totalJornadas: parseFloat(row.total_jornadas) || 0,
                                costo_ars: parseFloat(row.costo_ars) || 0,
                                hectareas: parseFloat(row.hectareas) || 0,
                                clasifica: row.clasifica,
                                variedad: row.variedad,
                                isCosecha: row.is_cosecha,
                                origen_archivo: row.origen_archivo,
                                ciclo: ciclo
                            };
                        });
                        console.log(`[PostgreSQL DB] Cargado ciclo histórico completo ${ciclo}.`);
                        this._cyclesCache.set(ciclo, mappedData);
                        
                        await this.saveLocalCycle(ciclo, mappedData);
                        return mappedData;
                    }
                }
            } catch (e) {
                console.warn(`Error obteniendo ciclo histórico en PostgreSQL:`, e);
            }

            // Fallback a IndexedDB Local
            const localData = await this.getLocalCycle(ciclo);
            if (localData && localData.length > 0) {
                console.log(`[Base de Datos] Cargado el ciclo histórico ${ciclo} de la tabla local.`);
                this._cyclesCache.set(ciclo, localData);
                return localData;
            }
        }

        console.log(`[API] Obteniendo datos de las APIs del sistema Sofía para el periodo ${ciclo}...`);
        const ranges = this.getCycleRanges(ciclo);
        let allJornales = []; // Consolidate results here

        const fincas = Object.keys(this.API_KEYS);

        // Fetch all ranges
        for (const finca of fincas) {
            for (const range of ranges) {
                try {
                    const results = await this.fetchFromSofia(finca, range.desde, range.hasta);
                    if (Array.isArray(results)) {
                        allJornales = allJornales.concat(results);
                    }
                } catch (e) {
                    console.error(`Error fetching ${finca} ${range.desde}:`, e);
                }
            }
        }

        // --- Include Auxiliares Data ---
        try {
            const auxiliares = await this.loadCSVAuxiliares();
            const filteredAux = auxiliares.filter(row => {
                return ranges.some(r => row.fecha >= r.desde && row.fecha <= r.hasta);
            });
            allJornales = allJornales.concat(filteredAux);
        } catch (e) {
            console.warn('Error loading auxiliares in fetchCycleData:', e);
        }

        // Deduplicate records (using composite signature)
        // This is necessary because API calls with overlapping ranges or multiple calls for same cycle can return duplicate data
        const uniqueRecords = new Map();
        allJornales.forEach(r => {
            const signature = `${r.finca}-${r.fecha}-${r.labor || ''}-${r.cuartel || ''}-${r.persona || ''}-${r.rendimiento || 0}-${r.jornada || 0}`;
            if (!uniqueRecords.has(signature)) {
                uniqueRecords.set(signature, r);
            }
        });

        const cycleStartYear = parseInt(ciclo.split('-')[0]);

        // Add normalized fields and clean up previous cycle's "Levantado" tails
        const processedData = Array.from(uniqueRecords.values()).map(r => {
            const rendition = parseFloat(r.rendimiento) || 0;
            // User sample shows "jornada" as the field name for jornadas
            const jornadas = parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0;
            const costo = parseFloat(r.valor_total_jornada) || 0;
            
            // Refined Harvest detection: either by name or by Sofia's type code 'C'
            const laborLower = (r.labor || '').toLowerCase();
            const isCosecha = laborLower.includes('cosecha') || r.id_tipo_faena === 'C' || r.tipo_faena === 'Cosecha';

            // Extract Ha for this record from cuartel string
            const info = this.parseCuartelInfo(r.cuartel);

            return {
                ...r,
                ciclo,
                rendimiento_val: rendition,
                totalJornadas: jornadas,
                costo_ars: costo,
                hectareas: info.ha,
                clasifica: r.clasifica || r.clasificacion || r.Clasificacion || r.Clasifica || info.predio,
                variedad: r.variedad || r.variedades || r.Variedad || r.Variedades || info.variedad,
                isCosecha,
                labor_normalized: (r.finca === 'El Espejo' && (r.labor === 'Poda' || r.labor === 'Poda dov')) ? 'Poda' : r.labor,
                fecha: (() => {
                    let d = r.fecha || r.Fecha || r.date || r.Date;
                    if (d && typeof d === 'string' && d.includes('-') && d.split('-')[0].length === 2) {
                        const p = d.split('-');
                        return `${p[2]}-${p[1]}-${p[0]}`;
                    }
                    return d;
                })()
            };
        }).filter(r => {
            // EXCLUSION RULE:
            // If the labor is 'cosecha' or 'levantado' and it happens in May/June of the START year,
            // it's actually the tail from the PREVIOUS cycle. We exclude it so it doesn't inflate this cycle.
            // But we keep 'Poda' or other labres so the hectares of those cuarteles get counted correctly.
            const laborStr = r.labor ? r.labor.toLowerCase() : '';
            const isHarvestOrLevantado = laborStr.includes('cosecha') || laborStr.includes('levantado');

            if (isHarvestOrLevantado && r.fecha) {
                const dateObj = new Date(r.fecha);
                const yr = dateObj.getFullYear();
                const mo = dateObj.getMonth(); // 0-indexed (4=May, 5=Jun)
                if (yr === cycleStartYear && (mo === 4 || mo === 5)) {
                    return false;
                }
            }
            return true;
        });

        // Store in Cache
        this._cyclesCache.set(ciclo, processedData);

        // Si es histórico, se almacena de forma definitiva en la Base de Datos Local
        if (isHistorical) {
            console.log(`[Base de Datos] Anexando el periodo histórico a la tabla del ciclo ${ciclo}`);
            await this.saveLocalCycle(ciclo, processedData);
        }

        return processedData;
    }

    /**
     * Interface for Jornales (using cached cycle data or fetching)
     */
    static async fetchJornales(filters = {}) {
        const ciclo = filters.ciclo || '2025-2026';
        this.DATA_JORNALES = await this.fetchCycleData(ciclo);
        return this.applyFilters(this.DATA_JORNALES, filters);
    }

    /**
     * Interface for Cosecha
     */
    static async fetchCosecha(filters = {}) {
        const ciclo = filters.ciclo || '2025-2026';

        const cycleData = await this.fetchCycleData(ciclo);

        // Filter only harvest tasks
        this.DATA_COSECHA = cycleData.filter(r => r.isCosecha);
        return this.applyFilters(this.DATA_COSECHA, filters);
    }

    static applyFilters(data, filters) {
        return data.filter(r => {
            if (filters.finca && r.finca !== filters.finca) return false;
            if (filters.predio && r.clasifica !== filters.predio) return false;
            if (filters.variedad && r.variedad !== filters.variedad) return false;
            if (filters.desde && new Date(r.fecha) < new Date(filters.desde)) return false;
            if (filters.hasta && new Date(r.fecha) > new Date(filters.hasta)) return false;

            if (filters.origen) {
                const PROPIA_KEYWORDS = ['Camino Truncado', 'EEI', 'EEII', 'EEIII', 'La Chimbera', 'Puente Alto'];
                const clasif = (r.clasifica || '').toUpperCase();
                const isPropia = PROPIA_KEYWORDS.some(k => clasif.includes(k.toUpperCase()));

                if (filters.origen === 'propia' && !isPropia) return false;
                if (filters.origen === 'terceros' && isPropia) return false;
            }

            return true;
        });
    }

    /**
     * Groups Jornales by Labor and calculates Ha stats
     */
    static getJornalesStats(data) {
        const stats = {};
        data.forEach(r => {
            const lab = r.labor_normalized || r.labor;
            if (!stats[lab]) {
                stats[lab] = {
                    labor: lab,
                    totalJornadas: 0,
                    totalCosto: 0,
                    totalHa: 0,
                    cuarteles: new Set()
                };
            }
            stats[lab].totalJornadas += r.totalJornadas;
            stats[lab].totalCosto += r.costo_ars;

            if (!stats[lab].cuarteles.has(r.cuartel)) {
                stats[lab].cuarteles.add(r.cuartel);
                // Skip "Gral" cuarteles from El Espejo for hectares count
                const isGralEspejo = r.finca === 'El Espejo' && r.cuartel && r.cuartel.toLowerCase().includes('gral');
                if (!isGralEspejo) {
                    stats[lab].totalHa += r.hectareas;
                }
            }
        });
        return Object.values(stats).sort((a, b) => b.totalJornadas - a.totalJornadas);
    }

    /**
     * Helper to estimate USD rate based on cycle
     * Uses approximate market rates for simplicity
     */
    static getApproximateUsdRate(cycle) {
        switch (cycle) {
            case '2021-2022': return 210; // Avg Blue 2021-22
            case '2022-2023': return 390; // Avg Blue 2022-23
            case '2023-2024': return 850; // Avg Blue 2023-24 (Devaluation)
            case '2024-2025': return 1150; // Avg Blue 2024-25
            case '2025-2026': return 1250; // Current/Projected
            default: return 1250;
        }
    }

    /**
     * Calculates Efficiency (Jornales/Ha) grouped by Finca and Predio
     * Also calculates Average Cost per Jornal (ARS & estimated USD)
     */
    static getEfficiencyStats(data) {
        // Configuration: Mapping Predio Keywords to (Group, DisplayName)
        const PREDIO_CONFIG = [
            { keyword: 'Camino Truncado', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'La Chimbera', group: 'Fincas Viejas', name: 'La Chimbera' },
            { keyword: 'Puente Alto', group: 'Fincas Viejas', name: 'Puente Alto' },
            { keyword: 'EEIII', group: 'El Espejo', name: 'El Espejo 3' },
            { keyword: 'EEII', group: 'El Espejo', name: 'El Espejo 2' },
            { keyword: 'EEI', group: 'El Espejo', name: 'El Espejo 1' }
        ];

        const uniqueCuarteles = new Map(); // Key: CuartelCode, Value: { ha, predioDisplayName }
        const groupStats = {
            'Fincas Viejas': { jornales: 0, area: 0, costoArs: 0, name: 'Fincas Viejas' },
            'El Espejo': { jornales: 0, area: 0, costoArs: 0, name: 'El Espejo' }
        };
        const predioStats = {};

        // Determine cycle from first record or default
        const currentCycle = data.length > 0 ? (data[0].ciclo || '2025-2026') : '2025-2026';
        const usdRate = this.getApproximateUsdRate(currentCycle);

        data.forEach(r => {
            const rawPredio = r.clasifica || '';
            const costo = r.costo_ars || 0;
            const jornales = r.totalJornadas || 0;

            // 1. Identify if this record belongs to a tracked Predio
            const config = PREDIO_CONFIG.find(c => rawPredio.includes(c.keyword));
            if (!config) return; // Skip if not in our whitelist

            const predioName = config.name;
            const groupName = config.group;

            // 2. Track Unique Physical Area (Denominator)
            // Use Cuartel as unique identifier for area
            if (r.cuartel && !uniqueCuarteles.has(r.cuartel)) {
                const info = this.parseCuartelInfo(r.cuartel);
                uniqueCuarteles.set(r.cuartel, { ha: info.ha, predio: predioName });

                // Skip "Gral" (General) or aggregate cuarteles for area calculation 
                // typically used for overhead/administration tasks in Sofia
                const isGeneral = r.cuartel.toLowerCase().includes('gral');
                if (!isGeneral) {
                    // Add to Aggregates
                    if (groupStats[groupName]) groupStats[groupName].area += info.ha;

                    if (!predioStats[predioName]) predioStats[predioName] = { jornales: 0, area: 0, costoArs: 0, name: predioName, group: groupName };
                    predioStats[predioName].area += info.ha;
                }
            }

            // 3. Sum Jornales and Cost (Numerator)
            if (groupStats[groupName]) {
                groupStats[groupName].jornales += jornales;
                groupStats[groupName].costoArs += costo;
            }

            if (!predioStats[predioName]) predioStats[predioName] = { jornales: 0, area: 0, costoArs: 0, name: predioName, group: groupName };
            predioStats[predioName].jornales += jornales;
            predioStats[predioName].costoArs += costo;
        });

        // Compute Ratios and Averages
        const compute = (obj) => ({
            ...obj,
            costoUsd: obj.costoArs / usdRate,
            efficiency: obj.area > 0 ? obj.jornales / obj.area : 0,
            avgCostArs: obj.jornales > 0 ? obj.costoArs / obj.jornales : 0,
            avgCostUsd: obj.jornales > 0 ? (obj.costoArs / obj.jornales) / usdRate : 0
        });

        return {
            groups: Object.values(groupStats).map(compute),
            predios: Object.values(predioStats).map(compute).sort((a, b) => b.efficiency - a.efficiency)
        };
    }

    /**
     * Extracts Hectares per Predio (Clasificación) grouped by Finca.
     * Uses unique cuarteles to avoid double-counting area.
     * Returns: { groups: [ { name, predios: [{ name, hectareas, cuarteles, plantas }], totalHa, totalCuarteles, totalPlantas } ], grandTotalHa, grandTotalCuarteles, grandTotalPlantas }
     */
    static getHectareasPorPredio(data) {
        const PREDIO_CONFIG = [
            { keyword: 'Camino Truncado', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'La Chimbera', group: 'Fincas Viejas', name: 'La Chimbera' },
            { keyword: 'Puente Alto', group: 'Fincas Viejas', name: 'Puente Alto' },
            { keyword: 'EEIII', group: 'El Espejo', name: 'El Espejo 3' },
            { keyword: 'EEII', group: 'El Espejo', name: 'El Espejo 2' },
            { keyword: 'EEI', group: 'El Espejo', name: 'El Espejo 1' }
        ];

        const uniqueCuarteles = new Set();
        const predioMap = {};  // predioName -> { ha, cuarteles, plantas, group }

        data.forEach(r => {
            const rawPredio = r.clasifica || '';
            const config = PREDIO_CONFIG.find(c => rawPredio.includes(c.keyword));
            if (!config) return;

            if (r.cuartel && !uniqueCuarteles.has(r.cuartel)) {
                uniqueCuarteles.add(r.cuartel);

                // Skip "Gral" (General) or aggregate cuarteles — they are overhead, not physical area
                const isGeneral = r.cuartel.toLowerCase().includes('gral');
                if (isGeneral) return;

                const info = this.parseCuartelInfo(r.cuartel);

                if (!predioMap[config.name]) {
                    predioMap[config.name] = { name: config.name, group: config.group, hectareas: 0, cuarteles: 0, plantas: 0, cuartelesList: [] };
                }
                const ha = info.ha || r.hectareas;
                predioMap[config.name].hectareas += ha;
                predioMap[config.name].cuarteles += 1;
                predioMap[config.name].plantas += info.pl;
                predioMap[config.name].cuartelesList.push({
                    numero: info.code || info.numero,
                    ha,
                    pl: info.pl,
                    variedad: info.variedad
                });
            }
        });

        // Group by finca
        const groupOrder = ['El Espejo', 'Fincas Viejas'];
        const groups = groupOrder.map(groupName => {
            const predios = Object.values(predioMap)
                .filter(p => p.group === groupName)
                .sort((a, b) => a.name.localeCompare(b.name));

            predios.forEach(p => {
                if (p.cuartelesList) {
                    p.cuartelesList.sort((a, b) => {
                        const numA = parseInt(a.numero.match(/\d+/)) || 0;
                        const numB = parseInt(b.numero.match(/\d+/)) || 0;
                        if (numA !== numB) return numA - numB;
                        return a.numero.localeCompare(b.numero);
                    });
                }
            });

            return {
                name: groupName,
                predios,
                totalHa: predios.reduce((s, p) => s + p.hectareas, 0),
                totalCuarteles: predios.reduce((s, p) => s + p.cuarteles, 0),
                totalPlantas: predios.reduce((s, p) => s + p.plantas, 0)
            };
        });

        return {
            groups,
            grandTotalHa: groups.reduce((s, g) => s + g.totalHa, 0),
            grandTotalCuarteles: groups.reduce((s, g) => s + g.totalCuarteles, 0),
            grandTotalPlantas: groups.reduce((s, g) => s + g.totalPlantas, 0)
        };
    }

    /**
     * Calculates detailed Yield statistics for the dashboard
     */
    static getCosechaDashboardStats(data) {
        let totalKilos = 0;
        let totalHa = 0;
        const fincas = {};
        const predios = {};
        const cuarteles = {};
        const variedades = {};

        data.forEach(r => {
            const kilos = r.rendimiento_val || 0;
            totalKilos += kilos;

            // Fincas
            if (!fincas[r.finca]) fincas[r.finca] = 0;
            fincas[r.finca] += kilos;

            // Predios
            const predioKey = r.clasifica || 'Sin Clasificar';
            if (!predios[predioKey]) predios[predioKey] = 0;
            predios[predioKey] += kilos;

            // Cuarteles
            if (!cuarteles[r.cuartel]) {
                cuarteles[r.cuartel] = 0;
                const isGralEspejo = r.finca === 'El Espejo' && r.cuartel && r.cuartel.toLowerCase().includes('gral');
                if (!isGralEspejo) {
                    const info = this.parseCuartelInfo(r.cuartel);
                    totalHa += info.ha;
                }
            }
            cuarteles[r.cuartel] += kilos;

            // Variedades
            if (!variedades[r.variedad]) variedades[r.variedad] = 0;
            variedades[r.variedad] += kilos;
        });

        const PROPIA_KEYWORDS = ['Camino Truncado', 'EEI', 'EEII', 'EEIII', 'La Chimbera', 'Puente Alto'];
        const origen = { propia: 0, terceros: 0, propiaHa: 0, promedioPropia: 0 };
        const cuartelesPropios = new Set();

        data.forEach(r => {
            const kilos = r.rendimiento_val || 0;
            const clasif = (r.clasifica || '').toUpperCase();

            const isPropia = PROPIA_KEYWORDS.some(k => clasif.includes(k.toUpperCase()));
            if (isPropia) {
                origen.propia += kilos;
                if (r.cuartel && !cuartelesPropios.has(r.cuartel)) {
                    cuartelesPropios.add(r.cuartel);
                    const isGralEspejo = r.finca === 'El Espejo' && r.cuartel.toLowerCase().includes('gral');
                    if (!isGralEspejo) {
                        const info = SofiaApiModel.parseCuartelInfo(r.cuartel);
                        origen.propiaHa += info.ha;
                    }
                }
            } else {
                origen.terceros += kilos;
            }
        });

        origen.promedioPropia = origen.propiaHa > 0 ? (origen.propia / origen.propiaHa) : 0;

        const sortObj = (obj) => Object.entries(obj)
            .map(([name, kg]) => ({ name, kg }))
            .sort((a, b) => b.kg - a.kg);

        return {
            totalKilos,
            rendimientoPromedio: totalHa > 0 ? totalKilos / totalHa : 0,
            cuartelesCosechados: Object.keys(cuarteles).length,
            totalVariedades: Object.keys(variedades).length,
            fincas: sortObj(fincas),
            predios: sortObj(predios),
            cuarteles: sortObj(cuarteles),
            variedades: sortObj(variedades),
            origen
        };
    }

    /**
     * Calculates Yield (Kg/Ha) per Predio for chart visualization
     */
    static getRendimientoPredioStats(data) {
        const predioMap = {}; // name -> { kg: 0, ha: 0, cuarteles: Set }

        data.forEach(r => {
            const predioName = r.clasifica || 'Sin Clasificar';
            if (!predioMap[predioName]) {
                predioMap[predioName] = { kg: 0, ha: 0, cuarteles: new Set() };
            }

            // 1. Sum Kilos only if it's a harvest record
            if (r.isCosecha) {
                predioMap[predioName].kg += r.rendimiento_val || 0;
            }

            // 2. Track Hectares once per Cuartel to get the TOTAL area of the predio
            if (r.cuartel && !predioMap[predioName].cuarteles.has(r.cuartel)) {
                predioMap[predioName].cuarteles.add(r.cuartel);

                // Skip Gral area for El Espejo
                const isGralEspejo = r.finca === 'El Espejo' && r.cuartel.toLowerCase().includes('gral');
                if (!isGralEspejo) {
                    const info = this.parseCuartelInfo(r.cuartel);
                    predioMap[predioName].ha += info.ha;
                }
            }
        });

        const stats = Object.entries(predioMap)
            .map(([name, s]) => ({
                name,
                kg: s.kg,
                ha: s.ha,
                rendimiento: s.ha > 0 ? (s.kg / s.ha) : 0
            }))
            .filter(s => s.rendimiento > 0) // Only show predios with yield
            .sort((a, b) => b.rendimiento - a.rendimiento);

        const colors = [
            'rgba(34, 197, 94, 0.6)',  // Green
            'rgba(59, 130, 246, 0.6)',  // Blue
            'rgba(168, 85, 247, 0.6)', // Purple
            'rgba(245, 158, 11, 0.6)',  // Amber
            'rgba(239, 68, 68, 0.6)',   // Red
            'rgba(6, 182, 212, 0.6)',   // Cyan
            'rgba(244, 63, 94, 0.6)',   // Rose
            'rgba(139, 92, 246, 0.6)'   // Violet
        ];

        return {
            labels: stats.map(s => s.name),
            datasets: [{
                label: 'Rendimiento (Kg/Ha)',
                data: stats.map(s => Math.round(s.rendimiento)),
                backgroundColor: colors.slice(0, stats.length),
                borderColor: colors.map(c => c.replace('0.6', '1')).slice(0, stats.length),
                borderWidth: 1,
                borderRadius: 6
            }]
        };
    }

    /**
     * Gets Cosecha KG (fresh grape) and Levantado (raisin) stats per predio, by pass number (1-5).
     * Requires full cycle data (not just cosecha-filtered data).
     * Returns: { predios: [ { name, group, cosecha: [kg1..kg5], levantado: [kg1..kg5], totalCosecha, totalLevantado } ] }
     */
    static getCosechaLevantadoStats(fullCycleData) {
        const PREDIO_CONFIG = [
            { keyword: 'Camino Truncado', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'La Chimbera', group: 'Fincas Viejas', name: 'La Chimbera' },
            { keyword: 'Puente Alto', group: 'Fincas Viejas', name: 'Puente Alto' },
            { keyword: 'EEIII', group: 'El Espejo', name: 'El Espejo 3' },
            { keyword: 'EEII', group: 'El Espejo', name: 'El Espejo 2' },
            { keyword: 'EEI', group: 'El Espejo', name: 'El Espejo 1' }
        ];

        const predioMap = {};

        fullCycleData.forEach(r => {
            const labor = (r.labor || '').toLowerCase().trim();
            const rawPredio = r.clasifica || '';
            const config = PREDIO_CONFIG.find(c => rawPredio.includes(c.keyword));
            if (!config) return;

            // Detect labor type and pass number
            let type = null;
            let passNum = 0;

            if (labor.includes('cosecha kg')) {
                type = 'cosecha';
                const match = labor.match(/cosecha\s*kg\s*(\d+)/i);
                passNum = match ? parseInt(match[1]) : 1;
            } else if (labor.includes('levantado')) {
                type = 'levantado';
                const match = labor.match(/levantado\s*(\d+)/i);
                passNum = match ? parseInt(match[1]) : 1;
            }

            if (!type || passNum < 1 || passNum > 5) return;

            const kg = r.rendimiento_val || 0;
            const predioName = config.name;

            if (!predioMap[predioName]) {
                predioMap[predioName] = {
                    name: predioName,
                    group: config.group,
                    cosecha: [0, 0, 0, 0, 0],   // pass 1-5
                    levantado: [0, 0, 0, 0, 0],  // pass 1-5
                    totalCosecha: 0,
                    totalLevantado: 0
                };
            }

            const idx = passNum - 1; // 0-indexed
            if (type === 'cosecha') {
                predioMap[predioName].cosecha[idx] += kg;
                predioMap[predioName].totalCosecha += kg;
            } else {
                predioMap[predioName].levantado[idx] += kg;
                predioMap[predioName].totalLevantado += kg;
            }
        });

        // Group by finca
        const groupOrder = ['El Espejo', 'Fincas Viejas'];
        const groups = groupOrder.map(groupName => {
            const predios = Object.values(predioMap)
                .filter(p => p.group === groupName)
                .sort((a, b) => a.name.localeCompare(b.name));

            return {
                name: groupName,
                predios,
                totalCosecha: predios.reduce((s, p) => s + p.totalCosecha, 0),
                totalLevantado: predios.reduce((s, p) => s + p.totalLevantado, 0),
                cosechaPasses: [0, 1, 2, 3, 4].map(i => predios.reduce((s, p) => s + p.cosecha[i], 0)),
                levantadoPasses: [0, 1, 2, 3, 4].map(i => predios.reduce((s, p) => s + p.levantado[i], 0))
            };
        });

        return {
            groups,
            grandTotalCosecha: groups.reduce((s, g) => s + g.totalCosecha, 0),
            grandTotalLevantado: groups.reduce((s, g) => s + g.totalLevantado, 0)
        };
    }

    /**
     * Groups Levantado records by Playa de Secadero (from 'nombre' field).
     * Shows where the raisins are dried, aggregated by playa per predio/finca.
     * Returns: { playas: [ { nombre, finca, predio, kg, jornadas, pasadas: {1: kg, 2: kg, ...} } ], 
     *            byFinca: { fincaName: { totalKg, playas: [...] } },
     *            grandTotalKg }
     */
    static getLevantadoPorPlayaStats(fullCycleData) {
        const PREDIO_CONFIG = [
            { keyword: 'Camino Truncado', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'La Chimbera', group: 'Fincas Viejas', name: 'La Chimbera' },
            { keyword: 'Puente Alto', group: 'Fincas Viejas', name: 'Camino Truncado' },
            { keyword: 'EEIII', group: 'El Espejo', name: 'El Espejo' },
            { keyword: 'EEII', group: 'El Espejo', name: 'El Espejo' },
            { keyword: 'EEI', group: 'El Espejo', name: 'El Espejo' }
        ];

        // Key: "finca|playa", Value: { nombre, finca, predio, kg, kgFresco, jornadas, pasadas, cosechaPasadas }
        const playaMap = {};

        fullCycleData.forEach(r => {
            const labor = (r.labor || '').toLowerCase().trim();
            const isLevantado = labor.includes('levantado');
            const isCosechaKg = labor.includes('cosecha kg');
            if (!isLevantado && !isCosechaKg) return;

            const nombre = (r.nombre || '').trim();
            if (!nombre) return;

            const rawPredio = r.clasifica || '';
            const config = PREDIO_CONFIG.find(c => rawPredio.includes(c.keyword));
            const predioName = config ? config.name : rawPredio;
            const fincaName = r.finca || 'Sin Finca';

            const kg = r.rendimiento_val || 0;
            const jornadas = r.totalJornadas || 0;

            const key = `${fincaName}|${nombre}`;
            if (!playaMap[key]) {
                playaMap[key] = {
                    nombre,
                    finca: fincaName,
                    predio: predioName,
                    kg: 0,
                    kgFresco: 0,
                    kgPasaHumeda: 0,
                    jornadas: 0,
                    jornadasPasaHumeda: 0,
                    pasadas: {},
                    cosechaPasadas: {},
                    pasaHumedaPasadas: {}
                };
            }

            if (isLevantado) {
                // Detect pass number for levantado
                const passMatch = labor.match(/levantado\s*(\d+)/i);
                const passNum = passMatch ? parseInt(passMatch[1]) : 1;

                if (r.isPasaHumeda) {
                    playaMap[key].kgPasaHumeda += kg;
                    playaMap[key].jornadasPasaHumeda += jornadas;
                    if (!playaMap[key].pasaHumedaPasadas[passNum]) {
                        playaMap[key].pasaHumedaPasadas[passNum] = 0;
                    }
                    playaMap[key].pasaHumedaPasadas[passNum] += kg;
                } else {
                    playaMap[key].kg += kg;
                    playaMap[key].jornadas += jornadas;
                    if (!playaMap[key].pasadas[passNum]) {
                        playaMap[key].pasadas[passNum] = 0;
                    }
                    playaMap[key].pasadas[passNum] += kg;
                }
            } else if (isCosechaKg) {
                // Detect pass number for cosecha
                const passMatch = labor.match(/cosecha\s*kg\s*(\d+)/i);
                const passNum = passMatch ? parseInt(passMatch[1]) : 1;

                playaMap[key].kgFresco += kg;
                
                if (!playaMap[key].cosechaPasadas[passNum]) {
                    playaMap[key].cosechaPasadas[passNum] = 0;
                }
                playaMap[key].cosechaPasadas[passNum] += kg;
            }
        });

        const playas = Object.values(playaMap).sort((a, b) => b.kg - a.kg);

        // Group by finca
        const byFinca = {};
        playas.forEach(p => {
            if (!byFinca[p.finca]) {
                byFinca[p.finca] = { totalKg: 0, totalKgFresco: 0, totalKgPasaHumeda: 0, totalJornadas: 0, playas: [] };
            }
            byFinca[p.finca].totalKg += p.kg;
            byFinca[p.finca].totalKgFresco += p.kgFresco;
            byFinca[p.finca].totalKgPasaHumeda += p.kgPasaHumeda;
            byFinca[p.finca].totalJornadas += (p.jornadas + p.jornadasPasaHumeda);
            byFinca[p.finca].playas.push(p);
        });

        const grandTotalKg = playas.reduce((s, p) => s + p.kg, 0);
        const grandTotalKgFresco = playas.reduce((s, p) => s + p.kgFresco, 0);
        const grandTotalKgPasaHumeda = playas.reduce((s, p) => s + p.kgPasaHumeda, 0);

        return {
            playas,
            byFinca,
            grandTotalKg,
            grandTotalKgFresco,
            grandTotalKgPasaHumeda
        };
    }

    /**
     * Gets comparative evolution of "fresco" vs "pasa" (levantado)
     * grouped BY PREDIO, exclusively for the 6 own sub-farms.
     */
    static getCosechaComparativaPorPredio(fullCycleData) {
        const PREDIO_CONFIG = [
            { keyword: 'Camino Truncado', name: 'Camino Truncado' }, 
            { keyword: 'La Chimbera', name: 'La Chimbera' }, 
            { keyword: 'Puente Alto', name: 'Puente Alto' },
            { keyword: 'EEIII', name: 'El Espejo 3' }, 
            { keyword: 'EEII', name: 'El Espejo 2' }, 
            { keyword: 'EEI', name: 'El Espejo 1' }
        ];

        const predioData = {};
        
        fullCycleData.forEach(r => {
            const rawPredio = r.clasifica || '';
            const predioObj = PREDIO_CONFIG.find(c => rawPredio.includes(c.keyword));
            if (!predioObj) return;

            const labor = (r.labor || '').toLowerCase().trim();
            let isFresco = labor.includes('cosecha kg');
            let isPasa = labor.includes('levantado');
            
            if (!isFresco && !isPasa) return;
            
            const kg = r.rendimiento_val || 0;
            if (kg <= 0) return;
            
            const predioKey = predioObj.name;
            
            if (!predioData[predioKey]) {
                predioData[predioKey] = { 
                    label: predioKey, 
                    fresco: 0, 
                    pasa: 0 
                };
            }
            
            if (isFresco) predioData[predioKey].fresco += kg;
            if (isPasa) predioData[predioKey].pasa += kg;
        });
        
        // Match the predefined order above for logical sorting
        const sorted = PREDIO_CONFIG.map(p => predioData[p.name] || { label: p.name, fresco: 0, pasa: 0 })
                                    .reverse(); // Reverse if you want EE1 first, etc. Let's do alphabetical or just reverse index.
        sorted.sort((a, b) => a.label.localeCompare(b.label)); // Alphabetical sorting guarantees standard order

        return {
            labels: sorted.map(d => d.label),
            fresco: sorted.map(d => Math.round(d.fresco)),
            pasa: sorted.map(d => Math.round(d.pasa)),
            factors: sorted.map(d => d.pasa > 0 ? (d.fresco / d.pasa).toFixed(1) : '0')
        };
    }

    /**
     * Fetches and aggregates data for multiple cycles for comparison
     * Returns Chart.js compatible partial data structure
     */
    static async getHistoricalComparison(baseFilters = {}) {
        const activeCycle = this.getCurrentCycle();
        const startYear = 2013;
        const currentYear = parseInt(activeCycle.split('-')[1]);
        
        const cycles = [];
        for (let y = startYear; y < currentYear; y++) {
            cycles.push(`${y}-${y+1}`);
        }
        
        const monthNames = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];

        // Helper to convert date to cycle-relative month index (0-11)
        const getRelativeMonth = (dateStr) => {
            if (!dateStr) return -1;

            let d = new Date(dateStr);

            // Try parsing manually if standard parsing fails or looks suspicious
            if (isNaN(d.getTime())) {
                // Try YYYY-MM-DD
                let parts = dateStr.split('-');
                if (parts.length === 3) {
                    if (parseInt(parts[0]) > 2000) {
                        // YYYY-MM-DD
                        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else if (parseInt(parts[2]) > 2000) {
                        // DD-MM-YYYY
                        d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }

                // Try DD/MM/YYYY
                if (isNaN(d.getTime())) {
                    parts = dateStr.split('/');
                    if (parts.length === 3) {
                        // Assume DD/MM/YYYY
                        d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }
            }

            if (isNaN(d.getTime())) {
                console.warn(`[Historical] Invalid date: ${dateStr}`);
                return -1;
            }

            const m = d.getMonth(); // 0=Jan, 4=May
            // May(4) -> 0, Dec(11) -> 7, Jan(0) -> 8, Apr(3) -> 11
            return m >= 4 ? m - 4 : m + 8;
        };

        // Data for each cycle
        const datasets = [];

        // Parallel fetching is good but might cause too many requests?
        // Let's do it sequentially for now
        for (const c of cycles) {
            console.log(`[Historical] Fetching cycle ${c}...`);
            let cycleData = await this.fetchCycleData(c);
            console.log(`[Historical] Cycle ${c} raw rows: ${cycleData.length}`);

            if (cycleData.length > 0 && cycleData[0].fecha) {
                console.log(`[Historical] Sample date for ${c}: ${cycleData[0].fecha}`);
            }

            // Apply Filters (Finca, Predio, etc) - BUT ignore Cycle filter
            const filtered = cycleData.filter(r => {
                if (baseFilters.finca && r.finca !== baseFilters.finca) return false;
                if (baseFilters.predio && r.clasifica !== baseFilters.predio) return false;
                if (baseFilters.variedad && r.variedad !== baseFilters.variedad) return false;
                return true;
            });
            console.log(`[Historical] Cycle ${c} filtered rows: ${filtered.length}`);

            // Aggregate by month
            // Aggregate by month (Priority: totalJornadas, Fallback: rendimiento if appropriate)
            const monthlySum = new Array(12).fill(0);
            filtered.forEach(r => {
                const idx = getRelativeMonth(r.fecha);
                if (idx >= 0 && idx < 12) {
                    // If we have jornadas, use them. 
                    // Note: Since historical DB has 0 jornadas for CSV imports, we might see 0s.
                    // However, we still fetch from DB as requested.
                    monthlySum[idx] += r.totalJornadas;
                }
            });

            datasets.push({
                label: `Ciclo ${c}`,
                data: monthlySum,
                tension: 0.4,
                fill: false
            });
        }

        const colors = [
            '#94a3b8', '#60a5fa', '#34d399', '#fbbf24', '#8b5cf6',
            '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#6366f1',
            '#f43f5e', '#10b981', '#facc15'
        ];

        return {
            labels: monthNames,
            datasets: datasets.map((d, i) => ({
                ...d,
                borderColor: colors[i % colors.length],
                pointBackgroundColor: colors[i % colors.length],
                borderWidth: i === datasets.length - 1 ? 3 : 2
            }))
        };
    }

    /**
     * Similar to getHistoricalComparison but returns normalized Jornales/Ha
     */
    static async getHistoricalEfficiencyComparison(baseFilters = {}) {
        const cycles = ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];
        const monthNames = ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];

        const getRelativeMonth = (dateStr) => {
            if (!dateStr) return -1;
            let d = new Date(dateStr);
            if (isNaN(d.getTime())) {
                let parts = dateStr.split('-');
                if (parts.length === 3) {
                    if (parseInt(parts[0]) > 2000) d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    else if (parseInt(parts[2]) > 2000) d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
                if (isNaN(d.getTime())) {
                    parts = dateStr.split('/');
                    if (parts.length === 3) d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                }
            }
            if (isNaN(d.getTime())) return -1;
            const m = d.getMonth();
            return m >= 4 ? m - 4 : m + 8;
        };

        const datasets = [];

        for (const c of cycles) {
            let cycleData = await this.fetchCycleData(c);

            const filtered = cycleData.filter(r => {
                if (baseFilters.finca && r.finca !== baseFilters.finca) return false;
                if (baseFilters.predio && r.clasifica !== baseFilters.predio) return false;
                if (baseFilters.variedad && r.variedad !== baseFilters.variedad) return false;
                return true;
            });

            // Calculate Total Area for this filtered dataset (Total Unique Hectares worked in the cycle)
            const uniqueCuarteles = new Map();
            let totalHa = 0;

            filtered.forEach(r => {
                if (r.cuartel && !uniqueCuarteles.has(r.cuartel)) {
                    // Skip "Gral" cuarteles from El Espejo for hectares count
                    const isGralEspejo = r.finca === 'El Espejo' && r.cuartel.toLowerCase().includes('gral');
                    // Only count if Ha is > 0 and not a Gral cuartel
                    if (r.hectares > 0 && !isGralEspejo) {
                        uniqueCuarteles.set(r.cuartel, r.hectares);
                        totalHa += r.hectares;
                    }
                }
            });

            // Prevent division by zero
            if (totalHa === 0) totalHa = 1;

            const monthlySum = new Array(12).fill(0);
            filtered.forEach(r => {
                const idx = getRelativeMonth(r.fecha);
                if (idx >= 0 && idx < 12) {
                    monthlySum[idx] += r.totalJornadas;
                }
            });

            // Normalize by Area
            const monthlyEfficiency = monthlySum.map(j => parseFloat((j / totalHa).toFixed(2)));

            datasets.push({
                label: `Ciclo ${c}`,
                data: monthlyEfficiency,
                rawTotals: monthlySum,
                totalHa: totalHa, // Helpful for debugging tooltip
                tension: 0.4,
                fill: false
            });
        }

        const colors = ['#94a3b8', '#60a5fa', '#34d399', '#fbbf24', '#8b5cf6'];

        return {
            labels: monthNames,
            datasets: datasets.map((d, i) => ({
                ...d,
                borderColor: colors[i % colors.length],
                pointBackgroundColor: colors[i % colors.length],
                borderWidth: i === datasets.length - 1 ? 3 : 2
            }))
        };
    }

    /**
     * Fetches annual harvest yields for comparison.
     * Returns two datasets: Real (solid) and Estimado BP (semi-transparent, only 2025-2026).
     */
    static async getHistoricalCosechaStats(baseFilters = {}) {
        const csvData = await this.loadCSVHistorico();
        const cycles = this.ALL_CYCLES;
        const realPoints = [];
        const estimadoPoints = [];
        const PROPIA_KEYWORDS = ['Camino Truncado', 'EEI', 'EEII', 'EEIII', 'La Chimbera', 'Puente Alto'];

        const filterCsvRows = (rows) => {
            let totalkg = 0;
            rows.forEach(r => {
                if (baseFilters.finca && r.finca !== baseFilters.finca) return;
                if (baseFilters.variedad && r.variedad !== baseFilters.variedad) return;
                if (baseFilters.origen === 'propia') {
                    if (!PROPIA_KEYWORDS.some(k => (r.predio || '').toUpperCase().includes(k.toUpperCase()))) return;
                }
                if (baseFilters.origen === 'terceros') {
                    if (PROPIA_KEYWORDS.some(k => (r.predio || '').toUpperCase().includes(k.toUpperCase()))) return;
                }
                totalkg += r.kg;
            });
            return totalkg;
        };

        for (const c of cycles) {
            if (c === '2025-2026') {
                // Real: datos de la API (ciclo actual en curso)
                let data = await this.fetchCycleData(c);
                const harvestData = data.filter(r => r.isCosecha);
                const filtered = this.applyFilters(harvestData, { ...baseFilters, ciclo: undefined });
                const totalReal = filtered.reduce((acc, r) => acc + (r.rendimiento_val || 0), 0);
                realPoints.push(totalReal);

                // Estimado: datos BP del CSV
                const bpRows = csvData['BP-2025-2026'] || [];
                estimadoPoints.push(filterCsvRows(bpRows));
            } else {
                // Datos CSV reales para ciclos históricos
                const rows = csvData[c] || [];
                realPoints.push(filterCsvRows(rows));
                estimadoPoints.push(null); // Sin estimado para ciclos pasados
            }
        }

        // Colores base según filtro origen
        let baseR = 74, baseG = 222, baseB = 128;
        if (baseFilters.origen === 'propia') { baseR = 59; baseG = 130; baseB = 246; }
        else if (baseFilters.origen === 'terceros') { baseR = 168; baseG = 85; baseB = 247; }

        return {
            labels: cycles,
            datasets: [
                {
                    label: 'Estimado BP (Kg)',
                    data: estimadoPoints,
                    backgroundColor: `rgba(${baseR}, ${baseG}, ${baseB}, 0.2)`,
                    borderColor: `rgba(${baseR}, ${baseG}, ${baseB}, 0.45)`,
                    borderWidth: 2,
                    borderRadius: 6,
                    order: 2
                },
                {
                    label: 'Producción Real (Kg)',
                    data: realPoints,
                    backgroundColor: `rgba(${baseR}, ${baseG}, ${baseB}, 0.7)`,
                    borderColor: `rgba(${baseR}, ${baseG}, ${baseB}, 1)`,
                    borderWidth: 1,
                    borderRadius: 6,
                    order: 1
                }
            ]
        };
    }

    /**
     * Fetches historical Kg/Ha yield per predio for comparison across cycles.
     */
    static async getHistoricalYieldEvolution(baseFilters = {}) {
        const csvData = await this.loadCSVHistorico();
        const PROPIA_KEYWORDS = ['Camino Truncado', 'EEI', 'EEII', 'EEIII', 'La Chimbera', 'Puente Alto'];
        const cycles = this.ALL_CYCLES;

        // We will collect yield stats for each predio over all cycles
        const predioHistory = {};

        for (let i = 0; i < cycles.length; i++) {
            const c = cycles[i];

            if (this.API_CYCLES.includes(c)) {
                // ── Datos de API ──
                let data = await this.fetchCycleData(c);
                const harvestData = data.filter(r => r.isCosecha);
                const filtered = this.applyFilters(harvestData, { ...baseFilters, ciclo: undefined });

                const propiosFiltered = filtered.filter(r => {
                    const clasif = (r.clasifica || '').toUpperCase();
                    return PROPIA_KEYWORDS.some(k => clasif.includes(k.toUpperCase()));
                });

                const dashboardStats = this.getCosechaDashboardStats(propiosFiltered);

                dashboardStats.predios.forEach(predio => {
                    const predioName = predio.name;
                    if (!predioHistory[predioName]) {
                        predioHistory[predioName] = new Array(cycles.length).fill(null);
                    }
                    predioHistory[predioName][i] = predio.kg;
                });
            } else {
                // ── Datos de CSV histórico ──
                const rows = csvData[c] || [];
                const byPredio = {};

                rows.forEach(r => {
                    // Solo predios propios (usar columna Predio)
                    const predioUpper = (r.predio || '').toUpperCase();
                    if (!PROPIA_KEYWORDS.some(k => predioUpper.includes(k.toUpperCase()))) return;

                    if (!byPredio[r.predio]) byPredio[r.predio] = 0;
                    byPredio[r.predio] += r.kg;
                });

                Object.entries(byPredio).forEach(([predio, kg]) => {
                    if (!predioHistory[predio]) {
                        predioHistory[predio] = new Array(cycles.length).fill(null);
                    }
                    predioHistory[predio][i] = kg;
                });
            }
        }

        const colors = [
            '#22c55e', // Green
            '#3b82f6', // Blue
            '#a855f7', // Purple
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#06b6d4', // Cyan
            '#f43f5e', // Rose
            '#8b5cf6'  // Violet
        ];

        let colorIndex = 0;
        const datasets = Object.keys(predioHistory).map(predioName => {
            const ds = {
                label: predioName,
                data: predioHistory[predioName],
                backgroundColor: colors[colorIndex % colors.length] + '99',
                borderColor: colors[colorIndex % colors.length],
                borderWidth: 1,
                borderRadius: 4
            };
            colorIndex++;
            return ds;
        });

        // Filter out any predios that have all nulls
        const validDatasets = datasets.filter(ds => ds.data.some(v => v !== null && v > 0));

        return {
            labels: cycles,
            datasets: validDatasets
        };
    }
}
