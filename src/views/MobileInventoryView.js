import { OfflineSyncModel } from '../models/OfflineSyncModel.js';

export function renderMobileInventoryView(catalogs) {
    if (!catalogs) catalogs = OfflineSyncModel.getLocalCatalogs();
    
    if (!catalogs || !catalogs.fincas) {
        return `<div style="padding:3rem 2rem;text-align:center;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:80vh;">
            <div style="font-size:4rem;margin-bottom:1rem;">📡</div>
            <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Sincronización Requerida</h3>
            <p style="opacity:0.7;font-size:0.95rem;">Conéctate a internet una vez para descargar los catálogos y poder trabajar sin conexión.</p>
            <button onclick="location.reload()" style="margin-top:1.5rem;padding:14px 28px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;font-weight:700;font-size:1em;cursor:pointer;">Reintentar</button>
        </div>`;
    }

    const { fincas, productos } = catalogs;
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
                <div style="font-size: 2.5rem; margin-bottom: 8px;">📦</div>
                <h2 style="margin: 0; font-weight: 800; font-size: 1.3em; color: #e2e8f0;">Movimientos de Stock</h2>
                <p style="margin: 4px 0 0; color: #64748b; font-size: 0.85em;">Recepciones, transferencias y despachos</p>
            </div>

            <form id="mobile-stock-form">
                <input type="hidden" id="m-stock-type" value="recepcion" />

                <!-- Tipo de Movimiento - Card selector -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Tipo de movimiento *</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <label class="stock-type-option" data-value="recepcion" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid #10b981;border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="stock_tipo" value="recepcion" checked style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">📥</span>
                            <span style="font-size:0.78em;font-weight:700;">Recepción</span>
                        </label>
                        <label class="stock-type-option" data-value="transferencia" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid var(--border-subtle);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="stock_tipo" value="transferencia" style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">🔄</span>
                            <span style="font-size:0.78em;font-weight:700;">Transfer.</span>
                        </label>
                        <label class="stock-type-option" data-value="despacho" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 8px;background:var(--bg-primary);border:2px solid var(--border-subtle);border-radius:12px;cursor:pointer;transition:all 0.2s;text-align:center;min-height:70px;color:#e2e8f0;">
                            <input type="radio" name="stock_tipo" value="despacho" style="display:none;">
                            <span style="font-size:1.5rem;margin-bottom:4px;">📤</span>
                            <span style="font-size:0.78em;font-weight:700;">Despacho</span>
                        </label>
                    </div>
                </div>

                <!-- Producto -->
                <div style="margin-bottom: 20px;">
                    <label style="${labelStyle}">Producto *</label>
                    <select id="m-producto" required style="${inputStyle}">
                        <option value="">— Seleccionar producto —</option>
                        ${(productos || []).map(p => `<option value="${p.id}">${p.nombre}${p.unidad ? ' (' + p.unidad + ')' : ''}</option>`).join('')}
                    </select>
                </div>

                <!-- Cantidad + Fecha -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
                    <div>
                        <label style="${labelStyle}">Cantidad *</label>
                        <input type="number" step="0.01" id="m-stock-cantidad" required placeholder="0.00" inputmode="decimal" style="${inputStyle}">
                    </div>
                    <div>
                        <label style="${labelStyle}">Fecha *</label>
                        <input type="date" id="m-stock-fecha" value="${hoy}" required style="${inputStyle}">
                    </div>
                </div>

                <!-- Finca Destino (Recepción) -->
                <div id="m-stock-section-in" style="margin-bottom: 16px;">
                    <label style="${labelStyle}">Finca destino *</label>
                    <select id="m-stock-finca-dest" style="${inputStyle}">
                        <option value="">— Dónde se recibe —</option>
                        ${(fincas || []).map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Transfer section (hidden by default) -->
                <div id="m-stock-section-transfer" style="display:none;margin-bottom:16px;">
                    <div style="margin-bottom:16px;">
                        <label style="${labelStyle}">Finca origen *</label>
                        <select id="m-stock-finca-orig" style="${inputStyle}">
                            <option value="">— De dónde sale —</option>
                            ${(fincas || []).map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="${labelStyle}">Finca destino *</label>
                        <select id="m-stock-finca-dest-t" style="${inputStyle}">
                            <option value="">— A dónde va —</option>
                            ${(fincas || []).map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Despacho section (hidden by default) -->
                <div id="m-stock-section-despacho" style="display:none;margin-bottom:16px;">
                    <label style="${labelStyle}">Finca de salida *</label>
                    <select id="m-stock-finca-salida" style="${inputStyle}">
                        <option value="">— De qué finca sale —</option>
                        ${(fincas || []).map(f => `<option value="${f.id}">${f.nombre}</option>`).join('')}
                    </select>
                </div>

                <!-- Remito -->
                <div style="margin-bottom: 16px;">
                    <label style="${labelStyle}">Nº Remito / Referencia</label>
                    <input type="text" id="m-stock-remito" placeholder="Ej: R-00145" style="${inputStyle}">
                </div>

                <!-- Observaciones -->
                <div style="margin-bottom: 24px;">
                    <label style="${labelStyle}">Observaciones</label>
                    <textarea id="m-stock-notas" rows="2" placeholder="Notas adicionales..." style="${inputStyle} resize:vertical;"></textarea>
                </div>

                <!-- Submit -->
                <button type="submit" id="btn-stock-save" style="width:100%;padding:16px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:12px;font-size:1.1em;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform 0.1s;-webkit-tap-highlight-color:transparent;">
                    💾 Guardar Movimiento
                </button>
            </form>

            <!-- Success feedback -->
            <div id="m-stock-success" style="display:none;text-align:center;padding:40px 20px;">
                <div style="font-size:3rem;margin-bottom:12px;">✅</div>
                <h3 style="color:#3b82f6;font-weight:800;margin:0 0 8px;">¡Movimiento Registrado!</h3>
                <p style="color:#94a3b8;font-size:0.9em;" id="m-stock-detail"></p>
                <button type="button" id="btn-stock-otro" style="margin-top:20px;padding:14px 28px;background:var(--bg-primary);border:1px solid var(--border-subtle);border-radius:12px;color:#e2e8f0;font-weight:700;cursor:pointer;font-size:1em;">
                    ➕ Registrar otro
                </button>
            </div>
        </div>
    `;
}
