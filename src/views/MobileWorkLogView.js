import { OfflineSyncModel } from '../models/OfflineSyncModel.js';

export function renderMobileWorkLogView(catalogs) {
    if (!catalogs) {
        catalogs = OfflineSyncModel.getLocalCatalogs();
    }
    
    // Ensure we have catalogs (even offline)
    if (!catalogs || !catalogs.fincas) {
        return `<div style="padding:2rem;text-align:center;color:white;">Error: No hay datos catalogados. Conéctate a internet una vez para descargarlos.</div>`;
    }

    const { fincas, faenas, labores, empleados } = catalogs;
    const isOnline = OfflineSyncModel.isOnline();
    const queueCount = OfflineSyncModel.getSyncQueue().length;

    let html = `
    <div class="mobile-worklog-container" style="padding: 1rem; color: #f8fafc; font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        
        <!-- Offline Status Bar -->
        <div id="mobile-sync-status" style="background: ${isOnline ? '#0f766e' : '#991b1b'}; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${isOnline ? '#34d399' : '#f87171'};"></div>
                <span id="mobile-network-text">${isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div style="font-size: 0.9rem;">
                <span id="mobile-queue-count" style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px;">${queueCount} pendientes</span>
            </div>
            ${isOnline ? `<button id="btn-mobile-sync" class="btn btn-sm btn-light" style="font-size:0.8rem; padding:4px 8px;">Sincronizar Nube</button>` : ''}
        </div>

        <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center; font-weight: 700;">Carga Rápida de Campo</h2>

        <form id="mobile-worklog-form" onsubmit="event.preventDefault();" style="display: flex; flex-direction: column; gap: 1.25rem;">
            
            <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <label style="display: block; margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.9rem;">📍 Ubicación</label>
                <select id="m-finca" required class="form-select" style="margin-bottom: 0.75rem; background:#0f172a; color:white; border-color: rgba(255,255,255,0.1); padding: 0.75rem; font-size: 1rem;">
                    <option value="">-- Seleccionar Finca --</option>
                    ${(fincas || []).map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                </select>
                <select id="m-cuartel" class="form-select" style="background:#0f172a; color:white; border-color: rgba(255,255,255,0.1); padding: 0.75rem; font-size: 1rem;">
                    <option value="">-- Todos los Cuarteles (Opcional) --</option>
                </select>
            </div>

            <div style="background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <label style="display: block; margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.9rem;">👷 Labor & Personal</label>
                <select id="m-empleado" required class="form-select" style="margin-bottom: 0.75rem; background:#0f172a; color:white; border-color: rgba(255,255,255,0.1); padding: 0.75rem; font-size: 1rem;">
                    <option value="">-- Quién hizo el trabajo --</option>
                    ${(empleados || []).map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
                </select>
                <select id="m-labor" required class="form-select" style="margin-bottom: 0.75rem; background:#0f172a; color:white; border-color: rgba(255,255,255,0.1); padding: 0.75rem; font-size: 1rem;">
                    <option value="">-- Qué labor realizó --</option>
                    ${(labores || []).map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                </select>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="number" step="0.1" id="m-cantidad" required placeholder="0.0" class="form-control" style="background:#0f172a; color:white; border-color: rgba(255,255,255,0.1); padding: 0.75rem; font-size: 1rem; flex: 2;" />
                    <select id="m-unidad" required class="form-select" style="background:#0f172a; color:white; border-color: rgba(255,255,255,0.1); padding: 0.75rem; font-size: 1rem; flex: 1;">
                        <option value="Jornadas">Jornadas</option>
                        <option value="Horas">Horas</option>
                        <option value="Hectáreas">Hectáreas</option>
                    </select>
                </div>
            </div>

            <button type="submit" id="btn-mobile-save" style="background: var(--color-primary); color: white; border: none; padding: 1.25rem; font-size: 1.2rem; font-weight: bold; border-radius: 12px; box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4); margin-top: 1rem;">
                Guardar Localmente
            </button>
            <div id="m-save-msg" style="text-align: center; height: 20px; font-size: 0.9rem; color: #10b981; margin-top: 0.5rem;"></div>

        </form>
    </div>
    `;
    return html;
}
