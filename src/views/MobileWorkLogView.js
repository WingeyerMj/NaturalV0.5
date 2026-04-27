import { OfflineSyncModel } from '../models/OfflineSyncModel.js';

export function renderMobileWorkLogView(catalogs) {
    if (!catalogs) catalogs = OfflineSyncModel.getLocalCatalogs();
    
    if (!catalogs || !catalogs.fincas) {
        return `<div style="padding:3rem 2rem;text-align:center;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;">
            <div style="font-size:4rem;margin-bottom:1rem;">📡</div>
            <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Sincronización Requerida</h3>
            <p style="opacity:0.7;font-size:0.95rem;">Conéctate a internet una vez para descargar los catálogos y poder trabajar sin conexión.</p>
            <button onclick="location.reload()" style="margin-top:1.5rem;padding:14px 28px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;font-weight:700;font-size:1em;cursor:pointer;">Reintentar</button>
        </div>`;
    }

    const { fincas, labores, empleados } = catalogs;
    const isOnline = OfflineSyncModel.isOnline();
    const queueCount = OfflineSyncModel.getSyncQueue('worklog').length;
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
                <div style="font-size: 2.5rem; margin-bottom: 8px;">📝</div>
                <h2 style="margin: 0; font-weight: 800; font-size: 1.3em; color: #e2e8f0;">Carga de Trabajo</h2>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 0.85em;">Registro de jornales y tareas de campo</p>
            </div>

            <form id="mobile-worklog-form">
                <!-- Finca -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Finca *</label>
                    <select id="m-finca" required style="${inputStyle}">
                        <option value="">— Seleccionar finca —</option>
                        ${(fincas || []).map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Cuartel -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Cuartel / Parcela</label>
                    <select id="m-cuartel" style="${inputStyle}">
                        <option value="">— Opcional —</option>
                    </select>
                </div>

                <!-- Empleado -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Empleado *</label>
                    <select id="m-empleado" required style="${inputStyle}">
                        <option value="">— Quién realizó el trabajo —</option>
                        ${(empleados || []).map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Labor -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Labor / Tarea *</label>
                    <select id="m-labor" required style="${inputStyle}">
                        <option value="">— Qué labor realizó —</option>
                        ${(labores || []).map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Fecha -->
                <div style="margin-bottom: 16px;">
                    <label style="${labelStyle}">Fecha *</label>
                    <input type="date" id="m-fecha" value="${hoy}" required style="${inputStyle}">
                </div>

                <!-- Cantidad + Unidad -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div>
                        <label style="${labelStyle}">Cantidad *</label>
                        <input type="number" step="0.1" id="m-cantidad" required placeholder="0.0" inputmode="decimal" style="${inputStyle}">
                    </div>
                    <div>
                        <label style="${labelStyle}">Unidad</label>
                        <select id="m-unidad" required style="${inputStyle}">
                            <option value="Jornadas">Jornadas</option>
                            <option value="Horas">Horas</option>
                            <option value="Hectáreas">Hectáreas</option>
                            <option value="Surcos">Surcos</option>
                        </select>
                    </div>
                </div>

                <!-- Observaciones -->
                <div style="margin-bottom: 24px;">
                    <label style="${labelStyle}">Observaciones</label>
                    <textarea id="m-notas" rows="2" placeholder="Notas adicionales..." style="${inputStyle} resize:vertical;"></textarea>
                </div>

                <!-- Submit -->
                <button type="submit" id="btn-worklog-save" style="width:100%;padding:16px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:12px;font-size:1.1em;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform 0.1s;-webkit-tap-highlight-color:transparent;">
                    💾 Guardar Registro
                </button>
            </form>

            <!-- Success feedback (hidden by default) -->
            <div id="m-save-success" style="display:none;text-align:center;padding:40px 20px;">
                <div style="font-size:3rem;margin-bottom:12px;">✅</div>
                <h3 style="color:#10b981;font-weight:800;margin:0 0 8px;">¡Registrado!</h3>
                <p style="color:#94a3b8;font-size:0.9em;" id="m-save-detail"></p>
                <button type="button" id="btn-worklog-otro" style="margin-top:20px;padding:14px 28px;background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:12px;color:#e2e8f0;font-weight:700;cursor:pointer;font-size:1em;">
                    ➕ Registrar otro
                </button>
            </div>
        </div>
    `;
}
