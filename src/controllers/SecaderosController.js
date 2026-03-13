import Papa from 'papaparse';
import { SofiaApiModel } from '../models/SofiaApiModel.js';

export class SecaderosController {
    static state = {
        plannedData: [],
        realData: [],
        mergedData: [],
        secaderoHas: [],
        rainData: [],
        climaData: {},
        expandedRegions: new Set(),
        expandedSecaderos: new Set(),
    };

    static async init() {
        console.log("Inicializando Secaderos...");

        // Usamos las rutas locales de public
        const CONFIG = {
            csvPath: '/Fuentes/Auxiliares/Programación Cosecha.csv',
            secaderoPath: '/Fuentes/secadero/Has de secadero.csv',
            lluviasPath: '/Fuentes/secadero/lluvias.csv',
            climasPath: '/Fuentes/secadero/Climas4.csv',
        };

        // 1. Fetch Planned
        if (this.state.plannedData.length === 0) {
            await new Promise((resolve) => {
                Papa.parse(CONFIG.csvPath, {
                    download: true, header: true, delimiter: ";", skipEmptyLines: true,
                    complete: (results) => {
                        this.state.plannedData = results.data;
                        resolve();
                    }, error: () => resolve()
                });
            });
        }

        // 2. Fetch Secaderos capacities
        if (this.state.secaderoHas.length === 0) {
            await new Promise((resolve) => {
                Papa.parse(CONFIG.secaderoPath, {
                    download: true, header: true, delimiter: ";", skipEmptyLines: true,
                    complete: (results) => {
                        this.state.secaderoHas = results.data.map(d => ({
                            playa: String(d.Playa || '').trim(),
                            has: parseFloat(String(d.Has || 0).replace(',', '.')) || 0,
                            capKg: parseFloat(String(d['Capacidad de KG tendido'] || 0).replace(/\./g, '')) || 0
                        }));
                        resolve();
                    }, error: () => resolve()
                });
            });
        }

        // 3. Fetch Lluvias
        if (this.state.rainData.length === 0) {
            await new Promise((resolve) => {
                Papa.parse(CONFIG.lluviasPath, {
                    download: true, header: true, delimiter: ";", skipEmptyLines: true,
                    complete: (results) => {
                        this.state.rainData = results.data;
                        resolve();
                    }, error: () => resolve()
                });
            });
        }

        // 4. Fetch Clima
        if (Object.keys(this.state.climaData).length === 0) {
            await new Promise((resolve) => {
                Papa.parse(CONFIG.climasPath, {
                    download: true, header: true, delimiter: ";", skipEmptyLines: true,
                    complete: (results) => {
                        const summary = {};
                        results.data.forEach(r => {
                            const literal = String(r.Literal || '');
                            const date = r['Solo Fecha'];
                            const temp = parseFloat(String(r.Temp || '').replace(',', '.'));
                            if (literal && date && !isNaN(temp)) {
                                const key = `${literal}_${date}`;
                                if (!summary[key]) summary[key] = { sum: 0, count: 0 };
                                summary[key].sum += temp;
                                summary[key].count++;
                            }
                        });
                        this.state.climaData = summary;
                        resolve();
                    }, error: () => resolve()
                });
            });
        }

        // 5. Fetch Real Data from Sofia
        // Instead of making the huge request from scratch, reuse SofiaApiModel's current cycle data
        const cycleData = SofiaApiModel.DATA_COSECHA || [];
        this.state.realData = cycleData.map(r => {
            const l = String(r.labor || '').toUpperCase();
            return {
                ...r,
                isPasa: l.includes('LEVANTADO')
            };
        });

        this.processData();
        this.renderSecaderosView();
        lucide.createIcons(); // Reactivate icons if any
    }

    static toggleSecaderoDetails(playaName) {
        if (this.state.expandedSecaderos.has(playaName)) {
            this.state.expandedSecaderos.delete(playaName);
        } else {
            this.state.expandedSecaderos.add(playaName);
        }
        this.renderSecaderosView();
    }

    static toggleRegionDetails(region) {
        if (this.state.expandedRegions.has(region)) {
            this.state.expandedRegions.delete(region);
        } else {
            this.state.expandedRegions.add(region);
        }
        this.renderSecaderosView();
    }

    static parseDMY(str) {
        if (!str) return null;
        const parts = str.split('/');
        if (parts.length < 3) return null;
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00`);
    }

    static getPlayaWeather(playaName, startDateStr) {
        if (!startDateStr) return { rain: 0, temp: null };
        let finca = 'Camino Truncado';
        if (playaName.toUpperCase().includes('LCH')) finca = 'La Chimbera';
        if (playaName.toUpperCase().includes('SECTOR')) finca = 'El Espejo';

        const start = new Date(startDateStr + 'T00:00:00');
        const today = new Date();
        let totalRain = 0;
        this.state.rainData.forEach(r => {
            const rFinca = String(r.Finca || '');
            if (rFinca.includes(finca) || (finca === 'El Espejo' && rFinca.includes('Espejo'))) {
                const rDate = this.parseDMY(r.Fecha);
                if (rDate && rDate >= start && rDate <= today) {
                    totalRain += parseFloat(String(r.Milimetros || 0).replace(',', '.')) || 0;
                }
            }
        });

        let tempSum = 0;
        let tempCount = 0;
        const climaLiterals = Object.keys(this.state.climaData).filter(k => {
            const lit = k.split('_')[0];
            if (finca === 'Camino Truncado' && lit.includes('Camino Truncado')) return true;
            if (finca === 'La Chimbera' && lit.includes('LCH')) return true;
            if (finca === 'El Espejo' && lit.includes('Espejo')) return true;
            return false;
        });

        climaLiterals.forEach(key => {
            const dateStr = key.split('_')[1];
            const cDate = this.parseDMY(dateStr);
            if (cDate && cDate >= start && cDate <= today) {
                tempSum += this.state.climaData[key].sum;
                tempCount += this.state.climaData[key].count;
            }
        });

        return { rain: totalRain, temp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : null };
    }

    static processData() {
        const getVal = (obj, targets) => {
            if (!Array.isArray(targets)) targets = [targets];
            const key = Object.keys(obj).find(k => targets.some(t => k.trim().toLowerCase() === t.toLowerCase()));
            return key ? String(obj[key]).trim() : '';
        };

        const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();

        // Creamos un summary para relacionar promedios vs planeado si es necesario.
        const realSummary = {};
        const pasaSummary = {};
        this.state.realData.forEach(r => {
            const cuartelMatch = String(r.cuartel || '').match(/^(\d+)/);
            const cuartelId = cuartelMatch ? parseInt(cuartelMatch[1], 10) : parseInt(r.id_cuartel, 10);
            let variety = normalize(r.variedad || '');
            let finca = normalize(r.clasificacion || 'Desconocida');

            if (finca === 'eei') finca = normalize('El Espejo I');
            if (finca === 'eeii') finca = normalize('El Espejo II');
            if (finca === 'eeiii') finca = normalize('El Espejo III');

            const key = `${finca}_${cuartelId}_${variety}`;
            const kg = parseFloat(r.rendimiento) || 0;
            if (r.isPasa) {
                if (!pasaSummary[key]) pasaSummary[key] = { kg: 0 };
                pasaSummary[key].kg += kg;
            } else {
                if (!realSummary[key]) realSummary[key] = { kg: 0 };
                realSummary[key].kg += kg;
            }
        });

        this.state.mergedData = this.state.plannedData.map(p => {
            const rawFinca = getVal(p, ['Finca', 'Productor', 'Nombre', 'Propietario']);
            const rawVariety = getVal(p, 'Variedad');
            const fincaNorm = normalize(rawFinca);
            const varietyNorm = normalize(rawVariety);
            const cuartelStr = getVal(p, 'Cuartel');
            const cuartel = parseInt(cuartelStr, 10);
            const key = `${fincaNorm}_${cuartel}_${varietyNorm}`;
            const info = realSummary[key] || { kg: 0 };
            const kgReal = info.kg;
            let rawPlanned = getVal(p, ['Kg Uva', 'Kg', 'Kilos']);
            let kgPlanned = rawPlanned ? parseFloat(rawPlanned.replace(/\./g, '').replace(',', '.')) : 0;

            return {
                finca: rawFinca,
                cuartel: cuartelStr,
                variety: rawVariety,
                planned: isNaN(kgPlanned) ? 0 : kgPlanned,
                real: kgReal
            };
        });
    }

    static renderSecaderosView() {
        if (!document.getElementById('secadero-grid') || !document.getElementById('secadero-stats')) return;

        const playaData = {};
        this.state.realData.forEach(r => {
            const nombre = (r.nombre || '').trim();
            if (!nombre || (!nombre.includes('Playa') && !nombre.includes('Sector') && !nombre.includes('PLAYA'))) return;

            const normName = nombre.toUpperCase();
            if (!playaData[normName]) {
                playaData[normName] = { batches: {}, lastDate: null, originalName: nombre, uva: 0, pasa: 0, cuartelId: r.id_cuartel };
            }

            const labor = String(r.labor || '').toUpperCase();
            const batchMatch = labor.match(/(\d+)$/);
            const batchNum = batchMatch ? batchMatch[1] : '1';

            if (!playaData[normName].batches[batchNum]) playaData[normName].batches[batchNum] = { uva: 0, pasa: 0, firstDate: null, lastDate: null, history: [] };

            const kg = parseFloat(r.rendimiento) || 0;
            let rawDate = r.fecha ? r.fecha.split(' ')[0] : null;
            let date = rawDate;
            if (rawDate && rawDate.includes('-') && rawDate.split('-')[0].length === 2) {
                const [d, m, y] = rawDate.split('-');
                date = `${y}-${m}-${d}`;
            } else if (rawDate && rawDate.includes('/')) {
                const [d, m, y] = rawDate.split('/');
                date = `${y}-${m}-${d}`;
            }

            if (r.isPasa) {
                playaData[normName].batches[batchNum].pasa += kg;
                playaData[normName].pasa += kg;
            } else {
                playaData[normName].batches[batchNum].uva += kg;
                playaData[normName].uva += kg;
                if (date && kg > 100) {
                    const existing = playaData[normName].batches[batchNum].history.find(h => h.date === date);
                    if (existing) existing.uva += kg;
                    else playaData[normName].batches[batchNum].history.push({ date, uva: kg, variedad: r.variedad || 'N/A' });
                }
                if (date) {
                    if (!playaData[normName].batches[batchNum].firstDate || date < playaData[normName].batches[batchNum].firstDate) playaData[normName].batches[batchNum].firstDate = date;
                    if (!playaData[normName].batches[batchNum].lastDate || date > playaData[normName].batches[batchNum].lastDate) playaData[normName].batches[batchNum].lastDate = date;
                }
                if (date && (!playaData[normName].lastDate || date > playaData[normName].lastDate)) playaData[normName].lastDate = date;
            }
        });

        Object.values(playaData).forEach(p => Object.values(p.batches).forEach(b => b.history.sort((a, b) => new Date(a.date) - new Date(b.date))));

        const processedPlayas = this.state.secaderoHas.map(cap => {
            const normCapName = cap.playa.toUpperCase();
            const data = playaData[normCapName] || { batches: {}, uva: 0, pasa: 0, lastDate: null, cuartelId: null };
            let status = 'libre';
            let latestOcupiedDate = null;
            let firstOcupiedDate = null;
            let activeHistory = [];

            Object.keys(data.batches).forEach(bKey => {
                const b = data.batches[bKey];
                if (b.uva > 100) {
                    const bRatio = b.pasa > 0 ? (b.uva / b.pasa) : 999;
                    if (b.pasa === 0 || bRatio > 5) {
                        status = 'ocupado';
                        if (!latestOcupiedDate || b.lastDate > latestOcupiedDate) latestOcupiedDate = b.lastDate;
                        if (!firstOcupiedDate || b.firstDate < firstOcupiedDate) firstOcupiedDate = b.firstDate;
                        activeHistory = activeHistory.concat(b.history);
                    }
                }
            });

            activeHistory = [...new Map(activeHistory.map(item => [item.date + item.variedad, item])).values()].sort((a, b) => new Date(a.date) - new Date(b.date));

            let duration = 15;
            if (latestOcupiedDate) {
                const m = new Date(latestOcupiedDate + 'T12:00:00').getMonth();
                duration = m === 1 ? 20 : (m === 2 ? 30 : 15);
            }

            let daysInPlan = null;
            if (data.cuartelId) {
                const planRow = this.state.plannedData.find(p => String(p.Cuartel || '').includes(String(data.cuartelId)));
                if (planRow) {
                    const rawDays = planRow['Días de secado'] || planRow['dias de secado'];
                    if (rawDays) daysInPlan = parseInt(rawDays, 10);
                }
            }

            const effectiveDuration = (daysInPlan !== null) ? daysInPlan : duration;
            let volumeFactor = 1.0;
            if (daysInPlan !== null) {
                const remainingRatio = Math.min(1, daysInPlan / duration);
                volumeFactor = 0.25 + (0.75 * remainingRatio);
            }

            const processedHistory = activeHistory.map(h => {
                let dDur = 15;
                const m = new Date(h.date + 'T12:00:00').getMonth();
                if (m === 1) dDur = 20; if (m === 2) dDur = 30;
                let hDaysInPlan = null;
                if (data.cuartelId) {
                    const planRow = this.state.plannedData.find(p => String(p.Cuartel || '').includes(String(data.cuartelId)));
                    if (planRow && (planRow['Días de secado'] || planRow['dias de secado'])) hDaysInPlan = parseInt(planRow['Días de secado'] || planRow['dias de secado'], 10);
                }
                const effDur = (hDaysInPlan !== null) ? hDaysInPlan : dDur;
                const dObj = new Date(h.date + 'T12:00:00');
                dObj.setDate(dObj.getDate() + effDur);
                const w = this.getPlayaWeather(cap.playa, h.date);
                if (w.rain > 10) dObj.setDate(dObj.getDate() + 3);

                return { ...h, estDate: dObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), duration: effDur, isDOV: hDaysInPlan !== null };
            });

            const todayObj = new Date(new Date().setHours(0, 0, 0, 0));
            let estDate = '-';
            if (status === 'ocupado' && latestOcupiedDate) {
                const dObj = new Date(latestOcupiedDate + 'T12:00:00');
                dObj.setDate(dObj.getDate() + effectiveDuration);
                const weatherInfo = this.getPlayaWeather(cap.playa, latestOcupiedDate);
                if (weatherInfo.rain > 10) dObj.setDate(dObj.getDate() + 3);
                estDate = dObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
            }

            const occupancy = cap.capKg > 0 ? (data.uva * volumeFactor / cap.capKg) * 100 : 0;
            const weather = this.getPlayaWeather(cap.playa, data.lastDate);

            return { ...cap, ...data, ratio: data.pasa > 0 ? (data.uva / data.pasa).toFixed(1) : '-', status, occupancy, estDate, firstDate: firstOcupiedDate, weather, volumeFactor, isDOV: daysInPlan !== null, dryingDays: effectiveDuration, history: processedHistory };
        });

        const regionalAggregates = [
            { name: 'Camino Truncado', filter: p => p.playa.toUpperCase().includes('TRUNCADO') || (p.playa.toUpperCase().startsWith('PLAYA') && !p.playa.toUpperCase().includes('LCH') && !p.playa.toUpperCase().includes('ESPEJO')) },
            { name: 'La Chimbera', filter: p => p.playa.toUpperCase().includes('LCH') || p.playa.toUpperCase().includes('CHIMBERA') },
            { name: 'Ullum', filter: p => p.playa.toUpperCase().includes('ESPEJO') || p.playa.toUpperCase().includes('ULLUM') || p.playa.toUpperCase().startsWith('SECTOR') }
        ].map(reg => {
            const group = processedPlayas.filter(reg.filter);
            const sumUva = group.reduce((s, p) => s + p.uva, 0);
            const sumCap = group.reduce((s, p) => s + p.capKg, 0);
            const latestDate = group.reduce((max, p) => (p.lastDate && (!max || p.lastDate > max)) ? p.lastDate : max, null);
            return {
                name: reg.name, uva: sumUva, pasa: group.reduce((s, p) => s + p.pasa, 0), capKg: sumCap, ratio: group.reduce((s, p) => s + p.pasa, 0) > 0 ? (sumUva / group.reduce((s, p) => s + p.pasa, 0)).toFixed(1) : '-',
                occupancy: sumCap > 0 ? (group.reduce((s, p) => s + (p.uva * p.volumeFactor), 0) / sumCap) * 100 : 0, status: sumUva > 500 ? 'ocupado' : 'libre', lastDate: latestDate, weather: this.getPlayaWeather(reg.name, latestDate), playas: group, countOcupados: group.filter(p => p.status === 'ocupado').length, countTotal: group.length,
                upcomingLiftingKg: group.filter(p => p.status === 'ocupado' && p.estDate !== '-').reduce((s, p) => s + (p.uva / 4), 0), sumAvailableHas: group.reduce((s, p) => s + (p.status === 'libre' ? (parseFloat(p.has) || 0) : 0), 0),
                nextFreeDate: 'No disp', nextFreeSectorName: 'Varios'
            };
        });

        const getTargetSecadero = (fincaName) => {
            const fn = (fincaName || '').toLowerCase();
            if (fn.includes('truncado') || fn.includes('puente alto') || fn.includes('pa')) return 'Camino Truncado';
            if (fn.includes('chimbera') || fn.includes('lch')) return 'La Chimbera';
            if (fn.includes('espejo') || fn.includes('ullum') || fn.includes('ee')) return 'Ullum';
            return 'Camino Truncado';
        };

        this.renderHarvestRecommendations(processedPlayas, regionalAggregates, getTargetSecadero);
    } // End of renderSecaderosView

    static renderHarvestRecommendations(playas, regions, getTargetSecadero) {
        const statsContainer = document.getElementById('secadero-stats');
        const recommendationsContainer = document.getElementById('secadero-grid');

        // --- A. CÁLCULO DE RITMO Y CAPACIDAD ---
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const recentHarvests = this.state.realData.filter(r => !r.isPasa && new Date(r.fecha) > last7Days);
        const dailyRate = recentHarvests.reduce((s, r) => s + (parseFloat(r.rendimiento) || 0), 0) / 7;

        const totalFreeCapKg = playas.reduce((s, p) => s + (p.status === 'libre' ? p.capKg : 0), 0);
        const capacityDaysLeft = dailyRate > 0 ? (totalFreeCapKg / dailyRate) : 999;

        // Clasificar bloques pendientes por su Secadero Destino
        const pendingBlocks = this.state.mergedData
            .filter(d => d.real < d.planned * 0.9 && d.planned > 1000)
            .map(d => {
                const raw = this.state.plannedData.find(p => String(p.Cuartel) === String(d.cuartel) && String(p.Finca || p.Productor).includes(d.finca));
                const secDays = raw ? parseInt(raw['Días de secado'] || 15, 10) : 15;
                const targetSec = getTargetSecadero(d.finca);
                return { ...d, secDays, targetSec };
            })
            .sort((a, b) => a.secDays - b.secDays);

        const totalFreeHas = playas.reduce((s, p) => s + (p.status === 'libre' ? (parseFloat(p.has) || 0) : 0), 0);

        // --- C. ESTADÍSTICAS DE COLAPSO ---
        statsContainer.innerHTML = `
        <div class="premium-card ${capacityDaysLeft < 2 ? 'alert-critical' : ''}">
            <span class="card-label">Punto de Colapso Global</span>
            <div class="card-value">${capacityDaysLeft > 10 ? 'Seguro' : Math.round(capacityDaysLeft) + ' Días'}</div>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 5px;">Ritmo de Cosecha: ${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(dailyRate)}/día</div>
        </div>
        <div class="premium-card">
            <span class="card-label">Espacio Inmediato</span>
            <div class="card-value" style="color: var(--accent-emerald)">${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(totalFreeCapKg)} / ${totalFreeHas.toFixed(1)} Has</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Kilos y Hectáreas libres ahora</div>
        </div>
        <div class="premium-card">
            <span class="card-label">Pasa x Levantar (4:1)</span>
            <div class="card-value" style="color: var(--accent-primary)">${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(regions.reduce((s, r) => s + r.upcomingLiftingKg, 0))}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Kilos estimados de pasa final</div>
        </div>
    `;

        // --- D. PANEL DE RECOMENDACIONES LOGÍSTICAS ---
        const recommendationsHtml = `
        <div class="playa-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8)); border: 1px solid var(--accent-primary); margin-bottom: 2rem;">
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                <h3 style="display: flex; align-items: center; gap: 10px; color: var(--accent-primary);">
                    <i data-lucide="map-pin"></i> Planner Logístico: Cosecha ➔ Secadero
                </h3>
            </div>
            <div style="padding: 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                ${regions.map(r => {
            const regionalBlocks = pendingBlocks.filter(b => b.targetSec === r.name);
            const isFull = r.occupancy > 85;
            const liftingDate = r.nextFreeDate;

            return `
                        <div style="background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 12px; border: 1px solid ${isFull ? 'var(--accent-warning)' : 'rgba(255,255,255,0.1)'};">
                            <h4 style="color: var(--accent-primary); font-size: 1.1rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">Secadero ${r.name}</h4>

                            <div style="margin-bottom: 1.5rem;">
                                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Estado de Capacidad:</div>
                                <div style="font-size: 0.9rem; font-weight: 700; color: ${isFull ? 'var(--accent-danger)' : 'var(--accent-emerald)'};">
                                    ${isFull ? `LLENO (${r.nextFreeSectorName}: ${liftingDate})` : `DISPONIBLE (${r.nextFreeSectorName})`}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">Libre: ${r.sumAvailableHas.toFixed(1)} Has inmediatas</div>
                            </div>

                            <div style="margin-bottom: 1.5rem;">
                                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Levantado de Pasa Proyectado:</div>
                                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">~${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(r.upcomingLiftingKg)} de Pasa</div>
                            </div>

                            <h5 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">RECOMENDACIÓN COSECHA:</h5>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${regionalBlocks.length > 0 ? regionalBlocks.slice(0, 2).map(b => {
                const initials = this.getFincaInitials(b.finca);
                return `
                                    <div style="font-size: 0.8rem; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px; border-left: 3px solid ${isFull ? '#64748b' : 'var(--accent-emerald)'};">
                                        <b style="${isFull ? 'opacity: 0.5' : ''}">[${initials}] C${b.cuartel} ${b.variety}</b>
                                        <div style="font-size: 0.7rem; color: ${isFull ? 'var(--accent-danger)' : 'var(--accent-emerald)'}; margin-top: 4px;">
                                            ${isFull ? `No cosechar hasta el ${liftingDate}` : `COSECHAR AHORA (Ahorra ${b.secDays} días)`}
                                        </div>
                                    </div>
                                `;
            }).join('') : '<div style="font-size: 0.8rem; opacity: 0.5;">No hay cuarteles pendientes para esta zona.</div>'}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
            <div style="padding: 1rem 1.5rem; background: rgba(0,0,0,0.2); font-size: 0.8rem; border-top: 1px solid var(--glass-border); color: var(--text-secondary);">
                <i data-lucide="info" style="width: 14px; vertical-align: middle;"></i>
                El cálculo del <b>Levantado de Pasa</b> se estima para las fechas indicadas usando la relación estándar 4:1 sobre la uva actual en secado.
            </div>
        </div>
    `;

        // Inyectamos las recomendaciones y luego el grid de regiones
        const gridContent = recommendationsHtml + regions.map(r => {
            const isExpanded = this.state.expandedRegions.has(r.name);
            const playasHtml = r.playas.map(p => {
                const displayName = p.playa.replace(/Playa |Sector /gi, 'Secadero ');
                const isDetailed = this.state.expandedSecaderos.has(p.playa);

                let detailedRowsHtml = '';
                if (isDetailed && p.history.length > 0) {
                    detailedRowsHtml = `
                    <div style="margin-top: 10px; border-top: 1px dashed var(--glass-border); padding-top: 10px; font-size: 0.65rem;">
                        ${p.history.map(h => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--text-secondary);">
                                <span>${h.date.split('-').slice(1).reverse().join('/')}: <b>${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(h.uva)}</b> (${h.variedad})</span>
                                <span style="color: var(--accent-emerald)">➔ ${h.estDate}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
                }

                return `
                <div class="playa-mini-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600; font-size: 0.85rem;">${displayName}</span>
                        <div style="display: flex; gap: 5px; align-items: center;">
                            <span class="status-indicator status-${p.status}" style="font-size: 0.6rem; padding: 1px 6px;">${p.status === 'ocupado' ? 'Ocupado' : 'Libre'}</span>
                            <button onclick="window.secaderosControllerRef.toggleSecaderoDetails('${p.playa}')" class="btn-icon" style="padding: 2px; border: none; background: none;">
                                <i data-lucide="${isDetailed ? 'chevron-up' : 'chevron-down'}" style="width: 14px; height: 14px; color: var(--text-secondary);"></i>
                            </button>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; color: var(--text-secondary);">
                        <div title="Uva tendida">U: ${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(p.uva)}</div>
                        <div title="Pasa levantada">P: ${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(p.pasa)}</div>
                        <div title="Ratio">R: ${p.ratio}</div>
                        <div title="Ocupación">${Math.round(p.occupancy)}%</div>
                    </div>
                    ${detailedRowsHtml}
                </div>
            `;
            }).join('');

            return `
            <div class="playa-card" style="grid-column: 1 / -1; margin-bottom: 2rem; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <button onclick="window.secaderosControllerRef.toggleRegionDetails('${r.name}')" class="btn-icon" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 5px; border-radius: 6px;">
                            <i data-lucide="${isExpanded ? 'minus' : 'plus'}" style="width: 18px; height: 18px; color: var(--accent-primary);"></i>
                        </button>
                        <div>
                            <h3 style="color: var(--accent-primary); font-size: 1.6rem; margin-bottom: 0.2rem; font-weight: 700;">${r.name}</h3>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <span class="status-indicator status-${r.status}" style="font-size: 0.8rem; padding: 4px 12px;">
                                    ${r.countOcupados} de ${r.countTotal} Sectores en uso
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="display: flex; gap: 20px; align-items: center; background: rgba(255,255,255,0.03); padding: 0.8rem 1.2rem; border-radius: 12px; border: 1px solid var(--glass-border);">
                            <span style="font-size: 0.95rem; color: ${r.weather.rain > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)'}; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="cloud-rain" style="width: 18px;"></i> ${r.weather.rain} mm
                            </span>
                            <span style="font-size: 0.95rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                                 <i data-lucide="thermometer" style="width: 18px;"></i> ${r.weather.temp ? r.weather.temp + '°C' : '--'}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="playa-details" style="grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 2rem; background: transparent; border: none; padding: 0;">
                    <div class="stat-box" title="Peso bruto total en secado">
                        <div class="playa-label">Carga Bruta (Kg)</div>
                        <div class="playa-val">${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(r.uva)}</div>
                    </div>
                    <div class="stat-box" title="Kilos ya levantados">
                        <div class="playa-label">Levantado (Pasa)</div>
                        <div class="playa-val">${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(r.pasa)}</div>
                    </div>
                    <div class="stat-box">
                        <div class="playa-label">Ratio Promedio</div>
                        <div class="playa-val" style="color: ${r.ratio < 6 && r.ratio !== '-' ? 'var(--accent-emerald)' : 'var(--accent-warning)'};">${r.ratio}</div>
                    </div>
                    <div class="stat-box" title="Carga ajustada por pérdida de volumen: Kilos x Factor de Secado">
                        <div class="playa-label">Ocupación Real (Vol)</div>
                        <div class="playa-val" style="color: var(--accent-primary);">${Math.round(r.occupancy)}% </div>
                        <div style="font-size: 0.65rem; color: var(--text-secondary);">Cap: ${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(r.capKg)}</div>
                    </div>
                </div>

                <div class="ratio-meter" style="padding-top: 1.5rem; border-top: 1px solid var(--glass-border); margin-bottom: ${isExpanded ? '2rem' : '0'};">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">
                        <span style="font-weight: 500;">Estado de Saturación:
                            <b style="color: ${r.occupancy > 90 ? 'var(--accent-danger)' : (r.occupancy > 75 ? 'var(--accent-warning)' : 'var(--accent-emerald)')};">
                                ${r.occupancy > 90 ? 'COLAPSO CRÍTICO' : (r.occupancy > 75 ? 'RIESGO ALTO' : 'DISPONIBLE')}
                            </b>
                        </span>
                        <span>Último Tendido: <b style="color: var(--text-primary);">${r.lastDate || 'N/A'}</b></span>
                    </div>
                    <div class="progress-bar" style="height: 14px; background: rgba(255,255,255,0.05); border-radius: 7px;">
                        <div class="progress-bar-fill ${r.occupancy > 90 ? 'bg-red' : (r.occupancy > 75 ? 'bg-amber' : 'bg-emerald')}"
                             style="width: ${Math.min(r.occupancy, 100)}%;"></div>
                    </div>
                </div>

                ${isExpanded ? `
                    <div style="border-top: 1px solid var(--glass-border); padding-top: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        ${playasHtml}
                    </div>
                ` : ''}
            </div>
        `;
        }).join('');

        recommendationsContainer.innerHTML = gridContent;
        lucide.createIcons();
        this.renderSecaderosGantt(regions, capacityDaysLeft);
    }



    static renderSecaderosGantt(regionalAggregates, collapseDays) {
        const gantt = document.getElementById('secadero-gantt');
        if (!gantt) return;

        // 1. Determinar rango de fechas: 30 días atrás y 45 días adelante
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 30);
        const end = new Date(today);
        end.setDate(today.getDate() + 45);

        const days = [];
        let curr = new Date(start);
        while (curr <= end) {
            days.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }

        // Calcular fecha de colapso para el gráfico (offset desde el inicio del gráfico)
        const diffToToday = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
        let collapseLeft = -1;
        if (collapseDays < 45) {
            collapseLeft = (diffToToday + collapseDays) * 60;
        }

        // 2. Estructura con Corner Fijo
        let html = `
        <div class="gantt-header-sticky">
            <div class="gantt-corner">Sectores / Días</div>
            <div class="gantt-timeline">
                ${days.map(d => `
                    <div class="gantt-day ${d.toDateString() === today.toDateString() ? 'today' : ''}">
                        ${d.getDate()}/${d.getMonth() + 1}
                    </div>
                `).join('')}
                ${collapseLeft > 0 ? `<div class="gantt-collapse-line" style="left: ${collapseLeft}px;">
                    <span>PROYECCIÓN COLAPSO</span>
                </div>` : ''}
            </div>
        </div>
    `;

        // 3. Filas Unificadas (una por región)
        html += regionalAggregates.map(r => {
            const isExpanded = this.state.expandedRegions.has(r.name);

            // Barras regionales (consolidado en una fila si no está expandido)
            const regionalBarsHtml = r.playas
                .filter(p => p.status === 'ocupado' && p.lastDate)
                .map(p => {
                    const dryingStart = new Date(p.lastDate + 'T12:00:00');
                    const diffStart = Math.ceil((dryingStart - start) / (1000 * 60 * 60 * 24));
                    const left = Math.max(0, diffStart * 60);
                    // Ancho dinámico basado en los días de secado reales de ese sector
                    const width = (p.dryingDays || 15) * 60;
                    if (left < days.length * 60) {
                        const secNum = p.playa.split(' ').pop();
                        const occupancy = Math.round(p.occupancy);
                        return `<div class="gantt-bar status-${p.status}"
                                 style="left: ${left}px; width: ${width}px; opacity: 0.7; height: 18px; top: 11px; font-size: 0.55rem; border: ${p.isDOV ? '1px solid #10b981' : 'none'};"
                                 title="${p.playa} ${p.isDOV ? '(DOV)' : ''} | Libre: ${p.estDate}">S${secNum} (${occupancy}%)</div>`;
                    }
                    return '';
                }).join('');

            // Filas de detalle (si está expandido)
            let detailRowsHtml = '';
            if (isExpanded) {
                detailRowsHtml = r.playas.map(p => {
                    const displayName = p.playa.replace(/Playa |Sector /gi, 'Secadero ');
                    const isSecDetailed = this.state.expandedSecaderos.has(p.playa);

                    let barHtml = '';
                    if (p.status === 'ocupado') {
                        if (isSecDetailed && p.history && p.history.length > 0) {
                            // Mostrar múltiples barras escalonadas por cada tendido individual
                            barHtml = p.history.map((h, hIdx) => {
                                const hStart = new Date(h.date + 'T12:00:00');
                                const diffStart = Math.ceil((hStart - start) / (1000 * 60 * 60 * 24));
                                const left = Math.max(0, diffStart * 60);
                                const width = h.duration * 60;
                                const topOffset = (hIdx * 12) + 12;

                                if (left < days.length * 60) {
                                    return `<div class="gantt-bar"
                                             style="left: ${left}px; width: ${width}px; height: 10px; top: ${topOffset}px; font-size: 0.45rem; background: var(--accent-emerald); opacity: 0.9; line-height: 10px; border-radius: 4px;"
                                             title="Tendido ${h.date}: ${h.variedad} (${(v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)(h.uva)}) -> Libre: ${h.estDate}">
                                             T${hIdx + 1}
                                        </div>`;
                                }
                                return '';
                            }).join('');
                        } else if (p.firstDate && p.history.length > 0) {
                            // Barra consolidada: Empieza en la PRIMERA carga activa y termina en la LTIMA liberación
                            const batchStart = new Date(p.firstDate + 'T12:00:00');
                            const diffStart = Math.ceil((batchStart - start) / (1000 * 60 * 60 * 24));
                            const left = Math.max(0, diffStart * 60);

                            // Calculamos fecha de fin máxima del history
                            const lastEstObj = p.history.reduce((max, curr) => {
                                // Assuming current year for estDate if not specified, or a fixed year like 2026
                                const [d, m] = curr.estDate.split('/').map(Number);
                                const curObj = new Date(today.getFullYear(), m - 1, d); // Use current year for comparison
                                return curObj > max ? curObj : max;
                            }, batchStart);

                            const widthDays = Math.ceil((lastEstObj - batchStart) / (1000 * 60 * 60 * 24));
                            const width = Math.max(1, widthDays) * 60;

                            if (left < days.length * 60) {
                                barHtml = `<div class="gantt-bar status-${p.status}" style="left: ${left}px; width: ${width}px;">${Math.round(p.occupancy)}%</div>`;
                            }
                        }
                    }

                    const rowHeight = isSecDetailed && p.history && p.history.length > 1 ? (p.history.length * 12 + 25) : 45;

                    return `
                    <div class="gantt-row detal-row" style="background: rgba(255,255,255,0.01); height: ${rowHeight}px;">
                        <div class="gantt-label" style="font-size: 0.75rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between; border-right: 1px solid rgba(255,255,255,0.05);">
                            <span>${displayName}</span>
                            ${p.status === 'ocupado' ? `
                                <button onclick="window.secaderosControllerRef.toggleSecaderoDetails('${p.playa}')" style="background: none; border: none; cursor: pointer; padding: 2px; margin-right: 10px;">
                                    <i data-lucide="${isSecDetailed ? 'chevron-up' : 'chevron-down'}" style="width: 12px; height: 12px; color: var(--text-secondary);"></i>
                                </button>
                            ` : ''}
                        </div>
                        <div class="gantt-timeline-row">
                            ${days.map(() => `<div class="gantt-grid-line"></div>`).join('')}
                            ${barHtml}
                        </div>
                    </div>
                `;
                }).join('');
            }

            return `
            <div class="gantt-row regional-row" style="background: rgba(255,255,255,0.03); border-top: 1px solid var(--glass-border);">
                <div class="gantt-label" style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    <button onclick="window.secaderosControllerRef.toggleRegionDetails('${r.name}')" class="btn-icon" style="padding: 2px;">
                        <i data-lucide="${isExpanded ? 'minus' : 'plus'}" style="width: 14px; height: 14px;"></i>
                    </button>
                    ${r.name}
                </div>
                <div class="gantt-timeline-row">
                    ${days.map(() => `<div class="gantt-grid-line" style="border-left: 1px solid rgba(255,255,255,0.08);"></div>`).join('')}
                    ${isExpanded ? '' : regionalBarsHtml}
                </div>
            </div>
            ${detailRowsHtml}
        `;
        }).join('');

        gantt.innerHTML = html;
        lucide.createIcons();

        // Auto-scroll a "Hoy" (está a ~1800px del inicio si son 30 días x 60px)
        setTimeout(() => {
            const container = document.querySelector('.gantt-container');
            if (container) container.scrollLeft = diffToToday * 60 - 150;
        }, 150);
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



}

// Global expose
if (typeof window !== "undefined") {
    window.secaderosControllerRef = SecaderosController;
}
