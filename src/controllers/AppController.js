/**
 * ═══════════════════════════════════════════════════════════
 * NATURALFOOD - Controller Layer
 * Handles all business logic, routing, and user interactions
 * ═══════════════════════════════════════════════════════════
 * VERSION: 1.0.2 - MENU UPDATE (GASTOS & SECADEROS)
 * ═══════════════════════════════════════════════════════════
 */

import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
Chart.register(...registerables, ChartDataLabels);
// Desactivar datalabels globalmente, solo se activa explícitamente por gráfico
Chart.defaults.set('plugins.datalabels', { display: false });

import {
    UserModel, FincaModel, PredioModel, VariedadModel,
    EmpleadoModel, LaborModel, PresupuestoModel, AplicacionModel,
    NotificationModel, ADMIN_MODELS, ADMIN_TABLE_CONFIG
} from '../models/DataModels.js';

import { SofiaImportModel } from '../models/SofiaModel.js';
import { SofiaApiModel } from '../models/SofiaApiModel.js';

import {
    renderLandingPage, renderLoginPage, renderDashboardLayout,
    renderDashboardHome, renderFincasView, renderPrediosView,
    renderVariedadesView, renderEmpleadosView, renderLaboresView,
    renderCargaView, renderInformesView, renderInformePresupuesto,
    renderCosechaDashboard, renderSofiaJornalesStats,
    renderInformeParametros, renderAplicacionesView,
    renderPresupuestoView, renderUsuariosView,
    renderInformeAplicaciones, renderSofiaResumen, renderSofiaFoliares,
    renderSofiaHerbicidas, renderFertilizacionComparativa, formatCurrency,
    renderHectareasPorPredio, renderEficienciaChartSection,
    renderCosechaLevantadoTable, renderAdminCrudView, renderWorkLogView,
    renderGastosView, renderSecaderosView, renderGastosHistoricosView,
    renderControlCargaView
} from '../views/Views.js';

import { SecaderosController } from './SecaderosController.js';
import { JornalesBudgetModel } from '../models/JornalesBudgetModel.js';

// ── Constants ──
const VITE_API_URL = '/api';
const ROLE_MENUS = {
    'Administrador': [
        {
            id: 'operativa', label: 'Operativa', icon: '🚜', section: 'Principal', submenu: [
                { id: 'admin-carga-trabajo', label: 'Carga de Trabajo', icon: '📝' },
                { id: 'admin-bodegas-movimientos', label: 'Movimientos Stock', icon: '📦' },
            ]
        },
        {
            id: 'informes', label: 'Informes', icon: '📈', section: 'Principal', submenu: [
                { id: 'jornales', label: 'Jornales', icon: '👷' },
                { id: 'cosecha', label: 'Cosecha', icon: '🍇' },
                { id: 'fincas', label: 'Fincas', icon: '🏡' },
                { id: 'aplicaciones-sofia', label: 'Aplicaciones', icon: '🧪' },
                { id: 'informe-gastos', label: 'Gastos', icon: '💰' },
                { id: 'informe-gastos-historicos', label: 'Gastos Históricos', icon: '📜' },
                { id: 'informe-secaderos', label: 'Secaderos', icon: '☀️' },
                { id: 'control-carga', label: 'Control de Carga', icon: '📋' },
            ]
        },
        {
            id: 'admin-fincas-menu', label: 'Fincas', icon: '🌲', section: 'Sistema', submenu: [
                { id: 'admin-fincas', label: 'Gestión Fincas', icon: '🏡' },
                { id: 'admin-predios', label: 'Predios', icon: '📍' },
                { id: 'admin-cuarteles', label: 'Cuarteles/Parcelas', icon: '🗺️' },
                { id: 'admin-bodegas', label: 'Bodegas', icon: '🏭' },
            ]
        },
        {
            id: 'administracion', label: 'Panel de Control', icon: '⚙️', section: 'Sistema', submenu: [
                { id: 'usuarios', label: 'Usuarios', icon: '👥' },
                { id: 'admin-faenas', label: 'Faenas', icon: '📋' },
                { id: 'admin-labor', label: 'Labor', icon: '🔨' },
                { id: 'admin-productos', label: 'Productos', icon: '📦' },
                { id: 'admin-institucional', label: 'Institucional', icon: '🏛️' },
                { id: 'admin-planificacion', label: 'Planificación', icon: '📅' },
            ]
        },
        {
            id: 'personal', label: 'Personal', icon: '👷', section: 'Sistema', submenu: [
                { id: 'admin-personal', label: 'Gestión Personal', icon: '👥' },
                { id: 'admin-contratos', label: 'Contratos', icon: '📄' },
            ]
        },
        {
            id: 'riego', label: 'Riego', icon: '💧', section: 'Sistema', submenu: [
                { id: 'admin-zonas-riego', label: 'Zonas de Riego', icon: '🗺️' },
                { id: 'admin-sistema-riego', label: 'Sistema de Riego', icon: '🚿' },
            ]
        },
    ],
    'Ingeniero': [
        {
            id: 'operativa', label: 'Operativa', icon: '🚜', section: 'Principal', submenu: [
                { id: 'admin-carga-trabajo', label: 'Carga de Trabajo', icon: '📝' },
                { id: 'admin-bodegas-movimientos', label: 'Movimientos Stock', icon: '📦' },
            ]
        },
        {
            id: 'informes', label: 'Informes', icon: '📈', section: 'Principal', submenu: [
                { id: 'jornales', label: 'Jornales', icon: '👷' },
                { id: 'cosecha', label: 'Cosecha', icon: '🍇' },
                { id: 'fincas', label: 'Fincas', icon: '🏡' },
                { id: 'aplicaciones-sofia', label: 'Aplicaciones', icon: '🧪' },
                { id: 'informe-gastos', label: 'Gastos', icon: '💰' },
                { id: 'informe-gastos-historicos', label: 'Gastos Históricos', icon: '📜' },
                { id: 'informe-secaderos', label: 'Secaderos', icon: '☀️' },
                { id: 'control-carga', label: 'Control de Carga', icon: '📋' },
            ]
        },
    ],
    'Carga': [
        {
            id: 'operativa', label: 'Operativa', icon: '🚜', section: 'Principal', submenu: [
                { id: 'admin-carga-trabajo', label: 'Carga de Trabajo', icon: '📝' },
                { id: 'admin-bodegas-movimientos', label: 'Movimientos Stock', icon: '📦' },
            ]
        },
    ],
    'Sub-Admin': [
        {
            id: 'informes', label: 'Informes', icon: '📈', section: 'Consulta', submenu: [
                { id: 'jornales', label: 'Jornales', icon: '👷' },
                { id: 'cosecha', label: 'Cosecha', icon: '🍇' },
                { id: 'fincas', label: 'Fincas', icon: '🏡' },
                { id: 'aplicaciones-sofia', label: 'Aplicaciones', icon: '🧪' },
                { id: 'informe-gastos', label: 'Gastos', icon: '💰' },
                { id: 'informe-gastos-historicos', label: 'Gastos Históricos', icon: '📜' },
                { id: 'informe-secaderos', label: 'Secaderos', icon: '☀️' },
                { id: 'control-carga', label: 'Control de Carga', icon: '📋' },
            ]
        },
    ],
};

// ── App Controller ──
export class AppController {
    constructor() {
        this.app = document.getElementById('app');
        this.currentSection = null;
        this.currentUser = null;
        this.charts = {};
        this.sofiaFilters = { ciclo: '', finca: '', predio: '', cuartel: '' };
        this.sofiaSubTab = 'resumen';
    }

    async showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const modalEl = document.getElementById('confirmDeleteModal');
            const titleEl = document.getElementById('confirmDeleteModalLabel');
            const messageEl = document.getElementById('confirmDeleteModalMessage');
            const btnConfirm = document.getElementById('btn-confirm-delete-action');

            if (!modalEl || !btnConfirm) {
                resolve(confirm(message));
                return;
            }

            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.innerHTML = message;

            // Initialize or get Bootstrap modal instance
            let bsModal = bootstrap.Modal.getInstance(modalEl);
            if (!bsModal) bsModal = new bootstrap.Modal(modalEl);
            
            const handleConfirm = () => {
                bsModal.hide();
                btnConfirm.onclick = null;
                resolve(true);
            };

            const handleCancel = () => {
                btnConfirm.onclick = null;
                resolve(false);
            };

            btnConfirm.onclick = handleConfirm;
            
            // Clean up listener before adding to avoid multiple registrations
            modalEl.removeEventListener('hidden.bs.modal', handleCancel);
            modalEl.addEventListener('hidden.bs.modal', handleCancel, { once: true });

            bsModal.show();
        });
    }

    async showAlert(message, title = 'Mensaje del Sistema') {
        return new Promise((resolve) => {
            const modalEl = document.getElementById('genericAlertModal');
            const titleEl = document.getElementById('genericAlertModalLabel');
            const messageEl = document.getElementById('genericAlertModalMessage');

            if (!modalEl) {
                alert(message);
                resolve();
                return;
            }

            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.innerHTML = message;

            let bsModal = bootstrap.Modal.getInstance(modalEl);
            if (!bsModal) bsModal = new bootstrap.Modal(modalEl);

            const handleClose = () => {
                modalEl.removeEventListener('hidden.bs.modal', handleClose);
                resolve();
            };

            modalEl.addEventListener('hidden.bs.modal', handleClose);
            bsModal.show();
        });
    }

    showToast(message, type = 'info') {
        const toastEl = document.getElementById('liveToast');
        const messageEl = document.getElementById('liveToastMessage');
        if (!toastEl || !messageEl) return;

        // Set colors based on type
        const colors = {
            success: 'var(--color-success)',
            error: 'var(--color-error)',
            warning: 'var(--color-amber-500)',
            info: 'var(--color-primary-500)'
        };

        toastEl.style.backgroundColor = colors[type] || colors.info;
        messageEl.textContent = message;

        const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
        bsToast.show();
    }


    init() {
        const user = UserModel.getCurrentUser();
        if (user) {
            this.loadDashboard(user);
        } else {
            this.loadLanding();
        }
    }

    // ── Navigation ──
    loadLanding() {
        this.app.innerHTML = renderLandingPage();
        this.bindLandingEvents();
    }

    loadLogin() {
        this.app.innerHTML = renderLoginPage();
        this.bindLoginEvents();
    }

    async loadDashboard(user, section = null) {
        this.currentUser = user;
        const menuItems = ROLE_MENUS[user.role] || [];

        // Load budget data from storage
        JornalesBudgetModel.loadFromStorage();
        // Try to auto-load budget CSV if it exists in Fuentes
        this.autoLoadJornalesBudget();

        // Load static Sofia files automatically
        await this.loadStaticSofiaData();

        // Default section is 'informe-gastos-historicos'
        if (!section) section = 'informe-gastos-historicos';
        this.currentSection = section;

        // Render layout first so overlay exists
        this.app.innerHTML = renderDashboardLayout(user, menuItems, section);
        this.bindDashboardEvents(user);

        // -- FAST LOADING (CURRENT CYCLE ONLY) AND BACKGROUND HISTORY --
        const overlay = document.getElementById('loading-overlay');
        const progressBar = document.getElementById('loading-progress');
        const progressMessage = document.getElementById('loading-message');
        const progressDetails = document.getElementById('loading-details');

        if (overlay) {
            overlay.classList.remove('hidden');

            try {
                // Health Check: Verificar si el proxy/servidor de Sofía está vivo
                let isSofiaDown = false;
                try {
                    const testRes = await fetch('/sofia-api/trabajvsfaenas');
                    if (testRes.status === 502 || testRes.status === 504 || testRes.status === 500) {
                        isSofiaDown = true;
                    }
                } catch (e) {
                    isSofiaDown = true;
                }

                if (isSofiaDown) {
                    if (progressMessage) {
                        progressMessage.innerHTML = '<span style="color: #ef4444; font-weight: 800; font-size: 1.1em;">⚠️ ¡¡¡El Servidor Sofia momentaneamente esta caido!!!</span>';
                    }
                    if (progressBar) {
                        progressBar.style.width = '100%';
                        progressBar.style.backgroundColor = '#ef4444';
                    }
                    if (progressDetails) progressDetails.textContent = 'Modo offline activado por falla de conexión.';

                    await new Promise(r => setTimeout(r, 10000));
                    throw new Error("El Servidor de Sofia está caído o no resuelve.");
                }

                const currentCycle = SofiaApiModel.getCurrentCycle();

                if (progressMessage) progressMessage.textContent = `Sincronizando ciclo actual (${currentCycle})...`;
                if (progressBar) progressBar.style.width = `50%`;

                // -- NEW: Sync Business Data from MySQL --
                if (progressDetails) progressDetails.textContent = 'Sincronizando datos de negocio...';
                await Promise.all([
                    UserModel.sync(),
                    FincaModel.sync(),
                    PredioModel.sync(),
                    VariedadModel.sync(),
                    EmpleadoModel.sync(),
                    LaborModel.sync(),
                    PresupuestoModel.sync(),
                    AplicacionModel.sync()
                ]);

                await new Promise(r => setTimeout(r, 1000)); // Reduced wait for Sofia and local sync
                if (progressBar) progressBar.style.width = `80%`;
                if (progressDetails) progressDetails.textContent = `Optimizando base de datos`;

                // Solo detenemos la UI para cargar el ciclo actual
                await SofiaApiModel.fetchCycleData(currentCycle);

                // Iniciamos la descarga/carga de la BD local del resto de los ciclos en segundo plano
                setTimeout(async () => {
                    const cycles = ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];
                    for (const c of cycles) {
                        if (c !== currentCycle) {
                            await SofiaApiModel.fetchCycleData(c);
                        }
                    }
                }, 500);

                // Complete
                if (progressBar) progressBar.style.width = '100%';
                if (progressMessage) progressMessage.textContent = 'Procesando datos...';
                await new Promise(r => setTimeout(r, 300)); // Short delay for visual completion

            } catch (error) {
                console.error("Error loading historical data:", error);
                if (progressMessage) progressMessage.textContent = 'Error de conexión. Cargando modo offline...';
            } finally {
                overlay.classList.add('hidden');
            }
        }

        this.loadSection(section, user);
    }

    async loadSection(section, user) {
        const content = document.getElementById('page-content');
        const title = document.getElementById('page-title');

        // Destroy existing charts
        Object.values(this.charts).forEach(c => { try { c.destroy(); } catch (e) { } });
        this.charts = {};

        switch (section) {
            case 'jornales':
                title.textContent = 'Informe de Jornales';
                this.renderJornalesSection(content);
                break;
            case 'cosecha':
                title.textContent = 'Informe de Cosecha';
                this.renderCosechaSection(content);
                break;
            case 'fincas':
                title.textContent = 'Informe de Fincas';
                this.renderFincasSection(content);
                break;
            case 'aplicaciones-sofia':
                title.textContent = 'Informe de Aplicaciones';
                await this.loadStaticSofiaData();
                this.renderAplicacionesSofiaModule(content);
                break;
            case 'informe-gastos':
                title.textContent = 'Informe de Gastos';
                content.innerHTML = renderGastosView();
                break;
            case 'informe-gastos-historicos':
                title.textContent = 'Informe de Gastos Históricos';
                content.innerHTML = renderGastosHistoricosView();
                this.renderGastosHistoricosSection();
                break;
            case 'informe-secaderos':
                title.textContent = 'Informe de Secaderos';
                content.innerHTML = renderSecaderosView();
                setTimeout(() => {
                    const btnGrid = document.getElementById('btn-secadero-grid');
                    const btnGantt = document.getElementById('btn-secadero-gantt');
                    const gridContainer = document.getElementById('secadero-grid-container');
                    const ganttContainer = document.getElementById('secadero-gantt-container');

                    if (btnGrid && btnGantt && gridContainer && ganttContainer) {
                        btnGrid.addEventListener('click', () => {
                            btnGrid.classList.add('active');
                            btnGantt.classList.remove('active');
                            gridContainer.style.display = 'block';
                            ganttContainer.style.display = 'none';
                        });
                        btnGantt.addEventListener('click', () => {
                            btnGantt.classList.add('active');
                            btnGrid.classList.remove('active');
                            ganttContainer.style.display = 'block';
                            gridContainer.style.display = 'none';
                        });
                    }

                    // Inicializar Controlador de Secaderos
                    SecaderosController.init();

                }, 50);
                break;
            case 'control-carga':
                title.textContent = 'Control de Carga de Labores';
                content.innerHTML = renderControlCargaView();
                this.renderControlCarga(content);
                break;
            case 'usuarios':
                title.textContent = 'Gestión de Usuarios';
                this.renderUsuariosSection(content);
                break;
            case 'admin-carga-trabajo':
                title.textContent = 'Carga de Trabajo de Campo';
                this.renderCargaTrabajoSection(content);
                break;
            case 'admin-bodegas-movimientos':
                title.textContent = 'Movimientos Stock';
                this.renderInventarioSection(content);
                break;
            default:
                // Handle all admin-* sections dynamically
                if (section && section.startsWith('admin-') && ADMIN_TABLE_CONFIG[section]) {
                    const cfg = ADMIN_TABLE_CONFIG[section];
                    title.textContent = cfg.title;
                    this.renderAdminCrudSection(content, section);
                }
                break;
        }

        // Update active sidebar item
        document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
    }

    // ── Sección 1: JORNALES ──
    async renderJornalesSection(container) {
        container.innerHTML = `
        <div class="sofia-filters animate-fade-in">
          <div class="filter-group">
            <label class="form-label">Ciclo Producción</label>
            <select class="form-select sofia-filter-select" id="filter-jornales-ciclo">
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
              <option value="2020-2021">2020-2021</option>
            </select>
          </div>
          <div class="filter-group" style="min-width: 140px;">
            <label class="form-label">Finca</label>
            <select class="form-select sofia-filter-select" id="filter-jornales-finca">
              <option value="">Todas</option>
              <option value="El Espejo">El Espejo</option>
              <option value="Fincas Viejas">Fincas Viejas</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Clasificación</label>
            <select class="form-select sofia-filter-select" id="filter-jornales-predio">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Variedad</label>
            <select class="form-select sofia-filter-select" id="filter-jornales-variedad">
              <option value="">Todas</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Desde</label>
            <input type="date" class="form-input" id="filter-jornales-desde" style="background:var(--bg-tertiary); max-width: 130px;" />
          </div>
          <div class="filter-group">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-input" id="filter-jornales-hasta" style="background:var(--bg-tertiary); max-width: 130px;" />
          </div>
        </div>

        <div id="jornales-content" class="animate-fade-in animate-delay-1">
            <div style="padding: var(--space-20); text-align: center; color: var(--text-tertiary);">
                <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
                <p>Cargando datos de jornales desde Sofía...</p>
                <small>(Este proceso puede tardar mientras se reconstruyen los datos mes a mes)</small>
            </div>
        </div>
        `;

        const filters = {
            ciclo: document.getElementById('filter-jornales-ciclo').value,
            finca: '', predio: '', variedad: '', desde: '', hasta: ''
        };

        const updateView = async () => {
            const content = document.getElementById('jornales-content');
            if (!content) return;

            const data = await SofiaApiModel.fetchJornales(filters);
            const stats = SofiaApiModel.getJornalesStats(data);
            const efficiency = SofiaApiModel.getEfficiencyStats(data);

            // Render jornales stats + eficiencia chart (Hectáreas por predio moved to Fincas section)
            const hectareasData = SofiaApiModel.getHectareasPorPredio(data);
            content.innerHTML = renderSofiaJornalesStats(stats, efficiency, filters.ciclo, this.currentUser?.role)
                + renderEficienciaChartSection(hectareasData);

            // Bind Table Cycle Selector to Sync
            document.getElementById('table-jornales-cycle')?.addEventListener('change', (e) => {
                const newVal = e.target.value;
                const mainFilter = document.getElementById('filter-jornales-ciclo');
                if (mainFilter) {
                    mainFilter.value = newVal;
                    filters.ciclo = newVal;
                    updateView();
                }
            });

            // Render Historical Comparison
            SofiaApiModel.getHistoricalComparison(filters).then(histData => {
                this.renderHistoricalChart(histData);
            });

            // ── Chart Filters Logic ──
            const chartData = data;
            const predioSelect = document.getElementById('chart-filter-predio');
            const faenaSelect = document.getElementById('chart-filter-faena');
            const laborSelect = document.getElementById('chart-filter-labor');

            const populateChartFilters = () => {
                const updateFaenasLabors = () => {
                    let subset = chartData;
                    const pVal = predioSelect.value;
                    if (pVal) {
                        if (pVal.startsWith('FINCA:')) {
                            const fincaName = pVal.replace('FINCA:', '');
                            subset = subset.filter(r => r.finca === fincaName);
                        } else {
                            subset = subset.filter(r => r.clasifica === pVal);
                        }
                    }

                    const faenas = [...new Set(subset.map(r => r.faena || 'Sin Faena'))].sort();
                    faenaSelect.innerHTML = '<option value="">🚜 Todas las Faenas</option>' +
                        faenas.map(f => `<option value="${f}">${f}</option>`).join('');

                    const updateLabors = (selectedFaena) => {
                        let laborsSubset = subset;
                        if (selectedFaena) laborsSubset = subset.filter(r => (r.faena || 'Sin Faena') === selectedFaena);
                        const labors = [...new Set(laborsSubset.map(r => r.labor_normalized || r.labor))].sort();
                        laborSelect.innerHTML = '<option value="">📝 Todas las Labores</option>' +
                            labors.map(l => `<option value="${l}">${l}</option>`).join('');
                    };

                    updateLabors(faenaSelect.value);
                };

                predioSelect.addEventListener('change', () => {
                    updateFaenasLabors();
                    updateChart();
                });

                faenaSelect.addEventListener('change', (e) => {
                    const pVal = predioSelect.value;
                    let subset = chartData;
                    if (pVal) {
                        if (pVal.startsWith('FINCA:')) subset = subset.filter(r => r.finca === pVal.replace('FINCA:', ''));
                        else subset = subset.filter(r => r.clasifica === pVal);
                    }

                    let laborsSubset = subset;
                    if (e.target.value) laborsSubset = subset.filter(r => (r.faena || 'Sin Faena') === e.target.value);
                    const labors = [...new Set(laborsSubset.map(r => r.labor_normalized || r.labor))].sort();
                    laborSelect.innerHTML = '<option value="">📝 Todas las Labores</option>' +
                        labors.map(l => `<option value="${l}">${l}</option>`).join('');

                    updateChart();
                });

                laborSelect.addEventListener('change', updateChart);

                updateFaenasLabors();
            };

            const updateChart = () => {
                const pVal = predioSelect.value;
                const fVal = faenaSelect.value;
                const lVal = laborSelect.value;

                let filtered = chartData;
                if (pVal) {
                    if (pVal.startsWith('FINCA:')) filtered = filtered.filter(r => r.finca === pVal.replace('FINCA:', ''));
                    else filtered = filtered.filter(r => r.clasifica === pVal);
                }
                if (fVal) filtered = filtered.filter(r => (r.faena || 'Sin Faena') === fVal);
                if (lVal) filtered = filtered.filter(r => (r.labor_normalized || r.labor) === lVal);

                // Prepare comparison data
                const currentChartFilters = {
                    finca: (pVal && pVal.startsWith('FINCA:')) ? pVal.replace('FINCA:', '') : (filters.finca || ''),
                    predio: (pVal && !pVal.startsWith('FINCA:')) ? pVal : '',
                    labor: lVal
                };

                const comparison = fVal || lVal
                    ? JornalesBudgetModel.getComparisonByLabor(filtered, currentChartFilters)
                    : JornalesBudgetModel.getComparisonByFaena(filtered, currentChartFilters);
                this.renderJornadasChart(comparison);
            };

            populateChartFilters();
            updateChart();

            // Map display names back to clasifica keywords for the API filter
            const CLASIFICA_MAP = {
                'El Espejo 1': 'EEI', 'El Espejo 2': 'EEII', 'El Espejo 3': 'EEIII',
                'Camino Truncado': 'Camino Truncado', 'La Chimbera': 'La Chimbera', 'Puente Alto': 'Puente Alto'
            };

            // Helper to render efficiency chart with optional classification filter
            const renderEfficiency = (clasificacion = '') => {
                const effFilters = { ...filters, predio: clasificacion ? (CLASIFICA_MAP[clasificacion] || clasificacion) : '' };
                SofiaApiModel.getHistoricalEfficiencyComparison(effFilters).then(histData => {
                    this.renderHistoricalEfficiencyChart(histData);
                });
                // Update label
                const label = document.getElementById('eficiencia-filter-label');
                if (label) label.textContent = clasificacion ? `— ${clasificacion}` : '';
            };

            // Initial render
            renderEfficiency();

            // Bind classification filter
            document.getElementById('filter-eficiencia-clasificacion')?.addEventListener('change', (e) => {
                renderEfficiency(e.target.value);
            });

            // Populate filter lists dynamically based on active data
            const updateFilterList = (id, key, allData) => {
                const sel = document.getElementById(id);
                if (!sel) return;
                const currentVal = filters[key];

                let subData = allData;
                if (filters.finca) subData = subData.filter(r => r.finca === filters.finca);

                const uniqueVals = [...new Set(subData.map(r => {
                    if (key === 'predio') return r.clasifica || r.clasificacion || r.Clasificacion || r.Clasifica;
                    if (key === 'variedad') return r.variedad || r.variedades || r.Variedad || r.Variedades;
                    if (key === 'labor') return r.labor_normalized || r.labor || r.Labor;
                    return r[key];
                }))].filter(v => v !== null && v !== undefined && v !== '').sort();


                sel.innerHTML = `<option value="">${key === 'predio' ? 'Todos' : 'Todas'}</option>` +
                    uniqueVals.map(v => `<option value="${v}" ${v === currentVal ? 'selected' : ''}>${v}</option>`).join('');
            };

            updateFilterList('filter-jornales-predio', 'predio', SofiaApiModel.DATA_JORNALES);
            updateFilterList('filter-jornales-variedad', 'variedad', SofiaApiModel.DATA_JORNALES);

            JornalesBudgetModel.loadFromStorage();

            document.getElementById('input-budget-csv')?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const content = event.target.result;
                        const res = JornalesBudgetModel.importFromCSV(content);
                        if (res.success) {
                            // Also save to server Fuentes folder
                            try {
                                const saveResp = await fetch('/api/save-jornales-budget', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ filename: file.name, content })
                                });
                                const saveRes = await saveResp.json();
                                if (saveRes.success) {
                                    this.showToast(`Presupuesto guardado en Fuentes (${res.count} registros)`, 'success');
                                } else {
                                    this.showToast(`Cargado localmente, pero error al guardar en servidor`, 'warning');
                                }
                            } catch (err) {
                                console.error('Error saving budget to server:', err);
                            }
                            updateChart();
                        } else {
                            this.showAlert(res.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        };

        const bind = (id, key) => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                filters[key] = e.target.value;
                if (key === 'finca') { filters.predio = ''; filters.variedad = ''; }
                updateView();
            });
        };

        ['filter-jornales-ciclo', 'filter-jornales-finca', 'filter-jornales-predio',
            'filter-jornales-variedad', 'filter-jornales-desde', 'filter-jornales-hasta'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                const key = id.split('-').pop();
                bind(id, key === 'ciclo' ? 'ciclo' : key);
            });

        await updateView();
    }

    renderHistoricalChart(histData) {
        const ctx = document.getElementById('chart-jornales-historico');
        if (!ctx) return;

        if (this.charts.historico) {
            this.charts.historico.destroy();
        }

        // @ts-ignore
        this.charts.historico = new Chart(ctx, {
            type: 'line',
            data: histData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#f1f5f9' } },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += new Intl.NumberFormat('es-AR').format(context.parsed.y) + ' Jor';
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } },
                    y: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } }
                }
            }
        });
    }

    renderHistoricalEfficiencyChart(histData) {
        const ctx = document.getElementById('chart-jornales-eficiencia-historico');
        if (!ctx) return;

        if (this.charts.historicoEficiencia) {
            this.charts.historicoEficiencia.destroy();
        }

        // @ts-ignore
        this.charts.historicoEficiencia = new Chart(ctx, {
            type: 'line',
            data: histData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#f1f5f9' } },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += new Intl.NumberFormat('es-AR').format(context.parsed.y) + ' Jor/Ha';
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false } },
                    y: {
                        ticks: { color: '#cbd5e1' },
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        title: { display: true, text: 'Intensidad (Jor/Ha)', color: '#64748b' }
                    }
                }
            }
        });
    }

    // ── Sección 2: COSECHA ──
    // ── Sección 2: COSECHA ──
    async renderCosechaSection(container) {
        container.innerHTML = `
        <div class="sofia-filters animate-fade-in">
          <div class="filter-group">
            <label class="form-label">Ciclo Producción</label>
            <select class="form-select sofia-filter-select" id="filter-cosecha-ciclo" style="padding-left:var(--space-4);">
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
              <option value="2020-2021">2020-2021</option>
              <option value="2019-2020">2019-2020</option>
              <option value="2018-2019">2018-2019</option>
              <option value="2017-2018">2017-2018</option>
              <option value="2016-2017">2016-2017</option>
              <option value="2015-2016">2015-2016</option>
              <option value="2014-2015">2014-2015</option>
              <option value="2013-2014">2013-2014</option>
              <option value="2012-2013">2012-2013</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Finca</label>
            <select class="form-select sofia-filter-select" id="filter-cosecha-finca" style="padding-left:var(--space-4);">
              <option value="">Todas</option>
              <option value="El Espejo">El Espejo</option>
              <option value="Fincas Viejas">Fincas Viejas</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Clasificación</label>
            <select class="form-select sofia-filter-select" id="filter-cosecha-predio" style="padding-left:var(--space-4);">
              <option value="">Todos</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Variedad</label>
            <select class="form-select sofia-filter-select" id="filter-cosecha-variedad" style="padding-left:var(--space-4);">
              <option value="">Todas</option>
            </select>
          </div>
          ${this.currentUser?.role === 'Administrador' ? `<div class="filter-group" style="display: flex; align-items: flex-end;">
            <button id="btn-cerrar-ciclo" class="btn btn-primary" style="height: 42px; background-color: var(--color-error); border-color: var(--color-error);">Archivar Ciclo</button>
          </div>` : ''}
        </div>

        <div id="cosecha-dashboard-container">
            <div style="padding: var(--space-20); text-align: center; color: var(--text-tertiary);">
                <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
                <p>Cargando datos de cosecha desde Sofía...</p>
                <small>(Reconstruyendo historial de rendimiento...)</small>
            </div>
        </div>
        `;

        const filters = {
            ciclo: document.getElementById('filter-cosecha-ciclo').value,
            finca: '', predio: '', variedad: ''
        };

        const dashboard = document.getElementById('cosecha-dashboard-container');
        if (!dashboard) return;

        // Populate filter lists dynamically based on active data
        const updateFilterList = (id, key, allData) => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const currentVal = filters[key];

            let subData = allData;
            if (filters.finca) subData = subData.filter(r => r.finca === filters.finca);

            const uniqueVals = [...new Set(subData.map(r => {
                if (key === 'predio') return r.clasifica || r.clasificacion || r.Clasificacion || r.Clasifica;
                if (key === 'variedad') return r.variedad || r.variedades || r.Variedad || r.Variedades;
                return r[key];
            }))].filter(v => v !== null && v !== undefined && v !== '').sort();


            sel.innerHTML = `<option value="">${key === 'predio' ? 'Todos' : 'Todas'}</option>` +
                uniqueVals.map(v => `<option value="${v}" ${v === currentVal ? 'selected' : ''}>${v}</option>`).join('');
        };

        // ── updateDashboard: re-filter & re-render ──
        const updateDashboard = async () => {
            const dashboard = document.getElementById('cosecha-dashboard-container');
            if (!dashboard) return;

            // Re-fetch if cycle changed, otherwise use cached data
            const data = await SofiaApiModel.fetchCosecha(filters);
            const filtered = SofiaApiModel.applyFilters(data, filters);
            const stats = SofiaApiModel.getCosechaDashboardStats(filtered);



            const clWrapper = document.getElementById('cosecha-levantado-wrapper');
            if (!clWrapper) {
                // First pass, add wrapper
                dashboard.innerHTML = renderCosechaDashboard(stats, this.currentUser?.role) + '<div id="cosecha-levantado-wrapper"></div>';
                updateCosechaLevantadoWidget();
            } else {
                // Sub-components are already there, just replace the top dashboard
                // We must use a temporary container to swap the HTML while preserving the wrapper
                const tmp = document.createElement('div');
                tmp.innerHTML = renderCosechaDashboard(stats, this.currentUser?.role);

                // Clear all nodes in dashboard except the wrappers we want to preserve
                Array.from(dashboard.childNodes).forEach(node => {
                    if (node.id !== 'cosecha-levantado-wrapper') {
                        node.remove();
                    }
                });

                // Prepend new top content
                while (tmp.firstChild) {
                    dashboard.insertBefore(tmp.firstChild, clWrapper);
                }
            }



            // Update dynamic filter options
            updateFilterList('filter-cosecha-predio', 'predio', data);
            updateFilterList('filter-cosecha-variedad', 'variedad', data);

            // Rebind origin filter for historical chart
            const originFilter = document.getElementById('filter-cosecha-historico-origen');
            if (originFilter) {
                originFilter.addEventListener('change', async (e) => {
                    const histStats = await SofiaApiModel.getHistoricalCosechaStats({ ...filters, origen: e.target.value });
                    this.renderCosechaHistoryChart(histStats);
                });
            }

            // Bind cycle filter for rendement chart
            const rendementCycleFilter = document.getElementById('filter-cosecha-rendimiento-ciclo');
            if (rendementCycleFilter) {
                rendementCycleFilter.value = filters.ciclo;
                const updateLabel = (val) => {
                    const label = document.getElementById('label-rendimiento-ciclo');
                    if (label) label.textContent = val;
                };
                updateLabel(filters.ciclo);

                rendementCycleFilter.addEventListener('change', async (e) => {
                    const localCycle = e.target.value;
                    updateLabel(localCycle);
                    const localFullData = await SofiaApiModel.fetchCycleData(localCycle);
                    const localFullFiltered = SofiaApiModel.applyFilters(localFullData, { ...filters, ciclo: localCycle });
                    const rendementStats = SofiaApiModel.getRendimientoPredioStats(localFullFiltered);
                    this.renderCosechaRendimientoPredioChart(rendementStats);
                });
            }

            // Re-render charts
            const fullCycleData = await SofiaApiModel.fetchCycleData(filters.ciclo);
            const fullFiltered = SofiaApiModel.applyFilters(fullCycleData, filters);
            const rendimientoStats = SofiaApiModel.getRendimientoPredioStats(fullFiltered);
            this.renderCosechaRendimientoPredioChart(rendimientoStats);

            const evolucionStats = await SofiaApiModel.getHistoricalYieldEvolution(filters);
            this.renderCosechaEvolucionRendimientoChart(evolucionStats);

            const histStats = await SofiaApiModel.getHistoricalCosechaStats(filters);
            this.renderCosechaHistoryChart(histStats);
        };

        const bind = (id, key) => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                filters[key] = e.target.value;
                if (key === 'finca') { filters.predio = ''; filters.variedad = ''; }
                updateDashboard();
            });
        };

        bind('filter-cosecha-ciclo', 'ciclo');
        bind('filter-cosecha-finca', 'finca');
        bind('filter-cosecha-predio', 'predio');
        bind('filter-cosecha-variedad', 'variedad');

        const btnCerrarCiclo = document.getElementById('btn-cerrar-ciclo');
        if (btnCerrarCiclo) {
            btnCerrarCiclo.addEventListener('click', async () => {
                const currentCycle = document.getElementById('filter-cosecha-ciclo').value;
                if (confirm(`¿Estás seguro que deseas pasar el ciclo ${currentCycle} a histórico (Archivarlo)?\nSe guardará localmente para mejorar el rendimiento, se almacenará en la base de datos histórica y dejará de actualizarse desde Sofía.`)) {
                    // Force refresh from API one last time before converting it to manual historical
                    const btnOriginalText = btnCerrarCiclo.textContent;
                    btnCerrarCiclo.textContent = 'Archivando...';
                    btnCerrarCiclo.disabled = true;
                    try {
                        const dataToArchive = await SofiaApiModel.fetchCycleData(currentCycle, true);
                        
                        // Guardar en la base de datos de PostgreSQL
                        const archiveResponse = await fetch('/api/archive-cycle', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ciclo: currentCycle, data: dataToArchive })
                        });
                        const archiveResult = await archiveResponse.json();
                        
                        if (!archiveResponse.ok || !archiveResult.success) {
                            throw new Error(archiveResult.message || 'Error del servidor al archivar');
                        }

                        localStorage.setItem(`manualHistory_${currentCycle}`, 'true');
                        alert(`Ciclo ${currentCycle} guardado en base de datos histórica exitosamente.`);
                        updateDashboard();
                    } catch (e) {
                        alert("Error archivando el ciclo: " + e.message);
                    } finally {
                        btnCerrarCiclo.textContent = btnOriginalText;
                        btnCerrarCiclo.disabled = false;
                    }
                }
            });
        }

        // State for inner widget
        const clFiltersState = { finca: '', ciclo: filters.ciclo };

        const updateCosechaLevantadoWidget = async () => {
            const container = document.getElementById('cosecha-levantado-wrapper');
            if (!container) return;

            // Get full cycle data (ignoring top-level 'desde/hasta', just using local filter 'ciclo')
            const fullCycleData = await SofiaApiModel.fetchCycleData(clFiltersState.ciclo || '2025-2026');
            // Apply ONLY local finca filter (ignore global predio/variedades for this section as it's grouped)
            const fullFiltered = SofiaApiModel.applyFilters(fullCycleData, { finca: clFiltersState.finca });
            const clStats = SofiaApiModel.getCosechaLevantadoStats(fullFiltered);
            const pasaEvolStats = SofiaApiModel.getCosechaComparativaPorPredio(fullFiltered); // FIXED METHOD NAME

            container.innerHTML = renderCosechaLevantadoTable(clStats, clFiltersState.finca, clFiltersState.ciclo);
            
            // Render the new chart manually
            this.renderCosechaPasaPrediosChart(pasaEvolStats);

            // Re-bind local elements
            document.getElementById('filter-cl-finca')?.addEventListener('change', e => {
                clFiltersState.finca = e.target.value;
                updateCosechaLevantadoWidget();
            });
            document.getElementById('filter-cl-ciclo')?.addEventListener('change', e => {
                clFiltersState.ciclo = e.target.value;
                updateCosechaLevantadoWidget();
            });
        };

        await updateDashboard();
    }

    renderCosechaRendimientoPredioChart(stats) {
        const ctx = document.getElementById('chart-cosecha-rendimiento-predio');
        if (!ctx) return;

        if (this.charts.cosechaRendimiento) {
            this.charts.cosechaRendimiento.destroy();
        }

        // @ts-ignore
        this.charts.cosechaRendimiento = new Chart(ctx, {
            type: 'bar',
            data: stats,
            options: {
                ...this.getChartOptions('Kg/Ha'),
                plugins: {
                    ...this.getChartOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    }

    renderCosechaPasaPrediosChart(stats) {
        const ctx = document.getElementById('chart-cosecha-pasa-evolucion');
        if (!ctx) return;

        if (this.charts.cosechaPasaEvolucion) {
            this.charts.cosechaPasaEvolucion.destroy();
        }

        // @ts-ignore
        this.charts.cosechaPasaEvolucion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Cosechado en Fresco (Kg)',
                        data: stats.fresco,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        // @ts-ignore
                        datalabels: {
                            display: true,
                            color: '#ffffff',
                            anchor: 'end',
                            align: 'top',
                            offset: 4,
                            font: { size: 10, weight: 'bold', family: 'Outfit' },
                            formatter: (value, context) => {
                                const factor = stats.factors[context.dataIndex];
                                return `${value.toLocaleString()} (${factor}x)`;
                            }
                        }
                    },
                    {
                        type: 'bar',
                        label: 'Levantado de Pasa (Kg)',
                        data: stats.pasa,
                        backgroundColor: 'rgba(168, 85, 247, 0.7)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        // @ts-ignore
                        datalabels: {
                            display: true,
                            color: '#ffffff',
                            anchor: 'end',
                            align: 'top',
                            offset: 4,
                            font: { size: 10, weight: 'bold', family: 'Outfit' },
                            formatter: (value) => value > 0 ? value.toLocaleString() : ''
                        }
                    }
                ]
            },
            options: {
                ...this.getChartOptions('Kilos (Kg)'),
                plugins: {
                    ...this.getChartOptions().plugins,
                    legend: { display: true, position: 'top' },
                    // @ts-ignore
                    datalabels: { display: true }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        // Add some padding for labels at the top
                        suggestedMax: Math.max(...(stats.fresco.length ? stats.fresco : [1000])) * 1.15
                    }
                }
            }
        });
    }

    renderCosechaEvolucionRendimientoChart(stats) {
        const ctx = document.getElementById('chart-cosecha-evolucion-rendimiento');
        if (!ctx) return;

        if (this.charts.cosechaEvolucionRendimiento) {
            this.charts.cosechaEvolucionRendimiento.destroy();
        }

        // @ts-ignore
        this.charts.cosechaEvolucionRendimiento = new Chart(ctx, {
            type: 'bar', // Changed from line to bar
            data: stats,
            options: {
                ...this.getChartOptions('Kg'),
                plugins: {
                    ...this.getChartOptions('Kg').plugins,
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'rgba(255,255,255,0.7)',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#F8FAFC',
                        bodyColor: '#CBD5E1',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += new Intl.NumberFormat('es-AR').format(context.parsed.y) + ' Kg';
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    renderCosechaHistoryChart(stats) {
        const ctx = document.getElementById('chart-cosecha-historico');
        if (!ctx) return;

        if (this.charts.cosechaHistory) {
            this.charts.cosechaHistory.destroy();
        }

        // Dataset de datos reales (índice 1 en stats.datasets)
        const realDataset = stats.datasets[1]; // Producción Real
        const estimadoDataset = stats.datasets[0]; // Estimado BP

        // Línea de tendencia usa los datos reales
        const realData = realDataset?.data || [];
        const lineDataset = {
            label: 'Tendencia',
            data: [...realData],
            type: 'line',
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            pointBackgroundColor: '#f59e0b',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5,
            tension: 0.3,
            fill: false,
            order: 0,
            datalabels: { display: false }
        };

        const chartData = {
            labels: stats.labels,
            datasets: [
                {
                    ...estimadoDataset,
                    order: 2,
                    barPercentage: 0.85,
                    grouped: false,
                    datalabels: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.5)',
                        anchor: 'end',
                        align: 'end',
                        font: { size: 10, weight: '600' },
                        formatter: (value) => {
                            if (!value) return '';
                            let fmt = value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : Math.round(value / 1000) + 'K';
                            return fmt + ' (Est.)';
                        }
                    }
                },
                { ...realDataset, order: 1, barPercentage: 0.85, grouped: false },
                lineDataset
            ]
        };

        // @ts-ignore
        this.charts.cosechaHistory = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    datalabels: {
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        color: '#e2e8f0',
                        font: { size: 10, weight: 'bold' },
                        formatter: (value) => {
                            if (!value || value === 0) return '';
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return Math.round(value / 1000) + 'K';
                            return value;
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += new Intl.NumberFormat('es-AR').format(context.parsed.y) + ' kg';
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#e2e8f0' }, grid: { display: false } },
                    y: {
                        ticks: { color: '#e2e8f0' },
                        grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // ── Sección: USUARIOS (Admin only) ──
    async renderUsuariosSection(container) {
        const users = await UserModel.getAll({ includePending: true });
        const roles = Object.values(UserModel.ROLES);
        container.innerHTML = renderUsuariosView(users, roles);

        const showModal = (editing = null) => {
            const overlay = document.getElementById('user-modal-overlay');
            const title = document.getElementById('user-modal-title');
            overlay.style.display = 'flex';

            if (editing) {
                title.textContent = '✏️ Editar Usuario';
                document.getElementById('user-edit-id').value = editing.id;
                document.getElementById('user-name').value = editing.name;
                document.getElementById('user-email').value = editing.email;
                document.getElementById('user-password').value = '';
                document.getElementById('user-password').placeholder = '(dejar vacío para no cambiar)';
                document.getElementById('user-role').value = editing.role;
            } else {
                title.textContent = '➕ Nuevo Usuario';
                document.getElementById('user-edit-id').value = '';
                document.getElementById('form-usuario').reset();
                document.getElementById('user-password').placeholder = 'Contraseña';
            }
        };

        const hideModal = () => {
            document.getElementById('user-modal-overlay').style.display = 'none';
        };

        const refreshTable = () => {
            this.renderUsuariosSection(container);
        };

        // Nuevo usuario
        document.getElementById('btn-add-usuario')?.addEventListener('click', () => showModal());

        // Cancelar
        document.getElementById('btn-cancel-usuario')?.addEventListener('click', hideModal);

        // Click fuera del modal
        document.getElementById('user-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'user-modal-overlay') hideModal();
        });

        // Submit form (Create or Update)
        document.getElementById('form-usuario')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = e.target.querySelector('button[type="submit"]');
            const originalText = btnSave.textContent;

            const editId = document.getElementById('user-edit-id').value;
            const userData = {
                name: document.getElementById('user-name').value.trim(),
                email: document.getElementById('user-email').value.trim(),
                role: document.getElementById('user-role').value,
                active: true // Default to active on edit/create
            };
            const password = document.getElementById('user-password').value.trim();
            if (password) userData.password = password;

            btnSave.disabled = true;
            btnSave.textContent = '...';

            if (editId) {
                // If editing, preserve active status if it was inactive (optional enhancement could be added)
                const existing = users.find(u => u.id === parseInt(editId));
                if (existing) userData.active = existing.active;
                await UserModel.update(parseInt(editId), userData);
            } else {
                if (!password) {
                    alert('La contraseña es obligatoria para usuarios nuevos.');
                    btnSave.disabled = false;
                    btnSave.textContent = originalText;
                    return;
                }
                await UserModel.add(userData); // Now async
            }

            hideModal();
            refreshTable();
        });

        // Editar
        container.querySelectorAll('.btn-edit-usuario').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const user = users.find(u => u.id === id);
                if (user) showModal(user);
            });
        });

        // Deactivate / Reactivate (Delete button)
        container.querySelectorAll('.btn-delete-usuario').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const user = users.find(u => u.id === id);
                if (!user) return;

                const action = user.active ? 'desactivar' : 'reactivar';
                const confirmed = await this.showConfirmModal(`¿Está seguro que desea ${action} al usuario "${user.name}"?`);
                if (confirmed) {
                    btn.disabled = true;
                    await UserModel.update(id, { ...user, active: !user.active });
                    refreshTable();
                }
            });
        });

        // Aprobar usuario pendiente
        container.querySelectorAll('.btn-approve-usuario').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                // Search in local users array fetched at start of section
                const user = users.find(u => u.id === id);
                if (!user) return;

                const confirmed = await this.showConfirmModal(`¿Aprobar el acceso de "${user.name}" (${user.email})?`);
                if (confirmed) {
                    btn.disabled = true;
                    btn.textContent = '...';
                    const success = await UserModel.approveUser(id);
                    if (success) {
                        refreshTable();
                        // Update notification badge if exists
                        const badge = document.getElementById('notification-badge');
                        if (badge) badge.textContent = NotificationModel.getUnread().length || '';
                    } else {
                        btn.disabled = false;
                        btn.textContent = '✅ Aprobar';
                        this.showAlert('Error al aprobar usuario.');
                    }
                }
            });
        });

        // Rechazar usuario pendiente
        container.querySelectorAll('.btn-reject-usuario').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const user = users.find(u => u.id === id);
                if (!user) return;

                const confirmed = await this.showConfirmModal(`¿Rechazar la solicitud de "${user.name}"?\nEl usuario será eliminado.`);
                if (confirmed) {
                    btn.disabled = true;
                    btn.textContent = '...';
                    const success = await UserModel.rejectUser(id);
                    if (success) {
                        refreshTable();
                        // Update notification badge
                        const badge = document.getElementById('notification-badge');
                        if (badge) badge.textContent = NotificationModel.getUnread().length || '';
                    } else {
                        btn.disabled = false;
                        btn.textContent = '❌ Rechazar';
                        this.showAlert('Error al rechazar usuario.');
                    }
                }
            });
        });

        // Buscador
        document.getElementById('search-usuarios')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#table-usuarios tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }

    // ── Sección: CRUD Genérico Admin ──
    async renderAdminCrudSection(container, sectionId) {
        const config = ADMIN_TABLE_CONFIG[sectionId];
        const model = ADMIN_MODELS[sectionId];
        if (!config || !model) return;

        // Show loading spinner
        container.innerHTML = `
            <div style="padding: var(--space-20); text-align: center; color: var(--text-tertiary);">
                <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
                <p>Cargando ${config.title.toLowerCase()}...</p>
            </div>
        `;

        // Fetch primary data and catalogs for relations
        const catalogs = {};
        const modelsToFetch = new Set();
        (config.columns || []).forEach(col => {
            if (col.type === 'select-model' && col.model) modelsToFetch.add(col.model);
        });
        // Extra for Quartel dependency
        if (sectionId === 'admin-cuarteles') modelsToFetch.add('admin-fincas');

        const [data] = await Promise.all([
            model.getAll(true),
            ...([...modelsToFetch].map(async mId => {
                if (ADMIN_MODELS[mId]) catalogs[mId] = await ADMIN_MODELS[mId].getAll(true);
            }))
        ]);

        container.innerHTML = renderAdminCrudView(config, data, catalogs, sectionId);

        // ── Event bindings ──
        const refreshTable = async () => {
            // Re-fetch everything on refresh to ensure catalogs are fresh
            const [freshData] = await Promise.all([
                model.getAll(true),
                ...([...modelsToFetch].map(async mId => {
                    if (ADMIN_MODELS[mId]) catalogs[mId] = await ADMIN_MODELS[mId].getAll(true);
                }))
            ]);
            container.innerHTML = renderAdminCrudView(config, freshData, catalogs, sectionId);
            this.bindAdminCrudEvents(container, config, model, refreshTable, sectionId);
        };

        this.bindAdminCrudEvents(container, config, model, refreshTable, sectionId);
    }

    async renderCargaTrabajoSection(container) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center;">⌛ Cargando sistema de operativa...</div>`;

        try {
            // Fetch everything needed with individual error catching for debug
            const [logs, fincas, predios, cuarteles, faenas, labores, personal, productos] = await Promise.all([
                fetch(`${VITE_API_URL}/trabajo-campo-completo`).then(r => r.json()).catch(e => { console.error('Error logs:', e); throw e; }),
                ADMIN_MODELS['admin-fincas'].getAll().catch(e => { console.error('Error fincas:', e); throw e; }),
                ADMIN_MODELS['admin-predios'].getAll().catch(e => { console.error('Error predios:', e); throw e; }),
                ADMIN_MODELS['admin-cuarteles'].getAll().catch(e => { console.error('Error cuarteles:', e); throw e; }),
                ADMIN_MODELS['admin-faenas'].getAll().catch(e => { console.error('Error faenas:', e); throw e; }),
                ADMIN_MODELS['admin-labor'].getAll().catch(e => { console.error('Error labor:', e); throw e; }),
                ADMIN_MODELS['admin-personal'].getAll().catch(e => { console.error('Error personal:', e); throw e; }), // Personal/Empleados
                ADMIN_MODELS['admin-productos'].getAll().catch(e => { console.error('Error productos:', e); throw e; })
            ]);

            const catalogs = { fincas, predios, cuarteles, faenas, labores, empleados: personal, productos };
            
            // Safety check: ensure logs is an array
            const logsArray = Array.isArray(logs) ? logs : [];
            if (!Array.isArray(logs)) {
                console.error('Expected array for work-logs, got:', logs);
            }
            
            container.innerHTML = renderWorkLogView(logsArray, catalogs);
            this.bindWorkLogEvents(container, logsArray, catalogs);
        } catch (e) {
            console.error('Work section load error:', e);
            container.innerHTML = `<div style="padding: 2rem; color: var(--color-error);">
                Error al cargar catálogos operativos. Verifique la base de datos.<br>
                <code style="color: black; background: #fee; padding: 1rem; display: block; margin-top: 1rem; text-align: left;">${e.stack || e.message || String(e)}</code>
            </div>`;
        }
    }

    bindWorkLogEvents(container, currentLogs, catalogs) {
        const { fincas, predios, cuarteles, productos, faenas, labores } = catalogs;

        const refresh = () => this.renderCargaTrabajoSection(container);

        // -- Modal UI Elements --
        const modal = document.getElementById('work-log-modal-overlay');
        const modalTitle = document.getElementById('work-modal-title');
        const hiddenIdInput = document.getElementById('work-log-id');
        const submitBtn = document.getElementById('work-btn-submit');
        const form = document.getElementById('form-work-log');

        const fincaSelect = document.getElementById('work-finca');
        const predioSelect = document.getElementById('work-predio');
        const cuartelSelect = document.getElementById('work-cuartel');
        const faenaSelect = document.getElementById('work-faena');
        const laborSelect = document.getElementById('work-labor');
        const insumoContainer = document.getElementById('insumos-list-container');
        const template = document.getElementById('template-insumo-item');

        const resetForm = () => {
            form.reset();
            hiddenIdInput.value = '';
            modalTitle.textContent = '🚜 Registro de Jornal / Trabajo Diario';
            submitBtn.textContent = '💾 Registrar Trabajo';
            insumoContainer.innerHTML = '';
            predioSelect.disabled = true;
            cuartelSelect.disabled = true;
            laborSelect.disabled = true;
            // Clear checked tools
            document.querySelectorAll('input[name="work-tools"]').forEach(i => i.checked = false);
        };

        // Open for New
        document.getElementById('btn-add-work-log')?.addEventListener('click', () => {
            resetForm();
            modal.style.display = 'flex';
        });

        const closeModal = () => modal.style.display = 'none';
        document.getElementById('btn-close-work-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-work-log')?.addEventListener('click', closeModal);

        // -- Chained Dropdowns --
        fincaSelect?.addEventListener('change', (e) => {
            const fid = e.target.value;
            predioSelect.innerHTML = '<option value="">Seleccionar Predio...</option>';
            cuartelSelect.innerHTML = '<option value="">-</option>';
            cuartelSelect.disabled = true;
            if (fid) {
                predios.filter(p => p.finca_id == fid).forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id; opt.textContent = p.nombre;
                    predioSelect.appendChild(opt);
                });
                predioSelect.disabled = false;
            } else {
                predioSelect.disabled = true;
            }
        });

        predioSelect?.addEventListener('change', (e) => {
            const pid = e.target.value;
            cuartelSelect.innerHTML = '<option value="">Seleccionar Cuartel...</option>';
            if (pid) {
                cuarteles.filter(c => c.predio_id == pid).forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id; opt.textContent = `Cuartel ${c.numero}`;
                    cuartelSelect.appendChild(opt);
                });
                cuartelSelect.disabled = false;
            } else {
                cuartelSelect.disabled = true;
            }
        });

        faenaSelect?.addEventListener('change', (e) => {
            const faenaId = e.target.value;
            laborSelect.innerHTML = '<option value="">Seleccionar Labor Específica...</option>';
            if (faenaId) {
                labores.filter(l => l.faena_id == faenaId).forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = l.id; opt.textContent = l.nombre;
                    laborSelect.appendChild(opt);
                });
                laborSelect.disabled = false;
            } else {
                laborSelect.disabled = true;
            }
        });

        // -- Live Jornal Preview --
        const qtyInp = document.getElementById('work-cantidad');
        const unitSel = document.getElementById('work-unidad');
        const previewDiv = document.getElementById('work-jornal-preview');

        const updatePreview = () => {
            if (!qtyInp || !unitSel || !previewDiv) return;
            const qty = parseFloat(qtyInp.value) || 0;
            const unit = unitSel.value;
            if (unit === 'horas') {
                previewDiv.querySelector('span').textContent = (qty / 8).toFixed(2);
                previewDiv.style.display = 'block';
            } else if (unit === 'jornal') {
                previewDiv.querySelector('span').textContent = qty.toFixed(2);
                previewDiv.style.display = 'block';
            } else {
                previewDiv.style.display = 'none';
            }
        };
        qtyInp?.addEventListener('input', updatePreview);
        unitSel?.addEventListener('change', updatePreview);

        // -- Insumos Dynamic Rows --
        const addInsumoRow = (prodId = '', qty = '') => {
            const clone = template.content.cloneNode(true);
            const row = clone.querySelector('.insumo-row');
            if (prodId) row.querySelector('.select-insumo-id').value = prodId;
            if (qty) row.querySelector('.input-insumo-qty').value = qty;
            row.querySelector('.btn-remove-insumo').onclick = () => row.remove();
            insumoContainer.appendChild(clone);
        };
        document.getElementById('btn-add-insumo-row')?.addEventListener('click', () => addInsumoRow());

        // -- Search --
        document.getElementById('search-work-logs')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#table-work-logs tbody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // -- Edit --
        container.querySelectorAll('.btn-edit-work-log').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                try {
                    const res = await fetch(`${VITE_API_URL}/trabajo-campo/${id}`).then(r => r.json());
                    if (!res.success) throw new Error(res.message);

                    resetForm();
                    const { log, insumos, herramientas } = res;

                    hiddenIdInput.value = log.id;
                    modalTitle.textContent = '✏️ Editar Registro de Trabajo';
                    submitBtn.textContent = '💾 Actualizar Registro';

                    document.getElementById('work-fecha-inicio').value = log.fecha.split('T')[0];
                    document.getElementById('work-fecha-fin').value = log.fecha.split('T')[0]; // One date edit
                    document.getElementById('work-hora-inicio').value = log.hora_inicio || '08:00';
                    document.getElementById('work-hora-fin').value = log.hora_fin || '17:00';
                    document.getElementById('work-empleado').value = log.empleado_id;
                    
                    // Trigger chains
                    fincaSelect.value = log.finca_id;
                    fincaSelect.dispatchEvent(new Event('change'));
                    predioSelect.value = log.predio_id;
                    predioSelect.dispatchEvent(new Event('change'));
                    
                    // For multiple selection, we need to handle it
                    const options = Array.from(cuartelSelect.options);
                    options.forEach(opt => opt.selected = opt.value == log.cuartel_id);

                    faenaSelect.value = log.faena_id;
                    faenaSelect.dispatchEvent(new Event('change'));
                    laborSelect.value = log.labor_id || '';

                    document.getElementById('work-cantidad').value = log.cantidad;
                    document.getElementById('work-unidad').value = log.unidad;
                    document.getElementById('work-notas').value = log.notas || '';

                    insumos.forEach(i => addInsumoRow(i.producto_id, i.cantidad));
                    
                    document.querySelectorAll('input[name="work-tools"]').forEach(chk => {
                        chk.checked = herramientas.includes(parseInt(chk.value));
                    });

                    updatePreview();
                    modal.style.display = 'flex';
                } catch (e) {
                    this.showAlert('Error al cargar detalle: ' + e.message);
                }
            };
        });

        // -- Delete --
        container.querySelectorAll('.btn-delete-work-log').forEach(btn => {
            btn.onclick = async () => {
                const confirmed = await this.showConfirmModal('⚠️ Confirmar Eliminación','¿Eliminar este registro de trabajo? El stock de insumos será restaurado automáticamente.');
                if (!confirmed) return;

                const id = btn.dataset.id;
                try {
                    const res = await fetch(`${VITE_API_URL}/trabajo-campo/${id}`, { method: 'DELETE' }).then(r => r.json());
                    if (res.success) refresh();
                    else this.showAlert('Error: ' + res.message);
                } catch (e) { 
                    this.showAlert('Error de red'); 
                }
            };
        });

        // -- Form Submission --
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const editId = hiddenIdInput.value;
            submitBtn.disabled = true;
            submitBtn.textContent = '...';

            try {
                const cuartelesSelected = Array.from(cuartelSelect.selectedOptions).map(o => o.value).filter(Boolean);
                const fechaInicio = document.getElementById('work-fecha-inicio').value;
                const fechaFin = document.getElementById('work-fecha-fin').value;
                const insumosUsed = [];
                insumoContainer.querySelectorAll('.insumo-row').forEach(row => {
                    const pid = row.querySelector('.select-insumo-id').value;
                    const qty = row.querySelector('.input-insumo-qty').value;
                    if (pid && qty) insumosUsed.push({ producto_id: pid, cantidad: qty });
                });
                const toolsUsed = Array.from(document.querySelectorAll('input[name="work-tools"]:checked')).map(i => i.value);

                const baseLog = {
                    hora_inicio: document.getElementById('work-hora-inicio').value,
                    hora_fin: document.getElementById('work-hora-fin').value,
                    empleado_id: document.getElementById('work-empleado').value,
                    finca_id: fincaSelect.value,
                    predio_id: predioSelect.value,
                    faena_id: faenaSelect.value,
                    labor_id: laborSelect.value || null,
                    cantidad: document.getElementById('work-cantidad').value,
                    unidad: document.getElementById('work-unidad').value,
                    notas: document.getElementById('work-notas').value,
                    usuario_cargo_id: this.currentUser.id
                };

                // Total jornadas calculation
                const qtyVal = parseFloat(baseLog.cantidad) || 0;
                baseLog.total_jornadas = baseLog.unidad === 'horas' ? qtyVal / 8 : (baseLog.unidad === 'jornal' ? qtyVal : 0);

                if (editId) {
                    // Update single record
                    baseLog.fecha = fechaInicio;
                    baseLog.cuartel_id = cuartelesSelected[0];
                    const resp = await fetch(`${VITE_API_URL}/trabajo-campo/${editId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ log: baseLog, insumos: insumosUsed, herramientas: toolsUsed })
                    }).then(r => r.json());
                    if (!resp.success) throw new Error(resp.message);
                } else {
                    // Create (multi-date/multi-cuartel)
                    if (!cuartelesSelected.length) throw new Error('Seleccione al menos un cuartel');
                    const dates = [];
                    for(let d = new Date(fechaInicio); d <= new Date(fechaFin); d.setDate(d.getDate() + 1)) {
                        dates.push(d.toISOString().split('T')[0]);
                    }

                    for (const dStr of dates) {
                        for (const cid of cuartelesSelected) {
                            const logData = { ...baseLog, fecha: dStr, cuartel_id: cid };
                            const resp = await fetch(`${VITE_API_URL}/trabajo-campo`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ log: logData, insumos: insumosUsed, herramientas: toolsUsed })
                            }).then(r => r.json());
                            if (!resp.success) throw new Error(resp.message);
                        }
                    }
                }

                modal.style.display = 'none';
                refresh();
            } catch (err) {
                console.error(err);
                this.showAlert('Error: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = editId ? '💾 Actualizar Registro' : '💾 Registrar Trabajo';
            }
        });
    }

    bindAdminCrudEvents(container, config, model, refreshTable, sectionId) {
        const columns = config.columns;

        const showModal = (editing = null) => {
            const overlay = document.getElementById('admin-crud-modal-overlay');
            const titleEl = document.getElementById('admin-crud-modal-title');
            if (!overlay) return;
            overlay.style.display = 'flex';

            if (editing) {
                titleEl.innerHTML = `${config.icon} ✏️ Editar Registro`;
                document.getElementById('admin-crud-edit-id').value = editing.id;
                columns.forEach(col => {
                    const el = document.getElementById(`admin-crud-${col.key}`);
                    if (!el) return;
                    let val = editing[col.key] ?? '';
                    if (col.type === 'date' && val) {
                        try {
                            val = new Date(val).toISOString().split('T')[0];
                        } catch (e) { }
                    }
                    el.value = val;
                });
            } else {
                titleEl.innerHTML = `${config.icon} ➕ Nuevo Registro`;
                document.getElementById('admin-crud-edit-id').value = '';
                document.getElementById('form-admin-crud')?.reset();
            }
        };

        const hideModal = () => {
            const overlay = document.getElementById('admin-crud-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        };

        // New record
        document.getElementById('btn-add-admin-crud')?.addEventListener('click', () => showModal());

        // Cancel
        document.getElementById('btn-cancel-admin-crud')?.addEventListener('click', hideModal);

        // Click outside modal
        document.getElementById('admin-crud-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'admin-crud-modal-overlay') hideModal();
        });

        // Submit (Create or Update)
        document.getElementById('form-admin-crud')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = e.target.querySelector('button[type="submit"]');
            const originalText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = '...';

            const editId = document.getElementById('admin-crud-edit-id').value;
            const formData = {};
            columns.forEach(col => {
                const el = document.getElementById(`admin-crud-${col.key}`);
                if (!el) return;
                let val = el.value;
                if ((col.type === 'number' || col.type === 'select-model') && val !== '') val = Number(val);
                formData[col.key] = val;
            });

            let result;
            if (editId) {
                result = await model.update(parseInt(editId), formData);
            } else {
                result = await model.create(formData);
            }

            if (result.success) {
                hideModal();
                this.showToast(result.message || 'Operación exitosa', 'success');
                await refreshTable();
            } else {
                this.showAlert(result.message || 'Error en la operación');
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });

        // Edit
        container.querySelectorAll('.btn-edit-admin-crud').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const item = await model.getById(id);
                if (item) showModal(item);
            });
        });

        // Delete
        container.querySelectorAll('.btn-delete-admin-crud').forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                const id = parseInt(btn.dataset.id);
                const confirmed = await this.showConfirmModal(
                    '⚠️ Confirmar Eliminación',
                    `¿Está seguro de que desea eliminar permanentemente este registro de <strong>${config.title}</strong>?<br><br><span style="color: var(--color-error);">Esta acción no se puede deshacer.</span>`
                );

                if (confirmed) {
                    btn.disabled = true;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                    try {
                        const result = await model.delete(id);
                        if (result.success) {
                            this.showToast('✅ Registro eliminado correctamente', 'success');
                            await refreshTable();
                        } else {
                            btn.disabled = false;
                            btn.innerHTML = '🗑️';
                            this.showAlert('❌ Error: ' + (result.message || 'No se pudo eliminar el registro.'));
                        }
                    } catch (err) {
                        btn.disabled = false;
                        btn.innerHTML = '🗑️';
                        this.showAlert('❌ Error de conexión al intentar eliminar.');
                    }
                }
            };
        });

        // Status Toggle (Quick switch)
        container.querySelectorAll('.status-select-admin-crud').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const id = parseInt(sel.dataset.id);
                const newStatus = e.target.value;
                sel.disabled = true;
                const result = await model.update(id, { status: newStatus });
                if (result.success) {
                    this.showToast('Estado actualizado', 'success');
                } else {
                    this.showAlert(result.message || 'Error al actualizar estado');
                }
                await refreshTable();
            });
        });

        // Multi-Select Deletion
        const btnDeleteSelected = document.getElementById('btn-delete-selected-admin-crud');
        const countSelectedSpan = document.getElementById('count-selected-admin-crud');
        const chkSelectAll = document.getElementById('chk-select-all-admin-crud');
        const rowCheckboxes = container.querySelectorAll('.chk-row-admin-crud');

        const updateSelectionUI = () => {
            const checked = container.querySelectorAll('.chk-row-admin-crud:checked');
            const count = checked.length;
            if (btnDeleteSelected) {
                btnDeleteSelected.style.display = count > 0 ? 'inline-flex' : 'none';
            }
            if (countSelectedSpan) {
                countSelectedSpan.textContent = count;
            }
            if (chkSelectAll) {
                const visibleCheckboxes = [...rowCheckboxes].filter(cb => cb.closest('tr').style.display !== 'none');
                const visibleChecked = visibleCheckboxes.filter(cb => cb.checked);
                chkSelectAll.checked = visibleCheckboxes.length > 0 && visibleChecked.length === visibleCheckboxes.length;
                chkSelectAll.indeterminate = visibleChecked.length > 0 && visibleChecked.length < visibleCheckboxes.length;
            }
        };

        // Select All Checkbox
        chkSelectAll?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            rowCheckboxes.forEach(cb => {
                if (cb.closest('tr').style.display !== 'none') {
                    cb.checked = isChecked;
                }
            });
            updateSelectionUI();
        });

        // Individual Row Checkbox
        rowCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateSelectionUI);
        });

        // Bulk Delete Button
        btnDeleteSelected?.addEventListener('click', async () => {
            const checkedBoxes = container.querySelectorAll('.chk-row-admin-crud:checked');
            const ids = [...checkedBoxes].map(cb => parseInt(cb.dataset.id));
            if (ids.length === 0) return;

            const confirmed = await this.showConfirmModal(
                '⚠️ Eliminación Masiva',
                `¿Está seguro que desea eliminar los <strong>${ids.length}</strong> registros seleccionados?<br><br><span style="color: var(--color-error);">Esta acción eliminará permanentemente todos los elementos seleccionados.</span>`
            );

            if (!confirmed) return;

            btnDeleteSelected.disabled = true;
            const originalText = btnDeleteSelected.innerHTML;
            btnDeleteSelected.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';

            let successCount = 0;
            let errorCount = 0;

            for (const id of ids) {
                const result = await model.delete(id);
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Error deleting ID ${id}:`, result.message);
                }
            }

            this.showToast(`Eliminados: ${successCount} exitosos${errorCount > 0 ? `, ${errorCount} fallidos` : ''}`, successCount > 0 ? 'success' : 'error');
            await refreshTable();
            btnDeleteSelected.disabled = false;
            btnDeleteSelected.innerHTML = originalText;
        });

        // Search
        document.getElementById('search-admin-crud')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#table-admin-crud tbody tr').forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(q) ? '' : 'none';
            });
            updateSelectionUI();
        });

        // 📥 Mass Import (Excel/CSV)
        const btnImport = document.getElementById('btn-import-admin-crud');
        const fileInput = document.getElementById('input-import-admin-crud');

        btnImport?.addEventListener('click', () => fileInput.click());

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const data = new Uint8Array(evt.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet);

                    if (rows.length === 0) {
                        this.showAlert('El archivo está vacío.');
                        return;
                    }

                    const confirmed = await this.showConfirmModal('📥 Importar Datos', `¿Desea importar ${rows.length} registros en "${config.title}"?`);
                    if (!confirmed) {
                        fileInput.value = '';
                        return;
                    }

                    btnImport.disabled = true;
                    btnImport.textContent = '⌛ Importando...';

                    let successCount = 0;
                    let errorCount = 0;

                    // Build relation maps for 'select-model' columns
                    const relationMaps = {};
                    for (const col of config.columns) {
                        if (col.type === 'select-model' && col.model) {
                            const relatedData = await ADMIN_MODELS[col.model].getAll();
                            const map = new Map();
                            relatedData.forEach(item => {
                                const name = (item.nombre || item.name || item.numero || String(item.id)).toLowerCase().trim();
                                map.set(name, item.id);
                            });
                            relationMaps[col.key] = map;
                        }
                    }

                    // Normalize helper
                    const norm = (s) => String(s || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    // Helper to map Excel headers to model keys
                    const mapRow = (row) => {
                        const mapped = {};
                        columns.forEach(col => {
                            const colLabelNorm = norm(col.label);
                            const colKeyNorm = norm(col.key);

                            // Try map by various headers
                            const key = Object.keys(row).find(k => {
                                const kn = norm(k);
                                return kn === colKeyNorm || 
                                       kn === colLabelNorm || 
                                       (col.key === 'numero' && (kn.includes('cuartel') || kn === 'nº' || kn === 'n°' || kn === 'nro' || kn === 'num' || kn === 'numero')) ||
                                       (col.key === 'predio_id' && (kn.includes('predio') || kn.includes('parcela'))) ||
                                       (col.key === 'finca_id' && kn.includes('finca')) ||
                                       (col.key === 'superficie' && (kn.includes('hectarea') || kn === 'ha' || kn === 'has' || kn === 'sup' || kn.includes('superficie'))) ||
                                       (col.key === 'plantas_por_hilera' && (kn.includes('plantas') || kn.includes('ejemplares') || kn.includes('p.h'))) ||
                                       (col.key === 'variedad' && (kn.includes('variedad') || kn.includes('uva') || kn.includes('cepa') || kn.includes('cultivo'))) ||
                                       (col.key === 'hileras' && (kn.includes('hileras') || kn.includes('filas'))) ||
                                       (col.key === 'sistema_riego' && (kn.includes('riego') || kn.includes('conduccion'))) ||
                                       (col.key === 'estado' && (kn.includes('estado') || kn.includes('situacion'))) ||
                                       (col.key === 'notas' && (kn.includes('nota') || kn.includes('obs') || kn.includes('comentario') || kn.includes('detalle'))) ||
                                       (col.key === 'nombre' && (kn.includes('nombre') || kn.includes('descripcion')));
                            });

                            if (key !== undefined) {
                                let val = row[key];
                                if (col.type === 'number') {
                                    val = Number(val) || 0;
                                } else if (col.type === 'select-model' && relationMaps[col.key]) {
                                    const vNorm = String(val || '').toLowerCase().trim();
                                    if (relationMaps[col.key].has(vNorm)) {
                                        val = relationMaps[col.key].get(vNorm);
                                    } else {
                                        // If not found in map, maybe it's already an ID
                                        const numVal = Number(val);
                                        if (!isNaN(numVal)) val = numVal;
                                    }
                                } else if (col.type === 'select' && col.options) {
                                    const opt = col.options.find(o => norm(o) === norm(val));
                                    if (opt) val = opt;
                                }
                                mapped[col.key] = val;
                            }
                        });
                        return mapped;
                    };

                    for (const [idx, row] of rows.entries()) {
                        const dataToSave = mapRow(row);
                        // Ensure required fields
                        const missing = columns.filter(c => c.required && (dataToSave[c.key] === undefined || dataToSave[c.key] === ''));
                        if (missing.length > 0) {
                            console.warn(`[Row ${idx + 2}] Saltada por falta de campos requeridos:`, missing.map(m => m.label));
                            errorCount++;
                            continue;
                        }

                        const res = await model.create(dataToSave);
                        if (res.success) {
                            successCount++;
                        } else {
                            console.error(`[Row ${idx + 2}] Error al crear:`, res.message);
                            errorCount++;
                        }
                    }

                    this.showToast(`Importación finalizada: ${successCount} exitosos, ${errorCount} fallidos.`, successCount > 0 ? 'success' : 'error');
                    await refreshTable();

                } catch (err) {
                    console.error('Import error:', err);
                    this.showAlert(`Error al procesar el archivo Excel: ${err.message || 'Formato incorrecto'}`);
                } finally {
                    btnImport.disabled = false;
                    btnImport.textContent = '📥 Carga Masiva';
                    fileInput.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }


// ── Sección 3: FINCAS ──
/**
 * Sincroniza datos maestros (Fincas, Predios, Cuarteles) desde Sofia
 * a la base de datos PostgreSQL local.
 */
async syncSofiaMasterData(hectareasData) {
    try {
        console.log('Sincronizando datos maestros con el servidor...');
        const resp = await fetch('/api/sync-sofia-master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groups: hectareasData.groups })
        });

        if (!resp.ok) {
            const error = await resp.json();
            console.warn('Sync master data failed:', error.message);
        } else {
            console.log('Datos maestros sincronizados exitosamente.');
        }
    } catch (e) {
        console.warn('Backend reach error during master data sync:', e);
    }
}

async renderFincasSection(container) {
    container.innerHTML = `
        <div class="sofia-filters animate-fade-in">
          <div class="filter-group">
            <label class="form-label">Ciclo Producción</label>
            <select class="form-select sofia-filter-select" id="filter-fincas-ciclo" style="padding-left:var(--space-4);">
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
              <option value="2021-2022">2021-2022</option>
              <option value="2020-2021">2020-2021</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label">Finca</label>
            <select class="form-select sofia-filter-select" id="filter-fincas-finca" style="padding-left:var(--space-4);">
              <option value="">Todas</option>
              <option value="El Espejo">El Espejo</option>
              <option value="Fincas Viejas">Fincas Viejas</option>
            </select>
          </div>
        </div>

        <div id="fincas-dashboard-container">
            <div style="padding: var(--space-20); text-align: center; color: var(--text-tertiary);">
                <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
                <p>Cargando datos de fincas desde Sofía...</p>
            </div>
        </div>
        `;

    const filters = {
        ciclo: document.getElementById('filter-fincas-ciclo').value,
        finca: ''
    };

    const updateFincasDashboard = async () => {
        const dashboard = document.getElementById('fincas-dashboard-container');
        if (!dashboard) return;

        dashboard.innerHTML = '<div style="padding: var(--space-10); text-align: center; color: var(--text-tertiary);"><div class="spinner" style="margin: 0 auto var(--space-4);"></div><p>Actualizando datos...</p></div>';

        try {
            // Fetch jornales data for Hectáreas por Predio
            const jornalesData = await SofiaApiModel.fetchJornales(filters);
            const hectareasData = SofiaApiModel.getHectareasPorPredio(jornalesData);

            dashboard.innerHTML = renderHectareasPorPredio(hectareasData);

            // Sincronizar con la base de datos local (PostgreSQL)
            if (hectareasData && hectareasData.groups && hectareasData.groups.length > 0) {
                this.syncSofiaMasterData(hectareasData);
            }
        } catch (err) {
            dashboard.innerHTML = '<div style="padding: var(--space-10); text-align: center; color: var(--text-tertiary);"><p>Error al cargar datos: ' + err.message + '</p></div>';
        }
    };

    // Bind filter changes
    document.getElementById('filter-fincas-ciclo')?.addEventListener('change', (e) => {
        filters.ciclo = e.target.value;
        updateFincasDashboard();
    });
    document.getElementById('filter-fincas-finca')?.addEventListener('change', (e) => {
        filters.finca = e.target.value;
        updateFincasDashboard();
    });

    await updateFincasDashboard();
}

renderDashboardContent(container) {
    const metrics = {
        totalHectares: FincaModel.getTotalHectares(),
        totalFincas: FincaModel.getActive().length,
        totalEmpleados: EmpleadoModel.getActive().length,
        budgetExecution: PresupuestoModel.getExecutionPercentage(),
        recentLabores: LaborModel.getAll().slice(0, 5)
    };

    container.innerHTML = renderDashboardHome(metrics);

    // Animated counters
    this.animateCounters();

    // Render charts after DOM update
    requestAnimationFrame(() => {
        this.renderBudgetChart();
        this.renderLaboresChart();
        this.renderHoursChart();
    });
}

// ── Animated Counters ──
animateCounters() {
    document.querySelectorAll('.metric-value').forEach(el => {
        const text = el.textContent;
        const numericMatch = text.match(/(\d+)/);
        if (!numericMatch) return;

        const target = parseInt(numericMatch[0]);
        const suffix = text.replace(numericMatch[0], '').trim();
        const prefix = text.substring(0, text.indexOf(numericMatch[0]));
        const duration = 1200;
        const start = performance.now();

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.round(target * eased);
            el.textContent = `${prefix}${current}${suffix}`;
            if (progress < 1) requestAnimationFrame(animate);
        };
        el.textContent = `${prefix}0${suffix}`;
        requestAnimationFrame(animate);
    });
}

// ── Chart Options Helper ──
getChartOptions(yLabel = '') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Inter', size: 12 },
                    padding: 14,
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
                grid: { color: 'rgba(148, 163, 184, 0.06)' }
            },
            y: {
                beginAtZero: true,
                title: yLabel ? { display: true, text: yLabel, color: '#64748b', font: { family: 'Inter', size: 12 } } : undefined,
                ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
                grid: { color: 'rgba(148, 163, 184, 0.06)' }
            }
        }
    };
}

// ── Chart Rendering ──
renderBudgetChart() {
    const ctx = document.getElementById('chart-budget');
    if (!ctx) return;

    const data = PresupuestoModel.getByCategory();
    const categories = Object.keys(data);

    this.charts['budget'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Presupuestado',
                    data: categories.map(c => data[c].planned),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                },
                {
                    label: 'Ejecutado',
                    data: categories.map(c => data[c].executed),
                    backgroundColor: 'rgba(168, 85, 247, 0.6)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                }
            ]
        },
        options: this.getChartOptions('Monto ($)')
    });
}

renderLaboresChart() {
    const ctx = document.getElementById('chart-labores');
    if (!ctx) return;

    const data = LaborModel.getByType();
    const labels = Object.keys(data);
    const values = Object.values(data);

    const colors = [
        'rgba(16, 185, 129, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
    ];

    this.charts['labores'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 16,
                        font: { family: 'Inter', size: 12 }
                    }
                }
            }
        }
    });
}

renderHoursChart() {
    const ctx = document.getElementById('chart-hours');
    if (!ctx) return;

    const data = LaborModel.getHoursByFinca();
    const labels = Object.keys(data);
    const values = Object.values(data);

    this.charts['hours'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.replace('Finca ', '')),
            datasets: [{
                label: 'Horas Totales',
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            ...this.getChartOptions('Horas'),
            indexAxis: 'y',
        }
    });
}

renderPresupuestoChart() {
    const ctx = document.getElementById('chart-presupuesto-mgmt');
    if (!ctx) return;

    const data = PresupuestoModel.getByCategory();
    const categories = Object.keys(data);

    this.charts['presupuesto-mgmt'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Presupuestado',
                    data: categories.map(c => data[c].planned),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                },
                {
                    label: 'Ejecutado',
                    data: categories.map(c => data[c].executed),
                    backgroundColor: 'rgba(245, 158, 11, 0.6)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                }
            ]
        },
        options: this.getChartOptions('Monto ($)')
    });
}

getChartOptions(yLabel = '') {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Inter', size: 12 }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
                grid: { color: 'rgba(255,255,255,0.04)' }
            },
            y: {
                title: { display: !!yLabel, text: yLabel, color: '#64748b' },
                ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
                grid: { color: 'rgba(255,255,255,0.04)' }
            }
        }
    };
}

// ── Informes Content ──
renderInformesContent(container, initialTab = 'presupuesto') {
    container.innerHTML = renderInformesView();

    // Update active class in the new vertical nav
    const tabs = document.querySelectorAll('#informes-tabs .tab-btn');
    tabs.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === initialTab);
    });

    this.renderInformeTab(initialTab);
    this.bindInformeTabEvents();
}

async renderInformeTab(tab) {
    const content = document.getElementById('informe-content');

    // Destroy existing charts
    Object.keys(this.charts).filter(k => k.includes('report')).forEach(k => {
        this.charts[k].destroy();
        delete this.charts[k];
    });

    switch (tab) {
        case 'presupuesto':
            content.innerHTML = renderInformePresupuesto(PresupuestoModel.getByCategory());
            requestAnimationFrame(() => this.renderBudgetReportChart());
            break;
        case 'labores':
            content.innerHTML = renderInformeLabores(LaborModel.getByType(), LaborModel.getHoursByFinca());
            requestAnimationFrame(() => {
                this.renderLaboresReportChart();
                this.renderHoursReportChart();
            });
            break;
        case 'parametros':
            content.innerHTML = renderInformeParametros(
                FincaModel.getAll(), VariedadModel.getAll(), AplicacionModel.getAll()
            );
            break;
        case 'aplicaciones':
            await this.loadStaticSofiaData();
            this.renderAplicacionesSofiaModule(content);
            break;
        case 'gastos':
            content.innerHTML = renderGastosView();
            break;
        case 'secaderos':
            content.innerHTML = renderSecaderosView();
            break;
    }
}

renderBudgetReportChart() {
    const ctx = document.getElementById('chart-budget-report');
    if (!ctx) return;

    const data = PresupuestoModel.getByCategory();
    const categories = Object.keys(data);

    this.charts['budget-report'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Presupuestado',
                    data: categories.map(c => data[c].planned),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                },
                {
                    label: 'Ejecutado',
                    data: categories.map(c => data[c].executed),
                    backgroundColor: 'rgba(168, 85, 247, 0.7)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                }
            ]
        },
        options: this.getChartOptions('Monto ($)')
    });
}

renderLaboresReportChart() {
    const ctx = document.getElementById('chart-labores-report');
    if (!ctx) return;

    const data = LaborModel.getByType();
    const colors = [
        'rgba(16, 185, 129, 0.8)', 'rgba(168, 85, 247, 0.8)',
        'rgba(245, 158, 11, 0.8)', 'rgba(59, 130, 246, 0.8)',
        'rgba(239, 68, 68, 0.8)', 'rgba(34, 197, 94, 0.8)',
    ];

    this.charts['labores-report'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 12 }
                }
            }
        }
    });
}

renderHoursReportChart() {
    const ctx = document.getElementById('chart-hours-report');
    if (!ctx) return;

    const data = LaborModel.getHoursByFinca();

    this.charts['hours-report'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data).map(l => l.replace('Finca ', '')),
            datasets: [{
                label: 'Horas',
                data: Object.values(data),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(168, 85, 247, 0.6)',
                    'rgba(245, 158, 11, 0.6)',
                    'rgba(59, 130, 246, 0.6)',
                ],
                borderWidth: 0,
                borderRadius: 6,
            }]
        },
        options: this.getChartOptions('Horas')
    });
}

// ══════════════════════════════════════════════════
// EVENT BINDING
// ══════════════════════════════════════════════════

bindLandingEvents() {
    // New Login Button
    document.getElementById('btn-login-nav')?.addEventListener('click', () => this.loadLogin());

    // Hero actions (if they exist in the new landing)
    document.getElementById('btn-hero-login')?.addEventListener('click', () => this.loadLogin());
    document.getElementById('btn-hero-features')?.addEventListener('click', () => {
        document.getElementById('machines-modernas')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Animation for #traz-producto elements
    const trazObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('traz-anim-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const trazElements = document.querySelectorAll('#traz-producto h2, #traz-producto figure, #traz-producto p');
    trazElements.forEach((el, index) => {
        el.classList.add('traz-anim-init');
        // Adding a small progressive delay based on DOM order for a smoother cascade effect
        el.style.transitionDelay = `${(index % 3) * 0.15}s`;
        trazObserver.observe(el);
    });
}

bindLoginEvents() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const pendingDiv = document.getElementById('login-pending-error');
    const successDiv = document.getElementById('login-success');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Hide all messages
        errorDiv?.classList.remove('show');
        if (pendingDiv) pendingDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';

        const user = await UserModel.authenticate(email, password);
        if (user && user.pending) {
            // User exists but is pending approval
            if (pendingDiv) pendingDiv.style.display = 'block';
        } else if (user) {
            this.loadDashboard(user);
        } else {
            if (errorDiv) {
                errorDiv.classList.add('show');
                setTimeout(() => errorDiv.classList.remove('show'), 3000);
            }
        }
    });

    document.getElementById('btn-back-landing')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadLanding();
    });

    // ── Registration Modal ──
    const registerModalEl = document.getElementById('register-modal');
    let bsRegisterModal = null;
    if (registerModalEl) bsRegisterModal = new bootstrap.Modal(registerModalEl);

    document.getElementById('btn-show-register')?.addEventListener('click', () => {
        if (bsRegisterModal) bsRegisterModal.show();
    });

    document.getElementById('btn-cancel-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (bsRegisterModal) bsRegisterModal.hide();
    });


    // ── Registration Form Submit ──
    document.getElementById('form-register')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit?.textContent;

        const regError = document.getElementById('register-error');
        const regErrorMsg = document.getElementById('register-error-msg');

        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        // Validate
        if (password !== passwordConfirm) {
            if (regError) { regError.style.display = 'block'; regErrorMsg.textContent = 'Las contraseñas no coinciden.'; }
            return;
        }
        if (password.length < 6) {
            if (regError) { regError.style.display = 'block'; regErrorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres.'; }
            return;
        }

        if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Procesando...'; }

        const result = await UserModel.register(name, email, password);

        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = originalBtnText; }

        if (result.error || result.success === false) {
            if (regError) {
                regError.style.display = 'block';
                regErrorMsg.textContent = result.error || result.message;
            }
            return;
        }

        // Success - close modal and show success message on login page
        if (registerModalEl) {
            const modalInstance = bootstrap.Modal.getInstance(registerModalEl);
            if (modalInstance) modalInstance.hide();
        }
        if (successDiv) {
            const successMsg = document.getElementById('login-success-msg');
            if (successMsg) successMsg.textContent = result.message || '¡Registro exitoso! Tu solicitud será revisada por un administrador.';
            successDiv.style.display = 'block';
        }
    });
}

bindDashboardEvents(user) {
    // Sidebar dropdown toggle
    document.querySelectorAll('.sidebar-dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const menuId = toggle.dataset.toggle;
            const submenu = document.getElementById(`submenu-${menuId}`);
            const isOpen = submenu?.classList.contains('open');
            submenu?.classList.toggle('open', !isOpen);
            toggle.classList.toggle('expanded', !isOpen);
            const chevron = toggle.querySelector('.sidebar-chevron');
            if (chevron) chevron.textContent = isOpen ? '▸' : '▾';
        });
    });

    // Sidebar sub-item navigation
    document.querySelectorAll('.sidebar-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            this.currentSection = section;
            this.loadSection(section, user);
            // Close mobile sidebar
            document.getElementById('sidebar')?.classList.remove('open');
        });
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        UserModel.logout();
        this.loadLanding();
    });

    // Mobile menu
    document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Modal close
    document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) this.closeModal();
    });

    // Notification bell
    this.bindNotificationBell();
}

// ── Notification Bell ──
bindNotificationBell() {
    const bell = document.querySelector('.notification-bell');
    if (!bell) return;

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        let dropdown = document.getElementById('notification-dropdown');

        if (dropdown) {
            dropdown.remove();
            return;
        }

        const notifications = NotificationModel.getAll();
        const unreadCount = NotificationModel.getUnread().length;
        const typeIcons = { warning: '⚠️', error: '🔴', success: '✅', info: 'ℹ️' };

        dropdown = document.createElement('div');
        dropdown.id = 'notification-dropdown';
        dropdown.className = 'notification-dropdown animate-fade-in';
        dropdown.innerHTML = `
                <div class="notif-header">
                    <h4>Notificaciones</h4>
                    ${unreadCount > 0 ? `<button class="btn btn-ghost btn-sm" id="btn-mark-all-read">Marcar todas leídas</button>` : ''}
                </div>
                <div class="notif-list">
                    ${notifications.length === 0 ? '<div class="notif-empty">No hay notificaciones</div>' :
            notifications.map(n => `
                        <div class="notif-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
                            <span class="notif-icon">${typeIcons[n.type] || 'ℹ️'}</span>
                            <div class="notif-content">
                                <div class="notif-title">${n.title}</div>
                                <div class="notif-message">${n.message}</div>
                                <div class="notif-time">${n.time}</div>
                            </div>
                            ${!n.read ? '<span class="notif-unread-dot"></span>' : ''}
                        </div>
                    `).join('')}
                </div>
            `;

        bell.parentElement.appendChild(dropdown);

        // Mark all as read
        document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
            NotificationModel.markAllRead();
            this.updateNotifBadge();
            dropdown.remove();
            this.showToast('Todas las notificaciones marcadas como leídas', 'info');
        });

        // Mark single as read
        dropdown.querySelectorAll('.notif-item.unread').forEach(item => {
            item.addEventListener('click', () => {
                NotificationModel.markAsRead(parseInt(item.dataset.id));
                item.classList.remove('unread');
                item.classList.add('read');
                const dot = item.querySelector('.notif-unread-dot');
                if (dot) dot.remove();
                this.updateNotifBadge();
            });
        });

        // Close on outside click
        const closeHandler = (ev) => {
            if (!dropdown.contains(ev.target) && ev.target !== bell) {
                dropdown.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
    });
}

updateNotifBadge() {
    const count = NotificationModel.getUnread().length;
    const badge = document.querySelector('.notification-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

bindInformeTabEvents() {
    document.querySelectorAll('#informes-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#informes-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.renderInformeTab(btn.dataset.tab);
        });
    });
}

bindLaboresEvents() {
    document.querySelectorAll('#labores-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#labores-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.tab;
            document.querySelectorAll('#table-labores tbody tr').forEach(row => {
                if (filter === 'all') {
                    row.style.display = '';
                } else {
                    row.style.display = row.dataset.status === filter ? '' : 'none';
                }
            });
        });
    });

    document.getElementById('btn-add-labor')?.addEventListener('click', () => {
        this.showNewLaborModal();
    });
}

bindCargaEvents() {
    const fincaSelect = document.getElementById('labor-finca');
    const predioSelect = document.getElementById('labor-predio');

    fincaSelect?.addEventListener('change', () => {
        const fincaName = fincaSelect.value;
        const finca = FincaModel.getAll().find(f => f.name === fincaName);
        const predios = finca ? PredioModel.getByFinca(finca.id) : [];

        predioSelect.innerHTML = predios.length
            ? predios.map(p => `<option value="${p.name}">${p.name}</option>`).join('')
            : '<option value="">Sin predios disponibles</option>';
    });

    document.getElementById('form-nueva-labor')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = this.currentUser;
        const date = document.getElementById('labor-date').value;
        const type = document.getElementById('labor-type').value;
        const finca = document.getElementById('labor-finca').value;
        const predio = document.getElementById('labor-predio').value;
        const hours = parseInt(document.getElementById('labor-hours').value);
        const notes = document.getElementById('labor-notes').value;

        if (!type || !finca || !predio || !hours) {
            this.showToast('Por favor complete todos los campos obligatorios', 'warning');
            return;
        }

        LaborModel.add({
            date,
            type,
            predio,
            finca,
            employee: user?.name || 'Operador',
            hours,
            notes,
            status: 'completed'
        });

        this.showToast('✅ Labor registrada exitosamente', 'success');
        // Refresh the view
        this.loadSection('carga', user);
    });
}

bindTableSearch(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) return;

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        table.querySelectorAll('tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// ══════════════════════════════════════════════════
// CRUD MODAL BINDINGS
// ══════════════════════════════════════════════════

// ── Finca CRUD ──
bindFincaCRUD(user) {
    document.getElementById('btn-add-finca')?.addEventListener('click', () => {
        const body = `
                <form id="modal-finca-form">
                    <div class="form-group">
                        <label class="form-label">Nombre de la Finca</label>
                        <input type="text" class="form-input" id="finca-name" style="padding-left: var(--space-4);" placeholder="Ej: Finca El Dorado" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ubicación</label>
                        <input type="text" class="form-input" id="finca-location" style="padding-left: var(--space-4);" placeholder="Ej: San Martín, Mendoza" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hectáreas</label>
                        <input type="number" class="form-input" id="finca-hectares" style="padding-left: var(--space-4);" min="1" placeholder="100" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cantidad de Predios</label>
                        <input type="number" class="form-input" id="finca-predios" style="padding-left: var(--space-4);" min="0" placeholder="5" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Encargado</label>
                        <input type="text" class="form-input" id="finca-manager" style="padding-left: var(--space-4);" placeholder="Nombre del encargado" required />
                    </div>
                </form>
            `;
        const footer = `
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="modal-save">💾 Guardar Finca</button>
            `;
        this.showModal('🏘️ Nueva Finca', body, footer);
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const name = document.getElementById('finca-name').value;
            const location = document.getElementById('finca-location').value;
            const hectares = parseInt(document.getElementById('finca-hectares').value);
            const predios = parseInt(document.getElementById('finca-predios').value);
            const manager = document.getElementById('finca-manager').value;
            if (!name || !location || !hectares || !manager) {
                this.showToast('Complete todos los campos', 'warning');
                return;
            }
            FincaModel.add({ name, location, hectares, predios: predios || 0, manager });
            this.showToast(`Finca "${name}" creada exitosamente`, 'success');
            this.closeModal();
            this.loadSection('fincas', user);
        });
    });
}

// ── Predio CRUD ──
bindPredioCRUD(user) {
    document.getElementById('btn-add-predio')?.addEventListener('click', () => {
        const fincas = FincaModel.getActive();
        const body = `
                <form id="modal-predio-form">
                    <div class="form-group">
                        <label class="form-label">Nombre del Predio</label>
                        <input type="text" class="form-input" id="predio-name" style="padding-left: var(--space-4);" placeholder="Ej: Parcela Este B" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Finca</label>
                        <select class="form-select" id="predio-finca" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            ${fincas.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hectáreas</label>
                        <input type="number" class="form-input" id="predio-hectares" style="padding-left: var(--space-4);" min="1" placeholder="15" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Variedad</label>
                        <select class="form-select" id="predio-variety" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            ${VariedadModel.getActive().map(v => `<option value="${v.name}">${v.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo de Riego</label>
                        <select class="form-select" id="predio-riego" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            <option>Goteo</option>
                            <option>Aspersión</option>
                            <option>Surco</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo de Suelo</label>
                        <select class="form-select" id="predio-suelo" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            <option>Franco</option>
                            <option>Franco-arenoso</option>
                            <option>Franco-arcilloso</option>
                            <option>Arenoso</option>
                            <option>Arcilloso</option>
                        </select>
                    </div>
                </form>
            `;
        const footer = `
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="modal-save">💾 Guardar Predio</button>
            `;
        this.showModal('🌾 Nuevo Predio', body, footer);
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const name = document.getElementById('predio-name').value;
            const fincaId = parseInt(document.getElementById('predio-finca').value);
            const hectares = parseInt(document.getElementById('predio-hectares').value);
            const variety = document.getElementById('predio-variety').value;
            const irrigationType = document.getElementById('predio-riego').value;
            const soilType = document.getElementById('predio-suelo').value;
            if (!name || !fincaId || !hectares || !variety || !irrigationType || !soilType) {
                this.showToast('Complete todos los campos', 'warning');
                return;
            }
            PredioModel.add({ name, fincaId, hectares, variety, irrigationType, soilType });
            this.showToast(`Predio "${name}" creado exitosamente`, 'success');
            this.closeModal();
            this.loadSection('predios', user);
        });
    });
}

// ── Variedad CRUD ──
bindVariedadCRUD(user) {
    document.getElementById('btn-add-variedad')?.addEventListener('click', () => {
        const body = `
                <form id="modal-variedad-form">
                    <div class="form-group">
                        <label class="form-label">Nombre de la Variedad</label>
                        <input type="text" class="form-input" id="variedad-name" style="padding-left: var(--space-4);" placeholder="Ej: Muscat de Alejandría" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <select class="form-select" id="variedad-type" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            <option>Roja</option>
                            <option>Verde</option>
                            <option>Negra</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Días a Cosecha</label>
                        <input type="number" class="form-input" id="variedad-days" style="padding-left: var(--space-4);" min="60" max="200" placeholder="120" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contenido de Azúcar</label>
                        <input type="text" class="form-input" id="variedad-sugar" style="padding-left: var(--space-4);" placeholder="Ej: 18-20°Brix" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Uso</label>
                        <select class="form-select" id="variedad-usage" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            <option>Pasa</option>
                            <option>Mesa</option>
                            <option>Pasa / Mesa</option>
                            <option>Mesa / Pasa</option>
                        </select>
                    </div>
                </form>
            `;
        const footer = `
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="modal-save">💾 Guardar Variedad</button>
            `;
        this.showModal('🍇 Nueva Variedad', body, footer);
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const name = document.getElementById('variedad-name').value;
            const type = document.getElementById('variedad-type').value;
            const daysToHarvest = parseInt(document.getElementById('variedad-days').value);
            const sugarContent = document.getElementById('variedad-sugar').value;
            const usage = document.getElementById('variedad-usage').value;
            if (!name || !type || !daysToHarvest || !sugarContent || !usage) {
                this.showToast('Complete todos los campos', 'warning');
                return;
            }
            VariedadModel.add({ name, type, daysToHarvest, sugarContent, usage });
            this.showToast(`Variedad "${name}" agregada exitosamente`, 'success');
            this.closeModal();
            this.loadSection('variedades', user);
        });
    });
}

// ── Empleado CRUD ──
bindEmpleadoCRUD(user) {
    document.getElementById('btn-add-empleado')?.addEventListener('click', () => {
        const fincas = FincaModel.getActive();
        const body = `
                <form id="modal-empleado-form">
                    <div class="form-group">
                        <label class="form-label">Nombre Completo</label>
                        <input type="text" class="form-input" id="empleado-name" style="padding-left: var(--space-4);" placeholder="Nombre y Apellido" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">DNI</label>
                        <input type="text" class="form-input" id="empleado-dni" style="padding-left: var(--space-4);" placeholder="12345678" pattern="[0-9]{7,8}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cargo</label>
                        <select class="form-select" id="empleado-position" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            <option>Peón Rural</option>
                            <option>Capataz</option>
                            <option>Encargada de Poda</option>
                            <option>Técnica Agrónoma</option>
                            <option>Operador de Maquinaria</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Finca</label>
                        <select class="form-select" id="empleado-finca" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            ${fincas.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha de Ingreso</label>
                        <input type="date" class="form-input" id="empleado-date" style="padding-left: var(--space-4);" value="${new Date().toISOString().split('T')[0]}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Salario ($)</label>
                        <input type="number" class="form-input" id="empleado-salary" style="padding-left: var(--space-4);" min="100000" placeholder="250000" required />
                    </div>
                </form>
            `;
        const footer = `
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="modal-save">💾 Guardar Empleado</button>
            `;
        this.showModal('👥 Nuevo Empleado', body, footer);
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const name = document.getElementById('empleado-name').value;
            const dni = document.getElementById('empleado-dni').value;
            const position = document.getElementById('empleado-position').value;
            const finca = document.getElementById('empleado-finca').value;
            const startDate = document.getElementById('empleado-date').value;
            const salary = parseInt(document.getElementById('empleado-salary').value);
            if (!name || !dni || !position || !finca || !startDate || !salary) {
                this.showToast('Complete todos los campos', 'warning');
                return;
            }
            EmpleadoModel.add({ name, dni, position, finca, startDate, salary });
            this.showToast(`Empleado "${name}" registrado exitosamente`, 'success');
            this.closeModal();
            this.loadSection('empleados', user);
        });
    });
}

// ── Aplicación CRUD ──
bindAplicacionCRUD(user) {
    document.getElementById('btn-add-aplicacion')?.addEventListener('click', () => {
        const predios = PredioModel.getAll().filter(p => p.status === 'active');
        const body = `
                <form id="modal-aplicacion-form">
                    <div class="form-group">
                        <label class="form-label">Producto</label>
                        <input type="text" class="form-input" id="app-product" style="padding-left: var(--space-4);" placeholder="Ej: Fungicida Mancozeb" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Dosis</label>
                        <input type="text" class="form-input" id="app-dose" style="padding-left: var(--space-4);" placeholder="Ej: 2.5 kg/ha" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Predio</label>
                        <select class="form-select" id="app-predio" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            ${predios.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha</label>
                        <input type="date" class="form-input" id="app-date" style="padding-left: var(--space-4);" value="${new Date().toISOString().split('T')[0]}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado</label>
                        <select class="form-select" id="app-status" style="padding-left: var(--space-4);" required>
                            <option value="scheduled">Programado</option>
                            <option value="pending">Pendiente</option>
                            <option value="applied">Aplicado</option>
                        </select>
                    </div>
                </form>
            `;
        const footer = `
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="modal-save">💾 Guardar Aplicación</button>
            `;
        this.showModal('🧪 Nueva Aplicación', body, footer);
        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const product = document.getElementById('app-product').value;
            const dose = document.getElementById('app-dose').value;
            const predio = document.getElementById('app-predio').value;
            const date = document.getElementById('app-date').value;
            const status = document.getElementById('app-status').value;
            if (!product || !dose || !predio || !date) {
                this.showToast('Complete todos los campos', 'warning');
                return;
            }
            AplicacionModel.add({ product, dose, predio, date, status, engineer: this.currentUser?.name || 'Ingeniero' });
            this.showToast(`Aplicación de "${product}" registrada`, 'success');
            this.closeModal();
            this.loadSection('aplicaciones', user);
        });
    });
}

// ── Usuario CRUD ──
bindUsuarioCRUD(user) {
    document.getElementById('btn-add-usuario')?.addEventListener('click', () => {
        const fincas = FincaModel.getActive();
        const body = `
                <form id="modal-usuario-form">
                    <div class="form-group">
                        <label class="form-label">Nombre Completo</label>
                        <input type="text" class="form-input" id="user-name" style="padding-left: var(--space-4);" placeholder="Nombre y Apellido" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="user-email" style="padding-left: var(--space-4);" placeholder="usuario@naturalfood.com" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input type="password" class="form-input" id="user-password" style="padding-left: var(--space-4);" placeholder="Mínimo 6 caracteres" minlength="6" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Rol</label>
                        <select class="form-select" id="user-role" style="padding-left: var(--space-4);" required>
                            <option value="">Seleccionar...</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Ingeniero">Ingeniero</option>
                            <option value="RRHH">RRHH</option>
                            <option value="Carga">Carga</option>
                            <option value="Sub-Admin">Sub-Admin</option>
                        </select>
                    </div>
                    <div class="form-group user-carga-fields" style="display: none; margin-top: var(--space-4);">
                        <label class="form-label">Finca Asignada</label>
                        <select class="form-select" id="user-finca" style="padding-left: var(--space-4);">
                            <option value="">Seleccionar...</option>
                            ${fincas.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group user-carga-fields" style="display: none; margin-top: var(--space-4);">
                        <label class="form-label">Predio Asignado</label>
                        <select class="form-select" id="user-predio" style="padding-left: var(--space-4);" disabled>
                            <option value="">Seleccionar finca primero...</option>
                        </select>
                    </div>
                </form>
            `;
        const footer = `
                <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
                <button class="btn btn-primary" id="modal-save">💾 Crear Usuario</button>
            `;
        this.showModal('⚙️ Nuevo Usuario', body, footer);

        const roleSelect = document.getElementById('user-role');
        const cargaFields = document.querySelectorAll('.user-carga-fields');
        roleSelect?.addEventListener('change', () => {
            const isCarga = roleSelect.value === 'Carga';
            cargaFields.forEach(f => f.style.display = isCarga ? 'block' : 'none');
        });

        const fincaSelect = document.getElementById('user-finca');
        const predioSelect = document.getElementById('user-predio');
        fincaSelect?.addEventListener('change', () => {
            const fid = fincaSelect.value;
            const selectedFinca = fincas.find(f => f.id == fid);
            const prediosInfo = selectedFinca ? PredioModel.getByFinca(fid) : [];
            predioSelect.innerHTML = prediosInfo.length
                ? prediosInfo.map(p => `<option value="${p.id}">${p.nombre || p.name}</option>`).join('')
                : '<option value="">Sin predios</option>';
            predioSelect.disabled = !fid;
        });

        document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-save')?.addEventListener('click', () => {
            const name = document.getElementById('user-name').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const role = document.getElementById('user-role').value;
            const finca_id = document.getElementById('user-finca').value;
            const predio_id = document.getElementById('user-predio').value;

            if (!name || !email || !password || !role) {
                this.showToast('Complete todos los campos principales', 'warning');
                return;
            }
            if (password.length < 6) {
                this.showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
                return;
            }
            UserModel.add({ name, email, password, role, finca_id, predio_id });
            this.showToast(`Usuario "${name}" creado exitosamente`, 'success');
            this.closeModal();
            this.loadSection('usuarios', user);
        });
    });
}

// ── Modal ──
showModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml;
    document.getElementById('modal-overlay').classList.add('show');
}

closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

showNewLaborModal() {
    const fincas = FincaModel.getActive();
    const empleados = EmpleadoModel.getActive();
    const body = `
      <form id="modal-labor-form">
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input type="date" class="form-input" id="modal-labor-date" style="padding-left: var(--space-4);" value="${new Date().toISOString().split('T')[0]}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de Labor</label>
          <select class="form-select" id="modal-labor-type" style="padding-left: var(--space-4);" required>
            <option value="">Seleccionar...</option>
            <option>Poda</option><option>Riego</option>
            <option>Fumigación</option><option>Cosecha</option>
            <option>Desmalezado</option><option>Fertilización</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Finca</label>
          <select class="form-select" id="modal-labor-finca" style="padding-left: var(--space-4);" required>
            <option value="">Seleccionar...</option>
            ${fincas.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Predio</label>
          <select class="form-select" id="modal-labor-predio" style="padding-left: var(--space-4);" required>
            <option value="">Seleccionar finca primero...</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Empleado</label>
          <select class="form-select" id="modal-labor-employee" style="padding-left: var(--space-4);" required>
            <option value="">Seleccionar...</option>
            ${empleados.map(e => `<option value="${e.name}">${e.name} - ${e.position}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Horas</label>
          <input type="number" class="form-input" id="modal-labor-hours" style="padding-left: var(--space-4);" min="1" max="24" placeholder="8" required />
        </div>
        <div class="form-group">
          <label class="form-label">Observaciones</label>
          <textarea class="form-input" id="modal-labor-notes" style="padding-left: var(--space-4); min-height: 60px;"></textarea>
        </div>
      </form>
    `;
    const footer = `
      <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="modal-save-labor">💾 Guardar Labor</button>
    `;
    this.showModal('🔧 Nueva Labor de Campo', body, footer);

    // Dynamic predio loading
    const fincaSelect = document.getElementById('modal-labor-finca');
    const predioSelect = document.getElementById('modal-labor-predio');
    fincaSelect?.addEventListener('change', () => {
        const finca = FincaModel.getAll().find(f => f.name === fincaSelect.value);
        const predios = finca ? PredioModel.getByFinca(finca.id) : [];
        predioSelect.innerHTML = predios.length
            ? predios.map(p => `<option value="${p.name}">${p.name}</option>`).join('')
            : '<option value="">Sin predios</option>';
    });

    document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-save-labor')?.addEventListener('click', () => {
        const date = document.getElementById('modal-labor-date').value;
        const type = document.getElementById('modal-labor-type').value;
        const finca = document.getElementById('modal-labor-finca').value;
        const predio = document.getElementById('modal-labor-predio').value;
        const employee = document.getElementById('modal-labor-employee').value;
        const hours = parseInt(document.getElementById('modal-labor-hours').value);
        const notes = document.getElementById('modal-labor-notes').value;

        if (!type || !finca || !predio || !employee || !hours) {
            this.showToast('Complete todos los campos obligatorios', 'warning');
            return;
        }

        LaborModel.add({ date, type, predio, finca, employee, hours, notes, status: 'completed' });
        this.showToast('Labor registrada correctamente', 'success');
        this.closeModal();
        this.loadSection('labores', this.currentUser);
    });
}

// ══════════════════════════════════════════════════
// MÓDULO APLICACIONES SOFÍA
// ══════════════════════════════════════════════════

renderAplicacionesSofiaModule(container) {
    // Destroy sofia charts
    Object.keys(this.charts).filter(k => k.startsWith('sofia')).forEach(k => {
        this.charts[k].destroy();
        delete this.charts[k];
    });

    const cycles = SofiaImportModel.getAvailableCycles();
    const fincas = SofiaImportModel.getFincas();

    // Dynamic lists based on current selected finca
    const predios = SofiaImportModel.getPredios(this.sofiaFilters.finca);
    const variedades = SofiaImportModel.getVariedades(this.sofiaFilters.finca, this.sofiaFilters.predio);
    const userRole = this.currentUser?.role || '';

    // Default to latest cycle if current filter is invalid
    if (cycles.length > 0 && (!this.sofiaFilters.ciclo || !cycles.includes(this.sofiaFilters.ciclo))) {
        this.sofiaFilters.ciclo = cycles[0];
    }

    // Pass available varieties to the view
    const viewFilters = { ...this.sofiaFilters, variedades };

    container.innerHTML = renderInformeAplicaciones(cycles, fincas, predios, [], userRole, viewFilters);
    this.bindSofiaEvents();
    this.renderSofiaSubTab(this.sofiaSubTab);
}

async loadStaticSofiaData() {
    // Always reload CSV data fresh (clear previous cache)
    SofiaImportModel.REGISTROS = [];

    const files = [
        { name: 'EE_aplicaciones.csv', finca: 'El Espejo' },
        { name: 'FV_aplicaciones.csv', finca: 'Fincas Viejas' }
    ];

    for (const file of files) {
        try {
            console.log(`[AppController] Fetching ${file.name}...`);
            const response = await fetch(`/Fuentes/Aplicaciones/${file.name}?t=${Date.now()}`);
            if (!response.ok) {
                console.error(`[AppController] Error fetching ${file.name}: ${response.status} ${response.statusText}`);
                continue;
            }

            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('iso-8859-1');
            const csvText = decoder.decode(buffer);
            console.log(`[AppController] Received ${csvText.length} chars from ${file.name}`);

            const result = SofiaImportModel.parseCSV(csvText, file.finca);
            if (!result.error) {
                SofiaImportModel.importRows(result.rows);
                console.log(`[AppController] Auto-loaded ${result.rows.length} rows from ${file.name} (${file.finca})`);
            } else {
                console.warn(`[AppController] Error parsing ${file.name}:`, result.error);
            }
        } catch (error) {
            console.error(`[AppController] Exception loading ${file.name}:`, error);
        }
    }

    // If we are already in the aplicaciones section, refresh it
    if (this.currentSection === 'aplicaciones-sofia') {
        const container = document.getElementById('page-content');
        if (container) this.renderAplicacionesSofiaModule(container);
    }
}

async autoLoadJornalesBudget() {
    try {
        const resp = await fetch(`/Fuentes/Auxiliares/PresupuestoJornales.csv?t=${Date.now()}`);
        if (resp.ok) {
            const csvText = await resp.text();
            const result = JornalesBudgetModel.importFromCSV(csvText);
            if (result.success) {
                console.log('Auto-loaded PresupuestoJornales.csv');
            }
        }
    } catch (e) {
        console.error('Error auto-loading Jornales budget:', e);
    }
}

bindSofiaEvents() {
    // Standardized Filters Logic
    const filterIds = ['filter-ciclo', 'filter-finca', 'filter-predio', 'filter-variedad'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('change', () => {
            const val = el.value;
            if (id === 'filter-ciclo') this.sofiaFilters.ciclo = val;
            if (id === 'filter-finca') {
                this.sofiaFilters.finca = val;
                this.sofiaFilters.predio = '';
                this.sofiaFilters.variedad = '';
                this.renderAplicacionesSofiaModule(document.getElementById('sofia-module-container') || this.app.querySelector('.dashboard-content'));
                return;
            }
            if (id === 'filter-predio') {
                this.sofiaFilters.predio = val;
                this.sofiaFilters.variedad = '';
                this.renderAplicacionesSofiaModule(document.getElementById('sofia-module-container') || this.app.querySelector('.dashboard-content'));
                return;
            }
            if (id === 'filter-variedad') this.sofiaFilters.variedad = val;

            this.renderSofiaSubTab(this.sofiaSubTab);
        });
    });

    // Sub-tabs
    document.querySelectorAll('#sofia-subtabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#sofia-subtabs .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.sofiaSubTab = btn.dataset.subtab;
            this.renderSofiaSubTab(this.sofiaSubTab);
        });
    });
}

renderSofiaSubTab(tab) {
    const content = document.getElementById('sofia-subtab-content');
    if (!content) return;

    // Destroy existing sofia charts
    Object.keys(this.charts).filter(k => k.startsWith('sofia')).forEach(k => {
        this.charts[k].destroy();
        delete this.charts[k];
    });

    const filters = this.sofiaFilters;

    switch (tab) {
        case 'resumen': {
            const resumen = SofiaImportModel.getResumen(filters);
            content.innerHTML = renderSofiaResumen(resumen);
            requestAnimationFrame(() => {
                this.renderSofiaDistChart(resumen.distribution);
                this.renderSofiaCostChart(resumen.topProducts);
            });
            break;
        }
        case 'foliares': {
            const foliaresStats = SofiaImportModel.getFoliaresPorPredioStats(filters);
            const productosStats = SofiaImportModel.getCategoriaPorProductoStats('Foliares', filters);
            content.innerHTML = renderSofiaFoliares(SofiaImportModel.getFoliares(filters));
            requestAnimationFrame(() => {
                this.renderFoliaresChart(foliaresStats);
                this.renderFoliaresProductosChart(productosStats);
            });
            break;
        }
        case 'herbicidas': {
            const herbiStats = SofiaImportModel.getHerbicidasPorPredioStats(filters);
            const productosStats = SofiaImportModel.getCategoriaPorProductoStats('Herbicidas', filters);
            content.innerHTML = renderSofiaHerbicidas(SofiaImportModel.getHerbicidas(filters));
            requestAnimationFrame(() => {
                this.renderHerbicidasChart(herbiStats);
                this.renderHerbicidasProductosChart(productosStats);
            });
            break;
        }
        case 'fertilizacion': {
            const comparativa = SofiaImportModel.getFertilizacionComparativa(filters);
            content.innerHTML = renderFertilizacionComparativa(comparativa);
            requestAnimationFrame(() => this.renderFertComparativaChart(comparativa));
            break;
        }
    }
}

renderSofiaDistChart(distribution) {
    const ctx = document.getElementById('chart-sofia-dist');
    if (!ctx) return;
    const colors = [
        'rgba(59, 130, 246, 0.8)', // Foliares (Blue)
        'rgba(245, 158, 11, 0.8)', // Herbicidas (Amber)
        'rgba(168, 85, 247, 0.8)', // Fertilizacion (Purple)
        'rgba(148, 163, 184, 0.8)' // Otros (Gray)
    ];
    this.charts['sofia-dist'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(distribution),
            datasets: [{ data: Object.values(distribution), backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 14 } } }
        }
    });
}

renderSofiaCostChart(topProducts) {
    const ctx = document.getElementById('chart-sofia-cost');
    if (!ctx) return;
    const colors = ['rgba(16,185,129,0.7)', 'rgba(168,85,247,0.7)', 'rgba(245,158,11,0.7)',
        'rgba(59,130,246,0.7)', 'rgba(239,68,68,0.7)', 'rgba(34,197,94,0.7)',
        'rgba(192,132,252,0.7)', 'rgba(251,191,36,0.7)'];
    this.charts['sofia-cost'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.producto),
            datasets: [{
                label: 'Costo Total ($)', data: topProducts.map(p => p.costo),
                backgroundColor: colors.slice(0, topProducts.length), borderWidth: 0, borderRadius: 6
            }]
        },
        options: { ...this.getChartOptions('Costo ($)'), indexAxis: 'y' }
    });
}

renderFoliaresChart(stats) {
    const ctx = document.getElementById('chart-sofia-foliares');
    if (!ctx) return;

    if (this.charts['sofia-foliares']) {
        this.charts['sofia-foliares'].destroy();
    }

    // @ts-ignore
    this.charts['sofia-foliares'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels,
            datasets: [
                {
                    label: 'Costo Operativo ($)',
                    data: stats.costos,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...this.getChartOptions('Costo Total ($)'),
            plugins: {
                ...this.getChartOptions().plugins,
                legend: { display: false }
            }
        }
    });
}

renderHerbicidasChart(stats) {
    const ctx = document.getElementById('chart-sofia-herbicidas');
    if (!ctx) return;

    if (this.charts['sofia-herbicidas']) {
        this.charts['sofia-herbicidas'].destroy();
    }

    // @ts-ignore
    this.charts['sofia-herbicidas'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels,
            datasets: [
                {
                    label: 'Costo Operativo ($)',
                    data: stats.costos,
                    backgroundColor: 'rgba(245, 158, 11, 0.7)', // Amber tint for Herbicides
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...this.getChartOptions('Costo Total ($)'),
            plugins: {
                ...this.getChartOptions().plugins,
                legend: { display: false }
            }
        }
    });
}

renderFoliaresProductosChart(stats) {
    const ctx = document.getElementById('chart-sofia-foliares-productos');
    if (!ctx) return;

    if (this.charts['sofia-foliares-productos']) {
        this.charts['sofia-foliares-productos'].destroy();
    }

    this.charts['sofia-foliares-productos'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels.slice(0, 15), // Show top 15 max
            datasets: [
                {
                    label: 'Cantidad Aplicada',
                    data: stats.cantidades.slice(0, 15),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)', // Emerald
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...this.getChartOptions('Unidades de Medida'),
            plugins: {
                ...this.getChartOptions().plugins,
                legend: { display: false }
            }
        }
    });
}

renderHerbicidasProductosChart(stats) {
    const ctx = document.getElementById('chart-sofia-herbicidas-productos');
    if (!ctx) return;

    if (this.charts['sofia-herbicidas-productos']) {
        this.charts['sofia-herbicidas-productos'].destroy();
    }

    this.charts['sofia-herbicidas-productos'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.labels.slice(0, 15), // Show top 15 max
            datasets: [
                {
                    label: 'Cantidad Aplicada',
                    data: stats.cantidades.slice(0, 15),
                    backgroundColor: 'rgba(168, 85, 247, 0.7)', // Purple
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...this.getChartOptions('Unidades de Medida'),
            plugins: {
                ...this.getChartOptions().plugins,
                legend: { display: false }
            }
        }
    });
}

renderFertComparativaChart(data) {
    // 0. Gráficos Comparativos por Finca (Espejo y Fincas Viejas)
    const renderSplitChart = (canvasId, fincaName, chartKey, colorPre, colorReal) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Get data filtering by CURRENT filters + specifically this Finca
        const specificFilters = { ...this.sofiaFilters, finca: fincaName };

        // If the currently selected predio doesn't belong to this fincaName,
        // ignore it for this specific chart to avoid showing an empty graph
        if (specificFilters.predio) {
            const subPredios = SofiaImportModel.getPredios(fincaName);
            if (!subPredios.includes(specificFilters.predio)) {
                specificFilters.predio = '';
                specificFilters.variedad = '';
            }
        }

        const prodData = SofiaImportModel.getProductComparison(specificFilters);
        console.log(`[Chart Sort] ${fincaName}:`, prodData.map(d => `${d.clasifica}-${d.producto}`).slice(0, 3));

        this.charts[chartKey] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: prodData.map(d => `${d.clasifica} - ${d.producto}`),
                datasets: [
                    {
                        label: 'Comprado (Pre)', data: prodData.map(d => d.pre),
                        backgroundColor: colorPre, borderColor: colorPre.replace('0.7', '1'),
                        borderWidth: 1, borderRadius: 4
                    },
                    {
                        label: 'Real Aplicado', data: prodData.map(d => d.real),
                        backgroundColor: colorReal, borderColor: colorReal.replace('0.7', '1'),
                        borderWidth: 1, borderRadius: 4
                    }
                ]
            },
            options: {
                ...this.getChartOptions('Litros (L)'),
                indexAxis: 'y',
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${formatCurrency(c.parsed.x)} L` } }
                }
            }
        });
    };

    renderSplitChart('chart-fert-prod-espejo', 'El Espejo', 'sofia-fert-espejo', 'rgba(59, 130, 246, 0.7)', 'rgba(236, 72, 153, 0.7)');
    renderSplitChart('chart-fert-prod-fincasviejas', 'Fincas Viejas', 'sofia-fert-fincasviejas', 'rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.7)');

    // 2. Timeline Charts (Weekly per-week Evolution) — one per finca with product + predio filter
    const weeklyConfigs = [
        { id: 'chart-fert-weekly-ee', filterId: 'filter-weekly-producto-ee', predioFilterId: 'filter-weekly-predio-ee', summaryId: 'weekly-summary-ee', finca: 'El Espejo', barColor: 'rgba(6, 182, 212, 0.7)', barBorder: 'rgba(6, 182, 212, 1)', lineColor: 'rgba(168, 85, 247, 1)' },
        { id: 'chart-fert-weekly-fv', filterId: 'filter-weekly-producto-fv', predioFilterId: 'filter-weekly-predio-fv', summaryId: 'weekly-summary-fv', finca: 'Fincas Viejas', barColor: 'rgba(249, 115, 22, 0.7)', barBorder: 'rgba(249, 115, 22, 1)', lineColor: 'rgba(52, 211, 153, 1)' }
    ];

    const renderWeeklyChart = (cfg) => {
        const ctx = document.getElementById(cfg.id);
        if (!ctx) return;

        // Destroy existing chart if any
        const chartKey = `sofia-${cfg.id}`;
        if (this.charts[chartKey]) {
            this.charts[chartKey].destroy();
            delete this.charts[chartKey];
        }

        const filterEl = document.getElementById(cfg.filterId);
        const productoFilter = filterEl ? filterEl.value : '';
        const predioFilterEl = document.getElementById(cfg.predioFilterId);
        const predioFilter = predioFilterEl ? predioFilterEl.value : '';
        const weeklyData = SofiaImportModel.getWeeklyEvolution(this.sofiaFilters, cfg.finca, productoFilter, predioFilter);

        // ── Update dynamic summary cards ──
        const summaryEl = document.getElementById(cfg.summaryId);
        if (summaryEl) {
            const totalPptado = [...weeklyData.pptadoPre, ...weeklyData.pptadoPos].reduce((s, v) => s + (v || 0), 0);
            const totalReal = weeklyData.realPre.reduce((s, v) => s + (v || 0), 0) + weeklyData.realPos.reduce((s, v) => s + (v || 0), 0);
            const desvio = totalReal - totalPptado;
            const desvioPct = totalPptado > 0 ? Math.round((desvio / totalPptado) * 100) : 0;
            const fmt = (v) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v);

            let estadoIcon, estadoColor, estadoBg, estadoBorder, estadoLabel;
            if (desvio > 0) {
                // Over budget → danger (red)
                estadoIcon = '⛔'; estadoColor = '#ef4444';
                estadoBg = 'rgba(239, 68, 68, 0.1)'; estadoBorder = 'rgba(239, 68, 68, 0.3)';
                estadoLabel = 'Exceso';
            } else if (desvio < 0) {
                // Under budget → warning (amber)
                estadoIcon = '⚠️'; estadoColor = '#f59e0b';
                estadoBg = 'rgba(245, 158, 11, 0.1)'; estadoBorder = 'rgba(245, 158, 11, 0.3)';
                estadoLabel = 'Falta';
            } else {
                // On target → green
                estadoIcon = '✅'; estadoColor = '#10b981';
                estadoBg = 'rgba(16, 185, 129, 0.1)'; estadoBorder = 'rgba(16, 185, 129, 0.3)';
                estadoLabel = 'En objetivo';
            }

            summaryEl.innerHTML = `
                    <div style="flex: 1; min-width: 160px; background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 10px 16px;">
                        <div style="font-size: 0.7em; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">🎯 Total Presupuestado</div>
                        <div style="font-size: 1.3em; font-weight: 700; color: #10b981; font-family: 'Outfit';">${fmt(totalPptado)} <span style="font-size: 0.55em; font-weight: 400; color: var(--text-tertiary);">L</span></div>
                    </div>
                    <div style="flex: 1; min-width: 160px; background: rgba(167, 139, 250, 0.06); border: 1px solid rgba(167, 139, 250, 0.15); border-radius: 12px; padding: 10px 16px;">
                        <div style="font-size: 0.7em; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">📦 Total Real Aplicado</div>
                        <div style="font-size: 1.3em; font-weight: 700; color: var(--color-accent-400); font-family: 'Outfit';">${fmt(totalReal)} <span style="font-size: 0.55em; font-weight: 400; color: var(--text-tertiary);">L</span></div>
                    </div>
                    <div style="flex: 1; min-width: 180px; background: ${estadoBg}; border: 1px solid ${estadoBorder}; border-radius: 12px; padding: 10px 16px;">
                        <div style="font-size: 0.7em; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${estadoIcon} Estado</div>
                        <div style="font-size: 1.3em; font-weight: 700; color: ${estadoColor}; font-family: 'Outfit';">${desvio > 0 ? '+' : ''}${fmt(desvio)} L <span style="font-size: 0.55em; font-weight: 500;">(${desvioPct > 0 ? '+' : ''}${desvioPct}%)</span></div>
                        <div style="font-size: 0.7em; color: ${estadoColor}; font-weight: 600; margin-top: 2px;">${estadoLabel}</div>
                    </div>
                `;
        }

        this.charts[chartKey] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'PPTO PRE',
                        data: weeklyData.pptadoPre,
                        borderColor: '#38bdf8', // Blue
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.1, fill: false,
                        pointRadius: 0, pointHoverRadius: 4,
                        order: 1
                    },
                    {
                        type: 'line',
                        label: 'PPTO POS',
                        data: weeklyData.pptadoPos,
                        borderColor: '#e879f9', // Pink
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.1, fill: false,
                        pointRadius: 0, pointHoverRadius: 4,
                        order: 1
                    },
                    {
                        type: 'bar',
                        label: 'Real PRE',
                        data: weeklyData.realPre,
                        backgroundColor: 'rgba(56, 189, 248, 0.4)',
                        borderColor: 'rgba(56, 189, 248, 1)',
                        borderWidth: 1, borderRadius: 2,
                        stack: 'real',
                        order: 2
                    },
                    {
                        type: 'bar',
                        label: 'Real POS (Bio-Crecimiento)',
                        data: weeklyData.realPos,
                        backgroundColor: 'rgba(232, 121, 249, 0.4)',
                        borderColor: 'rgba(232, 121, 249, 1)',
                        borderWidth: 1, borderRadius: 2,
                        stack: 'real',
                        order: 3
                    }
                ]
            },
            options: {
                ...this.getChartOptions('Litros (L) por Semana'),
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        stacked: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { size: 9, family: 'Inter' },
                            maxRotation: 45, minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.55)',
                            font: { size: 10 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'rgba(255,255,255,0.75)',
                            font: { family: 'Inter', size: 11, weight: '500' },
                            usePointStyle: true, padding: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (c) => `${c.dataset.label}: ${formatCurrency(c.parsed.y)} L`
                        }
                    }
                }
            }
        });
    };

    weeklyConfigs.forEach(cfg => {
        // Populate predio filter dropdown dynamically
        const predioEl = document.getElementById(cfg.predioFilterId);
        if (predioEl && predioEl.options.length <= 1) {
            const predios = SofiaImportModel.getPredios(cfg.finca);
            predios.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                opt.style.color = '#000';
                predioEl.appendChild(opt);
            });
        }

        renderWeeklyChart(cfg);
        // Bind product filter change
        const filterEl = document.getElementById(cfg.filterId);
        if (filterEl) {
            filterEl.addEventListener('change', () => renderWeeklyChart(cfg));
        }
        // Bind predio filter change
        if (predioEl) {
            predioEl.addEventListener('change', () => renderWeeklyChart(cfg));
        }
    });

    this.renderFertUnidadesChart();
}



// -- Jornadas Chart --
renderJornadasChart(comparison) {
    const ctx = document.getElementById('chart-jornadas-consumidas');
    if (!ctx) return;

    // Take top 8 labors for clarity
    const labels = comparison.labels.slice(0, 8);
    const realData = comparison.real.slice(0, 8);
    const budgetData = comparison.budget.slice(0, 8);

    if (this.charts['jornadas']) {
        this.charts['jornadas'].destroy();
    }

    this.charts['jornadas'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Ejecutado (Real)',
                    data: realData,
                    backgroundColor: [
                        'rgba(167, 139, 250, 0.8)',
                        'rgba(52, 211, 153, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(96, 165, 250, 0.8)',
                        'rgba(248, 113, 113, 0.8)',
                        'rgba(168, 162, 158, 0.8)',
                        'rgba(244, 114, 182, 0.8)',
                        'rgba(45, 212, 191, 0.8)'
                    ],
                    borderRadius: 4
                },
                {
                    type: 'line',
                    label: 'Proyectado (Budget)',
                    data: budgetData,
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false,
                    order: 1 // Drawn on top of bars
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 10 },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        font: { size: 10 },
                        callback: function (val) {
                            const label = this.getLabelForValue(val);
                            return label.length > 10 ? label.substr(0, 10) + '...' : label;
                        }
                    }
                }
            }
        }
    });
}

renderFertUnidadesChart() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
    const currentCycle = `${startYear}-${startYear + 1}`;
    const baseFilters = { ...this.sofiaFilters, ciclo: currentCycle };

    const productos = SofiaImportModel.getProductosFertilizacion();

    // Helper: populate & bind a product dropdown
    const setupProductFilter = (selectId, filterKey) => {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        if (sel.options.length <= 1) {
            productos.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                opt.style.color = '#000';
                if (p === this[filterKey]) opt.selected = true;
                sel.appendChild(opt);
            });
        }
        if (!sel._bound) {
            sel._bound = true;
            sel.addEventListener('change', () => {
                this[filterKey] = sel.value || '';
                this.renderFertUnidadesChart();
            });
        }
    };

    setupProductFilter('filter-producto-ee', 'fertProductoEE');
    setupProductFilter('filter-producto-fv', 'fertProductoFV');

    // Build filters per finca
    const filtersEE = { ...baseFilters, budgetType: 'pre' };
    const filtersFV = { ...baseFilters, budgetType: 'pre' };
    if (this.fertProductoEE) filtersEE.producto = this.fertProductoEE;
    if (this.fertProductoFV) filtersFV.producto = this.fertProductoFV;

    // POS-COSECHA filters
    const filtersEEPos = { ...baseFilters, budgetType: 'pos' };
    const filtersFVPos = { ...baseFilters, budgetType: 'pos' };
    if (this.fertProductoEE) filtersEEPos.producto = this.fertProductoEE;
    if (this.fertProductoFV) filtersFVPos.producto = this.fertProductoFV;

    // Destroy all previous nutrient charts
    ['n-ee', 'p-ee', 'k-ee', 'n-fv', 'p-fv', 'k-fv', 'n-ee-pos', 'n-fv-pos'].forEach(id => {
        const key = `sofia-fert-unidades-${id}`;
        if (this.charts[key]) {
            this.charts[key].destroy();
            delete this.charts[key];
        }
    });

    // Get data for each finca and each budget type
    const dataEE = SofiaImportModel.getFertilizacionUnidades(filtersEE, 'espejo');
    const dataFV = SofiaImportModel.getFertilizacionUnidades(filtersFV, 'fincasviejas');
    const dataEEPos = SofiaImportModel.getFertilizacionUnidades(filtersEEPos, 'espejo');
    const dataFVPos = SofiaImportModel.getFertilizacionUnidades(filtersFVPos, 'fincasviejas');

    // Nutrient config (colors)
    const nutrients = {
        n: {
            budgetColor: 'rgba(52, 211, 153, 0.35)', budgetBorder: 'rgba(52, 211, 153, 0.8)',
            realColor: 'rgba(52, 211, 153, 0.85)', realBorder: 'rgba(52, 211, 153, 1)',
        },
        p: {
            budgetColor: 'rgba(234, 179, 8, 0.35)', budgetBorder: 'rgba(234, 179, 8, 0.8)',
            realColor: 'rgba(234, 179, 8, 0.85)', realBorder: 'rgba(234, 179, 8, 1)',
        },
        k: {
            budgetColor: 'rgba(167, 139, 250, 0.35)', budgetBorder: 'rgba(167, 139, 250, 0.8)',
            realColor: 'rgba(167, 139, 250, 0.85)', realBorder: 'rgba(167, 139, 250, 1)',
        }
    };

    const nutrientsPos = {
        n: {
            budgetColor: 'rgba(129, 140, 248, 0.35)', budgetBorder: 'rgba(129, 140, 248, 0.8)',
            realColor: 'rgba(129, 140, 248, 0.85)', realBorder: 'rgba(129, 140, 248, 1)',
        }
    };

    // Helper to create a single nutrient chart
    const createChart = (canvasId, chartKey, data, colors) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        if (!data || data.length === 0) {
            // Optionally show "No data" message in canvas parent
            return;
        }

        this.charts[chartKey] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [
                    {
                        label: 'Presupuestado',
                        data: data.map(d => d.budget),
                        backgroundColor: colors.budgetColor,
                        borderColor: colors.budgetBorder,
                        borderWidth: 2, borderRadius: 6, borderSkipped: false,
                        categoryPercentage: 0.7, barPercentage: 0.85
                    },
                    {
                        label: 'Real Aplicado',
                        data: data.map(d => d.real),
                        backgroundColor: colors.realColor,
                        borderColor: colors.realBorder,
                        borderWidth: 2, borderRadius: 6, borderSkipped: false,
                        categoryPercentage: 0.7, barPercentage: 0.85
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 14, font: { family: 'Inter', size: 11, weight: '500' },
                            color: 'rgba(255,255,255,0.75)', padding: 16,
                            usePointStyle: true, pointStyle: 'rectRounded'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { family: 'Inter', size: 13, weight: '600' },
                        bodyFont: { family: 'Inter', size: 12 },
                        padding: 12, cornerRadius: 8,
                        callbacks: {
                            label: (c) => {
                                const formatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(c.parsed.y);
                                return `  ${c.dataset.label}: ${formatted} Unid.`;
                            },
                            afterBody: (items) => {
                                if (items.length < 2) return '';
                                const budget = items[0].parsed.y;
                                const real = items[1].parsed.y;
                                if (budget > 0) {
                                    const pct = ((real / budget) * 100).toFixed(1);
                                    return `\n  📊 Ejecución: ${pct}%`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: 'rgba(255,255,255,0.6)', 
                            font: { family: 'Inter', size: 10, weight: '500' }, 
                            maxRotation: 45, minRotation: 0 
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.06)', lineWidth: 1 },
                        ticks: {
                            color: 'rgba(255,255,255,0.55)', 
                            font: { family: 'Inter', size: 10 },
                            callback: function (value) {
                                if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
                                return new Intl.NumberFormat('es-AR').format(value);
                            }
                        }
                    }
                }
            }
        });
    };

        // Render El Espejo charts (PRE)
        Object.entries(nutrients).forEach(([nut, colors]) => {
            const flatData = dataEE.map(d => ({ name: d.name, budget: d[nut].budget, real: d[nut].real }));
            createChart(`chart-fert-unidades-${nut}-ee`, `sofia-fert-unidades-${nut}-ee`, flatData, colors);
        });

        // Render El Espejo charts (POS)
        if (dataEEPos && dataEEPos.length > 0) {
            const flatData = dataEEPos.map(d => ({ name: d.name, budget: d['n'].budget, real: d['n'].real }));
            createChart(`chart-fert-unidades-n-ee-pos`, `sofia-fert-unidades-n-ee-pos`, flatData, nutrientsPos.n);
        }

        // Render Fincas Viejas charts (PRE)
        Object.entries(nutrients).forEach(([nut, colors]) => {
            const flatData = dataFV.map(d => ({ name: d.name, budget: d[nut].budget, real: d[nut].real }));
            createChart(`chart-fert-unidades-${nut}-fv`, `sofia-fert-unidades-${nut}-fv`, flatData, colors);
        });

        // Render Fincas Viejas charts (POS)
        if (dataFVPos && dataFVPos.length > 0) {
            const flatData = dataFVPos.map(d => ({ name: d.name, budget: d['n'].budget, real: d['n'].real }));
            createChart(`chart-fert-unidades-n-fv-pos`, `sofia-fert-unidades-n-fv-pos`, flatData, nutrientsPos.n);
        }
    }

    // ── Gastos Históricos Section (Native, no iframe) ──
    async renderGastosHistoricosSection() {
        const statusEl = document.getElementById('gh-status');
        const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg; };

        setStatus('Cargando datos de gastos...');

        // ── 1. Load CSVs ──
        const parseCSVSimple = (text) => {
            const lines = text.split(/\r\n|\r|\n/).filter(l => l.trim());
            if (lines.length < 2) return [];
            const headers = lines[0].split(';').map(h => h.trim().replace(/^\uFEFF/, ''));
            return lines.slice(1).map(line => {
                const cols = line.split(';').map(c => c.trim());
                const obj = {};
                headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
                return obj;
            }).filter(row => Object.values(row).some(v => v !== ''));
        };

        let histData = [], curData = [];
        try {
            const [histRes, curRes] = await Promise.all([
                fetch('/Fuentes/Gastos/Historico.csv').then(r => r.ok ? r.text() : ''),
                fetch('/Fuentes/Gastos/2026.csv').then(r => r.ok ? r.text() : '')
            ]);
            histData = parseCSVSimple(histRes);
            curData = parseCSVSimple(curRes);
        } catch (e) {
            console.error('Error loading gastos CSVs:', e);
            setStatus('Error cargando archivos de gastos.');
            return;
        }

        const allExpenses = [...histData, ...curData];
        if (allExpenses.length === 0) {
            setStatus('No hay datos de gastos disponibles. Verifique los archivos CSV en /Fuentes/Gastos/');
            return;
        }

        // ── 2. Detect columns ──
        const sample = allExpenses[0];
        const findCol = (names) => {
            const keys = Object.keys(sample);
            let f = keys.find(k => names.some(n => k.trim().toLowerCase() === n.toLowerCase()));
            if (f) return f;
            f = keys.find(k => names.some(n => k.trim().toLowerCase().includes(n.toLowerCase())));
            return f || null;
        };

        const COL_FINCA = findCol(['FINCA', 'Finca']) || Object.keys(sample)[0];
        const COL_ITEM = findCol(['ITEMS', 'ITEM', 'Ítem', 'Item']) || Object.keys(sample)[1];
        const COL_UNIF = findCol(['UNIFICACION', 'Unificación', 'Unificacion']) || Object.keys(sample)[2];
        const COL_USD = findCol(['USD Final', 'USD']) || 'USD';
        const COL_YEAR = findCol(['Año', 'AÑO', 'Ao']) || Object.keys(sample).find(k => {
            const c = k.trim().toLowerCase(); return c.length <= 5 && c.startsWith('a');
        }) || Object.keys(sample)[4];
        const COL_HAS = findCol(['Has']) || 'Has';

        // ── 3. Normalize finca names ──
        const FINCA_MAP = {
            '01 - LA CHIMBERA': 'La Chimbera',
            '02 - CAMINO TRUNCADO': 'Camino Truncado',
            '03 - PUENTE ALTO': 'Puente Alto',
            '04 - EL ESPEJO': 'El Espejo I y II',
            '05 - EL ESPEJO': 'El Espejo III'
        };
        const normFinca = (raw) => FINCA_MAP[String(raw || '').trim()] || String(raw || '').trim();

        // ── 4. Populate filters ──
        const gFincas = [...new Set(allExpenses.map(d => normFinca(d[COL_FINCA])))].filter(Boolean).sort();
        const gItems = [...new Set(allExpenses.map(d => String(d[COL_ITEM] || '').trim()))].filter(Boolean).sort();
        const gUnifs = [...new Set(allExpenses.map(d => String(d[COL_UNIF] || '').trim()))].filter(Boolean).sort();

        const fincaSel = document.getElementById('gh-filter-finca');
        const itemSel = document.getElementById('gh-filter-item');
        const unifSel = document.getElementById('gh-filter-unif');

        if (fincaSel) gFincas.forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; fincaSel.appendChild(o); });
        if (itemSel) gItems.forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; itemSel.appendChild(o); });
        if (unifSel) gUnifs.forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; unifSel.appendChild(o); });

        // ── 5. Chart rendering function ──
        const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

        const renderGastosCharts = () => {
            const fFinca = fincaSel?.value || 'all';
            const fItem = itemSel?.value || 'all';
            const fUnif = unifSel?.value || 'all';

            const filtered = allExpenses.filter(d => {
                const finca = normFinca(d[COL_FINCA]);
                const item = String(d[COL_ITEM] || '').trim();
                const unif = String(d[COL_UNIF] || '').trim();
                return (fFinca === 'all' || finca === fFinca) &&
                    (fItem === 'all' || item === fItem) &&
                    (fUnif === 'all' || unif === fUnif);
            });

            // Aggregate by year
            const realYears = {}, bpYears = {}, itemsDist = {}, yearsHas = {};

            filtered.forEach(d => {
                const rawYear = String(d[COL_YEAR] || '').trim();
                if (!rawYear) return;

                let rawUsd = String(d[COL_USD] || '0').trim();
                const usd = parseFloat(rawUsd.replace(/\./g, '').replace(',', '.')) || 0;
                let rawHas = String(d[COL_HAS] || '0').trim();
                const has = parseFloat(rawHas.replace(/\./g, '').replace(',', '.')) || 0;
                const finca = normFinca(d[COL_FINCA]);
                const item = String(d[COL_ITEM] || 'Otros').trim();

                const isBP = rawYear.toUpperCase().startsWith('BP');
                const cleanYear = rawYear.replace(/^BP\s*/i, '').trim();
                if (!cleanYear || isNaN(parseInt(cleanYear))) return;

                if (isBP) {
                    bpYears[cleanYear] = (bpYears[cleanYear] || 0) + usd;
                } else {
                    if (!realYears[cleanYear]) { realYears[cleanYear] = 0; yearsHas[cleanYear] = {}; }
                    realYears[cleanYear] += usd;
                    if (!yearsHas[cleanYear][finca] || has > yearsHas[cleanYear][finca]) {
                        yearsHas[cleanYear][finca] = has;
                    }
                    itemsDist[item] = (itemsDist[item] || 0) + usd;
                }
            });

            const sortedYears = Object.keys(realYears).sort();
            if (sortedYears.length === 0) {
                setStatus('Sin datos de gastos para los filtros seleccionados.');
                return;
            }

            const usdEvolution = sortedYears.map(y => realYears[y]);
            const bpEvolution = sortedYears.map(y => y === '2026' ? (bpYears['2026'] || 0) : 0);
            const usdPerHa = sortedYears.map(y => {
                let totalHas = 0;
                if (yearsHas[y]) Object.values(yearsHas[y]).forEach(h => totalHas += h);
                return totalHas > 0 ? realYears[y] / totalHas : 0;
            });

            // Destroy previous charts
            ['gh-evol', 'gh-ha', 'gh-pasa', 'gh-pie'].forEach(k => {
                if (this.charts[k]) { this.charts[k].destroy(); delete this.charts[k]; }
            });

            // ── Chart 1: Evolution ──
            const ctxEvol = document.getElementById('gh-chart-evolution');
            if (ctxEvol) {
                const datasets = [{
                    type: 'bar', label: 'Gasto Real (USD)', data: usdEvolution,
                    backgroundColor: 'rgba(129, 140, 248, 0.85)', borderColor: '#818cf8',
                    borderWidth: 1, borderRadius: 6, order: 1,
                    barPercentage: 0.85, categoryPercentage: 0.8
                }];
                if (bpEvolution.some(v => v > 0)) {
                    datasets.push({
                        type: 'bar', label: 'BP (USD)', data: bpEvolution,
                        backgroundColor: 'rgba(16, 185, 129, 0.5)', borderColor: 'rgba(16, 185, 129, 0.7)',
                        borderWidth: 1, borderRadius: 6, order: 2,
                        barPercentage: 0.85, categoryPercentage: 0.8
                    });
                }

                this.charts['gh-evol'] = new Chart(ctxEvol, {
                    data: { labels: sortedYears, datasets },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter', size: 11 } } },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)', titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' },
                                callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatUSD(ctx.raw)}` }
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.5)', callback: v => formatUSD(v) } },
                            x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.6)' } }
                        }
                    }
                });
            }

            // ── Chart 2: USD/Ha ──
            const ctxHa = document.getElementById('gh-chart-ha');
            if (ctxHa) {
                const ctx2d = ctxHa.getContext('2d');
                const grad = ctx2d.createLinearGradient(0, 0, 0, 380);
                grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
                grad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

                this.charts['gh-ha'] = new Chart(ctxHa, {
                    type: 'line',
                    data: {
                        labels: sortedYears,
                        datasets: [{
                            label: 'USD por Hectárea', data: usdPerHa,
                            borderColor: '#10b981', backgroundColor: grad,
                            borderWidth: 3, fill: true,
                            pointRadius: 5, pointHoverRadius: 8,
                            pointBackgroundColor: '#10b981',
                            pointBorderColor: '#0f172a', pointBorderWidth: 2,
                            tension: 0.35
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                callbacks: { label: ctx => ` ${formatUSD(ctx.raw)} por ha` }
                            }
                        },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                            x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                        }
                    }
                });
            }

            // ── Chart 3: USD/Kg Pasa ──
            const ctxPasa = document.getElementById('gh-chart-pasa');
            if (ctxPasa) {
                // Estimate Kg Pasa per year (from historical_data if available, or hardcoded known values)
                const kgPasaByYear = {
                    '2020': 1512000, '2021': 1890000, '2022': 1345000, '2023': 1620000,
                    '2024': 1780000, '2025': 1950000, '2026': 1500000
                };
                const usdPerKgPasa = sortedYears.map(y => {
                    const kg = kgPasaByYear[y] || 0;
                    return kg > 0 ? realYears[y] / kg : 0;
                });

                const ctx2d = ctxPasa.getContext('2d');
                const gradP = ctx2d.createLinearGradient(0, 0, 0, 380);
                gradP.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
                gradP.addColorStop(1, 'rgba(251, 191, 36, 0.01)');

                this.charts['gh-pasa'] = new Chart(ctxPasa, {
                    type: 'line',
                    data: {
                        labels: sortedYears,
                        datasets: [{
                            label: 'USD por Kg Pasa', data: usdPerKgPasa,
                            borderColor: '#fbbf24', backgroundColor: gradP,
                            borderWidth: 3, fill: true,
                            pointRadius: 5, pointHoverRadius: 8,
                            pointBackgroundColor: '#fbbf24',
                            pointBorderColor: '#0f172a', pointBorderWidth: 2,
                            tension: 0.35
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                callbacks: { label: ctx => ` $${ctx.raw.toFixed(2)} por Kg pasa` }
                            }
                        },
                        scales: {
                            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.5)', callback: v => '$' + v.toFixed(2) } },
                            x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                        }
                    }
                });
            }

            // ── Chart 4: Distribution Pie ──
            const ctxPie = document.getElementById('gh-chart-pie');
            if (ctxPie) {
                const pieLabels = Object.keys(itemsDist).sort((a, b) => itemsDist[b] - itemsDist[a]);
                const pieData = pieLabels.map(l => itemsDist[l]);
                const totalPie = pieData.reduce((a, b) => a + b, 0);

                this.charts['gh-pie'] = new Chart(ctxPie, {
                    type: 'doughnut',
                    data: {
                        labels: pieLabels,
                        datasets: [{
                            data: pieData,
                            backgroundColor: [
                                '#6366f1', '#10b981', '#fbbf24', '#ef4444', '#f472b6',
                                '#a78bfa', '#2dd4bf', '#fb923c', '#94a3b8', '#e879f9',
                                '#38bdf8', '#34d399'
                            ],
                            borderWidth: 2, borderColor: 'rgba(15,23,42,0.8)',
                            hoverOffset: 8, borderRadius: 3, spacing: 2
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        cutout: '55%',
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Inter', size: 11 }, padding: 10, usePointStyle: true }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                callbacks: {
                                    label: ctx => {
                                        const pct = totalPie > 0 ? ((ctx.raw / totalPie) * 100).toFixed(1) : 0;
                                        return ` ${ctx.label}: ${formatUSD(ctx.raw)} (${pct}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // ── KPIs ──
            const lastYear = sortedYears[sortedYears.length - 1];
            const prevYear = sortedYears.length >= 2 ? sortedYears[sortedYears.length - 2] : null;
            const totalSelected = usdEvolution.reduce((a, b) => a + b, 0);
            const lastYearUSD = realYears[lastYear] || 0;
            const bpLastYear = bpYears[lastYear] || 0;
            const prevYearUSD = prevYear ? (realYears[prevYear] || 0) : 0;
            const varPerc = prevYearUSD > 0 ? ((lastYearUSD / prevYearUSD) - 1) * 100 : 0;

            const kpiTotal = document.getElementById('gh-kpi-total');
            const kpiLast = document.getElementById('gh-kpi-last');
            const kpiBP = document.getElementById('gh-kpi-bp');
            const kpiVar = document.getElementById('gh-kpi-var');

            if (kpiTotal) kpiTotal.textContent = formatUSD(totalSelected);
            if (kpiLast) { kpiLast.textContent = formatUSD(lastYearUSD); kpiLast.closest('.metric-card').querySelector('.metric-label').textContent = `Gasto ${lastYear} (Real)`; }
            if (kpiBP) { kpiBP.textContent = bpLastYear > 0 ? formatUSD(bpLastYear) : 'N/A'; kpiBP.closest('.metric-card').querySelector('.metric-label').textContent = `BP ${lastYear}`; }
            if (kpiVar) {
                kpiVar.textContent = `${varPerc > 0 ? '+' : ''}${varPerc.toFixed(1)}%`;
                kpiVar.style.color = varPerc > 0 ? '#ef4444' : '#10b981';
                kpiVar.closest('.metric-card').querySelector('.metric-label').textContent = `Variación vs ${prevYear || '-'}`;
            }

            setStatus(`Datos cargados: ${filtered.length} registros. Última actualización: ${new Date().toLocaleTimeString()}`);
        };

        // Initial render
        renderGastosCharts();

        // Filter events
        [fincaSel, itemSel, unifSel].forEach(sel => {
            if (sel) sel.addEventListener('change', renderGastosCharts);
        });
    }

    async renderControlCarga(content) {
        const dateInput = document.getElementById('control-carga-date');
        const refreshBtn = document.getElementById('refresh-control-carga');
        const cuartelSelect = document.getElementById('control-carga-cuartel');
        const container = document.getElementById('control-carga-tables-container');

        this.currentControlCargaData = [];

        // --- Búsqueda Histórica ---
        const searchLaborBtn = document.getElementById('btn-search-last-labor');
        const searchLaborSelect = document.getElementById('cc-search-labor');
        const searchFincaSelect = document.getElementById('cc-search-finca');
        const searchResult = document.getElementById('cc-search-result');

        if (searchLaborSelect) {
            let allLaborsSet = new Set();
            
            // Gather from DATA_JORNALES
            if (SofiaApiModel.DATA_JORNALES) {
                SofiaApiModel.DATA_JORNALES.forEach(r => allLaborsSet.add(r.labor_normalized || r.labor || r.Labor));
            }

            // Gather from ALL Cached Cycles
            if (SofiaApiModel._cyclesCache) {
                Object.values(SofiaApiModel._cyclesCache).forEach(cycleArr => {
                    if (Array.isArray(cycleArr)) {
                        cycleArr.forEach(r => allLaborsSet.add(r.labor_normalized || r.labor || r.Labor));
                    }
                });
            }

            // Fallback list to ensure all major labors are selectable
            const fallbackLabors = [
                'Poda', 'Cosecha', 'Desbrote', 'Atada', 'Limpieza', 'Desmalezado', 
                'Levantado', 'Aplicación', 'Aplicacion manual', 'Bordeleza', 'Curada',
                'Mantenimiento', 'Tractor', 'Riego', 'Manejo Canopia'
            ];
            fallbackLabors.forEach(l => allLaborsSet.add(l));

            const allLabors = [...allLaborsSet].filter(l => l && typeof l === 'string' && l.trim() !== '').sort();
            searchLaborSelect.innerHTML = '<option value="">Seleccione una labor...</option>' + 
                allLabors.map(l => `<option value="${l}">${l}</option>`).join('');
        }

        if (searchLaborBtn) {
            searchLaborBtn.addEventListener('click', async () => {
                const labor = searchLaborSelect?.value;
                const finca = searchFincaSelect?.value;
                if (!labor) return;

                // Disable button and show loading state
                const originalBtnText = searchLaborBtn.innerHTML;
                searchLaborBtn.disabled = true;
                searchLaborBtn.innerHTML = '⏳ Buscando...';

                // Collect all possible historcial records
                let allHistoricals = [];
                if (SofiaApiModel.DATA_JORNALES) {
                    allHistoricals = allHistoricals.concat(SofiaApiModel.DATA_JORNALES);
                }
                if (SofiaApiModel._cyclesCache) {
                    Object.values(SofiaApiModel._cyclesCache).forEach(cycleArr => {
                        if (Array.isArray(cycleArr)) allHistoricals = allHistoricals.concat(cycleArr);
                    });
                }

                if (allHistoricals.length === 0) {
                    searchResult.innerHTML = '⏳ Descargando historial de la base de datos... esto podría tardar unos segundos.';
                    searchResult.style.display = 'block';
                    searchResult.style.borderLeftColor = 'var(--text-tertiary)';
                    
                    try {
                        const defaultCycle = localStorage.getItem('sofia_current_cycle') || '2025-2026';
                        await SofiaApiModel.fetchJornales({ cycle: defaultCycle });
                        
                        if (SofiaApiModel.DATA_JORNALES) {
                            allHistoricals = allHistoricals.concat(SofiaApiModel.DATA_JORNALES);
                        }
                    } catch (err) {
                        console.error("Error fetching historicals:", err);
                    }
                }

                searchLaborBtn.disabled = false;
                searchLaborBtn.innerHTML = originalBtnText;

                if (allHistoricals.length === 0) {
                    searchResult.innerHTML = 'Error: No se pudo cargar la base de datos histórica.';
                    searchResult.style.display = 'block';
                    searchResult.style.borderLeftColor = 'var(--color-error)';
                    return;
                }

                let matches = allHistoricals.filter(r => (r.labor_normalized || r.labor || r.Labor) === labor);
                if (finca) matches = matches.filter(r => r.finca === finca);

                if (matches.length === 0) {
                    searchResult.innerHTML = `No se encontraron registros en el ciclo actual para "<b>${labor}</b>".`;
                    searchResult.style.display = 'block';
                    searchResult.style.borderLeftColor = 'var(--color-error)';
                    return;
                }

                matches.sort((a, b) => {
                    const d1 = new Date(a.fecha || a.Fecha || a.date).getTime();
                    const d2 = new Date(b.fecha || b.Fecha || b.date).getTime();
                    return d2 - d1; // Descending
                });

                const lastMatch = matches[0];
                const parts = lastMatch.fecha.split('-');
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : lastMatch.fecha;
                const parseJornadas = parseFloat(lastMatch.jornada || lastMatch.totalJornadas || 0);

                searchResult.innerHTML = `Última vez cargada: <b style="font-size: 1.2em;">${formattedDate}</b> 
                                          <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 8px;">
                                              Finca: <span style="color: var(--text-primary);">${lastMatch.finca || '-'}</span> | 
                                              Predio: <span style="color: var(--text-primary);">${lastMatch.clasifica || lastMatch.clasificacion || '-'}</span> | 
                                              Jornadas ese día: <span style="color: var(--text-primary);">${parseJornadas.toFixed(2)}</span>
                                          </div>`;
                searchResult.style.display = 'block';
                searchResult.style.borderLeftColor = 'var(--color-primary-500)';

                // Auto set date for the main query
                if (dateInput && parts.length === 3) {
                    // Sofia format requires YYYY-MM-DD
                    dateInput.value = lastMatch.fecha; 
                    updateData();
                }
            });
        }
        // --------------------------

        const populateCuarteles = (data) => {
            if (!cuartelSelect) return;
            const currentVal = cuartelSelect.value;
            const cuarteles = [...new Set(data.map(r => r.cuartel).filter(c => c))].sort();

            let html = '<option value="all" style="background: var(--color-bg-sidebar);">Todos</option>';
            cuarteles.forEach(c => {
                html += `<option value="${c}" style="background: var(--color-bg-sidebar);">${c}</option>`;
            });
            cuartelSelect.innerHTML = html;
            if (cuarteles.includes(currentVal)) cuartelSelect.value = currentVal;
            else cuartelSelect.value = 'all';
        };

        const updateData = async () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            if (container) {
                container.innerHTML = `
                    <div class="card" style="padding: 3rem; text-align: center; background: var(--color-bg-sidebar); border: 1px solid var(--color-border);">
                        <div class="loader-container">
                            <div class="loader"></div>
                            <p style="margin-top: 10px; color: var(--text-secondary);">Consultando APIs de Sofía para ${selectedDate}...</p>
                        </div>
                    </div>
                `;
            }

            try {
                const fincas = ['Fincas Viejas', 'El Espejo'];
                const allData = await Promise.all(
                    fincas.map(finca => SofiaApiModel.fetchFromSofia(finca, selectedDate, selectedDate))
                );

                let flatData = allData.flat();

                // --- Include Auxiliares Data in Control de Carga ---
                try {
                    const auxiliares = await SofiaApiModel.loadCSVAuxiliares();
                    const filteredAux = auxiliares.filter(r => r.fecha === selectedDate);
                    flatData = flatData.concat(filteredAux);
                } catch (e) {
                    console.warn('Error loading auxiliares in ControlCarga:', e);
                }

                this.currentControlCargaData = flatData;
                populateCuarteles(this.currentControlCargaData);
                this.updateControlCargaUI(this.currentControlCargaData);
            } catch (error) {
                console.error("Error fetching Control de Carga:", error);
                if (container) {
                    container.innerHTML = `
                        <div class="card" style="padding: 3rem; text-align: center; color: var(--color-error); background: var(--color-bg-sidebar); border: 1px solid var(--color-border);">
                            Error al cargar datos desde la API. Verifique su conexión y refresque.
                        </div>
                    `;
                }
            }
        };

        if (refreshBtn) refreshBtn.addEventListener('click', updateData);
        if (dateInput) dateInput.addEventListener('change', updateData);
        if (cuartelSelect) {
            cuartelSelect.addEventListener('change', () => {
                this.updateControlCargaUI(this.currentControlCargaData);
            });
        }

        // Initial load
        updateData();
    }

    updateControlCargaUI(data) {
        const container = document.getElementById('control-carga-tables-container');
        const countEl = document.getElementById('cc-total-registros');
        const jornadasEl = document.getElementById('cc-total-jornadas');
        const prediosEl = document.getElementById('cc-total-predios');
        const cuartelFilter = document.getElementById('control-carga-cuartel')?.value || 'all';

        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = `
                <div class="card" style="padding: 3rem; text-align: center; color: var(--text-tertiary); background: var(--color-bg-sidebar); border: 1px solid var(--color-border);">
                    No se encontraron labores cargadas para esta fecha en Sofía.
                </div>
            `;
            if (countEl) countEl.textContent = '0';
            if (jornadasEl) jornadasEl.textContent = '0';
            if (prediosEl) prediosEl.textContent = '0';
            return;
        }

        // Apply Cuartel Filter
        let filteredData = data;
        if (cuartelFilter !== 'all') {
            filteredData = data.filter(r => r.cuartel === cuartelFilter);
        }

        // Processing Summary Stats (on original data or filtered? Usually on filtered if UI shows filtered)
        // User might want to see global totals but table filtered. I'll use filtered for consistency in this view.
        let totalJornadas = 0;
        const prediosSet = new Set();

        // Grouping logic: Finca -> Labor
        // If "all" is selected, we should aggregate by Persona so we don't separate by cuartel in rows
        const processedData = [];
        if (cuartelFilter === 'all') {
            const aggregationMap = {};
            filteredData.forEach(r => {
                const key = `${r.finca}|${r.labor}|${r.persona}|${r.clasificacion || r.clasifica}`;
                if (!aggregationMap[key]) {
                    aggregationMap[key] = { ...r, jornada: 0, totalJornadas: 0, cuartel: 'Varios' };
                }
                const j = parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0;
                aggregationMap[key].jornada += j;
            });
            Object.values(aggregationMap).forEach(val => processedData.push(val));
        } else {
            filteredData.forEach(r => processedData.push(r));
        }

        const groupedData = processedData.reduce((acc, r) => {
            const finca = r.finca || 'Otros';
            const predio = r.clasificacion || r.clasifica || 'Sin Clasificar';

            if (!acc[finca]) acc[finca] = {};
            if (!acc[finca][predio]) acc[finca][predio] = [];

            acc[finca][predio].push(r);

            // Stats (actually use raw data for accurate total jornadas)
            totalJornadas += parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0;
            prediosSet.add(r.clasificacion || r.clasifica || 'Sin Clasificar');

            return acc;
        }, {});

        // Re-calcs summary on total data or filtered? I'll use filtered.
        if (cuartelFilter !== 'all') {
            // Re-calculate exactly for filtered data
            totalJornadas = filteredData.reduce((s, r) => s + (parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0), 0);
            const pSet = new Set(filteredData.map(r => r.clasificacion || r.clasifica || 'Sin Clasificar'));
            if (countEl) countEl.textContent = filteredData.length.toLocaleString();
            if (jornadasEl) jornadasEl.textContent = totalJornadas.toFixed(1).toLocaleString();
            if (prediosEl) prediosEl.textContent = pSet.size.toString();
        } else {
            if (countEl) countEl.textContent = data.length.toLocaleString();
            // Total jornadas from full data
            const fullTotal = data.reduce((s, r) => s + (parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0), 0);
            if (jornadasEl) jornadasEl.textContent = fullTotal.toFixed(1).toLocaleString();
            if (prediosEl) prediosEl.textContent = new Set(data.map(r => r.clasificacion || r.clasifica || 'Sin Clasificar')).size.toString();
        }

        let finalHtml = '';

        // Generate a table for each Finca
        Object.entries(groupedData).forEach(([fincaName, predios]) => {
            const isCuartelHidden = (cuartelFilter === 'all');

            let fincaHtml = `
                <div class="card" style="margin-bottom: 2rem; padding: 0; overflow: hidden; background: var(--color-bg-sidebar); border: 1px solid var(--color-border);">
                    <div style="padding: 1rem 1.5rem; background: rgba(16, 185, 129, 0.1); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: var(--accent-emerald); font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            <span>📍</span> ${fincaName}
                        </h3>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="data-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: rgba(255,255,255,0.03);">
                                    <th style="padding: 0.8rem 1rem; text-align: left; color: var(--text-secondary); width: 25%;">Labor</th>
                                    ${!isCuartelHidden ? '<th style="padding: 0.8rem 1rem; text-align: left; color: var(--text-secondary); width: 10%;">Cuartel</th>' : ''}
                                    <th style="padding: 0.8rem 1rem; text-align: left; color: var(--text-secondary); width: 40%;">Persona</th>
                                    <th style="padding: 0.8rem 1rem; text-align: left; color: var(--text-secondary); width: 15%;">Jornada</th>
                                    <th style="padding: 0.8rem 1rem; text-align: left; color: var(--text-secondary); width: 15%;">Rend.</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            // Group rows by Predio within the Finca table
            Object.entries(predios).forEach(([predioName, rows]) => {
                const predioTotalJornadas = rows.reduce((s, r) => s + (parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0), 0);

                fincaHtml += `
                    <tr style="background: rgba(255,255,255,0.05);">
                        <td colspan="${isCuartelHidden ? 4 : 5}" style="padding: 0.8rem 1rem; font-weight: 700; color: var(--text-primary); border-top: 1px solid var(--color-border);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span>📍 Predio: ${predioName}</span>
                                <span style="font-size: 0.85rem; background: rgba(129, 140, 248, 0.2); color: var(--accent-primary); padding: 2px 8px; border-radius: 6px;">
                                    Subtotal: ${predioTotalJornadas.toFixed(2)} jornadas
                                </span>
                            </div>
                        </td>
                    </tr>
                `;

                rows.forEach(r => {
                    const jornadas = parseFloat(r.jornada) || parseFloat(r.totalJornadas) || 0;
                    fincaHtml += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                            <td style="padding: 0.8rem 1rem; color: var(--text-secondary);">${r.labor || 'Otras Labores'}</td>
                            ${!isCuartelHidden ? `<td style="padding: 0.8rem 1rem;">${r.cuartel || '-'}</td>` : ''}
                            <td style="padding: 0.8rem 1rem;">${r.persona || '-'}</td>
                            <td style="padding: 0.8rem 1rem; font-weight: 600;">${jornadas.toFixed(2)}</td>
                            <td style="padding: 0.8rem 1rem;">${r.rendimiento || '-'}</td>
                        </tr>
                    `;
                });
            });

            fincaHtml += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            finalHtml += fincaHtml;
        });

        container.innerHTML = finalHtml;
    }

    async renderInventarioSection(container) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center;">⌛ Cargando movimientos de inventario...</div>`;
        try {
            const [movements, products] = await Promise.all([
                fetch(`${VITE_API_URL}/inventario/movimientos`).then(r => r.json()),
                ADMIN_MODELS['admin-productos'].getAll()
            ]);

            container.innerHTML = renderStockMovementView(movements, { productos: products }, this.currentUser);
            this.bindInventarioEvents(container, movements, { productos: products });
        } catch (e) {
            console.error('Inventario load error:', e);
            container.innerHTML = `<div class="alert alert-error">Error al cargar datos de inventario.</div>`;
        }
    }

    bindInventarioEvents(container, movements, catalogs) {
        const refresh = () => this.renderInventarioSection(container);
        const modal = document.getElementById('stock-move-modal-overlay');
        const form = document.getElementById('form-stock-move');

        document.getElementById('btn-add-stock-move')?.addEventListener('click', () => {
            form.reset();
            modal.style.display = 'flex';
        });

        const closeModal = () => modal.style.display = 'none';
        document.getElementById('btn-close-stock-modal')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-stock-move')?.addEventListener('click', closeModal);

        document.getElementById('search-stock-moves')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('#table-stock-moves tbody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('btn-submit-stock-move');
            submitBtn.disabled = true;
            submitBtn.textContent = '...';

            const payload = {
                producto_id: document.getElementById('move-producto').value,
                tipo_movimiento: document.getElementById('move-tipo').value,
                cantidad: parseFloat(document.getElementById('move-cantidad').value),
                nro_comprobante: document.getElementById('move-comprobante').value,
                usuario_id: this.currentUser.id,
                notas: document.getElementById('move-notas').value
            };

            try {
                const res = await fetch(`${VITE_API_URL}/inventario/movimiento`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(r => r.json());

                if (res.success) {
                    modal.style.display = 'none';
                    refresh();
                } else {
                    this.showAlert('Error: ' + res.message);
                }
            } catch (err) {
                this.showAlert('Error al registrar movimiento');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '💾 Guardar Ingreso';
            }
        });
    }
}
