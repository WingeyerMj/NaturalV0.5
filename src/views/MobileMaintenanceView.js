import { OfflineSyncModel } from '../models/OfflineSyncModel.js';

export function renderMobileMaintenanceView(catalogs) {
    if (!catalogs) catalogs = OfflineSyncModel.getLocalCatalogs();
    
    if (!catalogs) {
        return `<div style="padding:3rem 2rem;text-align:center;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;">
            <div style="font-size:4rem;margin-bottom:1rem;">📡</div>
            <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Sincronización Requerida</h3>
            <p style="opacity:0.7;font-size:0.95rem;">Conéctate a internet una vez para descargar los catálogos y poder trabajar sin conexión.</p>
            <button onclick="location.reload()" style="margin-top:1.5rem;padding:14px 28px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:12px;font-weight:700;font-size:1em;cursor:pointer;">Reintentar</button>
        </div>`;
    }

    const { maquinarias } = catalogs;
    const isOnline = OfflineSyncModel.isOnline();
    const totalQueue = OfflineSyncModel.getSyncQueue().length;
    const hoy = new Date().toISOString().split('T')[0];
    const inputStyle = 'width:100%;padding:14px 12px;background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:8px;color:#e2e8f0;font-size:16px;-webkit-appearance:none;';
    const labelStyle = 'display:block;font-size:0.72em;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:8px;font-weight:700;';

    return `
        <div class="fade-in" style="max-width: 540px; margin: 0 auto; padding-bottom: 100px;">

            <!-- Sync Status Bar -->
            <div id="mobile-sync-bar" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;margin-bottom:20px;border-radius:12px;background:${isOnline ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'};border:1px solid ${isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:10px;height:10px;border-radius:50%;background:${isOnline ? '#10b981' : '#ef4444'};box-shadow:0 0 6px ${isOnline ? '#10b981' : '#ef4444'};"></div>
                    <span style="font-weight:700;font-size:0.8em;color:${isOnline ? '#10b981' : '#ef4444'};text-transform:uppercase;letter-spacing:0.5px;">${isOnline ? 'Conectado' : 'Sin Conexión'}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span id="mobile-queue-count" style="font-size:0.78em;font-weight:600;color:#94a3b8;background:rgba(255,255,255,0.05);padding:4px 12px;border-radius:20px;">${totalQueue} pendientes</span>
                    ${isOnline && totalQueue > 0 ? `<button id="btn-mobile-sync" style="padding:6px 14px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:8px;font-size:0.78em;font-weight:700;cursor:pointer;">⬆ Sincronizar</button>` : ''}
                </div>
            </div>

            <!-- Header -->
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">🔧</div>
                <h2 style="margin: 0; font-weight: 800; font-size: 1.3em; color: #e2e8f0;">Registrar Mantenimiento</h2>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 0.85em;">Servicios, reparaciones e inspecciones</p>
            </div>

            <form id="mobile-mant-form">
                <!-- Machine Selector -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Maquinaria *</label>
                    <select id="m-maq-id" required style="${inputStyle}">
                        <option value="">— Seleccionar equipo —</option>
                        ${(maquinarias || []).map(m => {
                            let icon = '🟢';
                            if (m.estado === 'En Reparación') icon = '🟡';
                            if (m.estado === 'Fuera de Servicio' || m.estado === 'Dada de Baja') icon = '🔴';
                            return `<option value="${m.id}">${icon} ${m.nombre} (${m.categoria || ''})</option>`;
                        }).join('')}
                    </select>
                </div>

                <!-- Machine Info (dynamic) -->
                <div id="m-maq-info" style="display:none; padding:12px 14px; background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:8px; margin-bottom:20px; color:#e2e8f0; font-size:0.88em;"></div>

                <!-- Tipo de Intervención - Large touch cards -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Tipo de intervención *</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label class="mant-type-option" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid var(--border-subtle);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="m_mant_tipo" value="Servicio Preventivo" checked style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">🛡️</span>
                            <span style="font-size:0.78em;font-weight:700;">Servicio</span>
                        </label>
                        <label class="mant-type-option" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid var(--border-subtle);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="m_mant_tipo" value="Reparación Correctiva" style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">🔧</span>
                            <span style="font-size:0.78em;font-weight:700;">Reparación</span>
                        </label>
                        <label class="mant-type-option" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid var(--border-subtle);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="m_mant_tipo" value="Inspección / Auditoría" style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">🔍</span>
                            <span style="font-size:0.78em;font-weight:700;">Inspección</span>
                        </label>
                        <label class="mant-type-option" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid var(--border-subtle);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="m_mant_tipo" value="Cambio de Aceite/Filtros" style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">🛢️</span>
                            <span style="font-size:0.78em;font-weight:700;">Aceite/Filtros</span>
                        </label>
                    </div>
                </div>

                <!-- Fecha -->
                <div style="margin-bottom: 16px;">
                    <label style="${labelStyle}">Fecha *</label>
                    <input type="date" id="m-mant-fecha" value="${hoy}" required style="${inputStyle}">
                </div>

                <!-- Descripción -->
                <div style="margin-bottom: 16px;">
                    <label style="${labelStyle}">¿Qué se hizo? *</label>
                    <textarea id="m-mant-desc" rows="3" placeholder="Describir el trabajo realizado..." required style="${inputStyle} resize:vertical;"></textarea>
                </div>

                <!-- Repuestos -->
                <div style="margin-bottom: 16px;">
                    <label style="${labelStyle}">Repuestos usados</label>
                    <input type="text" id="m-mant-repuestos" placeholder="Ej: Filtro aceite, Correa..." style="${inputStyle}">
                </div>

                <!-- Técnico -->
                <div style="margin-bottom: 16px;">
                    <label style="${labelStyle}">Mecánico / Responsable</label>
                    <input type="text" id="m-mant-tecnico" placeholder="Nombre..." style="${inputStyle}">
                </div>

                <!-- Costo + Horómetro -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div>
                        <label style="${labelStyle}">Costo ($)</label>
                        <input type="number" id="m-mant-costo" placeholder="0" min="0" inputmode="numeric" style="${inputStyle}">
                    </div>
                    <div>
                        <label style="${labelStyle}">Horómetro (hs)</label>
                        <input type="number" id="m-mant-horometro" placeholder="Actual" inputmode="numeric" style="${inputStyle}">
                    </div>
                </div>

                <!-- Estado post -->
                <div style="margin-bottom: 24px;">
                    <label style="${labelStyle}">Estado después del trabajo</label>
                    <select id="m-mant-estado-post" style="${inputStyle}">
                        <option value="Operativa">✅ Operativa</option>
                        <option value="En Reparación">🟡 Sigue en reparación</option>
                        <option value="Fuera de Servicio">🔴 Fuera de servicio</option>
                    </select>
                </div>

                <!-- Submit -->
                <button type="submit" id="btn-mant-save" style="width:100%;padding:16px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:12px;font-size:1.1em;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform 0.1s;-webkit-tap-highlight-color:transparent;">
                    💾 Guardar Registro
                </button>
            </form>

            <!-- Success feedback -->
            <div id="m-mant-success" style="display:none;text-align:center;padding:40px 20px;">
                <div style="font-size:3rem;margin-bottom:12px;">✅</div>
                <h3 style="color:#f59e0b;font-weight:800;margin:0 0 8px;">¡Registrado!</h3>
                <p style="color:#94a3b8;font-size:0.9em;" id="m-mant-detail"></p>
                <button type="button" id="btn-mant-otro" style="margin-top:20px;padding:14px 28px;background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:12px;color:#e2e8f0;font-weight:700;cursor:pointer;font-size:1em;">
                    ➕ Registrar otro
                </button>
            </div>
        </div>
    `;
}
