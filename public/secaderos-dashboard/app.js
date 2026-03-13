const CONFIG = {
    csvPath: 'https://raw.githubusercontent.com/Leonixorm/Leonixorm/main/Programaci%C3%B3n%20Cosecha.csv',
    apiRoot: 'https://corsproxy.io/?',
    sources: [
        { name: 'Fincas Propias', key: '12345NC5xQdXAxT6jj8WrPH26krbn2y7sf6tt8mf' },
        { name: 'Ullum', key: '123450S8fgNhWDfKUNxnzFr7xb6DK1us2OqJK2' }
    ],
    startDate: '2025-12-01',
    historyPath: '/Fuentes/secadero/Cosecha 12-25.csv',
    secaderoPath: '../CSV/Has de secadero.csv',
    lluviasPath: '../CSV/lluvias.csv',
    climasPath: '../CSV/Climas4.csv'
};

let state = {
    plannedData: [],
    realData: [],
    mergedData: [],
    secaderoHas: [], // Capacidades de playas/sectores
    rainData: [],    // Registros de lluvia
    climaData: {},   // Promedios térmicos por finca/fecha
    expandedRegions: new Set(), // Regiones expandidas en Secaderos
    expandedSecaderos: new Set(), // Sectores individuales expandidos
    filters: {
        finca: ['all'],
        variedad: ['all'],
        tipo: ['all'],
        estado: ['all'],
        histCuartel: ['all'],
        histMateria: ['all']
    },
    currentView: 'secaderos',
    historicalData: [],
    charts: {}
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Lucide icons
    lucide.createIcons();

    await initDashboard();

    // Event listeners
    document.getElementById('refresh-btn').addEventListener('click', () => initDashboard());

    // Nav Listeners
    document.getElementById('nav-dashboard').addEventListener('click', () => switchView('dashboard'));
    document.getElementById('nav-daily').addEventListener('click', () => switchView('daily'));
    document.getElementById('nav-historical').addEventListener('click', () => switchView('historical'));
    document.getElementById('nav-secaderos').addEventListener('click', () => switchView('secaderos'));
    const navSettings = document.getElementById('nav-settings');
    if (navSettings) navSettings.addEventListener('click', () => switchView('settings'));

    // Manual Upload Listeners
    const upPlanned = document.getElementById('upload-planned');
    if (upPlanned) upPlanned.addEventListener('change', (e) => handleManualCSV(e, 'plannedData'));
    const upHistory = document.getElementById('upload-history');
    if (upHistory) upHistory.addEventListener('change', (e) => handleManualCSV(e, 'historicalData'));
    const upSecadero = document.getElementById('upload-secaderos');
    if (upSecadero) upSecadero.addEventListener('change', (e) => handleManualCSV(e, 'secaderoHas'));
    const upRain = document.getElementById('upload-rain');
    if (upRain) upRain.addEventListener('change', (e) => handleManualCSV(e, 'rainData'));
    const upClima = document.getElementById('upload-clima');
    if (upClima) upClima.addEventListener('change', (e) => handleManualCSV(e, 'climaData'));

    const reSyncBtn = document.getElementById('re-sync-btn');
    if (reSyncBtn) reSyncBtn.addEventListener('click', () => initDashboard());
});


// UI Helpers for Custom Dropdowns
function renderCustomDropdown(elementId, label, options, currentSelected, onUpdate) {
    const originalSelect = document.getElementById(elementId);

    // Find or create container
    let container = document.getElementById(elementId + '-container');
    if (!container) {
        if (!originalSelect) return; // If no select and no container, can't render
        container = document.createElement('div');
        container.id = elementId + '-container';
        container.className = 'custom-dropdown';
        originalSelect.parentNode.insertBefore(container, originalSelect);

        // Force hide native select
        originalSelect.classList.add('custom-replaced');
        originalSelect.style.display = 'none';
    }

    // Determine display text
    const allSelected = currentSelected.includes('all');
    let displayText = `${label}: ${allSelected ? 'Todas' : (currentSelected.length + ' selec.')}`;
    if (!allSelected && currentSelected.length === 1) displayText = `${label}: ${currentSelected[0]}`;
    if (!allSelected && currentSelected.length === 0) displayText = `${label}: Ninguna`;

    // Build HTML
    const html = `
        <div class="dropdown-trigger" onclick="toggleDropdown('${elementId}-container')">
            <span>${displayText}</span>
            <i data-lucide="chevron-down" style="width: 16px;"></i>
        </div>
        <div class="dropdown-menu" id="${elementId}-menu">
            <div class="dropdown-item" onclick="selectDropdownOption('${elementId}', 'all')">
                <input type="checkbox" ${allSelected ? 'checked' : ''} readonly>
                <span>Todas</span>
            </div>
            ${options.map(opt => `
                <div class="dropdown-item" onclick="selectDropdownOption('${elementId}', '${opt}')">
                    <input type="checkbox" ${currentSelected.includes(opt) ? 'checked' : ''} readonly>
                    <span>${opt}</span>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = html;

    // Store callback and options in a global registry if needed, or attach to DOM
    container.dataset.onUpdateId = elementId;

    // Refresh icons
    lucide.createIcons();
}

window.toggleDropdown = function (containerId) {
    const menu = document.querySelector(`#${containerId} .dropdown-menu`);
    const allMenus = document.querySelectorAll('.dropdown-menu');
    const allBars = document.querySelectorAll('.controls-bar');

    allMenus.forEach(m => {
        if (m.id !== menu.id) m.classList.remove('open');
    });

    // Quitar clase de prioridad de todas las barras menos la actual
    allBars.forEach(b => b.classList.remove('has-open-dropdown'));

    menu.classList.toggle('open');

    // Si se abrió, darle prioridad a su barra padre
    if (menu.classList.contains('open')) {
        const parentBar = menu.closest('.controls-bar');
        if (parentBar) parentBar.classList.add('has-open-dropdown');
    }
};

window.selectDropdownOption = function (elementId, value) {
    const keyMap = {
        'finca-filter': 'finca',
        'variedad-filter': 'variedad',
        'type-filter': 'tipo',
        'status-filter': 'estado',
        'hist-cuartel-filter': 'histCuartel',
        'hist-materia-filter': 'histMateria'
    };

    const stateKey = keyMap[elementId];
    if (!stateKey) return;

    let current = [...state.filters[stateKey]];

    if (value === 'all') {
        current = current.includes('all') ? [] : ['all'];
    } else {
        if (current.includes('all')) current = [];
        current = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        if (current.length === 0) current = ['all'];
    }

    state.filters[stateKey] = current;
    populateFilters();
    renderDashboard();
};

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.controls-bar.has-open-dropdown').forEach(b => b.classList.remove('has-open-dropdown'));
    }
});

function handleMultiSelect(key, values) {
    // Deprecated for custom dropdowns, logic moved to selectDropdownOption
    // But kept for compatibility if needed or reused logic
    state.filters[key] = values;
    renderDashboard();
}

function populateFilters() {
    const fincas = [...new Set(state.mergedData.map(d => d.finca))].sort();
    const varieties = [...new Set(state.mergedData.map(d => d.variety))].sort();

    renderCustomDropdown('finca-filter', 'Fincas', fincas, state.filters.finca);
    renderCustomDropdown('variedad-filter', 'Variedad', varieties, state.filters.variedad);

    // Static filters
    renderCustomDropdown('type-filter', 'Tipo', ['Propios', 'Terceros'], state.filters.tipo);
    renderCustomDropdown('status-filter', 'Estado', ['En proceso', 'Terminado'], state.filters.estado);

    // Materia Prima (Estado en Cosecha 13-25)
    renderCustomDropdown('hist-materia-filter', 'Materia', ['Uva', 'Pasa'], state.filters.histMateria);

    // Populate Historical Cuartel Filter
    populateHistoricalCuartels();
}

function populateHistoricalCuartels() {
    // Detectar si estamos en vista histórica
    if (state.historicalData.length === 0) return;

    // Detectar llaves
    const sample = state.historicalData[0];
    const kFinca = Object.keys(sample).find(k => k.toLowerCase() === 'finca') || 'Finca';
    const kVariedad = Object.keys(sample).find(k => k.toLowerCase() === 'variedad') || 'Variedad';
    const kCuartel = Object.keys(sample).find(k => k.toLowerCase() === 'cuartel') || 'Cuartel';

    // Normalizar para comparación
    const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();

    // Filtrar data por finca y variedad actuales del dashboard
    const available = state.historicalData.filter(d => {
        const fincaMatch = state.filters.finca.includes('all') || state.filters.finca.some(f => normalize(f) === normalize(d[kFinca]));
        const varietyMatch = state.filters.variedad.includes('all') || state.filters.variedad.some(v => normalize(v) === normalize(d[kVariedad]));
        return fincaMatch && varietyMatch;
    });

    const cuarteles = [...new Set(available.map(d => d[kCuartel]))].filter(Boolean).sort((a, b) => a - b);

    renderCustomDropdown('hist-cuartel-filter', 'Cuartel', cuarteles, state.filters.histCuartel);
}

function applyFiltersToData(data) {
    const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
    return data.filter(d => {
        const fincaMatch = state.filters.finca.includes('all') || state.filters.finca.some(f => normalize(f) === normalize(d.finca));
        const varietyMatch = state.filters.variedad.includes('all') || state.filters.variedad.some(v => normalize(v) === normalize(d.variety));
        const typeMatch = state.filters.tipo.includes('all') || state.filters.tipo.includes(d.tipo);
        const statusMatch = state.filters.estado.includes('all') || state.filters.estado.includes(d.status);

        return fincaMatch && varietyMatch && typeMatch && statusMatch;
    });
}

async function fetchSecaderoData() {
    return new Promise((resolve) => {
        Papa.parse(CONFIG.secaderoPath, {
            download: true,
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (results) => {
                state.secaderoHas = results.data.map(d => ({
                    playa: String(d.Playa || '').trim(),
                    has: parseFloat(String(d.Has || 0).replace(',', '.')) || 0,
                    capKg: parseFloat(String(d['Capacidad de KG tendido'] || 0).replace(/\./g, '')) || 0
                }));
                console.log("Secadero capacities loaded:", state.secaderoHas.length);
                resolve();
            },
            error: () => resolve()
        });
    });
}

// Helper para fechas D/M/YYYY
function parseDMY(str) {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length < 3) return null;
    return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00`);
}

function getPlayaWeather(playaName, startDateStr) {
    if (!startDateStr) return { rain: 0, temp: null };

    // Normalizar Finca
    let finca = 'Camino Truncado';
    if (playaName.toUpperCase().includes('LCH')) finca = 'La Chimbera';
    if (playaName.toUpperCase().includes('SECTOR')) finca = 'El Espejo'; // Ullum

    const start = new Date(startDateStr + 'T00:00:00');
    const today = new Date();

    // Lluvia
    let totalRain = 0;
    state.rainData.forEach(r => {
        const rFinca = String(r.Finca || '');
        if (rFinca.includes(finca) || (finca === 'El Espejo' && rFinca.includes('Espejo'))) {
            const rDate = parseDMY(r.Fecha);
            if (rDate && rDate >= start && rDate <= today) {
                totalRain += parseFloat(String(r.Milimetros || 0).replace(',', '.')) || 0;
            }
        }
    });

    // Temperatura (Promedio del periodo)
    let tempSum = 0;
    let tempCount = 0;

    // Mapeo de literales de Clima a Finca
    const climaLiterals = Object.keys(state.climaData).filter(k => {
        const lit = k.split('_')[0];
        if (finca === 'Camino Truncado' && lit.includes('Camino Truncado')) return true;
        if (finca === 'La Chimbera' && lit.includes('LCH')) return true;
        if (finca === 'El Espejo' && lit.includes('Espejo')) return true;
        return false;
    });

    climaLiterals.forEach(key => {
        const dateStr = key.split('_')[1];
        const cDate = parseDMY(dateStr);
        if (cDate && cDate >= start && cDate <= today) {
            tempSum += state.climaData[key].sum;
            tempCount += state.climaData[key].count;
        }
    });

    return {
        rain: totalRain,
        temp: tempCount > 0 ? (tempSum / tempCount).toFixed(1) : null
    };
}

async function fetchRainData() {
    return new Promise((resolve) => {
        Papa.parse(CONFIG.lluviasPath, {
            download: true,
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (results) => {
                state.rainData = results.data;
                console.log("Rain data loaded:", state.rainData.length);
                resolve();
            },
            error: () => resolve()
        });
    });
}

async function fetchClimaData() {
    return new Promise((resolve) => {
        // Al ser 19MB, PapaParse puede tardar o fallar en descarga. 
        // Intentamos cargar y procesar promedios diarios por "Literal" (Finca)
        Papa.parse(CONFIG.climasPath, {
            download: true,
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (results) => {
                const summary = {};
                results.data.forEach(r => {
                    const literal = String(r.Literal || '');
                    const date = r['Solo Fecha'];
                    const tempRaw = String(r.Temp || '').replace(',', '.');
                    const temp = parseFloat(tempRaw);

                    if (literal && date && !isNaN(temp)) {
                        const key = `${literal}_${date}`;
                        if (!summary[key]) summary[key] = { sum: 0, count: 0 };
                        summary[key].sum += temp;
                        summary[key].count++;
                    }
                });
                state.climaData = summary;
                console.log("Clima daily summary generated.");
                resolve();
            },
            error: () => resolve()
        });
    });
}

async function initDashboard() {
    updateBtnState(true);
    showStatus('Iniciando...');

    try {
        if (state.plannedData.length === 0) {
            showStatus('Cargando Programación...');
            await fetchPlannedData();
        }

        if (state.historicalData.length === 0) {
            await fetchHistoricalData();
        }

        if (state.secaderoHas.length === 0) {
            showStatus('Cargando Secaderos...');
            await fetchSecaderoData();
        }

        if (state.rainData.length === 0) {
            showStatus('Cargando Lluvias...');
            await fetchRainData();
        }

        if (Object.keys(state.climaData).length === 0) {
            showStatus('Cargando Clima...');
            await fetchClimaData();
        }

        showStatus('Consultando APIs (Dec-Hoy)...');
        await fetchRealDataAll();

        mergeAndProcess();
        populateFilters();
        updateSyncDetails();

        if (state.currentView === 'dashboard') renderDashboard();
        else if (state.currentView === 'daily') renderDailyView();
        else if (state.currentView === 'historical') renderHistoricalView();
        else if (state.currentView === 'secaderos') renderSecaderosView();
        else if (state.currentView === 'settings') updateSyncDetails();

        showStatus(`Actualizado: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
        console.error('Error:', error);
        showStatus(`Error: ${error.message}. Ver Panel Config.`, true);
        updateSyncDetails();
    } finally {
        updateBtnState(false);
    }
}

async function handleManualCSV(e, targetStateKey) {
    const file = e.target.files[0];
    if (!file) return;

    showStatus(`Procesando ${file.name}...`);
    Papa.parse(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        complete: async (results) => {
            if (targetStateKey === 'secaderoHas') {
                state.secaderoHas = results.data.map(d => ({
                    playa: String(d.Playa || '').trim(),
                    has: parseFloat(String(d.Has || 0).replace(',', '.')) || 0,
                    capKg: parseFloat(String(d['Capacidad de KG tendido'] || 0).replace(/\./g, '')) || 0
                }));
            } else if (targetStateKey === 'climaData') {
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
                state.climaData = summary;
            } else {
                state[targetStateKey] = results.data;
            }
            console.log(`Manual load successful for ${targetStateKey}:`, results.data.length, "rows");

            // Re-procesar todo
            mergeAndProcess();
            populateFilters();
            renderDashboard(); // O la vista actual
            showStatus(`${file.name} cargado.`);
            updateSyncDetails();
        }
    });
}

// 1. Data Fetching
async function fetchPlannedData() {
    return new Promise((resolve, reject) => {
        Papa.parse(CONFIG.csvPath, {
            download: true,
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (results) => {
                state.plannedData = results.data;
                console.log("Planned data loaded:", state.plannedData.length);
                resolve();
            },
            error: (err) => reject(err)
        });
    });
}

async function fetchHistoricalData() {
    if (state.historicalData.length > 0) return;

    return new Promise((resolve) => {
        Papa.parse(CONFIG.historyPath, {
            download: true,
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            complete: (results) => {
                state.historicalData = results.data;
                console.log("Historical data loaded automatically");
                resolve();
            },
            error: (err) => {
                console.warn("CORS bloqueó carga automática de Historia.");
                resolve();
            }
        });
    });
}

function handleManualHistory(e) {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
        header: true,
        delimiter: ";",
        skipEmptyLines: true,
        complete: (results) => {
            state.historicalData = results.data;
            console.log("Manual History loaded:", state.historicalData.length, "rows");
            populateFilters();
            if (state.currentView === 'historical') renderHistoricalView();
            showStatus("Historia cargada.");
        }
    });
}

async function fetchRealDataAll() {
    const ranges = getMonthRanges(CONFIG.startDate);
    const apiTasks = [];

    for (const source of CONFIG.sources) {
        for (const range of ranges) {
            apiTasks.push({ source, start: range.start, end: range.end });
        }
    }

    // Procesar en lotes pequeños con delay para evitar Error 429 (Too Many Requests)
    const batchSize = 5;
    let allData = [];

    for (let i = 0; i < apiTasks.length; i += batchSize) {
        const batch = apiTasks.slice(i, i + batchSize);
        showStatus(`Sincronizando registros (${i}/${apiTasks.length})...`);

        const batchResults = await Promise.all(
            batch.map(t => fetchMonthData(t.source, t.start, t.end))
        );

        allData = allData.concat(batchResults.flat());

        // Pequeño delay de 300ms entre lotes para no saturar el proxy/API
        if (i + batchSize < apiTasks.length) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    state.realData = allData;
    const totalRecords = state.realData.length;
    const totalKg = state.realData.reduce((s, r) => s + (parseFloat(r.rendimiento) || 0), 0);
    console.log(`📡 Fetch finalizado. Total: ${totalRecords} registros, ${Math.round(totalKg).toLocaleString()} kg.`);

    updateSyncDetails();

    if (totalRecords > 0) {
        showStatus('Datos de API cargados.');
    } else {
        showStatus('Sin datos de API (o bloqueado por servidor).', true);
    }
}

function updateSyncDetails() {
    const el = document.getElementById('sync-details');
    if (!el) return;

    el.innerHTML = `
        <div style="margin-bottom: 0.5rem;"><b style="color: var(--accent-primary)">Planing:</b> ${state.plannedData.length} filas</div>
        <div style="margin-bottom: 0.5rem;"><b style="color: var(--accent-emerald)">API Harvest:</b> ${state.realData.length} registros (${formatKgSimple(state.realData.reduce((s, r) => s + (parseFloat(r.rendimiento) || 0), 0))})</div>
        <div style="margin-bottom: 0.5rem;"><b style="color: var(--accent-warning)">Histórico:</b> ${state.historicalData.length} registros</div>
        <div style="margin-bottom: 0.5rem;"><b style="color: var(--accent-danger)">Secaderos:</b> ${state.secaderoHas.length} playas configuradas</div>
        <div style="margin-bottom: 0.5rem;"><b style="color: #60a5fa">Clima:</b> ${state.rainData.length} lluvias, ${Object.keys(state.climaData).length} d-clima</div>
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; opacity: 0.6;">
            Última actualización: ${new Date().toLocaleTimeString()}
        </div>
    `;
}
async function fetchMonthData(source, start, end) {
    const sofiaUrl = `https://apisofia.sofiagestionagricola.cl/trabajvsfaenas?nombre_usuario=NATURALFOOD&key_usuario=${source.key}&fecha_inicial=${start}&fecha_final=${end}`;

    // Añadimos un cache-buster (timestamp) para evitar que el proxy nos devuelva datos viejos
    const cacheBuster = `&_cb=${new Date().getTime()}`;
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(sofiaUrl + cacheBuster)}`;

    try {
        const response = await fetch(proxiedUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let data;
        try {
            data = await response.json();
        } catch (jsonErr) {
            console.warn(`[API ${source.name}] Error en JSON (${start} a ${end}): Datos truncados.`);
            return [];
        }
        const filtered = data.filter(r => {
            const f = String(r.faena || '').toUpperCase();
            const l = String(r.labor || '').toUpperCase();
            const yieldVal = parseFloat(r.rendimiento) || 0;

            // Filtro solicitado: Faena "COSECHA" y Labor contiene "COSECHA KG"
            const isHarvestFaena = f === 'COSECHA';
            const isCosechaKg = l.includes('COSECHA KG');

            // Nuevo filtro: Labores de "Levantado" (Pasa)
            const isLevantado = l.includes('LEVANTADO');

            return ((isHarvestFaena && isCosechaKg) || isLevantado) && yieldVal > 0;
        }).map(r => {
            const l = String(r.labor || '').toUpperCase();
            return {
                ...r,
                sourceName: source.name,
                isPasa: l.includes('LEVANTADO') // Flag para distinguir en el procesamiento
            };
        });

        if (filtered.length > 0) {
            const totalKg = filtered.reduce((s, r) => s + (parseFloat(r.rendimiento) || 0), 0);
            console.log(`[API ${source.name}] ${start}: ${filtered.length} registros, ${Math.round(totalKg).toLocaleString()} kg.`);
        }
        return filtered;
    } catch (e) {
        console.error(`[API ${source.name}] Error en ${start} a ${end}:`, e.message);
        return [];
    }
}

// 2. Data Processing
function mergeAndProcess() {
    // Helper para buscar columnas sin importar mayúsculas/espacios
    // Helper para buscar columnas con sinónimos (Finca, Productor, etc)
    const getVal = (obj, targets) => {
        if (!Array.isArray(targets)) targets = [targets];
        const key = Object.keys(obj).find(k =>
            targets.some(t => k.trim().toLowerCase() === t.toLowerCase())
        );
        return key ? String(obj[key]).trim() : '';
    };

    if (state.plannedData.length > 0) {
        console.log("📌 Columnas en CSV:", Object.keys(state.plannedData[0]));
    }

    const fincaMap = {
        'EEI': 'El Espejo I',
        'EEII': 'El Espejo II',
        'EEIII': 'El Espejo III'
    };

    const realSummary = {};
    const pasaSummary = {}; // Sumario para labores de Levantado

    const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();

    state.realData.forEach(r => {
        const cuartelMatch = String(r.cuartel || '').match(/^(\d+)/);
        const cuartelId = cuartelMatch ? parseInt(cuartelMatch[1], 10) : parseInt(r.id_cuartel, 10);
        let variety = normalize(r.variedad || '');
        let finca = normalize(r.clasificacion || 'Desconocida');

        if (finca === 'eei') finca = normalize('El Espejo I');
        if (finca === 'eeii') finca = normalize('El Espejo II');
        if (finca === 'eeiii') finca = normalize('El Espejo III');

        if (!variety || variety === 'desconocida') {
            const programMatch = state.plannedData.find(p =>
                normalize(getVal(p, ['Finca', 'Productor'])) === finca &&
                parseInt(getVal(p, 'Cuartel'), 10) === cuartelId
            );
            if (programMatch) {
                variety = normalize(getVal(programMatch, 'Variedad'));
            }
        }

        const key = `${finca}_${cuartelId}_${variety}`;
        const kg = parseFloat(r.rendimiento) || 0;

        if (r.isPasa) {
            if (!pasaSummary[key]) pasaSummary[key] = { kg: 0 };
            pasaSummary[key].kg += kg;
        } else {
            if (!realSummary[key]) realSummary[key] = { kg: 0, source: r.sourceName };
            realSummary[key].kg += kg;
        }
    });

    let matchedCount = 0;
    let totalKgFound = 0;

    state.mergedData = state.plannedData.map(p => {
        const rawFinca = getVal(p, ['Finca', 'Productor', 'Nombre', 'Propietario']);
        const rawVariety = getVal(p, 'Variedad');
        const fincaNorm = normalize(rawFinca);
        const varietyNorm = normalize(rawVariety);

        const cuartelStr = getVal(p, 'Cuartel');
        const cuartel = parseInt(cuartelStr, 10);

        const key = `${fincaNorm}_${cuartel}_${varietyNorm}`;

        const info = realSummary[key] || { kg: 0, source: 'Desconocido' };
        const kgReal = info.kg;
        const kgPasa = (pasaSummary[key] || { kg: 0 }).kg;
        const isPropia = info.source === 'Fincas Propias';

        if (kgReal > 0) {
            matchedCount++;
            totalKgFound += kgReal;
        }

        let rawPlanned = getVal(p, ['Kg Uva', 'Kg', 'Kilos']);
        let kgPlanned = 0;
        if (rawPlanned) {
            const cleanVal = rawPlanned.replace(/\./g, '').replace(',', '.').trim();
            kgPlanned = parseFloat(cleanVal);
        }

        return {
            finca: rawFinca,
            cuartel: cuartelStr,
            variety: rawVariety,
            planned: isNaN(kgPlanned) ? 0 : kgPlanned,
            real: kgReal,
            pasa: kgPasa,
            status: getVal(p, 'Estado') || 'En proceso',
            tipo: getVal(p, ['Sep.', 'Tipo']) || 'Otros',
            has: parseFloat(getVal(p, 'Has').replace(',', '.')) || 0,
            source: info.source,
            isPropia: isPropia
        };
    }).filter(row => row.finca !== '' && row.finca.toLowerCase() !== 'finca' && row.finca.toLowerCase() !== 'productor');

    console.log(`📊 Mezcla finalizada: ${totalKgFound.toLocaleString()} kg reales asociados a ${matchedCount} filas del CSV.`);

    // AUDITORIA DE DISCREPANCIAS
    const totalRawApi = state.realData.reduce((s, r) => s + (parseFloat(r.rendimiento) || 0), 0);
    if (Math.abs(totalRawApi - totalKgFound) > 1) {
        console.warn(`⚠️ Discrepancia: API tiene ${Math.round(totalRawApi).toLocaleString()} kg pero solo se asociaron ${Math.round(totalKgFound).toLocaleString()} kg al Excel.`);
        console.log("Tip: Verifique que los nombres de Variedades y Cuarteles coincidan exactamente entre Sofia y el Excel.");
    }
}

// 3. Rendering
function renderDashboard() {
    const filtered = applyFiltersToData(state.mergedData);

    if (state.currentView === 'dashboard') {
        renderKPIs(filtered);
        renderFincasGrid(filtered);
        renderTable(filtered);
    } else if (state.currentView === 'daily') {
        renderDailyView();
    } else if (state.currentView === 'historical') {
        renderHistoricalView();
    }
}

function switchView(view) {
    state.currentView = view;
    // UI Update
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(`${view}-view`).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');

    if (view === 'dashboard') renderDashboard();
    if (view === 'daily') renderDailyView();
    if (view === 'historical') renderHistoricalView();
    if (view === 'secaderos') renderSecaderosView();
    if (view === 'settings') updateSyncDetails();
}

function renderDailyView() {
    const fincaMap = { 'EEI': 'El Espejo I', 'EEII': 'El Espejo II', 'EEIII': 'El Espejo III' };
    const dailyDataPropios = {};
    const dailyDataTerceros = {};

    // Lista explícita de fincas propias
    const ownFincas = [
        'la chimbera',
        'camino truncado',
        'puente alto',
        'el espejo i',
        'el espejo ii',
        'el espejo iii'
    ];

    const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();

    state.realData.forEach(r => {
        if (r.isPasa) return;

        let finca = (r.clasificacion || '').trim();
        if (fincaMap[finca]) finca = fincaMap[finca];
        const variety = (r.variedad || '').trim();

        // Normalizar fecha a YYYY-MM-DD
        let rawDate = r.fecha ? r.fecha.split(' ')[0] : (r.fecha_movimiento ? r.fecha_movimiento.split(' ')[0] : 'Sin Fecha');
        let date = rawDate;
        if (rawDate.includes('-') && rawDate.split('-')[0].length === 2) {
            // Es DD-MM-YYYY -> Convertir a YYYY-MM-DD
            const [d, m, y] = rawDate.split('-');
            date = `${y}-${m}-${d}`;
        } else if (rawDate.includes('/')) {
            const [d, m, y] = rawDate.split('/');
            date = `${y}-${m}-${d}`;
        }

        const kg = parseFloat(r.rendimiento) || 0;
        const fincaNorm = normalize(finca);
        const isPropia = ownFincas.includes(fincaNorm);
        const tipo = isPropia ? 'Propios' : 'Terceros';

        const fincaMatch = state.filters.finca.includes('all') || state.filters.finca.some(f => normalize(f) === fincaNorm);
        const varietyMatch = state.filters.variedad.includes('all') || state.filters.variedad.some(v => normalize(v) === normalize(variety));
        const typeMatch = state.filters.tipo.includes('all') || state.filters.tipo.includes(tipo);

        if (fincaMatch && varietyMatch && typeMatch && date !== 'Sin Fecha') {
            if (isPropia) {
                dailyDataPropios[date] = (dailyDataPropios[date] || 0) + kg;
            } else {
                dailyDataTerceros[date] = (dailyDataTerceros[date] || 0) + kg;
            }
        }
    });

    // Ordenar todas las fechas (Desde Diciembre hasta Marzo)
    const allDates = [...new Set([...Object.keys(dailyDataPropios), ...Object.keys(dailyDataTerceros)])]
        .sort((a, b) => new Date(a) - new Date(b));

    // Ajustar el ancho del canvas dinámicamente: ~40px por día de cosecha
    const wrapper = document.getElementById('daily-chart-wrapper');
    if (wrapper) {
        const minWidth = Math.max(100, allDates.length * 40);
        wrapper.style.width = minWidth + 'px';
    }

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const chartLabels = allDates.map(d => {
        const dateObj = new Date(d + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];
        const parts = d.split('-');
        const displayDay = parts[2];
        const displayMonth = parts[1];
        return `${dayName} ${displayDay}/${displayMonth}`;
    });

    const ctx = document.getElementById('daily-chart').getContext('2d');
    if (state.charts.daily) state.charts.daily.destroy();

    state.charts.daily = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Propios',
                    data: allDates.map(d => dailyDataPropios[d] || 0),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    stack: 'Stack 0'
                },
                {
                    label: 'Terceros',
                    data: allDates.map(d => dailyDataTerceros[d] || 0),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // ... resto de opciones se mantienen
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } } },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    offset: 4,
                    color: '#f8fafc',
                    font: { weight: 'bold', size: 10 },
                    formatter: (value, context) => {
                        const date = allDates[context.dataIndex];
                        const total = (dailyDataPropios[date] || 0) + (dailyDataTerceros[date] || 0);
                        // Solo mostrar el total en el dataset de arriba (Terceros es el segundo)
                        if (context.datasetIndex === 1) {
                            return total > 0 ? new Intl.NumberFormat('es-AR').format(Math.round(total)) : '';
                        }
                        return '';
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${new Intl.NumberFormat('es-AR').format(Math.round(ctx.raw))} kg`
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8', callback: (v) => formatKgSimple(v) }
                },
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        color: (context) => {
                            const label = chartLabels[context.index];
                            if (label.includes('Sab')) return '#fbbf24'; // Amarillo para Sabado
                            if (label.includes('Dom')) return '#f87171'; // Rojo para Domingo
                            return '#94a3b8';
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // Desplazar el scroll al final (a Marzo) automáticamente
    setTimeout(() => {
        const container = document.querySelector('.chart-scroll-container');
        if (container) container.scrollLeft = container.scrollWidth;
    }, 100);

    const totalDay = allDates.reduce((sum, d) => sum + (dailyDataPropios[d] || 0) + (dailyDataTerceros[d] || 0), 0);
    document.getElementById('daily-summary').innerHTML = `
        <div class="premium-card">
            <span class="card-label">Total Propios</span>
            <div class="card-value" style="color: var(--accent-emerald)">${new Intl.NumberFormat('es-AR').format(Math.round(allDates.reduce((s, d) => s + (dailyDataPropios[d] || 0), 0)))} kg</div>
        </div>
        <div class="premium-card">
            <span class="card-label">Total Terceros</span>
            <div class="card-value" style="color: #3b82f6">${new Intl.NumberFormat('es-AR').format(Math.round(allDates.reduce((s, d) => s + (dailyDataTerceros[d] || 0), 0)))} kg</div>
        </div>
        <div class="premium-card">
            <span class="card-label">Total Periodo</span>
            <div class="card-value">${new Intl.NumberFormat('es-AR').format(Math.round(totalDay))} kg</div>
        </div>
    `;
}

function formatKgSimple(val) {
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val;
}

function renderFincasGrid(data) {
    const grid = document.getElementById('fincas-grid');
    const fincas = [...new Set(data.map(d => d.finca))].sort();

    grid.innerHTML = fincas.map(fincaName => {
        const fincaData = data.filter(d => d.finca === fincaName);
        const isPropia = fincaData.some(d => d.isPropia);
        const totalReal = fincaData.reduce((s, r) => s + r.real, 0);
        const totalPlanned = fincaData.reduce((s, r) => s + r.planned, 0);
        const totalHas = fincaData.reduce((s, r) => s + r.has, 0);
        const progress = totalPlanned > 0 ? (totalReal / totalPlanned) * 100 : 0;

        const realKgHa = totalHas > 0 ? Math.round(totalReal / totalHas) : 0;
        const plannedKgHa = totalHas > 0 ? Math.round(totalPlanned / totalHas) : 0;

        // Desglose por variedad para esta finca
        const varieties = [...new Set(fincaData.map(d => d.variety))];
        const varietyRows = varieties.map(v => {
            const vData = fincaData.filter(d => d.variety === v);
            const vReal = vData.reduce((s, r) => s + r.real, 0);
            const vPasa = vData.reduce((s, r) => s + r.pasa, 0);
            const vHas = vData.reduce((s, r) => s + r.has, 0);
            const vKgHa = vHas > 0 ? Math.round(vReal / vHas) : 0;
            const ratio = vPasa > 0 ? (vReal / vPasa).toFixed(1) : '-';

            return `
                <div class="variety-item" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <div style="flex: 1;">
                        <span style="font-weight: 600;">${v}</span>
                        <div style="font-size: 0.7rem; opacity: 0.6;">${vHas.toFixed(2)} ha ${isPropia ? `| ${vKgHa.toLocaleString()} kg/ha` : ''}</div>
                    </div>
                    <div style="text-align: right; min-width: 100px;">
                        <span class="variety-val" style="display: block;">Uva: ${formatKgSimple(vReal)}</span>
                        ${vPasa > 0 ? `<span style="font-size: 0.75rem; color: var(--accent-warning); display: block;">Pasa: ${formatKgSimple(vPasa)} <small style="opacity: 0.7">(R:${ratio})</small></span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const totalPasa = fincaData.reduce((s, r) => s + r.pasa, 0);

        return `
            <div class="finca-card">
                <div class="finca-header">
                    <div>
                        <div class="finca-name">${fincaName}</div>
                        <div style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 0.25rem;">
                             Est: ${formatKg(totalPlanned)} ${isPropia ? `<span style="opacity: 0.5">| ${plannedKgHa} kg/ha</span>` : ''}
                        </div>
                    </div>
                    <div class="percentage-badge">${Math.round(progress)}%</div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>

                <div class="variety-list">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.5rem; letter-spacing: 1px;">Producción:</div>
                    ${varietyRows}
                </div>
                
                <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <span style="color: var(--text-secondary); font-size: 0.75rem;">Totales Reales:</span>
                        <div style="font-weight: 800; color: var(--accent-emerald); font-size: 1.1rem;">Uva: ${formatKgSimple(totalReal)}</div>
                        ${totalPasa > 0 ? `<div style="font-weight: 700; color: var(--accent-warning); font-size: 0.85rem;">Pasa: ${formatKgSimple(totalPasa)}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <span style="color: var(--text-secondary); font-size: 0.75rem;">Global Finca:</span>
                        <div style="font-weight: 700; color: var(--accent-emerald)">${realKgHa.toLocaleString()} kg/ha</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// populateFilters y populateHistoricalCuartels movidos arriba para evitar duplicidad

function renderKPIs(data) {
    const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ' ').trim();
    const fincaMap = { 'EEI': 'El Espejo I', 'EEII': 'El Espejo II', 'EEIII': 'El Espejo III' };

    // Lista explícita de fincas propias definida por el usuario
    const ownFincas = [
        'la chimbera',
        'camino truncado',
        'puente alto',
        'el espejo i',
        'el espejo ii',
        'el espejo iii'
    ];

    const totalRealGlobal = state.realData.reduce((sum, r) => {
        let finca = (r.clasificacion || '').trim();
        if (fincaMap[finca]) finca = fincaMap[finca];
        const variety = (r.variedad || '').trim();

        // Determinar si es propia o tercero
        const fincaNorm = normalize(finca);
        const isPropia = ownFincas.includes(fincaNorm);
        const tipo = isPropia ? 'Propios' : 'Terceros';

        const fincaMatch = state.filters.finca.includes('all') ||
            state.filters.finca.some(f => normalize(f) === fincaNorm);
        const varietyMatch = state.filters.variedad.includes('all') ||
            state.filters.variedad.some(v => normalize(v) === normalize(variety));

        // Nuevo: Filtro por Tipo
        const typeMatch = state.filters.tipo.includes('all') || state.filters.tipo.includes(tipo);

        // Solo sumamos si no es Pasa (Uva)
        return (!r.isPasa && fincaMatch && varietyMatch && typeMatch) ? sum + (parseFloat(r.rendimiento) || 0) : sum;
    }, 0);

    const totalPasaGlobal = state.realData.reduce((sum, r) => {
        if (!r.isPasa) return sum;
        let finca = (r.clasificacion || '').trim();
        if (fincaMap[finca]) finca = fincaMap[finca];
        const variety = (r.variedad || '').trim();

        const fincaNorm = normalize(finca);
        const isPropia = ownFincas.includes(fincaNorm);
        const tipo = isPropia ? 'Propios' : 'Terceros';

        const fincaMatch = state.filters.finca.includes('all') ||
            state.filters.finca.some(f => normalize(f) === fincaNorm);
        const varietyMatch = state.filters.variedad.includes('all') ||
            state.filters.variedad.some(v => normalize(v) === normalize(variety));
        const typeMatch = state.filters.tipo.includes('all') || state.filters.tipo.includes(tipo);

        return (fincaMatch && varietyMatch && typeMatch) ? sum + (parseFloat(r.rendimiento) || 0) : sum;
    }, 0);

    const totalPlanned = data.reduce((s, row) => s + row.planned, 0);
    const progress = totalPlanned > 0 ? (totalRealGlobal / totalPlanned) * 100 : 0;

    const finishedCount = data.filter(d => String(d.status).toLowerCase().includes('terminado')).length;
    const totalCount = data.length;

    document.getElementById('kpi-real').textContent = formatKg(totalRealGlobal);
    document.getElementById('kpi-pasa').textContent = formatKg(totalPasaGlobal);
    document.getElementById('kpi-planned').textContent = formatKg(totalPlanned);
    document.getElementById('kpi-finished').textContent = `${finishedCount}/${totalCount}`;
    document.getElementById('kpi-progress').textContent = `${progress.toFixed(1)}%`;
}


function renderTable(data) {
    const tbody = document.querySelector('#details-table tbody');
    tbody.innerHTML = data.map(d => {
        const delta = d.real - d.planned;
        // Lógica de badge basada en la columna Estado real
        const isTerminado = String(d.status).toLowerCase().includes('terminado');
        const statusClass = isTerminado ? 'status-completed' : (d.real > 0 ? 'status-active' : 'status-pending');
        const statusLabel = d.status || (d.real > 0 ? 'Cosechando' : 'Pendiente');

        return `
            <tr>
                <td>${d.finca}</td>
                <td>${d.cuartel} <small style="opacity: 0.5">(${d.has.toFixed(2)} ha)</small></td>
                <td>${d.variety}</td>
                <td>${formatKg(d.planned)} ${d.isPropia ? `<br><small style="opacity: 0.5">${Math.round(d.planned / d.has || 0).toLocaleString()} kg/ha</small>` : ''}</td>
                <td>
                    ${formatKg(d.real)} ${d.isPropia ? `<br><small style="color: var(--accent-emerald)">${Math.round(d.real / d.has || 0).toLocaleString()} kg/ha</small>` : ''}
                    ${d.pasa > 0 ? `<div style="color: var(--accent-warning); font-size: 0.8rem; margin-top: 4px;">Pasa: ${formatKgSimple(d.pasa)} (R:${(d.real / d.pasa).toFixed(1)})</div>` : ''}
                </td>
                <td style="color: ${delta >= 0 ? '#10b981' : '#ef4444'}">${formatKg(delta)}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    }).join('');
}

function getFincaInitials(finca) {
    const fn = (finca || '').toLowerCase();
    if (fn.includes('truncado')) return 'CT';
    if (fn.includes('chimbera')) return 'LCH';
    if (fn.includes('puente')) return 'PA';
    if (fn.includes('espejo i') && !fn.includes('ii')) return 'EEI';
    if (fn.includes('espejo ii') && !fn.includes('iii')) return 'EEII';
    if (fn.includes('espejo iii')) return 'EEIII';
    return finca.substring(0, 3).toUpperCase();
}

// Helpers
function getMonthRanges(startDate) {
    const ranges = [];
    let current = new Date(startDate + 'T12:00:00');
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const CHUNK_SIZE = 10; // Pedir de a 10 días para balancear carga vs seguridad

    while (current <= today) {
        const startStr = current.toISOString().split('T')[0];

        let end = new Date(current);
        end.setDate(current.getDate() + (CHUNK_SIZE - 1));
        if (end > today) end = today;

        const endStr = end.toISOString().split('T')[0];

        ranges.push({ start: startStr, end: endStr });

        current.setDate(current.getDate() + CHUNK_SIZE);
    }
    return ranges;
}


function formatKg(val) {
    return new Intl.NumberFormat('es-AR').format(Math.round(val)) + ' kg';
}

// Funciones antiguas de filtrado eliminadas para usar los nuevos Custom Dropdowns

function showStatus(msg, isError = false) {
    const el = document.getElementById('last-update');
    el.textContent = msg;
    el.style.borderColor = isError ? 'var(--accent-danger)' : 'var(--accent-emerald)';
    el.style.color = isError ? 'var(--accent-danger)' : 'var(--accent-emerald)';
}

function updateBtnState(isLoading) {
    const btn = document.getElementById('refresh-btn');
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? '<i class="loader"></i> Cargando...' : '<i data-lucide="refresh-cw"></i> Actualizar';
    if (!isLoading) lucide.createIcons();
}

function renderHistoricalView() {
    if (state.historicalData.length === 0) return;

    // 0. Actualizar los cuarteles disponibles según Finca/Variedad antes de filtrar
    populateHistoricalCuartels();

    // Detectar llaves reales una sola vez para eficiencia
    const sample = state.historicalData[0];
    const kCuartel = Object.keys(sample).find(k => k.toLowerCase() === 'cuartel') || 'Cuartel';
    const kFinca = Object.keys(sample).find(k => k.toLowerCase() === 'finca') || 'Finca';
    const kVariedad = Object.keys(sample).find(k => k.toLowerCase() === 'variedad') || 'Variedad';
    const kEstado = Object.keys(sample).find(k => k.toLowerCase() === 'estado') || 'Estado';

    // 1. Filtrar histórico
    const historyFiltered = state.historicalData.filter(d => {
        const fincaMatch = state.filters.finca.includes('all') || state.filters.finca.includes(d[kFinca]);
        const varietyMatch = state.filters.variedad.includes('all') || state.filters.variedad.includes(d[kVariedad]);
        const cuartelMatch = state.filters.histCuartel.includes('all') || state.filters.histCuartel.includes(String(d[kCuartel]));
        const materiaMatch = state.filters.histMateria.includes('all') || state.filters.histMateria.some(m => String(d[kEstado]).toLowerCase() === m.toLowerCase());
        return fincaMatch && varietyMatch && cuartelMatch && materiaMatch;
    });

    const kKg = Object.keys(sample).find(k => k.toLowerCase() === 'kg') || 'Kg';
    const kHas = Object.keys(sample).find(k => k.toLowerCase() === 'has') || 'Has';

    // 2. Procesar datos históricos por año
    const yearsData = {};
    const yearsHas = {};

    historyFiltered.forEach(d => {
        const yearKey = Object.keys(d).find(k => k.toLowerCase().includes('a') && k.toLowerCase().includes('o')) || 'Año';
        const year = String(d[yearKey] || '').trim();
        if (!year) return;

        if (!yearsData[year]) {
            yearsData[year] = 0;
            yearsHas[year] = 0;
        }

        const cleanKg = parseFloat(String(d[kKg] || 0).replace(/\./g, '').replace(',', '.')) || 0;
        const cleanHas = parseFloat(String(d[kHas] || 0).replace(',', '.')) || 0;

        yearsData[year] += cleanKg;
        yearsHas[year] += cleanHas;
    });

    // 3. Obtener datos REALES de 2026 (mergedData) para comparar
    const real2026Filtered = applyFiltersToData(state.mergedData).filter(d => {
        // En vista histórica, también debemos filtrar los datos de 2026 por el cuartel seleccionado
        return state.filters.histCuartel.includes('all') || state.filters.histCuartel.includes(String(d.cuartel));
    });

    const isUvaSelected = state.filters.histMateria.includes('all') || state.filters.histMateria.some(m => m.toLowerCase() === 'uva');
    const isPasaSelected = state.filters.histMateria.includes('all') || state.filters.histMateria.some(m => m.toLowerCase() === 'pasa');

    let sumReal2026 = 0;
    if (isUvaSelected && isPasaSelected) {
        sumReal2026 = real2026Filtered.reduce((s, r) => s + (r.real || 0) + (r.pasa || 0), 0);
    } else if (isPasaSelected) {
        sumReal2026 = real2026Filtered.reduce((s, r) => s + (r.pasa || 0), 0);
    } else {
        sumReal2026 = real2026Filtered.reduce((s, r) => s + (r.real || 0), 0);
    }

    const sumHas2026 = real2026Filtered.reduce((s, r) => s + r.has, 0);

    // 4. Preparar labels y datasets
    let sortedYears = Object.keys(yearsData).sort();

    // Asegurarnos que BP 2026 esté al final (si existe) y agregar "Real 2026"
    const labels = sortedYears.map(y => y === 'BP 2026' ? 'Estimado 2026' : y);
    labels.push('Real 2026');

    const kgVolumes = sortedYears.map(y => yearsData[y]);
    kgVolumes.push(sumReal2026);

    const productivityLine = sortedYears.map(y => yearsHas[y] > 0 ? Math.round(yearsData[y] / yearsHas[y]) : 0);
    productivityLine.push(sumHas2026 > 0 ? Math.round(sumReal2026 / sumHas2026) : 0);

    const ctx = document.getElementById('historical-chart').getContext('2d');
    if (state.charts.historical) state.charts.historical.destroy();

    state.charts.historical = new Chart(ctx, {
        plugins: [ChartDataLabels],
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Volumen Cosecha (Kg)',
                    data: kgVolumes,
                    backgroundColor: labels.map(l => l === 'Real 2026' ? 'rgba(129, 140, 248, 0.7)' : 'rgba(16, 185, 129, 0.6)'),
                    borderColor: labels.map(l => l === 'Real 2026' ? '#818cf8' : '#10b981'),
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y',
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#f8fafc',
                        font: { weight: 'bold', size: 10 },
                        formatter: (val) => new Intl.NumberFormat('es-AR').format(Math.round(val))
                    }
                },
                {
                    type: 'line',
                    label: 'Productividad (Kg/Ha)',
                    data: productivityLine,
                    borderColor: '#fbbf24',
                    backgroundColor: '#fbbf24',
                    borderWidth: 3,
                    pointRadius: 4,
                    tension: 0.3,
                    yAxisID: 'y1',
                    datalabels: {
                        anchor: 'start',
                        align: 'top',
                        color: '#fbbf24',
                        offset: 10,
                        font: { weight: 'bold', size: 10 },
                        formatter: (val) => val > 0 ? val.toLocaleString() + ' kg/ha' : ''
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 30 } },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Outfit' } } },
                datalabels: {
                    display: (ctx) => ctx.datasetIndex === 0 || (ctx.datasetIndex === 1 && ctx.active)
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const val = new Intl.NumberFormat('es-AR').format(ctx.raw);
                            return ctx.datasetIndex === 0 ? `Total: ${val} kg` : `Rend: ${val} kg/ha`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8', callback: (v) => formatKgSimple(v) },
                    title: { display: true, text: 'Kilos Totales', color: '#94a3b8' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#fbbf24', callback: (v) => formatKgSimple(v) },
                    title: { display: true, text: 'Rendimiento (Kg/Ha)', color: '#fbbf24' }
                },
                x: { ticks: { color: '#94a3b8' } }
            }
        }
    });

    // Calcular KPIs históricos rápidos
    const totalDay = kgVolumes.reduce((a, b) => a + b, 0);
    const avgYield = productivityLine.filter(v => v > 0).reduce((a, b, i, arr) => a + b / arr.length, 0);

    const histSummary = document.getElementById('historical-summary');
    if (histSummary) {
        histSummary.innerHTML = `
            <div class="premium-card">
                <span class="card-label">Media Productividad</span>
                <div class="card-value" style="color: #fbbf24">${Math.round(avgYield).toLocaleString()} kg/ha</div>
            </div>
            <div class="premium-card">
                <span class="card-label">Kilos Totales (Selec.)</span>
                <div class="card-value">${formatKg(totalDay)}</div>
            </div>
            <div class="premium-card">
                <span class="card-label">Eficiencia 2026 vs BP</span>
                <div class="card-value">${sumHas2026 > 0 ? Math.round(sumReal2026 / sumHas2026).toLocaleString() : 0} kg/ha</div>
            </div>
        `;
    }
}

function renderSecaderosView() {
    const grid = document.getElementById('secadero-grid');
    const statsContainer = document.getElementById('secadero-stats');
    if (!grid || !statsContainer) return;

    // 1. Agrupar datos por Playa y BATCH (Tandas de secado)
    const playaData = {};

    state.realData.forEach(r => {
        const nombre = (r.nombre || '').trim();
        if (!nombre || (!nombre.includes('Playa') && !nombre.includes('Sector') && !nombre.includes('PLAYA'))) return;

        const normName = nombre.toUpperCase();
        if (!playaData[normName]) {
            playaData[normName] = {
                batches: {},
                lastDate: null,
                originalName: nombre,
                uva: 0,
                pasa: 0,
                cuartelId: r.id_cuartel // Para buscar en el plan
            };
        }

        const labor = String(r.labor || '').toUpperCase();
        const batchMatch = labor.match(/(\d+)$/);
        const batchNum = batchMatch ? batchMatch[1] : '1';

        if (!playaData[normName].batches[batchNum]) {
            playaData[normName].batches[batchNum] = {
                uva: 0,
                pasa: 0,
                firstDate: null, // Fecha del primer ingreso
                lastDate: null,  // Fecha del último ingreso
                history: []
            };
        }

        const kg = parseFloat(r.rendimiento) || 0;
        const date = r.fecha ? r.fecha.split(' ')[0] : null;

        if (r.isPasa) {
            playaData[normName].batches[batchNum].pasa += kg;
            playaData[normName].pasa += kg;
        } else {
            playaData[normName].batches[batchNum].uva += kg;
            playaData[normName].uva += kg;

            // Registrar tendido individual
            if (date && kg > 100) {
                const existing = playaData[normName].batches[batchNum].history.find(h => h.date === date);
                if (existing) {
                    existing.uva += kg;
                } else {
                    playaData[normName].batches[batchNum].history.push({
                        date,
                        uva: kg,
                        variedad: r.variedad || 'N/A'
                    });
                }
            }

            // Actualizar rango de fechas del batch
            if (date) {
                if (!playaData[normName].batches[batchNum].firstDate || date < playaData[normName].batches[batchNum].firstDate) {
                    playaData[normName].batches[batchNum].firstDate = date;
                }
                if (!playaData[normName].batches[batchNum].lastDate || date > playaData[normName].batches[batchNum].lastDate) {
                    playaData[normName].batches[batchNum].lastDate = date;
                }
            }
            if (date && (!playaData[normName].lastDate || date > playaData[normName].lastDate)) {
                playaData[normName].lastDate = date;
            }
        }
    });

    // Ordenar historial de cada batch por fecha
    Object.values(playaData).forEach(p => {
        Object.values(p.batches).forEach(b => {
            b.history.sort((a, b) => new Date(a.date) - new Date(b.date));
        });
    });

    // 2. Unificar con capacidades y calcular estado avanzado
    const processedPlayas = state.secaderoHas.map(cap => {
        const normCapName = cap.playa.toUpperCase();
        const data = playaData[normCapName] || { batches: {}, uva: 0, pasa: 0, lastDate: null, cuartelId: null };

        // Determinar status basado en la lógica de BATCHES:
        // Si existe un Cosecha KG (N) sin un Levantado (N), está ocupado.
        // Si tiene los dos, se revisa el ratio individual.
        let status = 'libre';
        let latestOcupiedDate = null;
        let firstOcupiedDate = null; // Para que la barra del Gantt empiece donde debe
        let activeHistory = [];
        let batchKeys = Object.keys(data.batches).sort((a, b) => b - a);

        batchKeys.forEach(bKey => {
            const b = data.batches[bKey];
            if (b.uva > 100) {
                const bRatio = b.pasa > 0 ? (b.uva / b.pasa) : 999;
                // Si el batch está ocupado (uva > pasa consolidado)
                if (b.pasa === 0 || bRatio > 5) {
                    status = 'ocupado';
                    // El rango del sector es el consolidado de sus batches activos
                    if (!latestOcupiedDate || b.lastDate > latestOcupiedDate) latestOcupiedDate = b.lastDate;
                    if (!firstOcupiedDate || b.firstDate < firstOcupiedDate) firstOcupiedDate = b.firstDate;
                    // Combinamos histories de batches activos si hay varios
                    activeHistory = activeHistory.concat(b.history);
                }
            }
        });

        // Limpiamos duplicados de history si los hubiera y ordenamos
        activeHistory = [...new Map(activeHistory.map(item => [item.date + item.variedad, item])).values()]
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // 3. Cálculo DINÁMICO para cada tendido individual
        const processedHistory = activeHistory.map(h => {
            let duration = 15;
            const m = new Date(h.date + 'T12:00:00').getMonth();
            if (m === 1) duration = 20; // Feb
            if (m === 2) duration = 30; // Mar

            let daysInPlan = null;
            if (data.cuartelId) {
                const planRow = state.plannedData.find(p => String(p.Cuartel || '').includes(String(data.cuartelId)));
                if (planRow) {
                    const rawDays = planRow['Días de secado'] || planRow['dias de secado'];
                    if (rawDays) daysInPlan = parseInt(rawDays, 10);
                }
            }

            const effectiveDuration = (daysInPlan !== null) ? daysInPlan : duration;
            const dObj = new Date(h.date + 'T12:00:00');
            dObj.setDate(dObj.getDate() + effectiveDuration);

            // Ajuste clima por tendido
            const weather = getPlayaWeather(cap.playa, h.date);
            if (weather.rain > 10) dObj.setDate(dObj.getDate() + 3);

            return {
                ...h,
                estDate: dObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
                duration: effectiveDuration,
                isDOV: daysInPlan !== null
            };
        });

        // 3. Cálculo DINÁMICO de días de secado y Volumen
        // Regla: Dic/Ene (15), Feb (20), Mar (30) + Clima
        let duration = 15;
        if (latestOcupiedDate) {
            const m = new Date(latestOcupiedDate + 'T12:00:00').getMonth(); // 0-11
            if (m === 1) duration = 20; // Febrero
            if (m === 2) duration = 30; // Marzo
        }

        // Caso Especial: DOV (Dry On Vine) - Programación
        // Buscamos si el cuartel que está en esta playa tiene "Días de secado" en el plan
        let daysInPlan = null;
        if (data.cuartelId) {
            const planRow = state.plannedData.find(p => String(p.Cuartel || '').includes(String(data.cuartelId)));
            if (planRow) {
                const rawDays = planRow['Días de secado'] || planRow['dias de secado'];
                if (rawDays) daysInPlan = parseInt(rawDays, 10);
            }
        }

        // Si hay días en el plan, usamos eso porque ya estuvo secando en la parra
        const effectiveDuration = (daysInPlan !== null) ? daysInPlan : duration;

        // Factor de Volumen (Si es DOV, ocupa menos espacio porque ya perdió agua)
        // Estimación: un kilo de uva fresca ocupa 100%. Un kilo de uva que ya secó 50% de sus días ocupa menos.
        // Ratio 4:1 -> el volumen baja drásticamente.
        let volumeFactor = 1.0;
        if (daysInPlan !== null) {
            // Si el plan dice que le quedan pocos días de los 20/30 originales, el volumen es menor
            const monthStandard = duration;
            const remainingRatio = Math.min(1, daysInPlan / monthStandard);
            // El volumen no baja de forma lineal perfectamente, pero podemos estimar que
            // el 25% (pasa final) es el piso, y el 75% es el agua que se va perdiendo.
            volumeFactor = 0.25 + (0.75 * remainingRatio);
        }

        // Estimación de liberación (CONSCIENTE DE HOY)
        const now = new Date();
        const ty = now.getFullYear();
        const tm = now.getMonth() + 1;
        const td = now.getDate();
        const todayObj = new Date(ty, tm - 1, td);

        let estDate = '-';
        let isDelayed = false;
        if (status === 'ocupado' && latestOcupiedDate) {
            const [y, m, d] = latestOcupiedDate.split('-').map(Number);
            const dObj = new Date(y, m - 1, d, 12, 0, 0);
            dObj.setDate(dObj.getDate() + effectiveDuration);

            // Penalización por clima
            const weather = getPlayaWeather(cap.playa, latestOcupiedDate);
            if (weather.rain > 10) dObj.setDate(dObj.getDate() + 3);

            if (dObj < todayObj) isDelayed = true;

            estDate = dObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        }

        const occupancy = cap.capKg > 0 ? (data.uva * volumeFactor / cap.capKg) * 100 : 0;
        const weather = getPlayaWeather(cap.playa, data.lastDate);

        return {
            ...cap,
            ...data,
            ratio: data.pasa > 0 ? (data.uva / data.pasa).toFixed(1) : '-',
            status,
            occupancy,
            estDate,
            firstDate: firstOcupiedDate, // Importante para el Gantt
            weather,
            volumeFactor,
            isDOV: daysInPlan !== null,
            dryingDays: effectiveDuration,
            history: processedHistory
        };
    });

    // 3. Renderizar KPIs y Recomendaciones
    const getTargetSecadero = (fincaName) => {
        const fn = fincaName.toLowerCase();
        if (fn.includes('truncado') || fn.includes('puente alto')) return 'Camino Truncado';
        if (fn.includes('chimbera') || fn.includes('lch')) return 'La Chimbera';
        if (fn.includes('espejo') || fn.includes('ullum')) return 'Ullum';
        return 'Camino Truncado';
    };

    const regionalAggregates = [
        {
            name: 'Camino Truncado',
            filter: p => {
                const up = p.playa.toUpperCase();
                return up.includes('TRUNCADO') || (up.startsWith('PLAYA') && !up.includes('LCH') && !up.includes('ESPEJO'));
            }
        },
        {
            name: 'La Chimbera',
            filter: p => {
                const up = p.playa.toUpperCase();
                return up.includes('LCH') || up.includes('CHIMBERA');
            }
        },
        {
            name: 'Ullum',
            filter: p => {
                const up = p.playa.toUpperCase();
                return up.includes('ESPEJO') || up.toUpperCase().includes('ULLUM') || up.startsWith('SECTOR');
            }
        }
    ].map(reg => {
        const group = processedPlayas.filter(reg.filter);
        const sumUva = group.reduce((s, p) => s + p.uva, 0);
        const sumPasa = group.reduce((s, p) => s + p.pasa, 0);
        const sumCap = group.reduce((s, p) => s + p.capKg, 0);

        const latestDate = group.reduce((max, p) => (p.lastDate && (!max || p.lastDate > max)) ? p.lastDate : max, null);
        const weather = getPlayaWeather(reg.name, latestDate);

        // Calcular Próxima Fecha de Liberación (REALISTA)
        const now = new Date();
        const ty = now.getFullYear();
        const tm = now.getMonth() + 1;
        const td = now.getDate();
        const todayObj = new Date(ty, tm - 1, td);

        const occupiedSectors = group.filter(p => p.status === 'ocupado' && p.estDate !== '-');

        // Ordenar por fecha estimada real
        const sortedByDate = [...occupiedSectors].sort((a, b) => {
            const [dA, mA] = a.estDate.split('/').map(Number);
            const [dB, mB] = b.estDate.split('/').map(Number);
            const dateA = new Date(ty, mA - 1, dA);
            const dateB = new Date(ty, mB - 1, dB);
            return dateA - dateB;
        });

        // La próxima liberación es la primera que sea >= Hoy,
        // o si todas pasaron, indicamos "Urgente/Atrasado"
        const nextFuture = sortedByDate.find(s => {
            const [sd, sm] = s.estDate.split('/').map(Number);
            return new Date(ty, sm - 1, sd) >= todayObj;
        });

        let nextFreeDate = 'Inmediata';
        let nextFreeSectorName = '-';
        if (occupiedSectors.length === group.length) {
            if (nextFuture) {
                nextFreeDate = nextFuture.estDate;
                nextFreeSectorName = nextFuture.playa.replace(/Playa |Sector /gi, 'Sec.');
            } else if (sortedByDate.length > 0) {
                nextFreeDate = 'HOY (Atrasado)';
                nextFreeSectorName = sortedByDate[0].playa.replace(/Playa |Sector /gi, 'Sec.');
            }
        } else {
            // Si hay libres, buscamos el nombre de uno libre para informar
            const freeOnes = group.filter(p => p.status === 'libre');
            if (freeOnes.length > 0) {
                nextFreeSectorName = freeOnes[0].playa.replace(/Playa |Sector /gi, 'Sec.');
            }
        }

        const sumAvailableHas = group.reduce((s, p) => s + (p.status === 'libre' ? (parseFloat(p.has) || 0) : 0), 0);
        const upcomingLiftingKg = occupiedSectors.reduce((s, p) => s + (p.uva / 4), 0);

        return {
            name: reg.name,
            uva: sumUva,
            pasa: sumPasa,
            capKg: sumCap,
            ratio: sumPasa > 0 ? (sumUva / sumPasa).toFixed(1) : '-',
            occupancy: sumCap > 0 ? (group.reduce((s, p) => s + (p.uva * p.volumeFactor), 0) / sumCap) * 100 : 0,
            status: sumUva > 500 ? 'ocupado' : 'libre',
            lastDate: latestDate,
            weather,
            playas: group,
            countOcupados: group.filter(p => p.status === 'ocupado').length,
            countTotal: group.length,
            nextFreeDate,
            nextFreeSectorName,
            sumAvailableHas,
            upcomingLiftingKg
        };
    });

    renderHarvestRecommendations(processedPlayas, regionalAggregates, getTargetSecadero);
}

function toggleSecaderoDetails(playaName) {
    if (state.expandedSecaderos.has(playaName)) {
        state.expandedSecaderos.delete(playaName);
    } else {
        state.expandedSecaderos.add(playaName);
    }
    renderSecaderosView();
}

function renderHarvestRecommendations(playas, regions, getTargetSecadero) {
    const statsContainer = document.getElementById('secadero-stats');
    const recommendationsContainer = document.getElementById('secadero-grid');

    // --- A. CÁLCULO DE RITMO Y CAPACIDAD ---
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentHarvests = state.realData.filter(r => !r.isPasa && new Date(r.fecha) > last7Days);
    const dailyRate = recentHarvests.reduce((s, r) => s + (parseFloat(r.rendimiento) || 0), 0) / 7;

    const totalFreeCapKg = playas.reduce((s, p) => s + (p.status === 'libre' ? p.capKg : 0), 0);
    const capacityDaysLeft = dailyRate > 0 ? (totalFreeCapKg / dailyRate) : 999;

    // Clasificar bloques pendientes por su Secadero Destino
    const pendingBlocks = state.mergedData
        .filter(d => d.real < d.planned * 0.9 && d.planned > 1000)
        .map(d => {
            const raw = state.plannedData.find(p => String(p.Cuartel) === String(d.cuartel) && String(p.Finca || p.Productor).includes(d.finca));
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
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 5px;">Ritmo de Cosecha: ${formatKgSimple(dailyRate)}/día</div>
        </div>
        <div class="premium-card">
            <span class="card-label">Espacio Inmediato</span>
            <div class="card-value" style="color: var(--accent-emerald)">${formatKgSimple(totalFreeCapKg)} / ${totalFreeHas.toFixed(1)} Has</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">Kilos y Hectáreas libres ahora</div>
        </div>
        <div class="premium-card">
            <span class="card-label">Pasa x Levantar (4:1)</span>
            <div class="card-value" style="color: var(--accent-primary)">${formatKgSimple(regions.reduce((s, r) => s + r.upcomingLiftingKg, 0))}</div>
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
                                <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">~${formatKgSimple(r.upcomingLiftingKg)} de Pasa</div>
                            </div>

                            <h5 style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">RECOMENDACIÓN COSECHA:</h5>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${regionalBlocks.length > 0 ? regionalBlocks.slice(0, 2).map(b => {
            const initials = getFincaInitials(b.finca);
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
        const isExpanded = state.expandedRegions.has(r.name);
        const playasHtml = r.playas.map(p => {
            const displayName = p.playa.replace(/Playa |Sector /gi, 'Secadero ');
            const isDetailed = state.expandedSecaderos.has(p.playa);

            let detailedRowsHtml = '';
            if (isDetailed && p.history.length > 0) {
                detailedRowsHtml = `
                    <div style="margin-top: 10px; border-top: 1px dashed var(--glass-border); padding-top: 10px; font-size: 0.65rem;">
                        ${p.history.map(h => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--text-secondary);">
                                <span>${h.date.split('-').slice(1).reverse().join('/')}: <b>${formatKgSimple(h.uva)}</b> (${h.variedad})</span>
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
                            <button onclick="toggleSecaderoDetails('${p.playa}')" class="btn-icon" style="padding: 2px; border: none; background: none;">
                                <i data-lucide="${isDetailed ? 'chevron-up' : 'chevron-down'}" style="width: 14px; height: 14px; color: var(--text-secondary);"></i>
                            </button>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; color: var(--text-secondary);">
                        <div title="Uva tendida">U: ${formatKgSimple(p.uva)}</div>
                        <div title="Pasa levantada">P: ${formatKgSimple(p.pasa)}</div>
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
                        <button onclick="toggleRegionDetails('${r.name}')" class="btn-icon" style="background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 5px; border-radius: 6px;">
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
                        <div class="playa-val">${formatKgSimple(r.uva)}</div>
                    </div>
                    <div class="stat-box" title="Kilos ya levantados">
                        <div class="playa-label">Levantado (Pasa)</div>
                        <div class="playa-val">${formatKgSimple(r.pasa)}</div>
                    </div>
                    <div class="stat-box">
                        <div class="playa-label">Ratio Promedio</div>
                        <div class="playa-val" style="color: ${r.ratio < 6 && r.ratio !== '-' ? 'var(--accent-emerald)' : 'var(--accent-warning)'};">${r.ratio}</div>
                    </div>
                    <div class="stat-box" title="Carga ajustada por pérdida de volumen: Kilos x Factor de Secado">
                        <div class="playa-label">Ocupación Real (Vol)</div>
                        <div class="playa-val" style="color: var(--accent-primary);">${Math.round(r.occupancy)}% </div>
                        <div style="font-size: 0.65rem; color: var(--text-secondary);">Cap: ${formatKgSimple(r.capKg)}</div>
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
    renderSecaderosGantt(regions, capacityDaysLeft);
}

function toggleSecaderoDisplay(view) {
    document.getElementById('secadero-grid-container').style.display = view === 'grid' ? 'block' : 'none';
    document.getElementById('secadero-gantt-container').style.display = view === 'gantt' ? 'block' : 'none';

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(view === 'grid' ? 'cuadrícula' : 'gantt'));
    });
}

function renderSecaderosGantt(regionalAggregates, collapseDays) {
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
        const isExpanded = state.expandedRegions.has(r.name);

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
                const isSecDetailed = state.expandedSecaderos.has(p.playa);

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
                                             title="Tendido ${h.date}: ${h.variedad} (${formatKgSimple(h.uva)}) -> Libre: ${h.estDate}">
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
                                <button onclick="toggleSecaderoDetails('${p.playa}')" style="background: none; border: none; cursor: pointer; padding: 2px; margin-right: 10px;">
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
                    <button onclick="toggleRegionDetails('${r.name}')" class="btn-icon" style="padding: 2px;">
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

function toggleRegionDetails(region) {
    if (state.expandedRegions.has(region)) {
        state.expandedRegions.delete(region);
    } else {
        state.expandedRegions.add(region);
    }
    renderSecaderosView();
}
