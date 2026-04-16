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
    renderSofiaHerbicidas, renderSofiaDron, renderFertilizacionComparativa, formatCurrency,
    renderHectareasPorPredio, renderEficienciaChartSection,
    renderCosechaLevantadoTable, renderLevantadoPorPlaya, renderAdminCrudView, renderWorkLogView,
    renderGastosView, renderSecaderosView, renderGastosHistoricosView,
    renderControlCargaView, renderPresupuestoProyeccionView, renderExcelBudgetSummary,
    renderEjecucionPresupuesto, renderInformePlanificacion,
    renderProyeccionJornalView, renderPomDetalleTable, renderPomResumenFinca, renderPomCalendario,
    renderCargaDocumentacionView, renderDocumentacionRows, renderTransferRows, renderRemitoExtRows, renderServicioRows,
    renderStockMovementView, renderRemitoPrintTemplate, renderCargaHome
} from '../views/Views.js';
import { renderInversionesKanbanView } from '../views/InversionesView.js';

import { SecaderosController } from './SecaderosController.js';
import { JornalesBudgetModel } from '../models/JornalesBudgetModel.js';
import { PresupuestoModel as PresupuestoBudgetModel } from '../models/PresupuestoModel.js';
import { ProyeccionJornalModel } from '../models/ProyeccionJornalModel.js';
import { DocumentacionModel } from '../models/DocumentacionModel.js';

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
                { id: 'informe-planificacion', label: 'Resumen Ppto Aprobado', icon: '📊' },
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
                { id: 'admin-proveedores', label: 'Proveedores', icon: '🤝' },
                { id: 'admin-institucional', label: 'Institucional', icon: '🏛️' },
                { id: 'presupuesto', label: 'Presupuesto', icon: '📊' },
                { id: 'admin-planificacion', label: 'Planificación', icon: '📅' },
                { id: 'inversiones-propuestas', label: 'Inversiones', icon: '💡' },
                { id: 'pom-avanzado', label: 'POM Avanzado', icon: '📈' },
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
        {
            id: 'documentacion', label: 'Documentación', icon: '📂', section: 'Sistema', submenu: [
                { id: 'carga-documentacion', label: 'Carga de Docs', icon: '📝' },
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
                { id: 'informe-planificacion', label: 'Resumen Ppto Aprobado', icon: '📊' },
            ]
        },
        {
            id: 'sistemas-pom', label: 'Sistemas', icon: '⚙️', section: 'Sistema', submenu: [
                { id: 'pom-avanzado', label: 'POM Avanzado', icon: '📈' }
            ]
        },
        {
            id: 'documentacion', label: 'Documentación', icon: '📂', section: 'Sistema', submenu: [
                { id: 'carga-documentacion', label: 'Carga de Docs', icon: '📝' },
            ]
        },
    ],
    'Carga': [
        {
            id: 'operativa', label: 'Operativa', icon: '🚜', section: 'Principal', submenu: [
                { id: 'admin-carga-trabajo', label: 'Carga de Trabajo', icon: '📝' },
                { id: 'admin-bodegas-movimientos', label: 'Movimientos Stock', icon: '📦' }
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
                { id: 'informe-planificacion', label: 'Ppto Aprobado', icon: '📅' },
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

    showLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('active');
    }

    hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.remove('active');
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
            this.loadLogin(); // Redirigir directamente al login para comenzar a operar
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
        // Try to auto-load budget CSV if it exists in Fuentes (non-blocking)
        this.autoLoadJornalesBudget();

        // Defer static Sofia CSV files to background (don't block dashboard load)
        // They will be loaded when the aplicaciones section is actually opened
        this._sofiaDataLoaded = false;

        // Default section
        if (!section) {
            section = 'home'; // All roles now start at home for consistent experience
        }
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

                    await new Promise(r => setTimeout(r, 2000));
                    throw new Error("El Servidor de Sofia está caído o no resuelve.");
                }

                const currentCycle = SofiaApiModel.getCurrentCycle();

                if (progressMessage) progressMessage.textContent = `Sincronizando ciclo actual (${currentCycle})...`;
                if (progressBar) progressBar.style.width = `50%`;

                // -- NEW: Sync Business Data from MySQL with timeout --
                if (progressDetails) progressDetails.textContent = 'Sincronizando datos de negocio...';
                
                // Helper for timeout
                const withTimeout = (promise, ms) => {
                    let timeout = new Promise((_, reject) => {
                        let id = setTimeout(() => {
                            clearTimeout(id);
                            reject(new Error(`Timeout de ${ms}ms`))
                        }, ms)
                    });
                    return Promise.race([promise, timeout]);
                };

                try {
                    await withTimeout(Promise.all([
                        UserModel.sync(),
                        FincaModel.sync(),
                        PredioModel.sync(),
                        VariedadModel.sync(),
                        EmpleadoModel.sync(),
                        LaborModel.sync(),
                        PresupuestoModel.sync(),
                        AplicacionModel.sync()
                    ]), 5000); // 5 second timeout for sync
                } catch (syncError) {
                    console.warn("Sync failed or timed out, using local cache:", syncError);
                    if (progressDetails) progressDetails.textContent = 'Usando datos locales (asíncrono)...';
                }

                // No artificial delay — proceed immediately after sync
                if (progressBar) progressBar.style.width = `80%`;
                if (progressDetails) progressDetails.textContent = `Optimizando base de datos`;

                // Solo detenemos la UI para cargar el ciclo actual
                await SofiaApiModel.fetchCycleData(currentCycle);

                // Iniciamos la descarga/carga de la BD local del resto de los ciclos en segundo plano
                SofiaApiModel.syncBackgroundCyclesAsync(currentCycle);

                // Complete
                if (progressBar) progressBar.style.width = '100%';
                if (progressMessage) progressMessage.textContent = 'Procesando datos...';
                // Removed artificial delay for faster load

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
        this.showLoader();
        const content = document.getElementById('page-content');
        const title = document.getElementById('page-title');

        // Dynamic Header Update for "Carga" user (Mobile/Field Interface)
        if (user.role === 'Carga' || user.rol === 'Carga') {
            const headerContainer = document.querySelector('header > div:first-child');
            if (headerContainer) {
                if (section !== 'home') {
                    // Show Back Button, Hide Logo if needed
                    headerContainer.innerHTML = `
                        <button id="btn-carga-back" class="btn btn-ghost" style="padding: 0.4rem 0.8rem; font-size: 0.9rem; color: var(--color-primary-400); border: 1px solid rgba(16, 185, 129, 0.3);">⬅️ Volver</button>
                        <span style="font-weight:600; color:white; font-size: 0.95rem;">${user.name}</span>
                    `;
                    // Re-bind just the back button
                    document.getElementById('btn-carga-back')?.addEventListener('click', () => this.loadSection('home', user));
                } else {
                    // Show Logo, Hide Back Button
                    headerContainer.innerHTML = `
                        <img src="https://www.naturalfoodargentina.com/wp-content/themes/naturalfoodargentina/img/favicon.png" alt="Logo" style="width:28px;">
                        <span style="font-weight:600; color:white; font-size: 0.95rem;">${user.name}</span>
                    `;
                }
            }
        }
        
        this.currentSection = section; // Update before loading

        // Destroy existing charts
        Object.values(this.charts).forEach(c => { try { c.destroy(); } catch (e) { } });
        this.charts = {};

        try {
            switch (section) {
            case 'home':
                if (title) title.textContent = 'Bienvenido';
                content.innerHTML = user.role === 'Carga' ? renderCargaHome() : renderDashboardHome();
                break;
            case 'jornales':
                if (title) title.textContent = 'Informe de Jornales';
                await this.renderJornalesSection(content);
                break;
            case 'cosecha':
                if (title) title.textContent = 'Informe de Cosecha';
                await this.renderCosechaSection(content);
                break;
            case 'fincas':
                if (title) title.textContent = 'Informe de Fincas';
                await this.renderJornalesSection(content); // Fallback if no specific fincas section
                break;
            case 'aplicaciones-sofia':
                if (title) title.textContent = 'Informe de Aplicaciones';
                if (!this._sofiaDataLoaded) {
                    await this.loadStaticSofiaData();
                    this._sofiaDataLoaded = true;
                }
                this.renderAplicacionesSofiaModule(content);
                break;
            case 'informe-gastos':
                if (title) title.textContent = 'Informe de Gastos';
                content.innerHTML = renderGastosView();
                break;
            case 'informe-gastos-historicos':
                if (title) title.textContent = 'Informe de Gastos Históricos';
                content.innerHTML = renderGastosHistoricosView();
                this.renderGastosHistoricosSection();
                break;
            case 'informe-secaderos':
                if (title) title.textContent = 'Informe de Secaderos';
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
                if (title) title.textContent = 'Control de Carga de Labores';
                content.innerHTML = renderControlCargaView();
                this.renderControlCarga(content);
                break;
            case 'presupuesto':
                if (title) title.textContent = 'Presupuesto — Proyección de Ciclo';
                content.innerHTML = renderPresupuestoProyeccionView();
                this.initPresupuestoSection();
                break;
            case 'informe-planificacion':
                if (title) title.textContent = 'Presupuesto Aprobado — Resumen Ejecutivo';
                await this.renderInformePlanificacionSection(content);
                break;
            case 'carga-documentacion':
                if (title) title.textContent = 'Carga de Documentación Administrativa';
                content.innerHTML = renderCargaDocumentacionView();
                this.initCargaDocumentacionSection();
                break;
            case 'pom-avanzado':
                if (title) title.textContent = 'POM Avanzado — Proyección de Jornal Específico';
                content.innerHTML = renderProyeccionJornalView();
                this.initPomAvanzadoSection();
                break;
            case 'usuarios':
                if (title) title.textContent = 'Gestión de Usuarios';
                content.innerHTML = ''; // Clear previous content to avoid collisions
                await this.renderUsuariosSection(content);
                break;
            case 'admin-carga-trabajo':
                if (title) title.textContent = 'Carga de Trabajo de Campo';
                this.renderCargaTrabajoSection(content);
                break;
            case 'admin-bodegas-movimientos':
                if (title) title.textContent = 'Movimientos Stock';
                this.renderInventarioSection(content);
                break;
            default:
                // Handle all admin-* sections dynamically
                if (section && section.startsWith('admin-') && ADMIN_TABLE_CONFIG[section]) {
                    const cfg = ADMIN_TABLE_CONFIG[section];
                    if (title) title.textContent = cfg.title;
                    this.renderAdminCrudSection(content, section);
                }
                break;
            }
        } catch (error) {
            console.error('Error loading section:', error);
            content.innerHTML = `<div class="error-msg" style="padding:2rem; color:var(--color-error);">Error al cargar secciÃ³n: ${error.message}</div>`;
        } finally {
            setTimeout(() => this.hideLoader(), 50);
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

    /**
     * ── Sección: Planificación Presupuestaria ──
     * Resumen en tablas y gráficos del presupuesto proyectado.
     */
    async renderInformePlanificacionSection(container) {
        container.innerHTML = `
            <div style="padding: var(--space-20); text-align: center; color: var(--text-tertiary);">
                <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
                <p>Consolidando reporte de planificación...</p>
            </div>
        `;

        try {
            const ciclo = '2026-2027'; 
            const budget = PresupuestoBudgetModel.load(ciclo);
            const prodEstimates = PresupuestoBudgetModel.loadProductionEstimates(ciclo);
            
            // Ciclo base para obtener las faenas/labores de referencia
            const mixed = await PresupuestoBudgetModel.buildMixedBudget('2025-2026');

            // Si hay borrador/snapshot guardado, usamos esos valores
            const projectedJornales = budget?.jornales || {};

            // Consolidamos datos para la vista
            const planData = {
                ciclo: ciclo,
                totals: {
                    jornales: Object.values(projectedJornales).reduce((s, v) => s + v, 0) || mixed.totals.jornales,
                    costoMo: (Object.values(projectedJornales).reduce((s, v) => s + v, 0) || mixed.totals.jornales) * 15000,
                    usdGral: mixed.totals.usdGral,
                    pasaPlan: prodEstimates.reduce((s, p) => s + (p.kgPasaEstimado || 0), 0)
                },
                jornales: mixed.jornales.map(l => ({
                    labor: l.labor,
                    jornales: projectedJornales[l.labor] || l.jornales,
                    costoArs: (projectedJornales[l.labor] || l.jornales) * 15000
                })),
                gastosGral: mixed.gastosGral
            };

            container.innerHTML = renderInformePlanificacion(planData);
            this.initPlanificacionCharts(planData);

        } catch (error) {
            console.error('Error rendering planificacion report:', error);
            container.innerHTML = `
                <div class="alert alert-error" style="margin: var(--space-10); text-align: center;">
                    <h4>⚠️ Error al cargar el reporte</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary btn-sm" onclick="location.reload()" style="margin-top: var(--space-4);">Reintentar</button>
                </div>`;
        }
    }

    // ═══════════════════════════════════════════════════════
    // POM AVANZADO — Proyección de Jornal Específico
    // ═══════════════════════════════════════════════════════
    initPomAvanzadoSection() {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

        // State
        let currentMatrix = [];
        let currentCiclo = '2025-2026';

        // Populate labor filter
        const laborFilter = document.getElementById('pom-labor-filter');
        if (laborFilter) {
            ProyeccionJornalModel.LABOR_CATALOG.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id;
                opt.textContent = l.nombre;
                laborFilter.appendChild(opt);
            });
        }

        // Tab switching
        const tabs = ['detalle', 'resumen', 'calendario'];
        const tabBtns = tabs.map(t => document.getElementById(`pom-tab-${t}`));
        const tabContents = tabs.map(t => document.getElementById(`pom-content-${t}`));

        tabBtns.forEach((btn, i) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => { if (b) b.className = 'btn btn-ghost'; });
                tabContents.forEach(c => { if (c) c.style.display = 'none'; });
                btn.className = 'btn btn-primary';
                if (tabContents[i]) tabContents[i].style.display = '';

                // Render on-demand for resumen and calendario
                if (tabs[i] === 'resumen' && currentMatrix.length > 0) {
                    const resumen = ProyeccionJornalModel.getResumenPorFinca(currentMatrix);
                    tabContents[i].innerHTML = renderPomResumenFinca(resumen);
                }
                if (tabs[i] === 'calendario' && currentMatrix.length > 0) {
                    const calendario = ProyeccionJornalModel.getCalendarioLabores(currentMatrix);
                    tabContents[i].innerHTML = renderPomCalendario(calendario);
                }
            });
        });

        // Load projection
        const btnLoad = document.getElementById('btn-pom-load');
        if (btnLoad) {
            // Check date window (April 1st to April 30th)
            const today = new Date();
            const esAbril = today.getMonth() === 3; // 0-indexed, 3 = Abril
            const wasLoaded = localStorage.getItem('has_loaded_pom') === 'true';

            // Disable button if not in April or already generated once
            if (!esAbril || wasLoaded) {
                btnLoad.disabled = true;
                if (!esAbril && !wasLoaded) {
                    btnLoad.title = "La generación solo está habilitada durante el mes de Abril";
                } else if (wasLoaded) {
                    btnLoad.title = "La proyección ya fue generada. Está visualizando los datos guardados.";
                }
            }

            const generateOloadData = async (isManualGeneration) => {
                const originalText = btnLoad.innerHTML;
                btnLoad.disabled = true;
                btnLoad.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;margin-right:6px;"></span> Cargando...';

                try {
                    currentCiclo = document.getElementById('pom-ciclo')?.value || '2025-2026';
                    const fincaFilter = document.getElementById('pom-finca-filter')?.value || '';
                    const laborFilterVal = document.getElementById('pom-labor-filter')?.value || '';

                    // 1. Build base from Excel "Tabla general" (requested by user)
                    let cuartelBase = await ProyeccionJornalModel.loadBaseFromExcel();

                    // Apply finca filter
                    if (fincaFilter) {
                        cuartelBase = cuartelBase.filter(c => c.finca === fincaFilter);
                    }

                    // 2. Load saved overrides
                    let overrides = ProyeccionJornalModel.loadOverrides(currentCiclo);
                    // Try server too
                    const serverOverrides = await ProyeccionJornalModel.loadFromServer(currentCiclo);
                    if (serverOverrides) {
                        overrides = { ...overrides, ...serverOverrides };
                    }

                    // 3. Build projection matrix
                    let laborsToUse = null;
                    if (laborFilterVal) {
                        laborsToUse = ProyeccionJornalModel.LABOR_CATALOG.filter(l => l.id === laborFilterVal);
                    }

                    currentMatrix = ProyeccionJornalModel.buildProjectionMatrix(cuartelBase, laborsToUse, overrides);

                    // 4. Cross with real Sofia data
                    currentMatrix = await ProyeccionJornalModel.crossWithRealData(currentMatrix, currentCiclo);

                    // 5. AUTO-SAVE CSV to server (Requirement: Save in a CSV every time generated)
                    await ProyeccionJornalModel.saveCSVToServer(currentMatrix, currentCiclo);

                    // 6. Render detail table
                    const detalleContainer = document.getElementById('pom-content-detalle');
                    if (detalleContainer) {
                        detalleContainer.innerHTML = renderPomDetalleTable(currentMatrix);
                        this.bindPomEditableInputs(currentCiclo, currentMatrix);
                    }

                    // 7. Update summary cards
                    this.updatePomSummaryCards(currentMatrix);

                    // 8. If other tabs are active, also render them
                    const activeResumen = document.getElementById('pom-content-resumen');
                    if (activeResumen && activeResumen.style.display !== 'none') {
                        const resumen = ProyeccionJornalModel.getResumenPorFinca(currentMatrix);
                        activeResumen.innerHTML = renderPomResumenFinca(resumen);
                    }

                    // Save to server only if it is a fresh generation
                    if (isManualGeneration) {
                        await ProyeccionJornalModel.saveCSVToServer(currentMatrix, currentCiclo);
                        localStorage.setItem('has_loaded_pom', 'true');
                        this.showToast('Proyección generada y guardada en servidor', 'success');
                    }

                } catch (error) {
                    console.error('[POM] Error load/generating projection:', error);
                    this.showToast('Error al procesar la proyección: ' + error.message, 'error');
                } finally {
                    btnLoad.innerHTML = originalText;
                    if (!esAbril || localStorage.getItem('has_loaded_pom') === 'true') {
                        btnLoad.disabled = true;
                    } else {
                        btnLoad.disabled = false;
                    }
                }
            };

            btnLoad.addEventListener('click', () => generateOloadData(true));
        }

        // Export CSV
        document.getElementById('btn-pom-export')?.addEventListener('click', () => {
            if (currentMatrix.length === 0) {
                this.showToast('Genere una proyección primero', 'warning');
                return;
            }
            ProyeccionJornalModel.exportToCSV(currentMatrix, currentCiclo);
            this.showToast('CSV exportado correctamente', 'success');
        });

        // Save to server
        document.getElementById('btn-pom-save')?.addEventListener('click', async () => {
            if (currentMatrix.length === 0) {
                this.showToast('Genere una proyección primero', 'warning');
                return;
            }
            const overrides = ProyeccionJornalModel.loadOverrides(currentCiclo);
            const saved = await ProyeccionJornalModel.saveToServer(currentCiclo, overrides);
            
            // Also save the CSV report to the server reflecting the current edits
            await ProyeccionJornalModel.saveCSVToServer(currentMatrix, currentCiclo);
            
            this.showToast(saved ? 'Proyección y reportes guardados en el servidor' : 'Guardado local finalizado', saved ? 'success' : 'success');
        });

        // --- AUTO-LOAD PERSISTENCE ---
        const checkAutoLoad = async () => {
            const hasOverrides = Object.keys(ProyeccionJornalModel.loadOverrides(currentCiclo)).length > 0;
            const wasLoaded = localStorage.getItem('has_loaded_pom') === 'true';
            
            // Try to see if server has it if not manually saved locally
            let serverHasIt = false;
            if (!wasLoaded) {
                 const serverOverrides = await ProyeccionJornalModel.loadFromServer(currentCiclo);
                 if (serverOverrides) {
                     serverHasIt = true;
                     localStorage.setItem('has_loaded_pom', 'true');
                 }
            }

            if ((hasOverrides || wasLoaded || serverHasIt) && btnLoad) {
                console.log('[POM] Auto-loading previous state from file...');
                // We call our internal function, bypassing manual generation flag
                const esAbril = new Date().getMonth() === 3;
                btnLoad.disabled = true;
                if (!esAbril) {
                     btnLoad.title = "Generación deshabilitada fuera de abril";
                } else {
                     btnLoad.title = "La proyección ya fue generada. Ajuste y guarde.";
                }
                
                // We invoke the fetch directly, avoiding manual generation flag
                generateOloadData(false);
            }
        };
        setTimeout(checkAutoLoad, 500); 
    }

    bindPomEditableInputs(ciclo, matrix) {
        const inputs = document.querySelectorAll('.pom-editable-input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                const field = e.target.dataset.field;
                const value = parseFloat(e.target.value) || 0;

                // Save override
                ProyeccionJornalModel.applyOverride(ciclo, key, field, value);

                // Update the record in current matrix
                const record = matrix.find(p => p.key === key);
                if (record) {
                    record.fuente = 'manual';
                    record.editado = true;

                    if (field === 'rendimiento') {
                        record.rendimientoProyectado = value;
                        // Recalculate jornales
                        const base = record.unidadBase === 'plantas' ? record.plantas : record.hectareas;
                        const newJornales = value > 0 ? Math.ceil(base / value) : 0;
                        record.jornalesProyectados = newJornales;
                        // Update UI
                        const jornalesInput = document.querySelector(`.pom-editable-input[data-key="${key}"][data-field="jornales"]`);
                        if (jornalesInput) jornalesInput.value = newJornales;
                        ProyeccionJornalModel.applyOverride(ciclo, key, 'jornales', newJornales);
                    } else if (field === 'jornales') {
                        record.jornalesProyectados = value;
                        // Recalculate rendimiento
                        const base = record.unidadBase === 'plantas' ? record.plantas : record.hectareas;
                        const newRend = value > 0 ? Math.round((base / value) * 10) / 10 : 0;
                        record.rendimientoProyectado = newRend;
                        // Update UI
                        const rendInput = document.querySelector(`.pom-editable-input[data-key="${key}"][data-field="rendimiento"]`);
                        if (rendInput) rendInput.value = newRend;
                        ProyeccionJornalModel.applyOverride(ciclo, key, 'rendimiento', newRend);
                    }

                    // Recalculate desvios
                    if (record.jornalesReales != null && record.jornalesProyectados > 0) {
                        record.desvioJornales = ((record.jornalesReales - record.jornalesProyectados) / record.jornalesProyectados * 100);
                        // Update UI cell (9th column: Desvío)
                        const desvioCell = e.target.closest('tr').querySelector('td:nth-child(9)');
                        if (desvioCell) {
                            const dValue = record.desvioJornales;
                            desvioCell.textContent = (dValue > 0 ? '+' : '') + dValue.toFixed(1) + '%';
                            desvioCell.style.color = dValue > 10 ? '#ef4444' : dValue < -10 ? '#10b981' : 'var(--text-secondary)';
                        }
                    }

                    // Update summary cards
                    this.updatePomSummaryCards(matrix);
                }

                // Visual feedback
                e.target.style.borderColor = '#a855f7';
                e.target.style.background = 'rgba(168,85,247,0.1)';
                setTimeout(() => {
                    e.target.style.borderColor = 'rgba(16,185,129,0.2)';
                    e.target.style.background = 'rgba(16,185,129,0.06)';
                }, 800);
            });

            // Highlight on focus
            input.addEventListener('focus', (e) => {
                e.target.style.outline = '2px solid rgba(16,185,129,0.4)';
                e.target.style.outlineOffset = '1px';
            });
            input.addEventListener('blur', (e) => {
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
            });
        });
    }

    updatePomSummaryCards(matrix) {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
        const totalProy = matrix.reduce((s, p) => s + (p.jornalesProyectados || 0), 0);
        const totalReal = matrix.reduce((s, p) => s + (p.jornalesReales || 0), 0);
        const totalSug = matrix.reduce((s, p) => s + (p.jornalesSugeridos || p.jornalesProyectados || 0), 0);
        const desvio = totalProy > 0 && totalReal > 0 ? ((totalReal - totalProy) / totalProy * 100) : null;

        const el = (id) => document.getElementById(id);
        if (el('pom-total-proy')) el('pom-total-proy').textContent = fmt(totalProy);
        if (el('pom-total-real')) el('pom-total-real').textContent = totalReal > 0 ? fmt(totalReal) : '—';
        if (el('pom-desvio')) {
            if (desvio != null) {
                el('pom-desvio').textContent = (desvio > 0 ? '+' : '') + desvio.toFixed(1) + '%';
                el('pom-desvio').style.color = desvio > 10 ? '#ef4444' : desvio < -10 ? '#10b981' : '#f59e0b';
            } else {
                el('pom-desvio').textContent = '—';
            }
        }
        if (el('pom-total-sug')) el('pom-total-sug').textContent = totalSug > 0 ? fmt(totalSug) : '—';
    }

    initPlanificacionCharts(data) {
        // Gráfico 1: Jornales por Labor (Agrupado por Top 6)
        const ctxLabor = document.getElementById('chart-plan-jornales-labor');
        if (ctxLabor) {
            const sortedJornales = [...data.jornales].sort((a,b) => b.jornales - a.jornales).slice(0, 8);
            new Chart(ctxLabor, {
                type: 'bar',
                data: {
                    labels: sortedJornales.map(j => j.labor),
                    datasets: [{
                        label: 'Jornales Proyectados',
                        data: sortedJornales.map(j => j.jornales),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { 
                        legend: { display: false },
                        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)' }
                    },
                    scales: { 
                        x: { display: false, grid: { display: false } },
                        y: { 
                            ticks: { color: '#f1f5f9', font: { size: 11 } },
                            grid: { display: false }
                        } 
                    }
                }
            });
        }

        // Gráfico 2: Gastos por Finca (Doughnut)
        const ctxFinca = document.getElementById('chart-plan-gastos-finca');
        if (ctxFinca) {
            const byFinca = {};
            data.gastosGral.forEach(g => { byFinca[g.finca] = (byFinca[g.finca] || 0) + g.usd; });
            const sortedFincas = Object.entries(byFinca).sort((a,b) => b[1] - a[1]);
            
            new Chart(ctxFinca, {
                type: 'doughnut',
                data: {
                    labels: sortedFincas.map(f => f[0]),
                    datasets: [{
                        data: sortedFincas.map(f => f[1]),
                        backgroundColor: ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#6366f1'],
                        borderWidth: 2,
                        borderColor: 'rgba(15, 23, 42, 0.5)',
                        hoverOffset: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { 
                        legend: { 
                            position: 'bottom', 
                            labels: { 
                                color: '#cbd5e1', 
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 11 }
                            } 
                        } 
                    }
                }
            });
        }
    }

    // ── Sección 2: COSECHA ──
    // ── Sección 2: COSECHA ──
    async renderCosechaSection(container) {
        // Unified filters state for the section - Move to the top
        const clFiltersState = { finca: '', ciclo: '2025-2026', predio: '', variedad: '', cuartel: '' };

        container.innerHTML = `
        <div id="cosecha-filters-container"></div>
        <div id="cosecha-dashboard-container">
            <div style="padding: var(--space-20); text-align: center; color: var(--text-tertiary);">
                <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
                <p>Cargando datos de cosecha desde Sofía...</p>
                <small>(Reconstruyendo historial de rendimiento...)</small>
            </div>
        </div>
        `;

        const updateFilterList = (id, key, allData) => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const currentVal = clFiltersState[key];

            let subData = allData;
            
            // Normalize helper for consistency
            const normalizePredio = (v) => {
                if (!v) return 'Otros';
                const s = String(v).toUpperCase();
                if (s.includes('CAMINO TRUNCADO') || s.includes('TRUNCADO')) return 'Camino Truncado';
                if (s.includes('CHIMBERA')) return 'La Chimbera';
                if (s.includes('PUENTE ALTO') || s.includes('P. ALTO') || s.includes('P.ALTO')) return 'Puente Alto';
                if (s.includes('EEIII') || s.includes('ESPEJO 3')) return 'EEIII';
                if (s.includes('EEII') || s.includes('ESPEJO 2')) return 'EEII';
                if (s.includes('EEI') || s.includes('ESPEJO 1')) return 'EEI';
                return v;
            };

            // Apply partial filters for the dropdown context
            if (clFiltersState.finca) {
                subData = subData.filter(r => r.finca === clFiltersState.finca);
            }

            if (key === 'cuartel' && clFiltersState.predio) {
                subData = subData.filter(r => normalizePredio(r.clasifica || r.clasificacion || r.Clasificacion || r.Clasifica) === clFiltersState.predio);
            }

            let uniqueVals = [...new Set(subData.map(r => {
                if (key === 'predio') return normalizePredio(r.clasifica || r.clasificacion || r.Clasificacion || r.Clasifica);
                if (key === 'variedad') return r.variedad || r.variedades || r.Variedad || r.Variedades;
                if (key === 'cuartel') return r.cuartel || r.Cuartel; 
                return r[key] || r[key.charAt(0).toUpperCase() + key.slice(1)];
            }))].filter(v => v !== null && v !== undefined && v !== '').sort((a,b) => {
                if (key === 'cuartel') {
                    const na = parseInt(a);
                    const nb = parseInt(b);
                    if (!isNaN(na) && !isNaN(nb)) return na - nb;
                }
                return String(a).localeCompare(String(b));
            });

            // Specific user request: restrict predios if a finca is selected
            if (key === 'predio' && clFiltersState.finca) {
                if (clFiltersState.finca === 'Fincas Viejas') {
                    const whitelist = ['Camino Truncado', 'Puente Alto', 'La Chimbera'];
                    uniqueVals = uniqueVals.filter(v => whitelist.includes(v));
                } else if (clFiltersState.finca === 'El Espejo') {
                    const whitelist = ['EEI', 'EEII', 'EEIII'];
                    uniqueVals = uniqueVals.filter(v => whitelist.includes(v));
                }
            }

            sel.innerHTML = `<option value="">${['predio', 'variedad', 'cuartel'].includes(key) ? 'Todos' : 'Todas'}</option>` +
                uniqueVals.map(v => `<option value="${v}" ${v === currentVal ? 'selected' : ''}>${v}</option>`).join('');
        };

        const updateCosechaLevantadoWidget = async () => {
            const wrapper = document.getElementById('cosecha-levantado-wrapper');
            if (!wrapper) return;

            const fullCycleData = await SofiaApiModel.fetchCycleData(clFiltersState.ciclo || '2025-2026');
            const fullFiltered = SofiaApiModel.applyFilters(fullCycleData, clFiltersState);
            fullFiltered.fincaFilter = clFiltersState.finca; // Feed the filter for secondary charts
            const clStats = SofiaApiModel.getCosechaLevantadoStats(fullFiltered);
            const pasaEvolStats = SofiaApiModel.getCosechaComparativaPorPredio(fullFiltered);
            const playaStats = SofiaApiModel.getLevantadoPorPlayaStats(fullFiltered);

            const filtersHtml = `
            <div class="sofia-filters animate-fade-in" style="margin-bottom: var(--space-6); background: var(--bg-secondary); padding: var(--space-4); border-radius: 12px; border: 1px solid var(--border-subtle);">
                <div class="filter-group">
                    <label class="form-label">Ciclo Producción</label>
                    <select class="form-select sofia-filter-select" id="filter-cosecha-ciclo">
                        ${['2025-2026','2024-2025','2023-2024','2022-2023','2021-2022','2020-2021','2019-2020','2018-2019','2017-2018','2016-2017','2015-2016','2014-2015','2013-2014','2012-2013'].map(c=>`<option value="${c}" ${c===clFiltersState.ciclo?'selected':''}>${c}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label class="form-label">Finca</label>
                    <select class="form-select sofia-filter-select" id="filter-cosecha-finca">
                        <option value="">Todas</option>
                        <option value="El Espejo" ${clFiltersState.finca==='El Espejo'?'selected':''}>El Espejo</option>
                        <option value="Fincas Viejas" ${clFiltersState.finca==='Fincas Viejas'?'selected':''}>Fincas Viejas</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="form-label">Clasificación</label>
                    <select class="form-select sofia-filter-select" id="filter-cosecha-predio">
                        <option value="">Todos</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="form-label">Cuartel</label>
                    <select class="form-select sofia-filter-select" id="filter-cosecha-cuartel">
                        <option value="">Todos</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="form-label">Variedad</label>
                    <select class="form-select sofia-filter-select" id="filter-cosecha-variedad">
                        <option value="">Todas</option>
                    </select>
                </div>
            </div>`;

            wrapper.innerHTML = filtersHtml + renderCosechaLevantadoTable(clStats, clFiltersState.finca, clFiltersState.ciclo) + renderLevantadoPorPlaya(playaStats);
            
            // Re-render the specific chart
            this.renderCosechaPasaPrediosChart(pasaEvolStats);

            // Update nested filter options based on current available data
            const activeData = SofiaApiModel.applyFilters(fullCycleData, { ciclo: clFiltersState.ciclo, finca: clFiltersState.finca });
            updateFilterList('filter-cosecha-predio', 'predio', activeData);
            updateFilterList('filter-cosecha-variedad', 'variedad', activeData);
            updateFilterList('filter-cosecha-cuartel', 'cuartel', activeData);

            // Re-bind change events
            ['ciclo', 'finca', 'predio', 'variedad', 'cuartel'].forEach(key => {
                const el = document.getElementById(`filter-cosecha-${key}`);
                if (el) {
                    el.addEventListener('change', e => {
                        clFiltersState[key] = e.target.value;
                        if (key === 'finca') { clFiltersState.predio = ''; clFiltersState.cuartel = ''; }
                        if (key === 'predio') { clFiltersState.cuartel = ''; }
                        
                        updateDashboard();
                    });
                }
            });
        };

        const updateDashboard = async () => {
            const dashboard = document.getElementById('cosecha-dashboard-container');
            if (!dashboard) return;

            const data = await SofiaApiModel.fetchCosecha(clFiltersState);
            const filtered = SofiaApiModel.applyFilters(data, clFiltersState);
            const stats = SofiaApiModel.getCosechaDashboardStats(filtered);

            dashboard.innerHTML = renderCosechaDashboard(stats, this.currentUser?.role) + '<div id="cosecha-levantado-wrapper"></div>';
            updateCosechaLevantadoWidget();

            // All global charts re-render is now handled inside or after updateCosechaLevantadoWidget as well
            // but we ensure metrics are current here.

            // Rebind historical chart origin filter
            const originFilter = document.getElementById('filter-cosecha-historico-origen');
            if (originFilter) {
                originFilter.addEventListener('change', async (e) => {
                    const histStats = await SofiaApiModel.getHistoricalCosechaStats({ ...clFiltersState, origen: e.target.value });
                    this.renderCosechaHistoryChart(histStats);
                });
            }

            // Rendimiento charts specific logic
            const rendCycleSel = document.getElementById('filter-cosecha-rendimiento-ciclo');
            if (rendCycleSel) {
                rendCycleSel.value = clFiltersState.ciclo;
                const updateLabel = (v) => {
                   const lbl = document.getElementById('label-rendimiento-ciclo');
                   if (lbl) lbl.textContent = v;
                };
                updateLabel(clFiltersState.ciclo);
                rendCycleSel.addEventListener('change', async (e) => {
                    const val = e.target.value;
                    updateLabel(val);
                    const d = await SofiaApiModel.fetchCycleData(val);
                    const f = SofiaApiModel.applyFilters(d, { ...clFiltersState, ciclo: val });
                    this.renderCosechaRendimientoPredioChart(SofiaApiModel.getRendimientoPredioStats(f));
                });
            }

            // Global Charts re-render
            const fullCycleData = await SofiaApiModel.fetchCycleData(clFiltersState.ciclo);
            const fullFiltered = SofiaApiModel.applyFilters(fullCycleData, clFiltersState);
            this.renderCosechaRendimientoPredioChart(SofiaApiModel.getRendimientoPredioStats(fullFiltered));
            this.renderCosechaEvolucionRendimientoChart(await SofiaApiModel.getHistoricalYieldEvolution(clFiltersState));
            this.renderCosechaHistoryChart(await SofiaApiModel.getHistoricalCosechaStats(clFiltersState));
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
                            formatter: (value) => value > 0 ? value.toLocaleString() : ''
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
                            labels: {
                                value: {
                                    color: '#ffffff',
                                    anchor: 'end',
                                    align: 'top',
                                    offset: 4,
                                    font: { size: 10, weight: 'bold', family: 'Outfit' },
                                    formatter: (value) => value > 0 ? value.toLocaleString() : ''
                                },
                                factor: {
                                    color: (context) => {
                                        const f = parseFloat(stats.factors[context.dataIndex]);
                                        return f > 0 ? (f <= 4.4 ? '#10b981' : '#ef4444') : '#f59e0b';
                                    },
                                    anchor: 'end',
                                    align: 'top',
                                    offset: 50,
                                    font: { size: 32, weight: '900', family: 'Outfit' },
                                    formatter: (value, context) => {
                                        const factor = stats.factors[context.dataIndex];
                                        return factor && factor !== '0' ? `${factor}x` : '';
                                    }
                                }
                            }
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
                        suggestedMax: Math.max(...(stats.fresco.length ? stats.fresco : [1000])) * 1.25
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

                const updatePreview = (imgName) => {
                    const preview = document.getElementById('user-avatar-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="/img/usuarios/${imgName}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    }
                };

                const initialAvatar = editing ? (editing.avatar || 'ingeniero.png') : 'ingeniero.png';
                if (editing) {
                    title.textContent = '✏️ Editar Usuario';
                    document.getElementById('user-edit-id').value = editing.id;
                    document.getElementById('user-name').value = editing.name;
                    document.getElementById('user-email').value = editing.email;
                    document.getElementById('user-password').value = '';
                    document.getElementById('user-password').placeholder = '(dejar vacío para no cambiar)';
                    document.getElementById('user-role').value = editing.role;
                    
                    const avatarInput = document.getElementById('user-avatar');
                    if (avatarInput) avatarInput.value = initialAvatar;
                    updatePreview(initialAvatar);
                } else {
                    title.textContent = '➕ Nuevo Usuario';
                    document.getElementById('user-edit-id').value = '';
                    document.getElementById('form-usuario').reset();
                    document.getElementById('user-password').placeholder = 'Contraseña';
                    
                    const avatarInput = document.getElementById('user-avatar');
                    if (avatarInput) avatarInput.value = 'ingeniero.png';
                    updatePreview('ingeniero.png');
                }

                // Initial highlight
                overlay.querySelectorAll('.avatar-option-admin').forEach(opt => {
                    const selected = opt.dataset.img === (editing ? (editing.avatar || 'ingeniero.png') : 'ingeniero.png');
                    opt.style.borderColor = selected ? 'var(--color-primary-500)' : 'transparent';
                    opt.style.boxShadow = selected ? '0 0 10px var(--color-primary-500)' : 'none';
                });

                // Bind selection click
                overlay.querySelectorAll('.avatar-option-admin').forEach(opt => {
                    opt.onclick = () => {
                        const img = opt.dataset.img;
                        const avatarInput = document.getElementById('user-avatar');
                        if (avatarInput) {
                            avatarInput.value = img;
                            updatePreview(img);
                        }
                        
                        overlay.querySelectorAll('.avatar-option-admin').forEach(o => {
                            o.style.borderColor = 'transparent';
                            o.style.boxShadow = 'none';
                        });
                        opt.style.borderColor = 'var(--color-primary-500)';
                        opt.style.boxShadow = '0 0 10px var(--color-primary-500)';
                    };
                });
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
            const email = document.getElementById('user-email').value.trim();
            const avatar = document.getElementById('user-avatar').value || 'ingeniero.png';

            const userData = {
                name: document.getElementById('user-name').value.trim(),
                email: email,
                role: document.getElementById('user-role').value,
                avatar: avatar,
                active: true // Default to active on edit/create
            };
            const password = document.getElementById('user-password').value.trim();
            if (password) userData.password = password;

            btnSave.disabled = true;
            btnSave.textContent = '...';

            try {
                if (editId) {
                    // If editing, preserve current data and update with new fields
                    const existing = users.find(u => u.id === parseInt(editId));
                    if (existing) {
                        userData.active = existing.active;
                        // If password field is empty, don't send it to preserve current password
                        if (!password) delete userData.password;
                        await UserModel.update(parseInt(editId), userData);
                        this.showToast('Usuario actualizado con éxito', 'success');

                        // Actualizar sesión si es el usuario actual
                        if (this.currentUser && (this.currentUser.id === parseInt(editId) || this.currentUser.email === userData.email)) {
                            const updatedUser = { ...this.currentUser, ...userData };
                            this.currentUser = updatedUser;
                            localStorage.setItem('nf_session', JSON.stringify(updatedUser));
                            this.refreshSidebarProfile(updatedUser);
                        }
                    }
                } else {
                    if (!password) {
                        alert('La contraseña es obligatoria para usuarios nuevos.');
                        btnSave.disabled = false;
                        btnSave.textContent = originalText;
                        return;
                    }
                    await UserModel.add(userData);
                    this.showToast('Usuario creado con éxito', 'success');
                }
                hideModal();
                refreshTable();
            } catch (err) {
                console.error("Error saving user:", err);
                this.showToast('Error al guardar el usuario. Inténtelo de nuevo.', 'error');
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
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

        if (sectionId === 'inversiones-propuestas') {
            container.innerHTML = renderInversionesKanbanView(config, data);
            
            // Re-bind click event for 'New' button to use generic CRUD modal but visually integrated
            setTimeout(() => {
                const btnNew = document.getElementById('btn-inversiones-new');
                if (btnNew) {
                    btnNew.addEventListener('click', () => {
                        // Using the built-in generic modal, but we must make sure events are bound
                        const tableBody = container.querySelector('tbody');
                        // Simulation of add generic row
                        this.openAdminCrudModal(config, null, catalogs);
                    });
                }
                
                // Bind cards click to edit
                const cards = container.querySelectorAll('.inversion-card');
                cards.forEach(card => {
                    card.addEventListener('click', () => {
                        const id = card.getAttribute('data-id');
                        const itemData = data.find(item => item.id == id);
                        if (itemData) this.openAdminCrudModal(config, itemData, catalogs);
                    });
                });
            }, 50);
        } else {
            container.innerHTML = renderAdminCrudView(config, data, catalogs, sectionId);
        }

        // ── Event bindings ──
        const refreshTable = async () => {
            // Re-fetch everything on refresh to ensure catalogs are fresh
            const [freshData] = await Promise.all([
                model.getAll(true),
                ...([...modelsToFetch].map(async mId => {
                    if (ADMIN_MODELS[mId]) catalogs[mId] = await ADMIN_MODELS[mId].getAll(true);
                }))
            ]);
            if (sectionId === 'inversiones-propuestas') {
                container.innerHTML = renderInversionesKanbanView(config, freshData);
                // Re-bind internal kanban events
                setTimeout(() => {
                    const btnNew = container.querySelector('#btn-inversiones-new');
                    if (btnNew) btnNew.addEventListener('click', () => this.openAdminCrudModal(config, null, catalogs));
                    container.querySelectorAll('.inversion-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const itemData = freshData.find(item => item.id == card.getAttribute('data-id'));
                            if (itemData) this.openAdminCrudModal(config, itemData, catalogs);
                        });
                    });
                }, 50);
            } else {
                container.innerHTML = renderAdminCrudView(config, freshData, catalogs, sectionId);
            }
            this.bindAdminCrudEvents(container, config, model, refreshTable, sectionId);
        };

        this.bindAdminCrudEvents(container, config, model, refreshTable, sectionId);
    }

    async renderCargaTrabajoSection(container) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center;">⌛ Cargando sistema de operativa...</div>`;

        try {
            // Import and configure offline model first
            const { OfflineSyncModel } = await import('../models/OfflineSyncModel.js');
            const { renderMobileWorkLogView } = await import('../views/MobileWorkLogView.js');

            const [logs, fincas, predios, cuarteles, faenas, labores, personal, productos] = await Promise.all([
                fetch(`${VITE_API_URL}/trabajo-campo-completo`).then(r => r.json()).catch(e => { console.warn('Offline?', e); return []; }),
                ADMIN_MODELS['admin-fincas'].getAll().catch(e => []),
                ADMIN_MODELS['admin-predios'].getAll().catch(e => []),
                ADMIN_MODELS['admin-cuarteles'].getAll().catch(e => []),
                ADMIN_MODELS['admin-faenas'].getAll().catch(e => []),
                ADMIN_MODELS['admin-labor'].getAll().catch(e => []),
                ADMIN_MODELS['admin-personal'].getAll().catch(e => []), 
                ADMIN_MODELS['admin-productos'].getAll().catch(e => [])
            ]);

            const catalogs = { fincas, predios, cuarteles, faenas, labores, empleados: personal, productos };
            
            // Si estamos online y descargamos los catalogos, los guardamos
            if (fincas.length > 0) {
                OfflineSyncModel.saveCatalogsLocally(catalogs);
            }

            // Detección de celular (Ancho de pantalla)
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                container.innerHTML = renderMobileWorkLogView(catalogs);
                // Bind Mobile Events
                setTimeout(() => {
                    const form = document.getElementById('mobile-worklog-form');
                    const btnSync = document.getElementById('btn-mobile-sync');
                    
                    if (form) form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const logData = {
                            fecha: new Date().toISOString().split('T')[0],
                            hora_inicio: '08:00', hora_fin: '17:00', // Hardcodeds temporales para campo
                            finca_id: document.getElementById('m-finca').value,
                            cuartel_id: document.getElementById('m-cuartel').value || null,
                            empleado_id: document.getElementById('m-empleado').value,
                            labor_id: document.getElementById('m-labor').value,
                            cantidad: parseFloat(document.getElementById('m-cantidad').value),
                            unidad: document.getElementById('m-unidad').value,
                            total_jornadas: document.getElementById('m-unidad').value === 'Jornadas' ? parseFloat(document.getElementById('m-cantidad').value) : 0,
                            usuario_cargo_id: UserModel.getCurrentUser().id
                        };
                        OfflineSyncModel.enqueueWorkLog(logData);
                        document.getElementById('m-save-msg').textContent = '✅ Guardado. Queda en cola.';
                        document.getElementById('m-cantidad').value = '';
                        setTimeout(() => document.getElementById('m-save-msg').textContent='', 2000);
                        
                        // Actualizar UI
                        const queueBadge = document.getElementById('mobile-queue-count');
                        if (queueBadge) queueBadge.textContent = OfflineSyncModel.getSyncQueue().length + ' pendientes';
                    });

                    if (btnSync) btnSync.addEventListener('click', async () => {
                        btnSync.textContent = 'Subiendo...';
                        const queue = OfflineSyncModel.getSyncQueue();
                        let successCount = 0;
                        for (const item of queue) {
                            try {
                                const response = await fetch(`${VITE_API_URL}/trabajo-campo`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ log: item, insumos: [], herramientas: [] })
                                });
                                if (response.ok) {
                                    OfflineSyncModel.dequeueWorkLog(item._offlineId);
                                    successCount++;
                                }
                            } catch (e) {
                                console.error('Error subiendo', item, e);
                            }
                        }
                        alert(`Sincronización finalizada. Éxito: ${successCount}`);
                        this.renderCargaTrabajoSection(container);
                    });

                }, 100);
                return; // FIN MOBILE
            }

            // Desktop View Normal
            const logsArray = Array.isArray(logs) ? logs : [];
            container.innerHTML = renderWorkLogView(logsArray, catalogs);
            this.bindWorkLogEvents(container, logsArray, catalogs);
        } catch (e) {
            console.error('Work section load error:', e);
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

            // Also load dynamic cost/ha data from Sofia for the informes view
            this.loadInformeCostoHa(content);
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
            if (!this._sofiaDataLoaded) {
                await this.loadStaticSofiaData();
                this._sofiaDataLoaded = true;
            }
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

/**
 * Loads and renders cost/ha section in the informes presupuesto tab.
 * Appends content dynamically after the static budget report.
 */
async loadInformeCostoHa(container) {
    const ciclo = SofiaApiModel.getCurrentCycle();

    // Append loading indicator
    const costoSection = document.createElement('div');
    costoSection.id = 'informe-costo-ha-section';
    costoSection.innerHTML = `
        <div class="section-divider" style="margin: var(--space-8) 0; height: 1px; background: var(--border-subtle);"></div>
        <div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
            <div class="spinner" style="margin: 0 auto 1rem;"></div>
            <p>Cargando análisis de Costo/Ha de Mantenimiento...</p>
        </div>
    `;
    container.appendChild(costoSection);

    try {
        // Load data
        const allData = await SofiaApiModel.fetchCycleData(ciclo);
        const fincaSummary = PresupuestoBudgetModel.buildJornalesSummaryByFinca(allData);
        const hectareasData = SofiaApiModel.getHectareasPorPredio(allData);
        const costoHaData = PresupuestoBudgetModel.getCostoMantenimientoHa(fincaSummary, hectareasData);

        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
        const fmtCur = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        const fincaColors = { 'El Espejo': '#3b82f6', 'Fincas Viejas': '#10b981' };

        // Render finca filter + cost/ha section
        let html = `
            <div class="section-divider" style="margin: var(--space-8) 0; height: 1px; background: var(--border-subtle);"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-3);">
                <h3 style="font-family: 'Outfit'; color: var(--text-primary); margin: 0;">
                    🌾 Costo de Mantenimiento por Hectárea — Ciclo ${ciclo}
                </h3>
                <div style="display: flex; gap: var(--space-3); align-items: center;">
                    <label style="font-size: 0.8em; color: var(--text-tertiary);">Filtrar por:</label>
                    <select id="informe-costoha-finca-filter" class="form-select" style="font-size: 0.8rem; padding: 4px 10px; width: 180px; background: var(--bg-tertiary);">
                        <option value="">Todas las Fincas</option>
                        <option value="El Espejo">🏔️ El Espejo</option>
                        <option value="Fincas Viejas">🌿 Fincas Viejas</option>
                    </select>
                    <select id="informe-costoha-predio-filter" class="form-select" style="font-size: 0.8rem; padding: 4px 10px; width: 180px; background: var(--bg-tertiary);">
                        <option value="">Todos los Predios</option>
                        <optgroup label="El Espejo">
                            <option value="El Espejo 1">EEI</option>
                            <option value="El Espejo 2">EEII</option>
                            <option value="El Espejo 3">EEIII</option>
                        </optgroup>
                        <optgroup label="Fincas Viejas">
                            <option value="Camino Truncado">Camino Truncado</option>
                            <option value="La Chimbera">La Chimbera</option>
                            <option value="Puente Alto">Puente Alto</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        `;

        // Finca summary cards
        html += `<div class="dashboard-grid animate-fade-in" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">`;
        costoHaData.byFinca.forEach(f => {
            const color = fincaColors[f.finca] || '#818cf8';
            html += `
                <div class="card informe-costoha-finca-card" data-finca="${f.finca}" style="padding: var(--space-4); border-top: 3px solid ${color};">
                    <h4 style="margin: 0 0 var(--space-3); color: ${color};">${f.finca === 'El Espejo' ? '🏔️' : '🌿'} ${f.finca}</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3);">
                        <div>
                            <div style="font-size: 0.7em; text-transform: uppercase; color: var(--text-tertiary);">Costo/Ha</div>
                            <div style="font-size: 1.4em; font-weight: 700; color: ${color};">${fmtCur(f.costoHa)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.7em; text-transform: uppercase; color: var(--text-tertiary);">Jornales/Ha</div>
                            <div style="font-size: 1.4em; font-weight: 700;">${fmt(f.jornalesHa)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.7em; text-transform: uppercase; color: var(--text-tertiary);">Superficie</div>
                            <div style="font-size: 1.4em; font-weight: 700;">${fmt(f.hectareas)} ha</div>
                        </div>
                    </div>
                </div>`;
        });
        html += `</div>`;

        // Detailed table
        const avgCostoHa = costoHaData.byPredio.length > 0
            ? costoHaData.byPredio.reduce((s, p) => s + p.costoHa, 0) / costoHaData.byPredio.length : 0;

        html += `
            <div class="data-table-container animate-fade-in" style="margin-bottom: var(--space-6);">
                <div class="table-header">
                    <h3>Detalle Costo/Ha por Predio (Clasifica)</h3>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Finca</th>
                            <th>Predio</th>
                            <th style="text-align: right;">Has</th>
                            <th style="text-align: right;">Jornales</th>
                            <th style="text-align: right;">Jornales/Ha</th>
                            <th style="text-align: right;">Costo Total</th>
                            <th style="text-align: right;">Costo/Ha</th>
                            <th style="text-align: center;">Nivel</th>
                        </tr>
                    </thead>
                    <tbody id="informe-costoha-tbody">`;

        costoHaData.byPredio.forEach(p => {
            const color = fincaColors[p.finca] || '#818cf8';
            const ratio = avgCostoHa > 0 ? p.costoHa / avgCostoHa : 1;
            let levelBadge, levelColor;
            if (ratio > 1.2) { levelBadge = '🔴 Alto'; levelColor = '#ef4444'; }
            else if (ratio < 0.8) { levelBadge = '🟢 Bajo'; levelColor = '#10b981'; }
            else { levelBadge = '🟡 Normal'; levelColor = '#f59e0b'; }

            html += `<tr class="informe-costoha-row" data-finca="${p.finca}" data-predio="${p.predio}">
                <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>${p.finca}</td>
                <td style="font-weight:600;">${p.predio}</td>
                <td style="text-align:right;">${fmt(p.hectareas)}</td>
                <td style="text-align:right;">${fmt(p.jornales)}</td>
                <td style="text-align:right;">${fmt(p.jornalesHa)}</td>
                <td style="text-align:right;">${fmtCur(p.costoArs)}</td>
                <td style="text-align:right;font-weight:700;"><span style="background:${levelColor}15;color:${levelColor};padding:3px 10px;border-radius:6px;">${fmtCur(p.costoHa)}</span></td>
                <td style="text-align:center;"><span style="font-size:0.85em;color:${levelColor};">${levelBadge}</span></td>
            </tr>`;
        });

        html += `</tbody></table></div>`;

        costoSection.innerHTML = html;

        // Wire up filters
        const fincaFilter = document.getElementById('informe-costoha-finca-filter');
        const predioFilter = document.getElementById('informe-costoha-predio-filter');

        const applyFilter = () => {
            const fVal = fincaFilter?.value || '';
            const pVal = predioFilter?.value || '';

            document.querySelectorAll('.informe-costoha-row').forEach(row => {
                const rowFinca = row.dataset.finca;
                const rowPredio = row.dataset.predio;
                let show = true;
                if (fVal && rowFinca !== fVal) show = false;
                if (pVal && rowPredio !== pVal) show = false;
                row.style.display = show ? '' : 'none';
            });

            // Show/hide finca cards
            document.querySelectorAll('.informe-costoha-finca-card').forEach(card => {
                if (!fVal || card.dataset.finca === fVal) card.style.display = '';
                else card.style.display = 'none';
            });
        };

        fincaFilter?.addEventListener('change', () => {
            // Sync predio filter optgroups
            predioFilter?.querySelectorAll('optgroup').forEach(og => {
                if (!fincaFilter.value || og.label === fincaFilter.value) {
                    og.style.display = '';
                    og.querySelectorAll('option').forEach(o => o.style.display = '');
                } else {
                    og.style.display = 'none';
                    og.querySelectorAll('option').forEach(o => o.style.display = 'none');
                }
            });
            if (predioFilter) predioFilter.value = '';
            applyFilter();
        });
        predioFilter?.addEventListener('change', applyFilter);

    } catch (err) {
        console.warn('Error loading cost/ha for informes:', err);
        costoSection.innerHTML = `
            <div class="section-divider" style="margin: var(--space-8) 0; height: 1px; background: var(--border-subtle);"></div>
            <div style="padding: 2rem; color: var(--text-tertiary); text-align: center;">
                ⚠️ No se pudo cargar el análisis de costo/ha. ${err.message || ''}
            </div>
        `;
    }
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

        // -- EMERGENCY BYPASS --
        if (email === 'admin@naturalfood.com' && password === 'N4tur4lf00d$') {
            const adminUser = { id: 1, name: 'José Miguel Orb', email: 'admin@naturalfood.com', role: 'Administrador', avatar: 'gerencia.png', active: true };
            localStorage.setItem('nf_session', JSON.stringify(adminUser));
            this.loadDashboard(adminUser);
            return;
        }

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

    // ── Avatar Selector logic in Registration Form ──
    const avatarGrid = document.getElementById('register-avatar-selector');
    const avatarPreviewContainer = document.getElementById('register-avatar-preview-container');
    const avatarPreviewImg = document.querySelector('#register-avatar-preview img');
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const inputAvatar = document.getElementById('register-avatar');

    if (avatarGrid && avatarPreviewContainer && btnChangeAvatar && inputAvatar) {
        // Toggle grid when clicking "Elegir otro diferente"
        btnChangeAvatar.addEventListener('click', (e) => {
            e.preventDefault();
            avatarGrid.style.display = 'grid';
            avatarPreviewContainer.style.display = 'none';
        });

        // Handle selection within grid
        avatarGrid.querySelectorAll('.avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const img = opt.dataset.img;
                inputAvatar.value = img;
                if (avatarPreviewImg) avatarPreviewImg.src = `/img/usuarios/${img}`;
                
                // Show preview and hide selector
                avatarGrid.style.display = 'none';
                avatarPreviewContainer.style.display = 'flex';
                this.showToast('Avatar seleccionado', 'success');
            });
        });
    }


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

        // Get avatar from hidden input
        const avatar = document.getElementById('register-avatar')?.value || 'ingeniero.png';

        const result = await UserModel.register(name, email, password, avatar);

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
        window.location.reload(); 
    });

    // Mobile/Carga Logout
    document.getElementById('btn-mobile-logout')?.addEventListener('click', () => {
        UserModel.logout();
        window.location.reload();
    });

    // Carga "Volver" to Home
    document.getElementById('btn-carga-back')?.addEventListener('click', () => {
        this.loadSection('home', user);
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

    // Click handler for Home Task Cards (Field personnel)
    document.getElementById('page-content')?.addEventListener('click', (e) => {
        const card = e.target.closest('.carga-task-card');
        if (card) {
            const section = card.dataset.section;
            this.loadSection(section, user);
        }
    });
}

    // ── Update UI parts ──
    refreshSidebarProfile(user) {
        const sidebarAvatar = document.querySelector('#sidebar-user-menu img');
        const sidebarName = document.querySelector('.sidebar-user-name');
        const sidebarRole = document.querySelector('.sidebar-user-role');

        if (sidebarAvatar) {
            sidebarAvatar.src = `/img/usuarios/${user.avatar || 'ingeniero.png'}`;
        }
        if (sidebarName) {
            sidebarName.textContent = user.name;
        }
        if (sidebarRole) {
            sidebarRole.textContent = user.role;
        }
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
    // Skip if already loaded this session
    if (this._sofiaDataLoaded && SofiaImportModel.REGISTROS.length > 0) {
        return;
    }

    SofiaImportModel.REGISTROS = [];

    const files = [
        { name: 'EE_aplicaciones.csv', finca: 'El Espejo' },
        { name: 'FV_aplicaciones.csv', finca: 'Fincas Viejas' },
        { name: 'AplicacionDron-EE.csv', finca: 'El Espejo' },
        { name: 'AplicacionDron-FV.csv', finca: 'Fincas Viejas' }
    ];

    // Load both CSVs in PARALLEL instead of sequentially
    const results = await Promise.allSettled(
        files.map(async (file) => {
            try {
                const response = await fetch(`/Fuentes/Aplicaciones/${file.name}`);
                if (!response.ok) {
                    console.error(`[AppController] Error fetching ${file.name}: ${response.status}`);
                    return null;
                }
                const buffer = await response.arrayBuffer();
                const csvText = new TextDecoder('iso-8859-1').decode(buffer);
                const result = SofiaImportModel.parseCSV(csvText, file.finca, file.name);
                if (!result.error) {
                    return { rows: result.rows, file };
                } else {
                    console.warn(`[AppController] Error parsing ${file.name}:`, result.error);
                    return null;
                }
            } catch (error) {
                console.error(`[AppController] Exception loading ${file.name}:`, error);
                return null;
            }
        })
    );

    // Import all results
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            SofiaImportModel.importRows(result.value.rows);
            console.log(`[AppController] Successfully loaded ${result.value.rows.length} rows from ${result.value.file.name}`);
        } else if (result.status === 'rejected') {
            console.error(`[AppController] Failed to load file:`, result.reason);
        } else {
            console.warn(`[AppController] File loading failed or empty:`, result);
        }
    }

    this._sofiaDataLoaded = true;

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
        case 'dron': {
            const dronStats = SofiaImportModel.getDronStats(filters);
            content.innerHTML = renderSofiaDron(dronStats);
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
                        label: 'Comprado (Total)', data: prodData.map(d => d.pre),
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
    ['n-ee', 'p-ee', 'ca-ee', 'n-fv', 'p-fv', 'ca-fv', 'n-ee-pos', 'n-fv-pos'].forEach(id => {
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
        ca: {
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
            // Load from model (Persistence)
            const remitosExt = DocumentacionModel.getRemitosExt();
            const transfers = DocumentacionModel.getTransfers();
            
            // Render the main structure
            container.innerHTML = renderStockMovementView([], { productos: [] }, this.currentUser);
            
            // Populate tables
            this.updateInventarioTables();
            
            // Bind events
            this.bindInventarioEvents(container);
            this.bindDocumentacionEvents(); // Ensure save buttons in modals are bound
        } catch (e) {
            console.error('Inventario load error:', e);
            container.innerHTML = `<div class="alert alert-error">Error al cargar datos de inventario.</div>`;
        }
    }

    updateInventarioTables() {
        const tbodyRemitos = document.getElementById('tbody-op-recepciones');
        const tbodyTransfers = document.getElementById('tbody-op-transferencias');
        
        if (tbodyRemitos) {
            tbodyRemitos.innerHTML = renderRemitoExtRows(DocumentacionModel.getRemitosExt());
        }
        if (tbodyTransfers) {
            tbodyTransfers.innerHTML = renderTransferRows(DocumentacionModel.getTransfers());
        }
    }

    bindInventarioEvents(container) {
        // Tab switching
        const tabRec = document.getElementById('stock-tab-recepciones');
        const tabTrans = document.getElementById('stock-tab-transferencias');
        const viewRec = document.getElementById('stock-view-recepciones');
        const viewTrans = document.getElementById('stock-view-transferencias');

        if (tabRec && tabTrans) {
            tabRec.addEventListener('click', () => {
                tabRec.className = 'btn btn-primary';
                tabTrans.className = 'btn btn-ghost';
                viewRec.style.display = 'block';
                viewTrans.style.display = 'none';
            });
            tabTrans.addEventListener('click', () => {
                tabRec.className = 'btn btn-ghost';
                tabTrans.className = 'btn btn-primary';
                viewRec.style.display = 'none';
                viewTrans.style.display = 'block';
            });
        }

        // New Document Buttons
        document.getElementById('btn-op-nuevo-remito-ext')?.addEventListener('click', () => {
            const modalEl = document.getElementById('modalRemitoExterno');
            if (modalEl) {
                // Populate catalogs in modal
                this.populateCargaDocumentacionCatalogs(); 
                const bsModal = new bootstrap.Modal(modalEl);
                bsModal.show();
            }
        });

        document.getElementById('btn-op-nueva-transferencia')?.addEventListener('click', () => {
            const modalEl = document.getElementById('modalTransferencia');
            if (modalEl) {
                this.populateCargaDocumentacionCatalogs();
                const bsModal = new bootstrap.Modal(modalEl);
                bsModal.show();
            }
        });

        // The save buttons were already bound globally in bindDocumentacionEvents 
        // if they have the same ID. Let me check the IDs in renderStockMovementView.
        // I used 'btn-op-nuevo-remito-ext' and 'btn-op-nueva-transferencia' for OPENING the modals.
        // The modals themselves have 'btn-save-remito-ext' and 'btn-save-transferencia'.
        // Those IDs are already handled in bindDocumentacionEvents.
        // I just need to make sure that when those events fire, they ALSO update THESE tables if we are in this view.
        
        // Wait, bindDocumentacionEvents is only called when loading the 'carga-documentacion' section.
        // I should call it or a subset of it to ensure save buttons work even if we are in 'admin-bodegas-movimientos'.
        
        // I'll add a listener to refresh these tables when a document is saved.
        window.addEventListener('document-saved', () => {
            if (this.currentSection === 'admin-bodegas-movimientos') {
                this.updateInventarioTables();
            }
        });
    }

    // ═══════════════════════════════════════════════════════
    // PRESUPUESTO (BUDGET) MODULE
    // ═══════════════════════════════════════════════════════
    initPresupuestoSection() {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
        const fmtCurrency = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

        // Load most recent draft from server
        const cicloDestinoInit = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
        PresupuestoBudgetModel.loadFromServer(cicloDestinoInit).then(() => {
            console.log('Presupuesto sincronizado con servidor.');
        });

        // Tab switching
        const tabJornalesCant = document.getElementById('ppto-tab-jornales-cant');
        const tabJornalesCosto = document.getElementById('ppto-tab-jornales-costo');
        const tabCostoHa = document.getElementById('ppto-tab-costo-ha');
        const tabGastos = document.getElementById('ppto-tab-gastos');
        const tabProduccion = document.getElementById('ppto-tab-produccion');
        const tabExcel = document.getElementById('ppto-tab-excel');
        const tabEjecucion = document.getElementById('ppto-tab-ejecucion');
        
        const contentJornalesCant = document.getElementById('ppto-content-jornales-cant');
        const contentJornalesCosto = document.getElementById('ppto-content-jornales-costo');
        const contentCostoHa = document.getElementById('ppto-content-costo-ha');
        const contentGastos = document.getElementById('ppto-content-gastos');
        const contentProduccion = document.getElementById('ppto-content-produccion');
        const contentExcel = document.getElementById('ppto-content-excel');
        const contentEjecucion = document.getElementById('ppto-content-ejecucion');

        if (tabJornalesCant && tabJornalesCosto && tabGastos && tabExcel) {
            const tabs = [tabJornalesCant, tabJornalesCosto, tabCostoHa, tabGastos, tabProduccion, tabExcel, tabEjecucion].filter(Boolean);
            const contents = [contentJornalesCant, contentJornalesCosto, contentCostoHa, contentGastos, contentProduccion, contentExcel, contentEjecucion].filter(Boolean);

            const switchTab = (activeTab, activeContent) => {
                tabs.forEach(t => t.className = 'btn btn-ghost');
                contents.forEach(c => c.style.display = 'none');
                activeTab.className = 'btn btn-primary';
                activeContent.style.display = '';
            };

            tabJornalesCant.addEventListener('click', () => switchTab(tabJornalesCant, contentJornalesCant));
            tabJornalesCosto.addEventListener('click', () => switchTab(tabJornalesCosto, contentJornalesCosto));
            if (tabCostoHa) tabCostoHa.addEventListener('click', () => switchTab(tabCostoHa, contentCostoHa));
            tabGastos.addEventListener('click', () => switchTab(tabGastos, contentGastos));
            if (tabProduccion) tabProduccion.addEventListener('click', () => switchTab(tabProduccion, contentProduccion));
            tabExcel.addEventListener('click', () => switchTab(tabExcel, contentExcel));
            if (tabEjecucion) tabEjecucion.addEventListener('click', () => switchTab(tabEjecucion, contentEjecucion));
        }

        // Finca → Predio filter interplay
        const fincaSelect = document.getElementById('ppto-finca');
        const predioSelect = document.getElementById('ppto-predio');
        if (fincaSelect && predioSelect) {
            fincaSelect.addEventListener('change', () => {
                const val = fincaSelect.value;
                const opts = predioSelect.querySelectorAll('option, optgroup');
                // Show/hide optgroups based on finca selection
                predioSelect.querySelectorAll('optgroup').forEach(og => {
                    if (!val || og.label === val) {
                        og.style.display = '';
                        og.querySelectorAll('option').forEach(o => o.style.display = '');
                    } else {
                        og.style.display = 'none';
                        og.querySelectorAll('option').forEach(o => o.style.display = 'none');
                    }
                });
                // Reset predio if it doesn't match the selected finca
                const selectedOption = predioSelect.querySelector(`option[value="${predioSelect.value}"]`);
                if (selectedOption && selectedOption.closest('optgroup')?.style.display === 'none') {
                    predioSelect.value = '';
                }
            });
        }

        // State
        let jornalesData = [];
        let gastosData = { byCategoria: [], byProducto: [], totals: {} };
        let jornalesSummary = { byLabor: [], byPredio: [], totals: {} };
        let fincaSummary = null;
        let costoHaData = null;
        let excelBudgetData = null;
        let hectareasData = null;

        // Load button
        const btnLoad = document.getElementById('btn-ppto-load');
        if (btnLoad) {
            btnLoad.addEventListener('click', async () => {
                btnLoad.disabled = true;
                btnLoad.textContent = '⏳ Cargando...';
                try {
                    await this.loadPresupuestoData();
                } finally {
                    btnLoad.disabled = false;
                    btnLoad.textContent = '📊 Generar Presupuesto';
                }
            });
        }

        this.loadPresupuestoData = async () => {
            const cicloBase = document.getElementById('ppto-ciclo-base')?.value || '2025-2026';
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            const finca = document.getElementById('ppto-finca')?.value || '';
            const predioFilter = document.getElementById('ppto-predio')?.value || '';

            // 1. Load Jornales
            const filters = { ciclo: cicloBase };
            if (finca) filters.finca = finca;
            if (predioFilter) filters.predio = predioFilter;
            const rawJornales = await SofiaApiModel.fetchJornales(filters);
            jornalesSummary = PresupuestoBudgetModel.buildJornalesSummary(rawJornales);

            // 1b. Build finca-grouped summary (always from unfiltered cycle data for full picture)
            const allCycleJornales = await SofiaApiModel.fetchJornales({ ciclo: cicloBase });
            fincaSummary = PresupuestoBudgetModel.buildJornalesSummaryByFinca(allCycleJornales);

            // 2. Load Gastos (from CSV aplicaciones — cached after first load)
            if (!this._sofiaDataLoaded) {
                await this.loadStaticSofiaData();
                this._sofiaDataLoaded = true;
            }
            gastosData = PresupuestoBudgetModel.buildGastosSummary(cicloBase);

            // 3. Load saved projections
            const saved = PresupuestoBudgetModel.load(cicloDestino);

            // 4. Update Summary Cards
            const el = (id) => document.getElementById(id);
            if (el('ppto-total-jornales')) el('ppto-total-jornales').textContent = fmt(jornalesSummary.totals.totalJornales);
            if (el('ppto-total-costo-mo')) el('ppto-total-costo-mo').textContent = fmtCurrency(jornalesSummary.totals.totalCostoArs);
            if (el('ppto-total-insumos')) el('ppto-total-insumos').textContent = fmt(gastosData.totals.totalCantidad);
            if (el('ppto-total-costo-insumos')) el('ppto-total-costo-insumos').textContent = fmtCurrency(gastosData.totals.totalCosto);

            // 4b. Render Finca Sub-Summary Cards
            this.renderFincaSummaryCards(fincaSummary);

            // 5. Render Jornales Table
            this.renderPresupuestoJornalesTable(jornalesSummary, saved, cicloBase);

            // 6. Render Gastos Table
            this.renderPresupuestoGastosTable(gastosData, saved, cicloBase);

            // 7. Render Charts
            this.renderPresupuestoCharts(jornalesSummary, gastosData, saved);

            // 8. Load and Render Excel Budget (Manual/General)
            try {
                const excelContainer = document.getElementById('excel-budget-container');
                if (excelContainer) {
                    excelContainer.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="spinner" style="margin: 0 auto 1rem;"></div><p>Cargando Excel "Prueba de Gral"...</p></div>';
                    excelBudgetData = await PresupuestoBudgetModel.loadExcelBudget();
                    excelContainer.innerHTML = renderExcelBudgetSummary(excelBudgetData);
                }
            } catch (err) {
                console.error("Error loading Excel budget:", err);
                const excelContainer = document.getElementById('excel-budget-container');
                if (excelContainer) excelContainer.innerHTML = `<div class="alert alert-error">Error al cargar Excel: ${err.message}</div>`;
            }

            // 9. Load Production Estimation (Hectáreas per Predio)
            try {
                const allCycleData = await SofiaApiModel.fetchCycleData(cicloBase);
                hectareasData = SofiaApiModel.getHectareasPorPredio(allCycleData);
                this.renderProductionEstimationTable(cicloDestino, hectareasData);

                // 9b. Calculate and render Costo/Ha
                if (fincaSummary && hectareasData) {
                    costoHaData = PresupuestoBudgetModel.getCostoMantenimientoHa(fincaSummary, hectareasData);
                    this.renderCostoHaTable(costoHaData);
                    this.renderCostoHaCharts(costoHaData);

                    // Update global Costo/Ha card
                    const totalCosto = fincaSummary.totals.totalCostoArs;
                    const totalHa = hectareasData.grandTotalHa;
                    const globalCostoHa = totalHa > 0 ? totalCosto / totalHa : 0;
                    if (el('ppto-costo-ha-global')) el('ppto-costo-ha-global').textContent = fmtCurrency(globalCostoHa);
                }
            } catch (err) {
                console.warn('Error loading hectareas data for production', err);
            }

            // 10. Update Status Badge
            this.updatePresupuestoStatus(cicloDestino);

            // 11. Load Execution Comparison if confirmed
            if (PresupuestoBudgetModel.isConfirmed(cicloDestino)) {
                try {
                    const realCycleData = await SofiaApiModel.fetchCycleData(cicloDestino.split('-')[0] + '-' + cicloDestino.split('-')[1]);
                    const realJornales = PresupuestoBudgetModel.buildJornalesSummary(realCycleData);
                    const realGastos = PresupuestoBudgetModel.buildGastosSummary(cicloDestino);
                    const comparison = PresupuestoBudgetModel.getExecutionComparison(cicloDestino, realJornales, realGastos, realCycleData);
                    if (comparison) {
                        const ejecContainer = document.getElementById('ppto-ejecucion-container');
                        if (ejecContainer) {
                            ejecContainer.innerHTML = renderEjecucionPresupuesto(comparison);
                            requestAnimationFrame(() => this.renderEjecucionCharts(comparison));
                        }
                    }
                } catch (err) {
                    console.warn('Error loading execution comparison:', err);
                }
            }
        };

        // Save
        document.getElementById('btn-ppto-save')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            const jornalesProj = {};
            const gastosProj = {};

            document.querySelectorAll('[data-ppto-labor]').forEach(input => {
                jornalesProj[input.dataset.pptoLabor] = parseFloat(input.value) || 0;
            });
            document.querySelectorAll('[data-ppto-producto]').forEach(input => {
                gastosProj[input.dataset.pptoProducto] = parseFloat(input.value) || 0;
            });

            PresupuestoBudgetModel.saveToServer(cicloDestino, { jornales: jornalesProj, gastos: gastosProj }).then(success => {
                const msg = success ? '✅ Presupuesto guardado en servidor' : '⚠️ Guardado solo localmente (Error de servidor)';
                this.showAlert(msg, success ? 'success' : 'warning');
            });
        });

        // Export
        document.getElementById('btn-ppto-export')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            const jRows = jornalesSummary.byLabor.map(r => {
                const input = document.querySelector(`[data-ppto-labor="${r.labor}"]`);
                const projected = input ? parseFloat(input.value) || r.jornales : r.jornales;
                return { labor: r.labor, real: r.jornales, projected, costoArs: r.costoArs };
            });
            const gRows = gastosData.byProducto.map(r => {
                const input = document.querySelector(`[data-ppto-producto="${r.producto}"]`);
                const projectedQty = input ? parseFloat(input.value) || r.cantidad : r.cantidad;
                return { categoria: r.categoria, producto: r.producto, realQty: r.cantidad, projectedQty, realCosto: r.costo };
            });
            PresupuestoBudgetModel.exportCSV(cicloDestino, jRows, gRows);
        });

        // Global adjustment buttons
        document.getElementById('btn-ppto-adjust-jornales-cant')?.addEventListener('click', () => {
            const pct = prompt('Ingrese el porcentaje de ajuste global para jornales (ej: 5 para +5%, -3 para -3%):', '0');
            if (pct === null) return;
            const factor = 1 + (parseFloat(pct) / 100);
            document.querySelectorAll('[data-ppto-labor]').forEach(input => {
                input.value = (parseFloat(input.value) * factor).toFixed(1);
                input.dispatchEvent(new Event('input'));
            });
        });
        document.getElementById('btn-ppto-adjust-gastos')?.addEventListener('click', () => {
            const pct = prompt('Ingrese el porcentaje de ajuste global para consumos (ej: 5 para +5%, -3 para -3%):', '0');
            if (pct === null) return;
            const factor = 1 + (parseFloat(pct) / 100);
            document.querySelectorAll('[data-ppto-producto]').forEach(input => {
                input.value = (parseFloat(input.value) * factor).toFixed(1);
                input.dispatchEvent(new Event('input'));
            });
        });

        // ── Confirm / Unconfirm Budget ──
        document.getElementById('btn-ppto-confirm')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            if (PresupuestoBudgetModel.isConfirmed(cicloDestino)) {
                alert('Este presupuesto ya está confirmado.');
                return;
            }
            if (!confirm(`¿Confirmar el presupuesto para ${cicloDestino}?\n\nUna vez confirmado, se tomará como referencia para el seguimiento de ejecución.\nLos valores actuales quedarán congelados.`)) return;

            // Collect current projections from inputs
            const jornalesSnapshot = {};
            document.querySelectorAll('[data-ppto-labor]').forEach(input => {
                jornalesSnapshot[input.getAttribute('data-ppto-labor')] = parseFloat(input.value) || 0;
            });
            const gastosSnapshot = {};
            document.querySelectorAll('[data-ppto-producto]').forEach(input => {
                gastosSnapshot[input.getAttribute('data-ppto-producto')] = parseFloat(input.value) || 0;
            });

            PresupuestoBudgetModel.confirm(cicloDestino, {
                jornales: jornalesSnapshot,
                gastos: gastosSnapshot
            });

            this.updatePresupuestoStatus(cicloDestino);
            alert(`✅ Presupuesto ${cicloDestino} confirmado exitosamente.\n\nAhora puede ver la ejecución en la pestaña "Ejecución vs Plan".`);
            
            // Reload to refresh execution tab
            document.getElementById('btn-ppto-load')?.click();
        });

        document.getElementById('btn-ppto-unconfirm')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            if (!confirm(`¿Desbloquear el presupuesto ${cicloDestino}?\n\nEsto permitirá volver a editar los valores, pero se perderán los datos de ejecución comparativa.`)) return;
            PresupuestoBudgetModel.unconfirm(cicloDestino);
            this.updatePresupuestoStatus(cicloDestino);
            
            // Clear execution tab
            const ejecContainer = document.getElementById('ppto-ejecucion-container');
            if (ejecContainer) {
                ejecContainer.innerHTML = `<div class="card" style="padding: 3rem; text-align: center; color: var(--text-tertiary); border: 1px dashed var(--color-border);">
                    <div style="font-size: 3em; margin-bottom: var(--space-4);">📋</div>
                    <h3 style="margin: 0 0 var(--space-2); color: var(--text-secondary);">Presupuesto No Confirmado</h3>
                    <p style="margin: 0;">Para ver la ejecución real vs planificada, primero confirme el presupuesto.</p>
                </div>`;
            }
        });

        // ── Save Production Estimates ──
        document.getElementById('btn-ppto-save-produccion')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            const estimates = [];
            document.querySelectorAll('[data-prod-predio]').forEach(input => {
                const predio = input.getAttribute('data-prod-predio');
                const group = input.getAttribute('data-prod-group');
                const ha = parseFloat(input.getAttribute('data-prod-ha')) || 0;
                const kgUvaHa = parseFloat(input.value) || 0;
                estimates.push({ predio, group, hectareas: ha, kgUvaHa });
            });
            const enriched = PresupuestoBudgetModel.saveProductionEstimates(cicloDestino, estimates);
            this.renderProductionChart(enriched);
            alert('💾 Estimaciones de producción guardadas correctamente.');
        });

        // ── Conteo de Racimos (Toggle, Save, Apply) ──
        document.getElementById('btn-toggle-racimos')?.addEventListener('click', (e) => {
            // Don't toggle if clicking on the buttons inside
            if (e.target.closest('button')) return;
            const wrapper = document.getElementById('racimos-content-wrapper');
            const icon = document.getElementById('racimos-toggle-icon');
            if (wrapper) {
                const isHidden = wrapper.style.display === 'none';
                wrapper.style.display = isHidden ? '' : 'none';
                if (icon) icon.textContent = isHidden ? '▲' : '▼';
            }
        });

        document.getElementById('btn-ppto-save-racimos')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            const conteos = this._collectRacimosFromUI();
            const enriched = PresupuestoBudgetModel.saveRacimosCounts(cicloDestino, conteos);
            this._updateRacimosTotals(enriched);
            alert('💾 Conteo de racimos guardado correctamente.');
        });

        document.getElementById('btn-ppto-apply-racimos')?.addEventListener('click', () => {
            const cicloDestino = document.getElementById('ppto-ciclo-destino')?.value || '2026-2027';
            
            // First save current racimos data
            const conteos = this._collectRacimosFromUI();
            const enriched = PresupuestoBudgetModel.saveRacimosCounts(cicloDestino, conteos);
            
            // Get racimos estimates aggregated by predio (only applied ones)
            const applied = enriched.filter(c => c.aplicarEstimacion);
            if (applied.length === 0) {
                alert('⚠️ No hay cuarteles marcados para aplicar.\nMarque la casilla "Aplicar" en los cuarteles deseados.');
                return;
            }

            // Aggregate by predio
            const predioAgg = {};
            applied.forEach(c => {
                if (!predioAgg[c.predio]) predioAgg[c.predio] = { totalUva: 0, totalHa: 0 };
                predioAgg[c.predio].totalUva += c.kgUvaCuartel;
                predioAgg[c.predio].totalHa += c.hectareas;
            });

            // Update the production estimation inputs to use racimos-derived kg/ha
            let updated = 0;
            Object.entries(predioAgg).forEach(([predio, data]) => {
                const kgHa = data.totalHa > 0 ? Math.round(data.totalUva / data.totalHa) : 0;
                const input = document.querySelector(`[data-prod-predio="${predio}"]`);
                if (input) {
                    input.value = kgHa;
                    input.dispatchEvent(new Event('input'));
                    input.style.background = 'rgba(245, 158, 11, 0.15)';
                    input.title = `Ajustado por conteo de racimos: ${kgHa} kg/ha`;
                    updated++;
                }
            });

            if (updated > 0) {
                alert(`✅ Se aplicaron ${updated} estimaciones de racimos al presupuesto.\n\nLos valores de Kg Uva/Ha de ${Object.keys(predioAgg).join(', ')} fueron actualizados según el conteo de racimos.`);
            }
        });

        // ── Default peso per racimo → update all ──
        document.getElementById('racimos-peso-default')?.addEventListener('change', () => {
            const defaultPeso = parseFloat(document.getElementById('racimos-peso-default')?.value) || 0.35;
            document.querySelectorAll('[data-racimo-peso]').forEach(input => {
                input.value = defaultPeso;
                input.dispatchEvent(new Event('input'));
            });
        });

        // ── Mixed Budget Generation & Downloads ──

        const getMixedData = async () => {
            const ciclo = document.getElementById('ppto-ciclo-base')?.value || '2025-2026';
            const finca = document.getElementById('ppto-finca')?.value || '';
            this.showLoader();
            try {
                return await PresupuestoBudgetModel.buildMixedBudget(ciclo, finca);
            } finally {
                this.hideLoader();
            }
        };

        document.getElementById('btn-ppto-mixed-pdf')?.addEventListener('click', async () => {
            const data = await getMixedData();
            // Simple PDF approach: Render to a temporary hidden div and print, or use a new window
            const win = window.open('', '_blank');
            win.document.write(`
                <html><head><title>Presupuesto Mixto ${data.ciclo}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f4f4f4; }
                    h1 { color: #2c3e50; }
                    h2 { border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-top: 40px; }
                </style></head>
                <body>
                    <h1>Presupuesto NaturalFood - Ciclo ${data.ciclo}</h1>
                    <p>Finca: ${data.finca}</p>
                    
                    <h2>1. Labores y Faenas (Reales Sofia)</h2>
                    <table>
                        <thead><tr><th>Labor</th><th>Jornales</th><th>Costo Est. ARS</th></tr></thead>
                        <tbody>${data.jornales.map(l => `<tr><td>${l.labor}</td><td>${l.jornales.toFixed(1)}</td><td>$${l.costoArs.toLocaleString()}</td></tr>`).join('')}</tbody>
                    </table>

                    <h2>2. Gastos Generales (Presupuesto Excel)</h2>
                    <table>
                        <thead><tr><th>Finca</th><th>Gasto</th><th>Mes</th><th>USD</th><th>ARS</th></tr></thead>
                        <tbody>${data.gastosGral.map(g => `<tr><td>${g.finca}</td><td>${g.gasto}</td><td>${g.mes}</td><td>$${g.usd.toFixed(1)}</td><td>$${g.importeArs.toLocaleString()}</td></tr>`).join('')}</tbody>
                    </table>
                </body></html>
            `);
            win.document.close();
            win.print();
        });

        document.getElementById('btn-ppto-mixed-xlsx')?.addEventListener('click', async () => {
            const data = await getMixedData();
            PresupuestoBudgetModel.exportToExcel(data, `Presupuesto_Mixto_${data.ciclo}.xlsx`);
        });

        document.getElementById('btn-ppto-mixed-csv')?.addEventListener('click', async () => {
            const data = await getMixedData();
            PresupuestoBudgetModel.exportToCSV(data);
        });
    }

    /**
     * Updates the status badge and button visibility based on budget confirmation state.
     */
    updatePresupuestoStatus(cicloDestino) {
        const isConfirmed = PresupuestoBudgetModel.isConfirmed(cicloDestino);
        const budget = PresupuestoBudgetModel.load(cicloDestino);
        
        const statusText = document.getElementById('ppto-status-text');
        const confirmedDate = document.getElementById('ppto-confirmed-date');
        const btnConfirm = document.getElementById('btn-ppto-confirm');
        const btnUnconfirm = document.getElementById('btn-ppto-unconfirm');
        const btnSave = document.getElementById('btn-ppto-save');

        if (statusText) {
            if (isConfirmed) {
                statusText.textContent = '✅ Confirmado';
                statusText.style.background = 'rgba(16, 185, 129, 0.15)';
                statusText.style.color = '#10b981';
                statusText.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            } else {
                statusText.textContent = '🔧 En Construcción';
                statusText.style.background = 'rgba(245, 158, 11, 0.15)';
                statusText.style.color = '#f59e0b';
                statusText.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            }
        }
        if (confirmedDate) {
            if (isConfirmed && budget?.confirmedAt) {
                confirmedDate.textContent = `Confirmado: ${new Date(budget.confirmedAt).toLocaleDateString('es-AR')}`;
                confirmedDate.style.display = '';
            } else {
                confirmedDate.style.display = 'none';
            }
        }
        if (btnConfirm) btnConfirm.style.display = isConfirmed ? 'none' : '';
        if (btnUnconfirm) btnUnconfirm.style.display = isConfirmed ? '' : 'none';
        if (btnSave) btnSave.disabled = isConfirmed;

        // Disable/enable projection inputs when confirmed
        document.querySelectorAll('[data-ppto-labor], [data-ppto-producto]').forEach(input => {
            input.disabled = isConfirmed;
            if (isConfirmed) {
                input.style.opacity = '0.6';
                input.style.cursor = 'not-allowed';
            }
        });
    }

    /**
     * Renders the Production Estimation table (Kg Uva/Ha per predio → Kg Pasa ÷4)
     */
    renderProductionEstimationTable(cicloDestino, hectareasData) {
        const tbody = document.getElementById('tbody-ppto-produccion');
        const tfoot = document.getElementById('tfoot-ppto-produccion');
        if (!tbody || !hectareasData) return;

        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        const fmtDec = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

        // Load saved estimates
        const savedEstimates = PresupuestoBudgetModel.loadProductionEstimates(cicloDestino);
        const savedMap = {};
        savedEstimates.forEach(e => { savedMap[e.predio] = e; });
        const isConfirmed = PresupuestoBudgetModel.isConfirmed(cicloDestino);

        let rows = '';
        let totalHa = 0, totalKgUva = 0, totalKgPasa = 0;
        const estimatesForChart = [];

        hectareasData.groups.forEach(group => {
            group.predios.forEach(predio => {
                const saved = savedMap[predio.name];
                const kgUvaHa = saved ? saved.kgUvaHa : 15000; // Default 15,000 kg/ha
                const kgUvaTotal = predio.hectareas * kgUvaHa;
                const kgPasa = kgUvaTotal / PresupuestoBudgetModel.FACTOR_UVA_PASA;

                totalHa += predio.hectareas;
                totalKgUva += kgUvaTotal;
                totalKgPasa += kgPasa;

                estimatesForChart.push({ predio: predio.name, group: group.name, hectareas: predio.hectareas, kgUvaHa, kgUvaTotal, kgPasaEstimado: kgPasa });

                rows += `<tr>
                    <td style="color: var(--text-tertiary); font-size: 0.85em;">${group.name}</td>
                    <td style="font-weight: 600;">${predio.name}</td>
                    <td style="text-align: right;">${fmtDec(predio.hectareas)}</td>
                    <td style="text-align: right;">
                        <input type="number" value="${kgUvaHa}" step="500" min="0" max="50000"
                            data-prod-predio="${predio.name}" data-prod-group="${group.name}" data-prod-ha="${predio.hectareas}"
                            ${isConfirmed ? 'disabled style="opacity: 0.6; cursor: not-allowed; width: 110px; text-align: right; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 8px; color: var(--text-primary);"' : 'style="width: 110px; text-align: right; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 8px; color: var(--text-primary);"'}
                        />
                    </td>
                    <td style="text-align: right; font-weight: 500;" id="prod-uva-${predio.name.replace(/\s/g, '-')}">${fmt(kgUvaTotal)}</td>
                    <td style="text-align: right; font-weight: 600; color: #8b5cf6;" id="prod-pasa-${predio.name.replace(/\s/g, '-')}">${fmt(kgPasa)}</td>
                </tr>`;
            });
        });

        tbody.innerHTML = rows;

        if (tfoot) {
            tfoot.innerHTML = `<tr style="font-weight: 700; border-top: 2px solid var(--color-border);">
                <td colspan="2">TOTALES</td>
                <td style="text-align: right;">${fmtDec(totalHa)}</td>
                <td style="text-align: right;">—</td>
                <td style="text-align: right;" id="prod-total-uva">${fmt(totalKgUva)}</td>
                <td style="text-align: right; color: #8b5cf6;" id="prod-total-pasa">${fmt(totalKgPasa)}</td>
            </tr>`;
        }

        // Auto-recalculate on input change
        tbody.querySelectorAll('input[data-prod-predio]').forEach(input => {
            input.addEventListener('input', () => {
                const predio = input.getAttribute('data-prod-predio');
                const ha = parseFloat(input.getAttribute('data-prod-ha')) || 0;
                const kgHa = parseFloat(input.value) || 0;
                const total = ha * kgHa;
                const pasa = total / PresupuestoBudgetModel.FACTOR_UVA_PASA;
                const safeId = predio.replace(/\s/g, '-');
                const uvaEl = document.getElementById(`prod-uva-${safeId}`);
                const pasaEl = document.getElementById(`prod-pasa-${safeId}`);
                if (uvaEl) uvaEl.textContent = fmt(total);
                if (pasaEl) pasaEl.textContent = fmt(pasa);

                // Recalculate totals
                let tUva = 0, tPasa = 0;
                tbody.querySelectorAll('input[data-prod-predio]').forEach(inp => {
                    const h = parseFloat(inp.getAttribute('data-prod-ha')) || 0;
                    const v = parseFloat(inp.value) || 0;
                    tUva += h * v;
                    tPasa += (h * v) / PresupuestoBudgetModel.FACTOR_UVA_PASA;
                });
                const tUvaEl = document.getElementById('prod-total-uva');
                const tPasaEl = document.getElementById('prod-total-pasa');
                if (tUvaEl) tUvaEl.textContent = fmt(tUva);
                if (tPasaEl) tPasaEl.textContent = fmt(tPasa);
            });
        });

        // Render chart
        this.renderProductionChart(estimatesForChart);

        // Also render racimos table
        this.renderRacimosTable(cicloDestino, hectareasData);
    }

    /**
     * Renders the grape cluster counting table (Conteo de Racimos post-floración)
     * One row per cuartel with editable racimos/planta and peso/racimo fields.
     */
    renderRacimosTable(cicloDestino, hectareasData) {
        const tbody = document.getElementById('tbody-ppto-racimos');
        const tfoot = document.getElementById('tfoot-ppto-racimos');
        if (!tbody || !hectareasData) return;

        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        const fmtDec = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

        // Load saved racimos data
        const savedRacimos = PresupuestoBudgetModel.loadRacimosCounts(cicloDestino);
        const savedMap = {};
        savedRacimos.forEach(c => { savedMap[`${c.predio}|${c.cuartel}`] = c; });
        const isConfirmed = PresupuestoBudgetModel.isConfirmed(cicloDestino);
        const defaultPeso = PresupuestoBudgetModel.DEFAULT_PESO_RACIMO_KG;

        let rows = '';
        let totalCuartelesCount = 0;

        hectareasData.groups.forEach(group => {
            group.predios.forEach(predio => {
                if (!predio.cuartelesList || predio.cuartelesList.length === 0) return;

                predio.cuartelesList.forEach(cuartel => {
                    const key = `${predio.name}|${cuartel.numero}`;
                    const saved = savedMap[key];
                    const racimosPlanta = saved ? saved.racimosPlanta : 0;
                    const pesoRacimo = saved ? saved.pesoRacimoKg : defaultPeso;
                    const plantas = cuartel.pl || 0;
                    const ha = cuartel.ha || 0;
                    const kgUva = racimosPlanta * pesoRacimo * plantas;
                    const kgHa = ha > 0 ? kgUva / ha : 0;
                    const kgPasa = kgUva / PresupuestoBudgetModel.FACTOR_UVA_PASA;
                    const aplicar = saved ? saved.aplicarEstimacion : false;
                    const notas = saved ? saved.notasIngeniero : '';

                    if (racimosPlanta > 0) totalCuartelesCount++;

                    const rowId = `racimo-${predio.name.replace(/\s/g, '-')}-${cuartel.numero.replace(/\s/g, '-')}`;

                    rows += `<tr data-racimo-row="${key}">
                        <td style="color: var(--text-tertiary); font-size: 0.85em;">${group.name}</td>
                        <td style="font-weight: 500;">${predio.name}</td>
                        <td style="font-size: 0.85em;">${cuartel.numero}${cuartel.variedad ? ` <span style="color: var(--text-tertiary);">(${cuartel.variedad})</span>` : ''}</td>
                        <td style="text-align: right; color: var(--text-tertiary);">${fmt(plantas)}</td>
                        <td style="text-align: right; color: var(--text-tertiary);">${fmtDec(ha)}</td>
                        <td style="text-align: right;">
                            <input type="number" value="${racimosPlanta}" step="1" min="0" max="100"
                                data-racimo-predio="${predio.name}" data-racimo-cuartel="${cuartel.numero}"
                                data-racimo-group="${group.name}" data-racimo-plantas="${plantas}" data-racimo-ha="${ha}"
                                ${isConfirmed ? 'disabled style="opacity: 0.6; cursor: not-allowed; width: 80px; text-align: right; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 6px; color: var(--text-primary);"' : 'style="width: 80px; text-align: right; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 6px; color: var(--text-primary);"'}
                            />
                        </td>
                        <td style="text-align: right;">
                            <input type="number" value="${pesoRacimo}" step="0.05" min="0.05" max="2"
                                data-racimo-peso="${key}"
                                ${isConfirmed ? 'disabled style="opacity: 0.6; cursor: not-allowed; width: 70px; text-align: right; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 6px; color: var(--text-primary);"' : 'style="width: 70px; text-align: right; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 6px; color: var(--text-primary);"'}
                            />
                        </td>
                        <td style="text-align: right; font-weight: 500;" id="${rowId}-uva">${fmt(kgUva)}</td>
                        <td style="text-align: right; color: var(--text-tertiary);" id="${rowId}-kgha">${fmt(kgHa)}</td>
                        <td style="text-align: right; font-weight: 600; color: #8b5cf6;" id="${rowId}-pasa">${fmt(kgPasa)}</td>
                        <td style="text-align: center;">
                            <input type="checkbox" data-racimo-apply="${key}" ${aplicar ? 'checked' : ''} ${isConfirmed ? 'disabled' : ''}
                                style="width: 18px; height: 18px; accent-color: #10b981; cursor: ${isConfirmed ? 'not-allowed' : 'pointer'};"
                            />
                        </td>
                        <td>
                            <input type="text" value="${notas}" placeholder="Notas..."
                                data-racimo-notas="${key}"
                                ${isConfirmed ? 'disabled style="opacity: 0.6; cursor: not-allowed; width: 100%; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 6px; color: var(--text-primary); font-size: 0.85em;"' : 'style="width: 100%; background: var(--bg-tertiary); border: 1px solid var(--color-border); border-radius: 6px; padding: 4px 6px; color: var(--text-primary); font-size: 0.85em;"'}
                            />
                        </td>
                    </tr>`;
                });
            });
        });

        tbody.innerHTML = rows;

        // Live recalculation for racimos inputs
        tbody.querySelectorAll('input[data-racimo-predio]').forEach(input => {
            input.addEventListener('input', () => {
                const row = input.closest('tr');
                const predio = input.getAttribute('data-racimo-predio');
                const cuartel = input.getAttribute('data-racimo-cuartel');
                const plantas = parseFloat(input.getAttribute('data-racimo-plantas')) || 0;
                const ha = parseFloat(input.getAttribute('data-racimo-ha')) || 0;
                const racimos = parseFloat(input.value) || 0;
                const pesoInput = row.querySelector('[data-racimo-peso]');
                const peso = parseFloat(pesoInput?.value) || PresupuestoBudgetModel.DEFAULT_PESO_RACIMO_KG;

                const kgUva = racimos * peso * plantas;
                const kgHa = ha > 0 ? kgUva / ha : 0;
                const kgPasa = kgUva / PresupuestoBudgetModel.FACTOR_UVA_PASA;
                const rowId = `racimo-${predio.replace(/\s/g, '-')}-${cuartel.replace(/\s/g, '-')}`;

                const uvaEl = document.getElementById(`${rowId}-uva`);
                const kgHaEl = document.getElementById(`${rowId}-kgha`);
                const pasaEl = document.getElementById(`${rowId}-pasa`);
                if (uvaEl) uvaEl.textContent = fmt(kgUva);
                if (kgHaEl) kgHaEl.textContent = fmt(kgHa);
                if (pasaEl) pasaEl.textContent = fmt(kgPasa);

                // Update totals
                this._updateRacimosTotalsFromDOM();
            });
        });

        // Also bind peso changes
        tbody.querySelectorAll('input[data-racimo-peso]').forEach(input => {
            input.addEventListener('input', () => {
                const row = input.closest('tr');
                const racInput = row.querySelector('[data-racimo-predio]');
                if (racInput) racInput.dispatchEvent(new Event('input'));
            });
        });

        // Set initial totals
        this._updateRacimosTotalsFromDOM();

        // Update peso default in the header
        const pesoDefaultInput = document.getElementById('racimos-peso-default');
        if (pesoDefaultInput && savedRacimos.length > 0) {
            pesoDefaultInput.value = savedRacimos[0].pesoRacimoKg || defaultPeso;
        }
    }

    /**
     * Collect racimos data from all UI inputs
     */
    _collectRacimosFromUI() {
        const conteos = [];
        document.querySelectorAll('input[data-racimo-predio]').forEach(input => {
            const predio = input.getAttribute('data-racimo-predio');
            const cuartel = input.getAttribute('data-racimo-cuartel');
            const group = input.getAttribute('data-racimo-group');
            const plantas = parseFloat(input.getAttribute('data-racimo-plantas')) || 0;
            const ha = parseFloat(input.getAttribute('data-racimo-ha')) || 0;
            const racimosPlanta = parseFloat(input.value) || 0;

            const key = `${predio}|${cuartel}`;
            const pesoInput = document.querySelector(`[data-racimo-peso="${key}"]`);
            const pesoRacimoKg = parseFloat(pesoInput?.value) || PresupuestoBudgetModel.DEFAULT_PESO_RACIMO_KG;
            const applyInput = document.querySelector(`[data-racimo-apply="${key}"]`);
            const aplicar = applyInput?.checked || false;
            const notasInput = document.querySelector(`[data-racimo-notas="${key}"]`);
            const notas = notasInput?.value || '';

            conteos.push({ predio, group, cuartel, racimosPlanta, pesoRacimoKg, plantas, hectareas: ha, aplicarEstimacion: aplicar, notasIngeniero: notas });
        });
        return conteos;
    }

    /**
     * Update racimos summary totals from enriched data
     */
    _updateRacimosTotals(enrichedConteos) {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        const withData = enrichedConteos.filter(c => c.racimosPlanta > 0);
        const totalUva = withData.reduce((s, c) => s + c.kgUvaCuartel, 0);
        const totalPasa = withData.reduce((s, c) => s + c.kgPasaCuartel, 0);

        const countEl = document.getElementById('racimos-cuarteles-count');
        const uvaEl = document.getElementById('racimos-total-uva');
        const pasaEl = document.getElementById('racimos-total-pasa');
        if (countEl) countEl.textContent = withData.length;
        if (uvaEl) uvaEl.textContent = `${fmt(totalUva)} kg`;
        if (pasaEl) pasaEl.textContent = `${fmt(totalPasa)} kg`;
    }

    /**
     * Update racimos totals from current DOM state
     */
    _updateRacimosTotalsFromDOM() {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        let totalUva = 0, totalPasa = 0, count = 0;
        document.querySelectorAll('input[data-racimo-predio]').forEach(input => {
            const racimos = parseFloat(input.value) || 0;
            if (racimos <= 0) return;
            const plantas = parseFloat(input.getAttribute('data-racimo-plantas')) || 0;
            const key = `${input.getAttribute('data-racimo-predio')}|${input.getAttribute('data-racimo-cuartel')}`;
            const pesoInput = document.querySelector(`[data-racimo-peso="${key}"]`);
            const peso = parseFloat(pesoInput?.value) || PresupuestoBudgetModel.DEFAULT_PESO_RACIMO_KG;
            const kgUva = racimos * peso * plantas;
            totalUva += kgUva;
            totalPasa += kgUva / PresupuestoBudgetModel.FACTOR_UVA_PASA;
            count++;
        });
        const countEl = document.getElementById('racimos-cuarteles-count');
        const uvaEl = document.getElementById('racimos-total-uva');
        const pasaEl = document.getElementById('racimos-total-pasa');
        if (countEl) countEl.textContent = count;
        if (uvaEl) uvaEl.textContent = `${fmt(totalUva)} kg`;
        if (pasaEl) pasaEl.textContent = `${fmt(totalPasa)} kg`;
    }

    /**
     * Renders production estimation chart (Uva vs Pasa by Predio)
     */
    renderProductionChart(estimates) {
        const canvas = document.getElementById('chart-ppto-produccion');
        if (!canvas || !estimates || estimates.length === 0) return;

        if (this._chartProdEstimation) this._chartProdEstimation.destroy();

        const labels = estimates.map(e => e.predio);
        const uvaData = estimates.map(e => Math.round(e.kgUvaTotal || (e.hectareas * e.kgUvaHa)));
        const pasaData = estimates.map(e => Math.round(e.kgPasaEstimado || ((e.hectareas * e.kgUvaHa) / PresupuestoBudgetModel.FACTOR_UVA_PASA)));

        this._chartProdEstimation = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Kg Uva Estimado',
                        data: uvaData,
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Kg Pasa Estimado (÷4)',
                        data: pasaData,
                        backgroundColor: 'rgba(139, 92, 246, 0.6)',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#94a3b8' } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-AR')} kg`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8', callback: v => (v / 1000).toFixed(0) + 'k' }
                    },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    /**
     * Renders execution comparison charts for the Ejecución tab
     */
    renderEjecucionCharts(comparison) {
        if (!comparison) return;

        // 1. Jornales chart
        const canvasJ = document.getElementById('chart-ejecucion-jornales');
        if (canvasJ && comparison.jornales.length > 0) {
            if (this._chartEjecJornales) this._chartEjecJornales.destroy();
            const top10 = comparison.jornales.slice(0, 10);
            this._chartEjecJornales = new Chart(canvasJ, {
                type: 'bar',
                data: {
                    labels: top10.map(j => j.labor),
                    datasets: [
                        {
                            label: 'Planificado',
                            data: top10.map(j => j.planificado),
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: 'Consumido',
                            data: top10.map(j => j.consumido),
                            backgroundColor: 'rgba(245, 158, 11, 0.5)',
                            borderColor: 'rgba(245, 158, 11, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
                    scales: {
                        x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                        y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        }

        // 2. Production chart
        const canvasP = document.getElementById('chart-ejecucion-produccion');
        if (canvasP && comparison.produccion.length > 0) {
            if (this._chartEjecProduccion) this._chartEjecProduccion.destroy();
            this._chartEjecProduccion = new Chart(canvasP, {
                type: 'bar',
                data: {
                    labels: comparison.produccion.map(p => p.predio),
                    datasets: [
                        {
                            label: 'Uva Planificada',
                            data: comparison.produccion.map(p => Math.round(p.planificadoUva)),
                            backgroundColor: 'rgba(34, 197, 94, 0.4)',
                            borderColor: 'rgba(34, 197, 94, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: 'Uva Real',
                            data: comparison.produccion.map(p => Math.round(p.realUva)),
                            backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            borderColor: 'rgba(34, 197, 94, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: 'Pasa Planificada',
                            data: comparison.produccion.map(p => Math.round(p.planificadoPasa)),
                            backgroundColor: 'rgba(139, 92, 246, 0.4)',
                            borderColor: 'rgba(139, 92, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        },
                        {
                            label: 'Pasa Real',
                            data: comparison.produccion.map(p => Math.round(p.realPasa)),
                            backgroundColor: 'rgba(139, 92, 246, 0.8)',
                            borderColor: 'rgba(139, 92, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 10 } } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('es-AR')} kg`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            ticks: { color: '#94a3b8', callback: v => (v / 1000).toFixed(0) + 'k' }
                        },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                    }
                }
            });
        }
    }

    /**
     * Renders per-finca summary cards showing jornales, cost, and breakdown.
     */
    renderFincaSummaryCards(fincaSummary) {
        const container = document.getElementById('ppto-finca-summary');
        if (!container || !fincaSummary) return;

        const fmtCur = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

        const fincaOrder = ['El Espejo', 'Fincas Viejas'];
        const fincaColors = { 'El Espejo': '#3b82f6', 'Fincas Viejas': '#10b981' };
        const fincaIcons = { 'El Espejo': '🏔️', 'Fincas Viejas': '🌿' };

        let cardsHtml = '';
        fincaOrder.forEach(fincaName => {
            const data = fincaSummary.byFinca[fincaName];
            if (!data) return;

            const prediosHtml = Object.values(data.byPredio).map(p =>
                `<div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: var(--text-secondary); font-size: 0.85em;">📍 ${p.predio}</span>
                    <span style="font-weight: 600; font-size: 0.85em;">${fmt(p.jornales)} jorn.</span>
                </div>`
            ).join('');

            const color = fincaColors[fincaName] || '#818cf8';
            cardsHtml += `
                <div class="metric-card" style="border-top: 3px solid ${color}; padding: var(--space-4);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3);">
                        <h3 style="margin: 0; color: ${color}; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                            ${fincaIcons[fincaName] || '🏡'} ${fincaName}
                        </h3>
                        <span style="font-size: 0.8em; background: ${color}20; color: ${color}; padding: 2px 10px; border-radius: 12px;">
                            ${Object.keys(data.byPredio).length} predios
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-3);">
                        <div>
                            <div style="font-size: 0.75em; color: var(--text-tertiary); text-transform: uppercase;">Jornales</div>
                            <div style="font-size: 1.3em; font-weight: 700; color: var(--text-primary);">${fmt(data.jornales)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75em; color: var(--text-tertiary); text-transform: uppercase;">Costo M.O.</div>
                            <div style="font-size: 1.3em; font-weight: 700; color: var(--text-primary);">${fmtCur(data.costoArs)}</div>
                        </div>
                    </div>
                    <div style="font-size: 0.75em; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: var(--space-1);">Desglose por predio</div>
                    ${prediosHtml}
                </div>
            `;
        });

        const grid = container.querySelector('.dashboard-grid');
        if (grid) grid.innerHTML = cardsHtml;
        container.style.display = cardsHtml ? '' : 'none';
    }

    /**
     * Renders the Costo/Ha maintenance table in the Costo/Ha tab.
     */
    renderCostoHaTable(costoHaData) {
        const tbody = document.getElementById('tbody-ppto-costo-ha');
        const tfoot = document.getElementById('tfoot-ppto-costo-ha');
        if (!tbody || !costoHaData) return;

        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
        const fmtCur = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

        const fincaColors = { 'El Espejo': '#3b82f6', 'Fincas Viejas': '#10b981' };

        // Determine average for color coding
        const avgCostoHa = costoHaData.byPredio.length > 0
            ? costoHaData.byPredio.reduce((s, p) => s + p.costoHa, 0) / costoHaData.byPredio.length
            : 0;

        let rows = '';
        costoHaData.byPredio.forEach(p => {
            const color = fincaColors[p.finca] || '#818cf8';
            const ratio = avgCostoHa > 0 ? p.costoHa / avgCostoHa : 1;
            let levelBadge, levelColor;
            if (ratio > 1.2) {
                levelBadge = '🔴 Alto';
                levelColor = '#ef4444';
            } else if (ratio < 0.8) {
                levelBadge = '🟢 Bajo';
                levelColor = '#10b981';
            } else {
                levelBadge = '🟡 Normal';
                levelColor = '#f59e0b';
            }

            rows += `<tr>
                <td>
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color}; margin-right: 6px;"></span>
                    ${p.finca}
                </td>
                <td style="font-weight: 600;">${p.predio}</td>
                <td style="text-align: right;">${fmt(p.hectareas)}</td>
                <td style="text-align: right;">${fmt(p.jornales)}</td>
                <td style="text-align: right;">${fmt(p.jornalesHa)}</td>
                <td style="text-align: right;">${fmtCur(p.costoArs)}</td>
                <td style="text-align: right; font-weight: 700; font-size: 1.05em;">
                    <span style="background: ${levelColor}15; color: ${levelColor}; padding: 3px 10px; border-radius: 6px;">
                        ${fmtCur(p.costoHa)}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span style="font-size: 0.85em; color: ${levelColor};">${levelBadge}</span>
                </td>
            </tr>`;
        });

        tbody.innerHTML = rows;

        // Finca subtotals
        let footHtml = '';
        costoHaData.byFinca.forEach(f => {
            const color = fincaColors[f.finca] || '#818cf8';
            footHtml += `<tr style="font-weight: 600; background: ${color}08; border-top: 1px solid var(--color-border);">
                <td style="color: ${color};">${f.finca}</td>
                <td>${f.prediosCount} predios</td>
                <td style="text-align: right;">${fmt(f.hectareas)}</td>
                <td style="text-align: right;">${fmt(f.jornales)}</td>
                <td style="text-align: right;">${fmt(f.jornalesHa)}</td>
                <td style="text-align: right;">${fmtCur(f.costoArs)}</td>
                <td style="text-align: right; font-weight: 700;">${fmtCur(f.costoHa)}</td>
                <td></td>
            </tr>`;
        });

        // Grand total
        const grandHa = costoHaData.byFinca.reduce((s, f) => s + f.hectareas, 0);
        const grandCosto = costoHaData.byFinca.reduce((s, f) => s + f.costoArs, 0);
        const grandJornales = costoHaData.byFinca.reduce((s, f) => s + f.jornales, 0);
        footHtml += `<tr style="font-weight: 700; border-top: 2px solid var(--color-border);">
            <td colspan="2">TOTAL GENERAL</td>
            <td style="text-align: right;">${fmt(grandHa)}</td>
            <td style="text-align: right;">${fmt(grandJornales)}</td>
            <td style="text-align: right;">${grandHa > 0 ? fmt(grandJornales / grandHa) : '—'}</td>
            <td style="text-align: right;">${fmtCur(grandCosto)}</td>
            <td style="text-align: right; font-size: 1.1em;">${grandHa > 0 ? fmtCur(grandCosto / grandHa) : '—'}</td>
            <td></td>
        </tr>`;

        if (tfoot) tfoot.innerHTML = footHtml;

        // Render finca comparison cards
        const fincaCards = document.getElementById('ppto-costo-ha-finca-cards');
        if (fincaCards) {
            const fincaIcons = { 'El Espejo': '🏔️', 'Fincas Viejas': '🌿' };
            fincaCards.innerHTML = costoHaData.byFinca.map(f => {
                const color = fincaColors[f.finca] || '#818cf8';
                return `
                    <div class="card" style="padding: var(--space-4); border-top: 3px solid ${color};">
                        <h4 style="margin: 0 0 var(--space-3); color: ${color}; display: flex; align-items: center; gap: 8px;">
                            ${fincaIcons[f.finca] || '🏡'} ${f.finca}
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3);">
                            <div>
                                <div style="font-size: 0.7em; text-transform: uppercase; color: var(--text-tertiary);">Costo/Ha</div>
                                <div style="font-size: 1.4em; font-weight: 700; color: ${color};">$${(f.costoHa).toLocaleString('es-AR', {maximumFractionDigits: 0})}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.7em; text-transform: uppercase; color: var(--text-tertiary);">Jornales/Ha</div>
                                <div style="font-size: 1.4em; font-weight: 700;">${f.jornalesHa.toFixed(1)}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.7em; text-transform: uppercase; color: var(--text-tertiary);">Superficie</div>
                                <div style="font-size: 1.4em; font-weight: 700;">${f.hectareas.toFixed(1)} ha</div>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }
    }

    /**
     * Renders charts for Costo/Ha view.
     */
    renderCostoHaCharts(costoHaData) {
        if (!costoHaData) return;

        // Destroy previous charts
        ['ppto-costo-ha-chart', 'ppto-jornales-ha-chart'].forEach(k => {
            if (this.charts[k]) { this.charts[k].destroy(); delete this.charts[k]; }
        });

        // 1. Costo/Ha bar chart
        const ctx1 = document.getElementById('chart-ppto-costo-ha');
        if (ctx1) {
            const fincaColors = { 'El Espejo': 'rgba(59, 130, 246, 0.7)', 'Fincas Viejas': 'rgba(16, 185, 129, 0.7)' };
            const borderColors = { 'El Espejo': 'rgba(59, 130, 246, 1)', 'Fincas Viejas': 'rgba(16, 185, 129, 1)' };

            this.charts['ppto-costo-ha-chart'] = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: costoHaData.byPredio.map(p => p.predio),
                    datasets: [{
                        label: 'Costo/Ha (ARS)',
                        data: costoHaData.byPredio.map(p => Math.round(p.costoHa)),
                        backgroundColor: costoHaData.byPredio.map(p => fincaColors[p.finca] || 'rgba(129, 140, 248, 0.7)'),
                        borderColor: costoHaData.byPredio.map(p => borderColors[p.finca] || 'rgba(129, 140, 248, 1)'),
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: {
                    ...this.getChartOptions('Costo/Ha (ARS)'),
                    plugins: {
                        ...this.getChartOptions('Costo/Ha (ARS)').plugins,
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `$${ctx.raw.toLocaleString('es-AR')} / ha`
                            }
                        }
                    }
                }
            });
        }

        // 2. Jornales/Ha bar chart
        const ctx2 = document.getElementById('chart-ppto-jornales-ha');
        if (ctx2) {
            this.charts['ppto-jornales-ha-chart'] = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: costoHaData.byPredio.map(p => p.predio),
                    datasets: [{
                        label: 'Jornales/Ha',
                        data: costoHaData.byPredio.map(p => parseFloat(p.jornalesHa.toFixed(1))),
                        backgroundColor: 'rgba(245, 158, 11, 0.6)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                },
                options: this.getChartOptions('Jornales/Ha')
            });
        }
    }

    renderPresupuestoJornalesTable(summary, saved, cicloBase) {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
        const fmtCur = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        
        const tbodyQty = document.getElementById('tbody-ppto-jornales-qty');
        const tfootQty = document.getElementById('tfoot-ppto-jornales-qty');
        const tbodyCost = document.getElementById('tbody-ppto-jornales-costo');
        const tfootCost = document.getElementById('tfoot-ppto-jornales-costo');
        if (!tbodyQty || !tbodyCost) return;

        let totalReal = 0, totalProy = 0, totalCostoReal = 0, totalCostoProy = 0;
        const rows = summary.byLabor.filter(r => r.jornales > 0);

        tbodyQty.innerHTML = '';
        tbodyCost.innerHTML = '';

        rows.forEach(r => {
            const savedVal = saved?.jornales?.[r.labor];
            const projected = savedVal !== undefined ? savedVal : r.jornales;
            const delta = r.jornales > 0 ? ((projected - r.jornales) / r.jornales * 100) : 0;
            const costoProy = r.jornales > 0 ? (r.costoArs * (projected / r.jornales)) : 0;
            const deltaClass = delta > 0 ? 'color: var(--color-success)' : delta < 0 ? 'color: var(--color-error)' : '';

            totalReal += r.jornales;
            totalProy += projected;
            totalCostoReal += r.costoArs;
            totalCostoProy += costoProy;

            // Qty Table
            tbodyQty.innerHTML += `<tr>
                <td><span style="font-size: 0.7rem; background: var(--bg-secondary); color: var(--text-tertiary); padding: 2px 5px; border-radius: 4px;">${r.categoria}</span></td>
                <td style="font-weight: 500;">${r.labor}</td>
                <td style="text-align: right;">${fmt(r.jornales)}</td>
                <td style="text-align: right;">
                    <input type="number" step="0.1" value="${projected.toFixed(1)}"
                        data-ppto-labor="${r.labor}" data-real="${r.jornales}" data-costo="${r.costoArs}"
                        class="form-input ppto-input" style="width: 100px; text-align: right; background: var(--bg-tertiary); padding: 4px 8px;" />
                </td>
                <td style="text-align: right; ${deltaClass}" class="ppto-delta-cell">${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%</td>
            </tr>`;

            // Cost Table
            tbodyCost.innerHTML += `<tr>
                <td><span style="font-size: 0.7rem; background: #10b98120; color: #10b981; padding: 2px 5px; border-radius: 4px;">${r.categoria}</span></td>
                <td style="font-weight: 500;">${r.labor}</td>
                <td style="text-align: right;">${fmtCur(r.costoArs)}</td>
                <td style="text-align: right;" id="cost-proy-${r.labor.replace(/[\s\/.]+/g,'-')}">${fmtCur(costoProy)}</td>
            </tr>`;
        });

        tfootQty.innerHTML = `<tr style="font-weight: 700; border-top: 2px solid var(--color-border);">
            <td>TOTAL</td>
            <td style="text-align: right;">${fmt(totalReal)}</td>
            <td style="text-align: right;" id="qty-total-proy">${fmt(totalProy)}</td>
            <td style="text-align: right;" id="qty-total-delta">${totalReal > 0 ? ((totalProy - totalReal) / totalReal * 100).toFixed(1) : 0}%</td>
        </tr>`;

        tfootCost.innerHTML = `<tr style="font-weight: 700; border-top: 2px solid var(--color-border);">
            <td>TOTAL</td>
            <td style="text-align: right;">${fmtCur(totalCostoReal)}</td>
            <td style="text-align: right;" id="ppto-total-costo-proy">${fmtCur(totalCostoProy)}</td>
        </tr>`;

        // Live recalculation on input change
        tbodyQty.querySelectorAll('.ppto-input').forEach(input => {
            input.addEventListener('input', () => {
                const real = parseFloat(input.dataset.real) || 0;
                const costo = parseFloat(input.dataset.costo) || 0;
                const proj = parseFloat(input.value) || 0;
                
                const delta = real > 0 ? ((proj - real) / real * 100) : 0;
                const costoProy = real > 0 ? (costo * (proj / real)) : 0;
                
                // Update row delta qty
                const row = input.closest('tr');
                const deltaCell = row.querySelector('.ppto-delta-cell');
                if (deltaCell) {
                    deltaCell.textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
                    deltaCell.style.color = delta > 0 ? 'var(--color-success)' : delta < 0 ? 'var(--color-error)' : '';
                }
                
                // Update cost table cell
                const laborKey = input.dataset.pptoLabor.replace(/[\s\/.]+/g,'-');
                const costCell = document.getElementById('cost-proy-' + laborKey);
                if(costCell) {
                    costCell.textContent = '$' + costoProy.toLocaleString('es-AR', { maximumFractionDigits: 0 });
                }

                // Update totals
                let newTotalProy = 0;
                let newTotalCostoProy = 0;
                tbodyQty.querySelectorAll('.ppto-input').forEach(inp => {
                    const iReal = parseFloat(inp.dataset.real) || 0;
                    const iProj = parseFloat(inp.value) || 0;
                    const iCosto = parseFloat(inp.dataset.costo) || 0;
                    newTotalProy += iProj;
                    if(iReal > 0) newTotalCostoProy += (iCosto * (iProj / iReal));
                });
                
                const qtyTotalSpan = document.getElementById('qty-total-proy');
                if (qtyTotalSpan) qtyTotalSpan.textContent = newTotalProy.toLocaleString('es-AR', { maximumFractionDigits: 1 });
                
                const totalDelta = totalReal > 0 ? ((newTotalProy - totalReal) / totalReal * 100) : 0;
                const qtyDeltaSpan = document.getElementById('qty-total-delta');
                if (qtyDeltaSpan) qtyDeltaSpan.textContent = `${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(1)}%`;
                
                const costTotalSpan = document.getElementById('ppto-total-costo-proy');
                if (costTotalSpan) costTotalSpan.textContent = '$' + newTotalCostoProy.toLocaleString('es-AR', { maximumFractionDigits: 0 });
            });
        });
    }

    renderPresupuestoGastosTable(gastosData, saved, cicloBase) {
        const fmt = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });
        const fmtCur = (n) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
        const tbody = document.getElementById('tbody-ppto-gastos');
        const tfoot = document.getElementById('tfoot-ppto-gastos');
        if (!tbody) return;

        let totalRealQty = 0, totalProjQty = 0, totalRealCosto = 0, totalProjCosto = 0;
        const rows = gastosData.byProducto.filter(r => r.cantidad > 0);

        tbody.innerHTML = rows.map(r => {
            const savedVal = saved?.gastos?.[r.producto];
            const projected = savedVal !== undefined ? savedVal : r.cantidad;
            const delta = r.cantidad > 0 ? ((projected - r.cantidad) / r.cantidad * 100) : 0;
            const costoProy = r.cantidad > 0 ? (r.costo * (projected / r.cantidad)) : 0;
            const deltaClass = delta > 0 ? 'color: var(--color-success)' : delta < 0 ? 'color: var(--color-error)' : '';

            totalRealQty += r.cantidad;
            totalProjQty += projected;
            totalRealCosto += r.costo;
            totalProjCosto += costoProy;

            return `<tr>
                <td><span style="font-size: 0.75rem; color: var(--text-tertiary);">${r.categoria}</span></td>
                <td style="font-weight: 500;">${r.producto}</td>
                <td style="text-align: right;">${fmt(r.cantidad)}</td>
                <td style="text-align: right;">
                    <input type="number" step="0.1" value="${projected.toFixed(1)}"
                        data-ppto-producto="${r.producto}" data-real="${r.cantidad}" data-costo="${r.costo}"
                        class="form-input ppto-input-gastos" style="width: 100px; text-align: right; background: var(--bg-tertiary); padding: 4px 8px;" />
                </td>
                <td style="text-align: right; ${deltaClass}">${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%</td>
                <td style="text-align: right;">${fmtCur(r.costo)}</td>
                <td style="text-align: right;">${fmtCur(costoProy)}</td>
            </tr>`;
        }).join('');

        tfoot.innerHTML = `<tr style="font-weight: 700; border-top: 2px solid var(--color-border);">
            <td colspan="2">TOTAL</td>
            <td style="text-align: right;">${fmt(totalRealQty)}</td>
            <td style="text-align: right;">${fmt(totalProjQty)}</td>
            <td style="text-align: right;">${totalRealQty > 0 ? ((totalProjQty - totalRealQty) / totalRealQty * 100).toFixed(1) : 0}%</td>
            <td style="text-align: right;">${fmtCur(totalRealCosto)}</td>
            <td style="text-align: right;">${fmtCur(totalProjCosto)}</td>
        </tr>`;

        // Live recalculation on input change
        tbody.querySelectorAll('.ppto-input-gastos').forEach(input => {
            input.addEventListener('input', () => {
                const real = parseFloat(input.dataset.real) || 0;
                const costo = parseFloat(input.dataset.costo) || 0;
                const proj = parseFloat(input.value) || 0;
                const row = input.closest('tr');
                const cells = row.querySelectorAll('td');
                const delta = real > 0 ? ((proj - real) / real * 100) : 0;
                const costoProy = real > 0 ? (costo * (proj / real)) : 0;
                cells[4].textContent = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
                cells[4].style.color = delta > 0 ? 'var(--color-success)' : delta < 0 ? 'var(--color-error)' : '';
                cells[6].textContent = '$' + costoProy.toLocaleString('es-AR', { maximumFractionDigits: 0 });
            });
        });
    }

    renderPresupuestoCharts(jornalesSummary, gastosData, saved) {
        // Destroy existing ppto charts
        ['chart-ppto-jornales-labor', 'chart-ppto-jornales-predio', 'chart-ppto-gastos-cat', 'chart-ppto-gastos-prod'].forEach(id => {
            if (this.charts[id]) { try { this.charts[id].destroy(); } catch (e) {} }
        });

        const chartOpts = (horizontal = false) => ({
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: horizontal ? 'y' : 'x',
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
            },
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { size: 11 } } },
                datalabels: { display: false }
            }
        });

        // 1. Jornales por Labor (top 10)
        const topLabors = jornalesSummary.byLabor.slice(0, 10);
        const ctx1 = document.getElementById('chart-ppto-jornales-labor');
        if (ctx1 && topLabors.length > 0) {
            const projValues = topLabors.map(r => {
                const input = document.querySelector(`[data-ppto-labor="${r.labor}"]`);
                return input ? parseFloat(input.value) || r.jornales : r.jornales;
            });
            this.charts['chart-ppto-jornales-labor'] = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: topLabors.map(r => r.labor.length > 18 ? r.labor.substring(0, 18) + '…' : r.labor),
                    datasets: [
                        { label: 'Real (Base)', data: topLabors.map(r => r.jornales), backgroundColor: 'rgba(59,130,246,0.6)', borderColor: 'rgba(59,130,246,1)', borderWidth: 1, borderRadius: 4 },
                        { label: 'Proyectado', data: projValues, backgroundColor: 'rgba(34,197,94,0.6)', borderColor: 'rgba(34,197,94,1)', borderWidth: 1, borderRadius: 4 }
                    ]
                },
                options: chartOpts()
            });
        }

        // 2. Jornales por Predio
        const topPredios = jornalesSummary.byPredio.slice(0, 10);
        const ctx2 = document.getElementById('chart-ppto-jornales-predio');
        if (ctx2 && topPredios.length > 0) {
            this.charts['chart-ppto-jornales-predio'] = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: topPredios.map(r => r.predio),
                    datasets: [
                        { label: 'Real (Base)', data: topPredios.map(r => r.jornales), backgroundColor: 'rgba(168,85,247,0.6)', borderColor: 'rgba(168,85,247,1)', borderWidth: 1, borderRadius: 4 },
                        { label: 'Proyectado', data: topPredios.map(r => r.jornales), backgroundColor: 'rgba(245,158,11,0.6)', borderColor: 'rgba(245,158,11,1)', borderWidth: 1, borderRadius: 4 }
                    ]
                },
                options: chartOpts()
            });
        }

        // 3. Gastos por Categoría
        const cats = gastosData.byCategoria;
        const ctx3 = document.getElementById('chart-ppto-gastos-cat');
        if (ctx3 && cats.length > 0) {
            const catColors = ['rgba(34,197,94,0.6)', 'rgba(59,130,246,0.6)', 'rgba(168,85,247,0.6)', 'rgba(245,158,11,0.6)', 'rgba(239,68,68,0.6)'];
            this.charts['chart-ppto-gastos-cat'] = new Chart(ctx3, {
                type: 'doughnut',
                data: {
                    labels: cats.map(c => c.categoria),
                    datasets: [{
                        data: cats.map(c => c.cantidad),
                        backgroundColor: catColors.slice(0, cats.length),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#e2e8f0', font: { size: 11 } } },
                        datalabels: { display: false }
                    }
                }
            });
        }

        // 4. Top Productos por Cantidad
        const topProds = gastosData.byProducto.slice(0, 10);
        const ctx4 = document.getElementById('chart-ppto-gastos-prod');
        if (ctx4 && topProds.length > 0) {
            const projProds = topProds.map(r => {
                const input = document.querySelector(`[data-ppto-producto="${r.producto}"]`);
                return input ? parseFloat(input.value) || r.cantidad : r.cantidad;
            });
            this.charts['chart-ppto-gastos-prod'] = new Chart(ctx4, {
                type: 'bar',
                data: {
                    labels: topProds.map(r => r.producto.length > 18 ? r.producto.substring(0, 18) + '…' : r.producto),
                    datasets: [
                        { label: 'Real (Base)', data: topProds.map(r => r.cantidad), backgroundColor: 'rgba(59,130,246,0.6)', borderColor: 'rgba(59,130,246,1)', borderWidth: 1, borderRadius: 4 },
                        { label: 'Proyectado', data: projProds, backgroundColor: 'rgba(34,197,94,0.6)', borderColor: 'rgba(34,197,94,1)', borderWidth: 1, borderRadius: 4 }
                    ]
                },
                options: chartOpts(true)
            });
        }
    }

    /** ── DOCUMENTACION SECTION LOGIC ── **/
    initCargaDocumentacionSection() {
        this.renderInvoicesTable();
        this.renderServiciosTable();
        this.renderRemitosExtTable();
        this.renderTransfersTable();
        this.bindDocumentacionEvents();
    }

    renderInvoicesTable() {
        const invoices = DocumentacionModel.getInvoices();
        const tbody = document.getElementById('tbody-documentacion');
        if (!tbody) return;

        tbody.innerHTML = renderDocumentacionRows(invoices);

        // Update Stats (Invoices)
        const total = invoices.length;
        const pending = invoices.filter(v => v.status === 'Pendiente de Entrega').length;
        
        const elTotal = document.getElementById('doc-stat-total');
        const elPending = document.getElementById('doc-stat-pending');
        if (elTotal) elTotal.textContent = total;
        if (elPending) elPending.textContent = pending;
    }

    renderServiciosTable() {
        const servicios = DocumentacionModel.getServicios();
        const tbody = document.getElementById('tbody-servicios');
        if (!tbody) return;
        tbody.innerHTML = renderServicioRows(servicios);
    }

    renderTransfersTable() {
        const transfers = DocumentacionModel.getTransfers();
        const tbody = document.getElementById('tbody-transferencias');
        if (!tbody) return;
        tbody.innerHTML = renderTransferRows(transfers);
    }

    renderRemitosExtTable() {
        const remitos = DocumentacionModel.getRemitosExt();
        const tbody = document.getElementById('tbody-remitos-ext');
        if (!tbody) return;
        tbody.innerHTML = renderRemitoExtRows(remitos);
    }

    async bindDocumentacionEvents() {
        // --- PROVIDERS POPULATION ---
        const populateProveedores = async () => {
            const proveedores = await ADMIN_MODELS['admin-proveedores'].getAll();
            const optionsHtml = '<option value="">Seleccione o escriba nuevo abajo...</option>' + 
                proveedores.map(p => `<option value="${p.id}" data-nombre="${p.nombre}" data-cuit="${p.cuit || ''}">${p.nombre}</option>`).join('');
            
            document.querySelectorAll('.doc-select-proveedor').forEach(sel => sel.innerHTML = optionsHtml);
        };
        populateProveedores();

        const setupProviderSelect = (selectId, nameInputId, cuitInputId) => {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            sel.addEventListener('change', (e) => {
                const option = e.target.selectedOptions[0];
                if (option && option.value) {
                    const nameInput = document.getElementById(nameInputId);
                    const cuitInput = document.getElementById(cuitInputId);
                    if (nameInput) nameInput.value = option.dataset.nombre || '';
                    if (cuitInput) cuitInput.value = option.dataset.cuit || '';
                }
            });
        };

        setupProviderSelect('buscar-prov-factura', 'nombre-prov-factura', 'cuit-prov-factura');
        setupProviderSelect('buscar-prov-servicio', 'nombre-prov-servicio', null);
        setupProviderSelect('buscar-prov-remito-ext', 'nombre-prov-remito-ext', null);
        // --- TAB SWITCHING ---
        const tabFacturas = document.getElementById('doc-tab-facturas');
        const tabServicios = document.getElementById('doc-tab-servicios');
        const tabRemExt = document.getElementById('doc-tab-remitos-ext');
        const tabTransf = document.getElementById('doc-tab-transferencias');
        
        const viewFacturas = document.getElementById('view-facturas');
        const viewServicios = document.getElementById('view-servicios');
        const viewRemExt = document.getElementById('view-remitos-ext');
        const viewTransf = document.getElementById('view-transferencias');

        const tabs = [
            { btn: tabFacturas, view: viewFacturas },
            { btn: tabServicios, view: viewServicios },
            { btn: tabRemExt, view: viewRemExt },
            { btn: tabTransf, view: viewTransf }
        ];

        tabs.forEach(t => {
            if (t.btn) {
                t.btn.onclick = () => {
                    tabs.forEach(x => {
                        if (x.btn) x.btn.classList.replace('btn-primary', 'btn-ghost');
                        if (x.view) x.view.style.display = 'none';
                    });
                    t.btn.classList.replace('btn-ghost', 'btn-primary');
                    t.view.style.display = 'block';
                };
            }
        });

        // --- LOGISTICA TOGGLE ---
        const logisticaSelect = document.getElementById('select-logistica-factura');
        if (logisticaSelect) {
            logisticaSelect.addEventListener('change', (e) => {
                const container = document.getElementById('container-ingreso-stock');
                if (container) {
                    container.style.display = e.target.value === 'con_factura' ? 'grid' : 'none';
                }
            });
        }

        // --- INVOICE EVENTS (Providers) ---
        const btnNueva = document.getElementById('btn-nueva-factura');
        if (btnNueva) {
            btnNueva.onclick = async () => {
                const bodegas = await ADMIN_MODELS['admin-bodegas'].getAll();
                const productos = await ADMIN_MODELS['admin-productos'].getAll();

                document.querySelectorAll('.doc-select-bodega').forEach(sel => {
                    sel.innerHTML = '<option value="">Seleccionar Bodega...</option>' +
                        bodegas.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
                });

                document.querySelectorAll('.doc-select-producto').forEach(sel => {
                    sel.innerHTML = '<option value="">-- Nuevo Producto / No en lista --</option>' +
                        productos.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock || 0})</option>`).join('');
                });

                document.getElementById('form-factura').reset();
                const container = document.getElementById('container-ingreso-stock');
                if (container) container.style.display = 'grid'; // because 'con_factura' is the default
                new bootstrap.Modal(document.getElementById('modalFactura')).show();
            };
        }

        const btnSave = document.getElementById('btn-save-factura');
        if (btnSave) {
            btnSave.onclick = async () => {
                const form = document.getElementById('form-factura');
                const formData = new FormData(form);
                const data = {
                    proveedor: formData.get('proveedor'),
                    cuitProveedor: formData.get('cuitProveedor'),
                    nroFactura: formData.get('nroFactura'),
                    producto: formData.get('producto'),
                    fecha: formData.get('fecha'),
                    precioUnitario: parseFloat(formData.get('precioUnitario')),
                    impuesto: parseFloat(formData.get('impuesto')),
                    monto: parseFloat(formData.get('monto')),
                    entregaEnFactura: formData.get('logistica') === 'con_factura'
                };

                if (!data.proveedor || !data.nroFactura || !data.fecha || isNaN(data.monto) || !data.producto || !data.cuitProveedor) {
                    this.showToast('Por favor complete todos los campos obligatorios.', 'error');
                    return;
                }

                // Auto-create new provider if it does not exist
                const proveedoresObj = await ADMIN_MODELS['admin-proveedores'].getAll();
                const existProv = proveedoresObj.find(p => p.nombre.toLowerCase() === data.proveedor.toLowerCase());
                if (!existProv) {
                    await ADMIN_MODELS['admin-proveedores'].create({
                         nombre: data.proveedor,
                         cuit: data.cuitProveedor || '',
                         tipo: 'Insumos'
                    });
                    populateProveedores();
                }

                DocumentacionModel.saveInvoice(data);
                
                // --- Update physical stock via ADMIN_MODELS ---
                if (data.entregaEnFactura) {
                    const bodegaDestinoId = formData.get('bodegaDestinoId');
                    let productoId = formData.get('productoId');
                    const cantidad = parseFloat(formData.get('cantidadIngresada'));
                    
                    if (!isNaN(cantidad) && bodegaDestinoId) {
                        try {
                            const allProds = await ADMIN_MODELS['admin-productos'].getAll();
                            let targetProd = null;

                            if (productoId) {
                                targetProd = await ADMIN_MODELS['admin-productos'].getById(productoId);
                            } else if (data.producto) {
                                // Search by name in the target bodega
                                targetProd = allProds.find(p => p.nombre.toLowerCase() === data.producto.toLowerCase() && p.bodega_id == bodegaDestinoId);
                                
                                if (!targetProd) {
                                    // Create new product if not found
                                    const newP = await ADMIN_MODELS['admin-productos'].create({
                                        nombre: data.producto,
                                        bodega_id: bodegaDestinoId,
                                        categoria: 'Insumo',
                                        unidad: 'un',
                                        stock: 0
                                    });
                                    targetProd = newP;
                                }
                            }

                            if (targetProd) {
                                const nuevoStock = (Number(targetProd.stock) || 0) + cantidad;
                                await ADMIN_MODELS['admin-productos'].update(targetProd.id, { ...targetProd, stock: nuevoStock });
                            }
                        } catch(e) { console.warn("Could not update/create product stock", e); }
                    }
                }

                this.showToast('Factura de proveedor guardada.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalFactura')).hide();
                this.renderInvoicesTable();
                window.dispatchEvent(new CustomEvent('document-saved'));
            };
        }

        // --- SERVICIOS EVENTS ---
        const btnNuevoServ = document.getElementById('btn-nuevo-servicio');
        if (btnNuevoServ) {
            btnNuevoServ.onclick = () => {
                document.getElementById('form-servicio').reset();
                new bootstrap.Modal(document.getElementById('modalServicio')).show();
            };
        }

        const btnSaveServ = document.getElementById('btn-save-servicio');
        if (btnSaveServ) {
            btnSaveServ.onclick = async () => {
                const form = document.getElementById('form-servicio');
                const formData = new FormData(form);
                const data = {
                    proveedor: formData.get('proveedor'),
                    categoria: formData.get('categoria'),
                    nroFactura: formData.get('nroFactura'),
                    fecha: formData.get('fecha'),
                    fechaVenc: formData.get('fechaVenc'),
                    monto: parseFloat(formData.get('monto')),
                    notas: formData.get('notas')
                };

                if (!data.proveedor || !data.nroFactura || !data.fecha || isNaN(data.monto)) {
                    this.showToast('Complete los campos obligatorios.', 'error');
                    return;
                }

                // Auto-create new provider if it does not exist
                const proveedoresObj = await ADMIN_MODELS['admin-proveedores'].getAll();
                const existProv = proveedoresObj.find(p => p.nombre.toLowerCase() === data.proveedor.toLowerCase());
                if (!existProv) {
                    await ADMIN_MODELS['admin-proveedores'].create({
                         nombre: data.proveedor,
                         tipo: 'Servicios'
                    });
                    populateProveedores();
                }

                DocumentacionModel.saveServicio(data);
                this.showToast('Gasto de servicio registrado.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalServicio')).hide();
                this.renderServiciosTable();
                window.dispatchEvent(new CustomEvent('document-saved'));
            };
        }

        // --- REMITOS EXTERNOS EVENTS ---
        const btnNuevoRemitoExt = document.getElementById('btn-nuevo-remito-ext');
        if (btnNuevoRemitoExt) {
            btnNuevoRemitoExt.onclick = async () => {
                const bodegas = await ADMIN_MODELS['admin-bodegas'].getAll();
                const productos = await ADMIN_MODELS['admin-productos'].getAll();

                document.querySelectorAll('.doc-select-bodega').forEach(sel => {
                    sel.innerHTML = '<option value="">Seleccionar Bodega...</option>' +
                        bodegas.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
                });

                document.querySelectorAll('.doc-select-producto').forEach(sel => {
                    sel.innerHTML = '<option value="">Seleccionar Insumo...</option>' +
                        productos.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock || 0})</option>`).join('');
                });

                document.getElementById('form-remito-ext').reset();
                new bootstrap.Modal(document.getElementById('modalRemitoExterno')).show();
            };
        }

        const btnSaveRemitoExt = document.getElementById('btn-save-remito-ext');
        if (btnSaveRemitoExt) {
            btnSaveRemitoExt.onclick = async () => {
                const form = document.getElementById('form-remito-ext');
                const formData = new FormData(form);
                
                const bodegaDestinoId = formData.get('bodegaDestino');
                const productoId = formData.get('productoId');
                const cantidad = parseFloat(formData.get('cantidad'));
                const proveedor = formData.get('proveedor');
                const nroRemito = formData.get('nroRemito');
                const fecha = formData.get('fecha');

                if (!bodegaDestinoId || !productoId || isNaN(cantidad) || !proveedor || !nroRemito || !fecha) {
                    this.showToast('Complete todos los campos del remito.', 'error');
                    return;
                }

                const bodegas = await ADMIN_MODELS['admin-bodegas'].getAll();
                const productos = await ADMIN_MODELS['admin-productos'].getAll();
                const bDst = bodegas.find(b => b.id == bodegaDestinoId);
                const prod = productos.find(p => p.id == productoId);

                const data = {
                    proveedor,
                    nroRemito,
                    bodegaDestinoId,
                    bodegaNombre: bDst?.nombre || 'Destino',
                    productoId,
                    productoNombre: prod?.nombre || 'Producto',
                    cantidad,
                    fecha,
                    notas: formData.get('notas')
                };

                // Auto-create new provider if it does not exist
                const proveedoresObj = await ADMIN_MODELS['admin-proveedores'].getAll();
                const existProv = proveedoresObj.find(p => p.nombre.toLowerCase() === proveedor.toLowerCase());
                if (!existProv) {
                    await ADMIN_MODELS['admin-proveedores'].create({
                         nombre: proveedor,
                         tipo: 'Otro'
                    });
                    populateProveedores();
                }

                // Save Document
                DocumentacionModel.saveRemitoExt(data);
                
                // --- Update physical stock via ADMIN_MODELS ---
                try {
                    const allProds = await ADMIN_MODELS['admin-productos'].getAll();
                    const prodSourceRef = await ADMIN_MODELS['admin-productos'].getById(productoId);
                    
                    if (prodSourceRef) {
                        // Find matching record in the TARGET bodega
                        let targetRecord = allProds.find(p => p.nombre === prodSourceRef.nombre && p.bodega_id == bodegaDestinoId);
                        
                        if (targetRecord) {
                            const newStock = (parseFloat(targetRecord.stock) || 0) + cantidad;
                            await ADMIN_MODELS['admin-productos'].update(targetRecord.id, { ...targetRecord, stock: newStock });
                        } else {
                            // Create new record for this product in the target bodega
                            await ADMIN_MODELS['admin-productos'].create({
                                nombre: prodSourceRef.nombre,
                                categoria: prodSourceRef.categoria || 'Insumo',
                                bodega_id: bodegaDestinoId,
                                unidad: prodSourceRef.unidad || 'un',
                                stock: cantidad,
                                notas: `Ingreso inicial por remito externo ${nroRemito}`
                            });
                        }
                        this.showToast('Remito registrado e ingreso a stock completado.', 'success');
                    }
                } catch (err) {
                    console.error('Error auto-updating stock for Remito Ext:', err);
                    this.showToast('Documento guardado, pero no se pudo actualizar el stock físico.', 'warning');
                }

                bootstrap.Modal.getInstance(document.getElementById('modalRemitoExterno')).hide();
                this.renderRemitosExtTable();
                window.dispatchEvent(new CustomEvent('document-saved'));
            };
        }

        // --- TRANSFER EVENTS (Internal) ---
        const btnNuevaTransf = document.getElementById('btn-nueva-transferencia');
        if (btnNuevaTransf) {
            btnNuevaTransf.onclick = async () => {
                const bodegas = await ADMIN_MODELS['admin-bodegas'].getAll();
                const productos = await ADMIN_MODELS['admin-productos'].getAll();

                document.querySelectorAll('.doc-select-bodega').forEach(sel => {
                    sel.innerHTML = '<option value="">Seleccionar Bodega...</option>' +
                        bodegas.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
                });

                document.querySelectorAll('.doc-select-producto').forEach(sel => {
                    sel.innerHTML = '<option value="">Seleccionar Insumo...</option>' +
                        productos.map(p => `<option value="${p.id}">${p.nombre} (Stock: ${p.stock || 0})</option>`).join('');
                });

                document.getElementById('form-transferencia').reset();
                new bootstrap.Modal(document.getElementById('modalTransferencia')).show();
            };
        }

        const btnSaveTransf = document.getElementById('btn-save-transferencia');
        if (btnSaveTransf) {
            btnSaveTransf.onclick = async () => {
                const form = document.getElementById('form-transferencia');
                const formData = new FormData(form);
                
                const bodegaOrigenId = formData.get('bodegaOrigen');
                const bodegaDestinoId = formData.get('bodegaDestino');
                const productoId = formData.get('productoId');
                const cantidad = parseFloat(formData.get('cantidad'));

                if (!bodegaOrigenId || !bodegaDestinoId || !productoId || isNaN(cantidad)) {
                    this.showToast('Complete todos los campos de transferencia.', 'error');
                    return;
                }

                if (bodegaOrigenId === bodegaDestinoId) {
                    this.showToast('La bodega de origen y destino no pueden ser iguales.', 'error');
                    return;
                }

                // Get Names and check STOCK availability
                const bodegas = await ADMIN_MODELS['admin-bodegas'].getAll();
                const productos = await ADMIN_MODELS['admin-productos'].getAll();
                const bOrg = bodegas.find(b => b.id == bodegaOrigenId);
                const bDst = bodegas.find(b => b.id == bodegaDestinoId);
                const prodRef = productos.find(p => p.id == productoId);

                // Find the EXACT record in the origin bodega to check its specific stock
                const sourceRecord = productos.find(p => p.nombre === prodRef.nombre && p.bodega_id == bodegaOrigenId);
                
                if (!sourceRecord || (parseFloat(sourceRecord.stock) || 0) < cantidad) {
                    this.showToast(`Stock insuficiente en ${bOrg?.nombre || 'Bodega Origen'}. Disponible: ${sourceRecord ? sourceRecord.stock : 0}`, 'error');
                    return;
                }

                // Deduct stock from Origin
                try {
                    const newStockOrg = (parseFloat(sourceRecord.stock) || 0) - cantidad;
                    await ADMIN_MODELS['admin-productos'].update(sourceRecord.id, { ...sourceRecord, stock: newStockOrg });
                } catch (err) {
                    console.error('Error deducting stock on emission:', err);
                    this.showToast('No se pudo actualizar el stock en la bodega de origen.', 'error');
                    return;
                }

                const data = {
                    bodegaOrigenId,
                    bodegaOrigenNombre: bOrg?.nombre || 'Origen',
                    bodegaDestinoId,
                    bodegaDestinoNombre: bDst?.nombre || 'Destino',
                    productoId,
                    productoNombre: prodRef?.nombre || 'Producto',
                    cantidad,
                    notas: formData.get('notas'),
                    fecha: new Date().toISOString()
                };

                const newT = DocumentacionModel.saveTransfer(data);

                // Add Notification for the destination team
                NotificationModel.add({
                    title: '📦 Envío en Camino',
                    message: `Se emitió el remito ${newT.nroRemito} de ${data.bodegaOrigenNombre} hacia ${data.bodegaDestinoNombre} (${data.cantidad} ${prodRef?.unidad || 'un'} de ${data.productoNombre}).`,
                    type: 'info',
                    time: 'Ahora',
                    read: false,
                    actionType: 'confirm_transfer',
                    transferId: newT.id
                });

                this.showToast('Remito Interno emitido y stock descontado de origen.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('modalTransferencia')).hide();
                
                // Refresh tables
                this.renderTransfersTable();
                if (this.currentSection === 'admin-bodegas-movimientos') {
                    this.updateInventarioTables();
                }
                window.dispatchEvent(new CustomEvent('document-saved'));

                // Auto Print Option
                if (confirm(`Remito emitido: ${newT.nroRemito}\n¿Desea imprimir el remito interno para el chofer?`)) {
                    this.printTransferRemito(newT.id);
                }
            };
        }

        // --- DELEGATED BUTTONS ---
        const tbodyDoc = document.getElementById('tbody-documentacion');
        if (tbodyDoc) {
            tbodyDoc.onclick = (e) => {
                const btnRecibir = e.target.closest('.btn-add-remito');
                if (btnRecibir) {
                    const id = btnRecibir.dataset.id;
                    // Logic for Receiving mercadería from Invoice (already implemented in many systems)
                    this.showToast('Funcionalidad de recepción de factura en desarrollo.', 'info');
                }
            };
        }

        const handleConfirmClick = (e) => {
            const btnConfirm = e.target.closest('.btn-confirm-transfer');
            if (btnConfirm) {
                const id = btnConfirm.dataset.id;
                this.openConfirmTransferModal(id);
            }
        };

        const tbodyTransf = document.getElementById('tbody-transferencias');
        if (tbodyTransf) tbodyTransf.onclick = handleConfirmClick;
        
        const tbodyOpTransf = document.getElementById('tbody-op-transferencias');
        if (tbodyOpTransf) tbodyOpTransf.onclick = handleConfirmClick;

        const btnDoConfirmTransf = document.getElementById('btn-do-confirm-transfer');
        if (btnDoConfirmTransf) {
            btnDoConfirmTransf.onclick = async () => {
                const form = document.getElementById('form-confirm-transfer');
                const transferId = document.getElementById('transfer-info-confirm').dataset.id;
                const formData = new FormData(form);
                
                const data = {
                    receptor: formData.get('receptor'),
                    notas: formData.get('notas')
                };

                if (!data.receptor) {
                    this.showToast('Debe ingresar el nombre de quién recibe.', 'error');
                    return;
                }

                // ── Inventory Sync Logic (Finalize arrival) ──
                const transfers = DocumentacionModel.getTransfers();
                const t = transfers.find(x => x.id === transferId);
                if (t && t.status === 'En Tránsito') {
                    try {
                        const allProds = await ADMIN_MODELS['admin-productos'].getAll();
                        const prodSourceRef = await ADMIN_MODELS['admin-productos'].getById(t.productoId);
                        
                        let prodDest = allProds.find(p => p.nombre === t.productoNombre && p.bodega_id == t.bodegaDestinoId);
                        
                        if (prodDest) {
                            const newStockDest = (parseFloat(prodDest.stock) || 0) + parseFloat(t.cantidad);
                            await ADMIN_MODELS['admin-productos'].update(prodDest.id, { ...prodDest, stock: newStockDest });
                        } else {
                            await ADMIN_MODELS['admin-productos'].create({
                                nombre: t.productoNombre,
                                categoria: prodSourceRef?.categoria || 'Insumo',
                                bodega_id: t.bodegaDestinoId,
                                unidad: prodSourceRef?.unidad || 'un',
                                stock: parseFloat(t.cantidad),
                                notas: `Ingresado por remito interno ${t.nroRemito}`
                            });
                        }
                        
                        DocumentacionModel.confirmTransfer(transferId, data);

                        // Mark related notifications as read
                        const allNotifs = await NotificationModel.getAll();
                        const myNotif = allNotifs.find(n => n.transferId === transferId);
                        if (myNotif) NotificationModel.markAsRead(myNotif.id);

                        this.showToast('Ingreso a bodega confirmado y stock actualizado.', 'success');
                    } catch (err) {
                        console.error('Stock sync error:', err);
                        this.showToast('Error al sincronizar stock.', 'error');
                    }
                }

                bootstrap.Modal.getInstance(document.getElementById('modalConfirmarTransferencia')).hide();
                this.renderTransfersTable();
                window.dispatchEvent(new CustomEvent('document-saved'));
            };
        }
    }

    openConfirmTransferModal(transferId) {
        const transfers = DocumentacionModel.getTransfers();
        const t = transfers.find(x => x.id === transferId);
        if (!t) return;

        const infoDiv = document.getElementById('transfer-info-confirm');
        infoDiv.dataset.id = transferId;
        infoDiv.innerHTML = `
            <div style="font-size: 0.9em;">
                <div style="margin-bottom: 8px;">Recibiendo: <strong style="color: var(--color-primary-400);">${t.cantidad} unidades</strong> de <strong>${t.productoNombre}</strong></div>
                <div style="font-size: 0.85em; color: var(--text-tertiary);">Desde: ${t.bodegaOrigenNombre} ➡️ A: ${t.bodegaDestinoNombre}</div>
                <div style="font-size: 0.85em; color: var(--text-tertiary); margin-top: 4px;">Remito: ${t.nroRemito}</div>
            </div>
        `;

        new bootstrap.Modal(document.getElementById('modalConfirmarTransferencia')).show();
    }
    async populateCargaDocumentacionCatalogs() {
        try {
            const bodegas = await ADMIN_MODELS['admin-bodegas'].getAll();
            const productos = await ADMIN_MODELS['admin-productos'].getAll();

            // Pre-find user bodega if assigned to a finca
            let userBodegaId = null;
            if (this.currentUser?.finca) {
                const userFinca = this.currentUser.finca;
                // Try to find a bodega where fincaId matches our finca
                // First get all fincas to find the ID of the finca with name userFinca
                const fincas = await ADMIN_MODELS['admin-fincas'].getAll();
                const myFinca = fincas.find(f => f.nombre === userFinca);
                if (myFinca) {
                    const myBodega = bodegas.find(b => b.finca_id == myFinca.id);
                    if (myBodega) userBodegaId = myBodega.id;
                }
            }

            document.querySelectorAll('.doc-select-bodega').forEach(sel => {
                const currentVal = sel.value || (sel.name === 'bodegaOrigen' ? userBodegaId : null);
                sel.innerHTML = '<option value="">Seleccionar Bodega...</option>' +
                    bodegas.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
                if (currentVal) sel.value = currentVal;
            });

            document.querySelectorAll('.doc-select-producto').forEach(sel => {
                const currentVal = sel.value;
                sel.innerHTML = '<option value="">Seleccionar Insumo...</option>' +
                    productos.map(p => {
                        // If we have a pre-selected bodega, only show products from that bodega or all?
                        // User said products usually "are destinaded to a predio", so we show everything 
                        // but maybe we should show stock relative to the selected bodega.
                        // For now, keep it simple: show all products but include global stock info.
                        return `<option value="${p.id}">${p.nombre} (Stock: ${p.stock || 0})</option>`;
                    }).join('');
                if (currentVal) sel.value = currentVal;
            });
        } catch (e) {
            console.error('Populate catalogs error:', e);
        }
    }

    printTransferRemito(transferId) {
        const transfers = DocumentacionModel.getTransfers();
        const t = transfers.find(x => x.id === transferId);
        if (!t) return;

        const printWin = window.open('', '_blank', 'width=800,height=900');
        printWin.document.write(renderRemitoPrintTemplate(t));
        printWin.document.close();
    }
}
