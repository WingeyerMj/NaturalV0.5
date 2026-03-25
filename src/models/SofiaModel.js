/**
 * SofiaModel.js
 * Manages import and processing of Sofia CSV data.
 */

const COLUMNS_MAP = {
    'Fecha': ['Fecha Inicio Aplica', 'Fecha Inicio', 'Fecha', 'Fecha de Aplicación', 'Date', 'Fecha Apl.'],
    'Labor': ['Labor', 'Labor Code', 'Faena', 'Tarea', 'Operación'],
    'Producto': ['Nombre Producto', 'Producto', 'Insumo', 'Product', 'Artículo'],
    'Cantidad': ['Cantidad', 'Real Aplicado', 'Cantidad Periodo', 'Monto', 'Cant.'],
    'Tipo': ['tipo', 'Tipo Registro', 'Tipo', 'Categoría'],
    'Cuartel': ['Cuartel', 'Cuadro', 'Sector', 'Lote', 'Potrero'],
    'CodCuartel': ['Cod Cuartel', 'Código Cuartel', 'ID Cuartel'],
    'Dosis': ['Dosis', 'Dose', 'Dosis/Ha'],
    'Finca': ['Predio', 'Finca', 'Farm', 'Establecimiento'],
    'Clasifica': ['Clasifica', 'Clasificación', 'Sub-Predio', 'Variación'],
    'Estado': ['Estado', 'Status', 'Situación'],
    'Variedad': ['Variedad', 'Cepa', 'Grape Variety'],
    'Costo': ['Total Producto', 'Costo', 'Cost', 'Importe', 'Monto USD', 'Monto en USD', 'Total USD', 'Monto en USDO'],
    'N': ['Unidades N', 'N', 'Nitrogeno', 'Units N', 'Unid N', 'Nitrógeno'],
    'P': ['Unidades P', 'P', 'Fosforo', 'Units P', 'Unid P', 'Fósforo', 'P2O5'],
    'K': ['Unidades K', 'K', 'Unidades K2O', 'K20', 'K2O', 'Potasio', 'Units K', 'Unid K'],
    'Ca': ['Unidades Ca', 'Ca', 'Calcio', 'Calcium'],
    'Has': ['Has Totales', 'Hectáreas', 'Area', 'Hectareas', 'Ha']
};

const REQUIRED_KEYS = ['Fecha', 'Labor', 'Producto', 'Cantidad'];

const HERBICIDE_KEYWORDS = ['glifosato', 'gramoxone', 'roundup', 'panzer', 'herbicida', 'tordon', 'afalon', 'atrazina'];

export class SofiaImportModel {
    static REGISTROS = [];

    static importRows(rows) {
        // Simple deduplication based on common fields to avoid bloating the model if imported multiple times
        const existingHashes = new Set(this.REGISTROS.map(r => `${r.fecha_aplicacion}|${r.producto}|${r.cantidad}|${r.finca}|${r.cuartel}|${r.tipo_registro}|${r.costo_total}|${r.n_units}|${r.original_index}`));
        const newRows = rows.filter(r => !existingHashes.has(`${r.fecha_aplicacion}|${r.producto}|${r.cantidad}|${r.finca}|${r.cuartel}|${r.tipo_registro}|${r.costo_total}|${r.n_units}|${r.original_index}`));
        
        this.REGISTROS.push(...newRows);
        console.log(`[SofiaImportModel] Imported ${newRows.length} new rows. Skipped ${rows.length - newRows.length} duplicates. Total: ${this.REGISTROS.length}`);
    }

    static parseCSV(csvText, defaultFinca) {
        if (!csvText) return { error: "Archivo vacío" };
        const lines = csvText.split(/\r\n|\r|\n/).filter(l => l.trim() !== '');
        console.log(`[SofiaModel] Splitting ${csvText.length} chars resulted in ${lines.length} lines.`);
        if (lines.length < 2) {
            console.warn("[SofiaModel] Too few lines found. Raw first 100 chars:", csvText.substring(0, 100));
            return { error: "Archivo sin datos" };
        }

        const header = lines[0].split(';').map(h => h.trim().replace(/^[\uFEFF]/, ''));
        console.log(`[SofiaModel] Parsing CSV with ${header.length} columns. Example columns: ${header.slice(0, 5).join(', ')}`);

        const colMap = {};
        Object.keys(COLUMNS_MAP).forEach(key => {
            const possibleNames = COLUMNS_MAP[key];
            let idx = -1;

            // 1. Priority-based Exact Match
            for (const name of possibleNames) {
                idx = header.findIndex(h => h.toLowerCase() === name.toLowerCase());
                if (idx !== -1) break;
            }

            // 2. Priority-based Partial Match (if exact not found)
            if (idx === -1) {
                for (const name of possibleNames) {
                    idx = header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
                    if (idx !== -1) break;
                }
            }

            if (idx !== -1) colMap[key] = idx;
        });

        const missing = REQUIRED_KEYS.filter(k => colMap[k] === undefined);
        if (missing.length > 0) {
            console.error(`[SofiaModel] Missing required columns: ${missing.join(', ')}`);
            return { error: `Faltan columnas esenciales: ${missing.join(', ')}` };
        }

        const rows = [];
        let skippedEmpty = 0;
        let skippedPendiente = 0;

        // Date selection logic: Prefer 'Fecha Inicio Aplica' (index in colMap) but fallback to standard 'Fecha'
        const primaryFechaIdx = colMap['Fecha'];
        const fallbackFechaIdx = header.findIndex(h => h.toLowerCase() === 'fecha');

        for (let i = 1; i < lines.length; i++) {
            const rowStr = lines[i];
            // Split and clean
            const cols = rowStr.split(';').map(c => c.trim().replace(/^['"]|['"]$/g, ''));

            // Skip really short rows or just semicolons
            if (cols.length < (header.length * 0.3) || cols.every(c => c === '')) {
                skippedEmpty++;
                continue;
            }

            let fecha = primaryFechaIdx !== undefined ? cols[primaryFechaIdx] : '';
            if (!fecha && fallbackFechaIdx !== -1) {
                fecha = cols[fallbackFechaIdx];
            }

            if (!fecha) {
                skippedEmpty++;
                continue;
            }

            const labor = colMap['Labor'] !== undefined ? cols[colMap['Labor']] : 'Desconocido';
            let producto = colMap['Producto'] !== undefined ? cols[colMap['Producto']] : '';

            // Product name normalization
            if (producto) {
                producto = producto.toUpperCase()
                    .replace(/\s+/g, ' ')
                    .replace(/(\d+)\s*([MV])\b/g, '$1 $2')
                    .trim();
            }

            // Helper to parse Spanish numbers (1.234,56 -> 1234.56)
            const parseNum = (val) => {
                if (!val) return 0;
                let clean = val.toString().replace(/[$\s]/g, '');
                // If it has both . and , assume . is thousands
                if (clean.includes('.') && clean.includes(',')) {
                    clean = clean.replace(/\./g, '').replace(',', '.');
                } else if (clean.includes(',')) {
                    // If only comma, assume it is decimal
                    clean = clean.replace(',', '.');
                }
                return parseFloat(clean) || 0;
            };

            // Improved quantity detection: try all possible mapped columns if the primary one is 0
            const qtyPossibleIndices = header.reduce((acc, h, idx) => {
                if (COLUMNS_MAP['Cantidad'].some(name => h.toLowerCase().includes(name.toLowerCase()))) acc.push(idx);
                return acc;
            }, []);

            let cantidad = 0;
            for (const idx of qtyPossibleIndices) {
                cantidad = parseNum(cols[idx]);
                if (cantidad > 0) break;
            }

            const costo = parseNum(cols[colMap['Costo']]);

            const cuartel = colMap['Cuartel'] !== undefined ? cols[colMap['Cuartel']] : 'Sin Asignar';
            const codCuartel = colMap['CodCuartel'] !== undefined ? cols[colMap['CodCuartel']] : '';
            const dosis = colMap['Dosis'] !== undefined ? cols[colMap['Dosis']] : '';

            // Finca logic
            let finca = colMap['Finca'] !== undefined ? cols[colMap['Finca']] : '';
            const fLower = (finca || '').toLowerCase();
            if (fLower.includes('espejo')) {
                finca = 'El Espejo';
            } else if (fLower.includes('viejas') || fLower.includes('camino truncado') || fLower.includes('chimbera') || fLower.includes('puente alto')) {
                finca = 'Fincas Viejas';
            }

            if ((!finca || finca === 'Finca Desconocida') && defaultFinca) {
                finca = defaultFinca;
            } else if (!finca) {
                finca = 'Finca Desconocida';
            }

            // Clasifica (Sub-Predio) logic
            let clasifica = colMap['Clasifica'] !== undefined ? cols[colMap['Clasifica']] : '';
            if (!clasifica || clasifica.trim() === '') clasifica = 'General';

            let predioFull = finca;
            if (clasifica && clasifica !== finca && clasifica !== 'General') {
                predioFull = `${finca} - ${clasifica}`;
            }

            // Estado filtering
            // Relaxed Estado filtering: only skip Pendiente if it has no quantity
            // This ensures we show 'Real' applications that Sofia still marks as 'Pendiente'
            let estado = colMap['Estado'] !== undefined ? cols[colMap['Estado']] : '';
            const estadoLower = estado.toLowerCase();
            if (estadoLower === 'pendiente' && cantidad === 0) {
                skippedPendiente++;
                continue;
            }

            // Tipo cleaning
            let tipoRaw = colMap['Tipo'] !== undefined ? cols[colMap['Tipo']] : 'Real';
            let tipo = (tipoRaw || '').toLowerCase();
            if (tipo.includes('presupuestado') || tipo.includes('presupuesto') || tipo.includes('ppto')) {
                if (tipo.includes('pos')) tipo = 'Presupuestado-Pos';
                else tipo = 'Presupuestado-Pre';
            } else {
                tipo = 'Real';
            }

            const variety = (colMap['Variedad'] !== undefined && cols[colMap['Variedad']]) ? cols[colMap['Variedad']] : ((cuartel.split('-')[2] || '').trim() || 'Sin Variedad');

            rows.push({
                fecha_aplicacion: fecha,
                labor_codigo: labor,
                tipo_registro: tipo,
                producto,
                cantidad,
                cuartel,
                cod_cuartel: codCuartel || cuartel,
                dosis,
                costo_total: costo,
                costo_unitario: cantidad > 0 ? costo / cantidad : 0,
                finca: predioFull,
                finca_original: finca,
                clasifica: clasifica,
                estado: estado,
                variedad: variety,
                categoria: this.classify(labor, producto, tipoRaw),
                ciclo: this.getCycle(fecha),
                n_units: colMap['N'] !== undefined ? parseNum(cols[colMap['N']]) : 0,
                k_units: colMap['K'] !== undefined ? parseNum(cols[colMap['K']]) : 0,
                p_units: colMap['P'] !== undefined ? parseNum(cols[colMap['P']]) : 0,
                ca_units: colMap['Ca'] !== undefined ? parseNum(cols[colMap['Ca']]) : 0,
                has_totales: colMap['Has'] !== undefined ? parseNum(cols[colMap['Has']]) : 0,
                original_index: i // To distinguish otherwise identical rows within the same file import
            });
        }
        console.log(`[SofiaModel] Parse complete: ${rows.length} rows kept, ${skippedEmpty} empty/invalid skipped, ${skippedPendiente} pendientes skipped.`);
        return { rows };
    }


    static classify(laborCode, producto, tipoRaw = '') {
        const lab = (laborCode || '').toUpperCase().trim();
        const prod = (producto || '').toLowerCase();
        const tipo = (tipoRaw || '').toLowerCase();

        // 1. Foliares: Starts with "AF -" or is "FITOSANITARIO"
        if (lab.startsWith('AF -') || lab === 'AF' || lab.includes('FOLIAR') || lab === 'FITOSANITARIO') return 'Foliares';

        // 2. Herbicidas: Labour matches HERBICIDA or HERB, or product keywords
        if (lab.includes('HERBICIDA') || lab === 'HERB' || HERBICIDE_KEYWORDS.some(k => prod.includes(k))) return 'Herbicidas';

        // 3. Fertilización: Strictly "FERTILIZACION" or close variants
        if (lab.includes('FERTILIZACI') || lab.includes('FERTILIZANTE') || lab === 'FERT' || lab === 'ABONO' || prod.includes('nutri') || tipo.includes('pre-cosecha') || tipo.includes('pos-cosecha')) return 'Fertilizacion';

        // 4. Dynamic category: Take the name of the labor if not recognized above
        return lab || 'Otros';
    }

    static getCycle(fechaStr) {
        if (!fechaStr) return 'Unknown';
        let year, month;
        const s = fechaStr.toString().trim();

        if (s.includes('/')) {
            const parts = s.split('/');
            if (parts.length === 3) {
                let y = parts[2].trim();
                year = parseInt(y.length === 2 ? '20' + y : y);
                month = parseInt(parts[1].trim());
            }
        } else if (s.includes('-')) {
            const parts = s.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    year = parseInt(parts[0]);
                    month = parseInt(parts[1]);
                } else if (parts[2].length === 4) {
                    year = parseInt(parts[2]);
                    month = parseInt(parts[1]);
                }
            }
        }

        if (isNaN(month) || isNaN(year) || !month || !year) return 'Unknown';
        if (month >= 5) return `${year}-${year + 1}`;
        return `${year - 1}-${year}`;
    }

    static getAvailableCycles() {
        const requested = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];
        const found = new Set(this.REGISTROS.map(r => r.ciclo).filter(c => c !== 'Unknown'));
        requested.forEach(c => found.add(c));
        return [...found].sort().reverse();
    }

    static getFincas() {
        return ['El Espejo', 'Fincas Viejas'];
    }

    static getPredios(finca) {
        const set = new Set(this.REGISTROS.filter(r => !finca || r.finca_original === finca).map(r => r.clasifica).filter(c => c && c !== 'General'));
        return [...set].sort();
    }

    static getVariedades(finca, predio) {
        const set = new Set(this.REGISTROS.filter(r => (!finca || r.finca_original === finca) && (!predio || r.clasifica === predio)).map(r => r.variedad).filter(v => v));
        return [...set].sort();
    }


    static applyFilters(data, filters = {}) {
        return data.filter(r => {
            if (filters.finca && r.finca_original !== filters.finca) return false;
            if (filters.ciclo && r.ciclo !== filters.ciclo) return false;
            if (filters.predio && r.clasifica !== filters.predio) return false;
            if (filters.variedad && r.variedad !== filters.variedad) return false;
            if (filters.cuartel && r.cuartel !== filters.cuartel) return false;
            return true;
        });
    }

    static getResumen(filters = {}) {
        const all = this.applyFilters(this.REGISTROS, filters);
        const distribution = {};
        const prodCounts = {};

        all.forEach(r => {
            distribution[r.categoria] = (distribution[r.categoria] || 0) + 1;
            const key = `${r.producto}|${r.labor_codigo}`;
            if (!prodCounts[key]) {
                prodCounts[key] = { producto: r.producto, labor: r.labor_codigo, totalCantidad: 0, count: 0, costo: 0 };
            }
            prodCounts[key].totalCantidad += r.cantidad;
            prodCounts[key].costo += (r.costo_total || 0);
            prodCounts[key].count++;
        });

        const topProducts = Object.values(prodCounts)
            .sort((a, b) => b.totalCantidad - a.totalCantidad)
            .slice(0, 10);

        const sumCost = (cat) => all.filter(r => r.categoria === cat).reduce((s, r) => s + (r.costo_total || 0), 0);

        return {
            totalApplications: all.length,
            foliares: { count: all.filter(r => r.categoria === 'Foliares').length, costo: sumCost('Foliares') },
            herbicidas: { count: all.filter(r => r.categoria === 'Herbicidas').length, costo: sumCost('Herbicidas') },
            fertilizacion: { count: all.filter(r => r.categoria === 'Fertilizacion').length, costo: sumCost('Fertilizacion') },
            distribution,
            topProducts
        };
    }

    static getFoliares(filters = {}) {
        return this.applyFilters(this.REGISTROS.filter(r => r.categoria === 'Foliares'), filters);
    }

    static getCategoriaPorPredioStats(categoria, filters = {}) {
        const all = this.applyFilters(this.REGISTROS.filter(r => r.categoria === categoria), filters);
        const predioMap = {};
        
        all.forEach(r => {
            const finca = r.finca_original || r.finca || 'Otros';
            const predio = r.clasifica || 'Sin Clasifica';
            const key = `${finca}|${predio}`;
            
            if (!predioMap[key]) {
                predioMap[key] = { finca, predio, costo: 0, cantidad: 0 };
            }
            
            predioMap[key].costo += (r.costo_total || 0);
            predioMap[key].cantidad += (r.cantidad || 0);
        });

        const sorted = Object.values(predioMap).sort((a,b) => {
            if (a.finca !== b.finca) return a.finca.localeCompare(b.finca);
            return a.predio.localeCompare(b.predio);
        });

        return {
            labels: sorted.map(s => `${s.finca}: ${s.predio}`),
            costos: sorted.map(s => s.costo),
            cantidades: sorted.map(s => s.cantidad)
        };
    }

    static getFoliaresPorPredioStats(filters = {}) {
        return this.getCategoriaPorPredioStats('Foliares', filters);
    }

    static getHerbicidasPorPredioStats(filters = {}) {
        return this.getCategoriaPorPredioStats('Herbicidas', filters);
    }

    static getCategoriaPorProductoStats(categoria, filters = {}) {
        const all = this.applyFilters(this.REGISTROS.filter(r => r.categoria === categoria), filters);
        const prodMap = {};
        
        all.forEach(r => {
            const prod = r.producto || 'Desconocido';
            
            if (!prodMap[prod]) {
                prodMap[prod] = { producto: prod, costo: 0, cantidad: 0 };
            }
            
            prodMap[prod].costo += (r.costo_total || 0);
            prodMap[prod].cantidad += (r.cantidad || 0);
        });

        // Sort by quantity descending
        const sorted = Object.values(prodMap).sort((a,b) => b.cantidad - a.cantidad);

        return {
            labels: sorted.map(s => s.producto),
            costos: sorted.map(s => s.costo),
            cantidades: sorted.map(s => Math.round(s.cantidad * 100) / 100)
        };
    }

    static getHerbicidas(filters = {}) {
        return this.applyFilters(this.REGISTROS.filter(r => r.categoria === 'Herbicidas'), filters);
    }

    static getFertilizacionComparativa(filters = {}) {
        const all = this.applyFilters(this.REGISTROS.filter(r => r.categoria === 'Fertilizacion'), filters);
        const groups = {};
        all.forEach(r => {
            const clasifica = r.clasifica || 'Sin Clasifica';
            const key = `${clasifica}|${r.producto}|${r.finca}`;
            if (!groups[key]) groups[key] = { cuartel: clasifica, finca: r.finca_original || r.finca, producto: r.producto, clasifica, pre: 0, pos: 0, real: 0 };
            const tr = (r.tipo_registro || '').toLowerCase();
            if (tr === 'presupuestado-pre') groups[key].pre += r.cantidad;
            else if (tr === 'presupuestado-pos') groups[key].pos += r.cantidad;
            else if (tr === 'real') groups[key].real += r.cantidad;
        });

        // Solo items con presupuesto (pre o pos)
        return Object.values(groups)
            .filter(g => (g.pre + g.pos) > 0)
            .map(g => ({
                ...g,
                metaAnual: g.pre + g.pos,
                desvio: g.real - (g.pre + g.pos),
                desvioPct: (g.pre + g.pos) > 0 ? Math.round(((g.real - (g.pre + g.pos)) / (g.pre + g.pos)) * 100) : 0,
            }))
            .sort((a, b) => {
                // 1. Sort by Finca
                const fincaComp = a.finca.localeCompare(b.finca);
                if (fincaComp !== 0) return fincaComp;

                // 2. Sort by Predio (Clasifica)
                const clasificaComp = (a.clasifica || '').localeCompare(b.clasifica || '');
                if (clasificaComp !== 0) return clasificaComp;

                // 3. Sort by Product
                return a.producto.localeCompare(b.producto);
            });
    }

    static getProductComparison(filters = {}) {
        const all = this.applyFilters(this.REGISTROS.filter(r => r.categoria === 'Fertilizacion'), filters);
        const groups = {};
        all.forEach(r => {
            const key = `${r.clasifica || 'Sin Clasifica'}|${r.producto}`;
            if (!groups[key]) groups[key] = { producto: r.producto, clasifica: r.clasifica || 'Sin Clasifica', pre: 0, real: 0 };
            const tipo = (r.tipo_registro || '').toLowerCase();
            if (tipo.includes('presupuestado')) groups[key].pre += r.cantidad;
            else if (tipo === 'real') groups[key].real += r.cantidad;
        });

        // Solo items con presupuesto
        return Object.values(groups)
            .filter(g => g.pre > 0)
            .sort((a, b) => {
                const clasDiff = a.clasifica.localeCompare(b.clasifica);
                if (clasDiff !== 0) return clasDiff;
                return a.producto.localeCompare(b.producto);
            });
    }


    static getWeeklyEvolution(filters = {}, fincaName = '', productoFilter = '', predioFilter = '') {
        // Only these 3 products
        const ALLOWED = ['NUTRI 1075 M', 'NUTRI 1683 M', 'NUTRI 1684 M', 'BIO-CRECIMIENTO', 'NITRON 27', 'NITRATO DE CALCIO', 'UREA', 'SULFATO DE POTASIO'];

        const all = this.applyFilters(
            this.REGISTROS.filter(r =>
                r.categoria === 'Fertilizacion' &&
                ALLOWED.includes((r.producto || '').toUpperCase()) &&
                (!fincaName || r.finca_original === fincaName) &&
                (!productoFilter || (r.producto || '').toUpperCase() === productoFilter.toUpperCase()) &&
                (!predioFilter || r.clasifica === predioFilter)
            ),
            filters
        );

        // ── Fixed projection period: 09/09/2025 → 30/04/2026 ──
        const projStart = new Date(2025, 8, 9);   // Sep 9, 2025
        const projEnd = new Date(2026, 3, 30);  // Apr 30, 2026

        // Helper: get Monday of the ISO week for a given date
        const getMonday = (d) => {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.getFullYear(), d.getMonth(), diff);
        };

        // Helper: format a date as "DD/MM"
        const fmtShort = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        // Helper: parse dd/mm/yyyy date string
        const parseDate = (str) => {
            if (!str) return null;
            const parts = str.split('/');
            if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            const parts2 = str.split('-');
            if (parts2.length === 3) return new Date(parseInt(parts2[0]), parseInt(parts2[1]) - 1, parseInt(parts2[2]));
            return null;
        };

        // ── 1. Generate all weeks in the projection range ──
        const weeks = [];
        const weekMap = {};
        let cursor = getMonday(projStart);
        let weekIdx = 0;
        while (cursor <= projEnd) {
            const weekEnd = new Date(cursor);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const label = `S${weekIdx + 1} (${fmtShort(cursor)})`;
            weeks.push({ start: new Date(cursor), end: weekEnd, label });
            weekMap[weekIdx] = { realPre: 0, realPos: 0 };
            cursor.setDate(cursor.getDate() + 7);
            weekIdx++;
        }
        const totalWeeks = weeks.length;

        // ── 2. Assign data to each week ──
        all.forEach(r => {
            const fecha = parseDate(r.fecha_aplicacion);
            if (!fecha) return;

            const tipo = (r.tipo_registro || '').toLowerCase();
            const isBudget = tipo.includes('presupuestado');
            
            // Determine if this record belongs to a PRE or POS product
            const prod = (r.producto || '').toUpperCase();
            const isPosProduct = prod.includes('BIO-CRECIMIENTO');

            for (let i = 0; i < weeks.length; i++) {
                if (fecha >= weeks[i].start && fecha <= weeks[i].end) {
                    if (isBudget) {
                        if (isPosProduct) weekMap[i].budgetPos = (weekMap[i].budgetPos || 0) + r.cantidad;
                        else weekMap[i].budgetPre = (weekMap[i].budgetPre || 0) + r.cantidad;
                    } else {
                        if (isPosProduct) weekMap[i].realPos += r.cantidad;
                        else weekMap[i].realPre += r.cantidad;
                    }
                    break;
                }
            }
        });

        // ── 3. Build per-week arrays (NOT cumulative) ──
        const labels = [];
        const pptadoPre = [];
        const pptadoPos = [];
        const realPre = [];
        const realPos = [];

        // Transition week: March 5, 2026
        const posStart = new Date(2026, 2, 5);
        let transitionIdx = -1;
        for (let i = 0; i < weeks.length; i++) {
            if (posStart >= weeks[i].start && posStart <= weeks[i].end) {
                transitionIdx = i;
                break;
            }
        }

        // ── 3. Calculate Totals for Distribution ──
        const getSum = (t, isPos) => all
            .filter(r => (r.tipo_registro || '').toLowerCase().includes(t) && 
                         ((r.producto || '').toUpperCase().includes('BIO-CRECIMIENTO') === isPos))
            .reduce((s, r) => s + r.cantidad, 0);

        const budgetPreTotal = getSum('presupuestado', false);
        const budgetPosTotal = getSum('presupuestado', true);

        for (let i = 0; i < totalWeeks; i++) {
            labels.push(weeks[i].label);
            
            // For budget lines: use null for non-active periods to make lines "end" cleanly
            // Budget distribution logic
            if (i < transitionIdx || transitionIdx === -1) {
                // Pre-harvest period
                pptadoPre.push(budgetPreTotal / (transitionIdx === -1 ? totalWeeks : transitionIdx));
                pptadoPos.push(null);
            } else if (i >= transitionIdx && i < transitionIdx + 5) {
                // Post-harvest period (first 5 weeks)
                pptadoPre.push(null);
                pptadoPos.push(budgetPosTotal / 5);
            } else {
                // After the 5 weeks of application
                pptadoPre.push(null);
                pptadoPos.push(0);
            }

            realPre.push(Math.round(weekMap[i].realPre * 100) / 100);
            realPos.push(Math.round(weekMap[i].realPos * 100) / 100);
        }

        return { labels, pptadoPre, pptadoPos, realPre, realPos };
    }

    static getProductosFertilizacion() {
        return ['NUTRI 1075 M', 'NUTRI 1683 M', 'NUTRI 1684 M'];
    }

    static getFertilizacionUnidades(filters = {}, fincaGroup = 'espejo') {
        const compositions = {
            'NITRATO DE CALCIO': { n: 0.155, k: 0, p: 0 },
            'NUTRI 1075 M': { n: 0.0048868, k: 0.0029810, p: 0 },
            'NUTRI 1683 M': { n: 0.0126, k: 0.0284, p: 0 },
            'NUTRI 1684 M': { n: 0.0062, k: 0.0125, p: 0 },
            'SULFATO DE POTASIO': { n: 0, k: 0.50, p: 0 },
            'UREA': { n: 0.46, k: 0, p: 0 },
            'BIO-CRECIMIENTO': { n: 0.1, k: 0, p: 0 },
            'NITRON 27': { n: 0.27, k: 0, p: 0 }
        };
        const nutrientDensities = {};
        const budgetStats = {};
        const processedBudgets = new Set();

        // Only consider these products for nutrient charts
        const allowedProducts = Object.keys(compositions);

        // Helper: check if record belongs to requested finca group
        const belongsToGroup = (r) => {
            const finca = (r.finca_original || '').toLowerCase();
            if (fincaGroup === 'espejo') return finca.includes('espejo');
            return !finca.includes('espejo'); // fincasviejas = everything else
        };

        // Helper: determine group key
        // El Espejo → por Cod Cuartel (EEI 1, EEI 2, EEII 1, etc.)
        // Fincas Viejas → por Clasifica (Camino Truncado, La Chimbera, Puente Alto)
        const getGroupKey = (r) => {
            if (fincaGroup === 'espejo') {
                return (r.cod_cuartel || r.cuartel || r.clasifica || 'Otros').trim();
            }
            return r.clasifica || 'Otros';
        };

        // ── 1. Process BUDGET rows ──
        this.REGISTROS.forEach(r => {
            if (!belongsToGroup(r)) return;

            const tipo = (r.tipo_registro || '').toLowerCase();
            const isBudget = tipo.includes('presupuestado') || tipo.includes('presupuesto') || tipo.includes('ppto');
            if (!isBudget) return;

            const prod = (r.producto || '').toUpperCase();
            // Only allowed products
            if (!allowedProducts.includes(prod)) return;
            // Product filter (individual selection)
            if (filters.producto && prod !== filters.producto.toUpperCase()) return;

            // Exclusion of BIO-CRECIMIENTO for PRE-COSECHA charts
            if (filters.budgetType === 'pre' && prod === 'BIO-CRECIMIENTO') return;

            if (filters.budgetType) {
                const bType = filters.budgetType.toLowerCase();
                const tipoLower = tipo.toLowerCase();
                if (bType === 'pre' && !tipoLower.endsWith('-pre')) return;
                if (bType === 'pos' && !tipoLower.endsWith('-pos')) return;
            }

            if (r.cantidad > 0) {
                const key = getGroupKey(r);
                // Use a more unique index if available or just don't deduplicate if they are from CSV
                const uniqueKey = `${r.clasifica}-${r.cod_cuartel}-${r.producto}-${r.variedad}-${r.ciclo}-${tipo}-${r.fecha_aplicacion}-${r.cantidad}`;

                // Get nutrient units: extract first from CSV, then override ONLY if our strict composition dictionary specifies a >0 multiplier
                let nUnits = r.n_units || 0;
                let pUnits = r.p_units || 0;
                let kUnits = r.k_units || 0;

                if (compositions[prod]) {
                    const comp = compositions[prod];
                    if (comp.n > 0) nUnits = r.cantidad * comp.n;
                    if (comp.p > 0) pUnits = r.cantidad * comp.p;
                    if (comp.k > 0) kUnits = r.cantidad * comp.k;
                }

                if (nUnits > 0 || pUnits > 0 || kUnits > 0) {
                    const cycleMatch = !filters.ciclo || r.ciclo === filters.ciclo || r.ciclo === 'Unknown';
                    const fincaMatch = !filters.finca || r.finca_original === filters.finca;
                    const predioMatch = !filters.predio || r.clasifica === filters.predio;

                    // Store per-group+product ratio for real calculations
                    const ratioKey = `${key}|${prod}`;
                    if (!nutrientDensities[ratioKey]) {
                        nutrientDensities[ratioKey] = { n: 0, p: 0, k: 0, totalQty: 0 };
                    }
                    nutrientDensities[ratioKey].n += nUnits;
                    nutrientDensities[ratioKey].p += pUnits;
                    nutrientDensities[ratioKey].k += kUnits;
                    nutrientDensities[ratioKey].totalQty += r.cantidad;

                    if (cycleMatch && fincaMatch && predioMatch) {
                        if (!budgetStats[key]) budgetStats[key] = { n: 0, p: 0, k: 0 };
                        budgetStats[key].n += nUnits;
                        budgetStats[key].p += pUnits;
                        budgetStats[key].k += kUnits;
                    }
                }
            }
        });

        // ── Compute nutrient ratios per group+product (units per liter) ──
        const groupProductRatios = {};
        Object.entries(nutrientDensities).forEach(([ratioKey, sums]) => {
            if (sums.totalQty > 0) {
                let rN = sums.n / sums.totalQty;
                let rP = sums.p / sums.totalQty;
                let rK = sums.k / sums.totalQty;

                // Sanity Check: If Sofia export has percentage instead of absolute units (e.g. "10" for 10%), 
                // the ratio would be e.g. 10. We cap it to reasonable levels based on known maxes.
                // Most high-concentration fertilizers (like Urea) are ~0.46. 
                // If it's > 1.0, it's almost certainly a percentage or a units error.
                if (rN > 0.8) rN = rN / 100;
                if (rP > 0.8) rP = rP / 100;
                if (rK > 0.8) rK = rK / 100;

                groupProductRatios[ratioKey] = { n: rN, p: rP, k: rK };
            }
        });

        // ── 2. Process REAL applied rows ──
        const allReal = this.applyFilters(
            this.REGISTROS.filter(r => r.categoria === 'Fertilizacion' && r.tipo_registro === 'Real' && belongsToGroup(r)),
            filters
        );
        const realStats = {};
        const processedReal = new Set();

        allReal.forEach(r => {
            const prod = (r.producto || '').toUpperCase();
            if (!allowedProducts.includes(prod)) return;
            if (filters.producto && prod !== filters.producto.toUpperCase()) return;
            if (filters.budgetType === 'pre' && prod === 'BIO-CRECIMIENTO') return;

            const key = getGroupKey(r);
            if (!realStats[key]) realStats[key] = { n: 0, p: 0, k: 0 };

            let appliedN = 0, appliedP = 0, appliedK = 0;

            const ratioKey = `${key}|${prod}`;
            // Hierarchy: 1. Specific key (Cuartel/Parcela) -> 2. Predio level -> 3. Global average
            if (groupProductRatios[ratioKey]) {
                const ratios = groupProductRatios[ratioKey];
                appliedN = r.cantidad * ratios.n;
                appliedP = r.cantidad * ratios.p;
                appliedK = r.cantidad * ratios.k;
            } else if (groupProductRatios[`${r.clasifica}|${prod}`]) {
                // Try to use the ratio from the broader "Predio" (Clasifica) if Cuartel specific ratio is missing
                const ratios = groupProductRatios[`${r.clasifica}|${prod}`];
                appliedN = r.cantidad * ratios.n;
                appliedP = r.cantidad * ratios.p;
                appliedK = r.cantidad * ratios.k;
            } else {
                // Fallback: average ratio from other groups that have this product
                const prodRatios = Object.entries(groupProductRatios)
                    .filter(([k]) => k.endsWith(`|${prod}`))
                    .map(([, v]) => v);

                if (prodRatios.length > 0) {
                    const avgN = prodRatios.reduce((s, r) => s + r.n, 0) / prodRatios.length;
                    const avgP = prodRatios.reduce((s, r) => s + r.p, 0) / prodRatios.length;
                    const avgK = prodRatios.reduce((s, r) => s + r.k, 0) / prodRatios.length;
                    appliedN = r.cantidad * avgN;
                    appliedP = r.cantidad * avgP;
                    appliedK = r.cantidad * avgK;
                }
            }

            realStats[key].n += appliedN;
            realStats[key].p += appliedP;
            realStats[key].k += appliedK;
        });

        // ── 3. Merge and return ──
        const allKeys = new Set([...Object.keys(budgetStats), ...Object.keys(realStats)]);

        return Array.from(allKeys).map(name => ({
            name,
            n: { budget: parseFloat((budgetStats[name]?.n || 0).toFixed(2)), real: parseFloat((realStats[name]?.n || 0).toFixed(2)) },
            p: { budget: parseFloat((budgetStats[name]?.p || 0).toFixed(2)), real: parseFloat((realStats[name]?.p || 0).toFixed(2)) },
            k: { budget: parseFloat((budgetStats[name]?.k || 0).toFixed(2)), real: parseFloat((realStats[name]?.k || 0).toFixed(2)) },
        })).sort((a, b) => a.name.localeCompare(b.name));
    }
}
