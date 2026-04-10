
import os

filepath = r"c:\Users\usuario\Documents\GitHub\NaturalV0.5\src\views\Views.js"
temp_filepath = r"c:\Users\usuario\Documents\GitHub\NaturalV0.5\src\views\Views_fixed.js"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The corruption starts at line 4727 in the 1-indexed view (which is index 4726)
# We want to keep lines up to 4725 (index 4724)
clean_lines = lines[:4725]

new_content = """
                        return `
                        <td style="padding: var(--space-2); border-right: 1px solid var(--border-subtle); vertical-align: top;">
                            <div style="font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-2); text-align: center; font-size: 0.9em; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.05);">${m.totalJornales.toFixed(0)}</div>
                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                ${entries.map(([labor, data]) => {
                                    const percentage = (data.jornales / m.totalJornales) * 100;
                                    const color = LABOR_COLORS[labor] || '#818cf8';
                                    return `
                                    <div style="font-size: 0.68em; background: ${color}15; color: ${color}; padding: 3px 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid ${color}30;" title="${labor} - ${data.jornales.toFixed(1)} j.">
                                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 50px;">${labor}</span>
                                        <span style="font-weight: 800;">${percentage.toFixed(0)}%</span>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </td>
                        `;
                    }).join('')}
                </tr>
            </tbody>
        </table>
    </div>
    `;
    return html;
}

export function renderCargaDocumentacionView() {
    return `
        <div class="container-fluid animate-fade-in" style="padding: var(--space-4);">
            <!-- Tab Navigation -->
            <div style="display: flex; gap: var(--space-2); margin-bottom: var(--space-5);">
                <button class="btn btn-primary" id="doc-tab-facturas" style="border-radius: var(--radius-lg); font-size: 0.9em; padding: var(--space-2) var(--space-5);">📄 Facturas de Proveedores</button>
                <button class="btn btn-ghost" id="doc-tab-transferencias" style="border-radius: var(--radius-lg); font-size: 0.9em; padding: var(--space-2) var(--space-5);">🚛 Remitos Internos (Inter-Bodega)</button>
            </div>

            <!-- VIEW: FACTURAS -->
            <div id="view-facturas">
                <div class="row mb-4">
                    <div class="col-12">
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-lg);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
                                <div>
                                    <h2 style="font-family: var(--font-display); font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">📂 Carga de <span style="color: var(--color-primary-400);">Documentación</span></h2>
                                    <p style="color: var(--text-tertiary); font-size: 0.9em; margin: 0;">Gestión administrativa de facturas y enlace logístico con operativa.</p>
                                </div>
                                <div style="display: flex; gap: var(--space-3); align-items: center;">
                                    <!-- Stats Mini -->
                                    <div style="display: flex; gap: var(--space-4); margin-right: var(--space-4);">
                                        <div style="text-align: right;"><span id="doc-stat-total" style="font-weight: 800; color: var(--text-primary); display: block;">0</span><small style="font-size: 0.7em; color: var(--text-tertiary);">Total</small></div>
                                        <div style="text-align: right;"><span id="doc-stat-pending" style="font-weight: 800; color: #f59e0b; display: block;">0</span><small style="font-size: 0.7em; color: var(--text-tertiary);">Pendientes</small></div>
                                    </div>
                                    <button class="btn btn-primary" id="btn-nueva-factura" style="border-radius: var(--radius-lg); font-weight: 700; display: flex; align-items: center; gap: var(--space-2);">
                                        <span>➕</span> Nueva Factura
                                    </button>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.01); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle); overflow: hidden;">
                                <div style="overflow-x: auto;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.88em;">
                                        <thead>
                                            <tr style="text-align: left; border-bottom: 1px solid var(--border-subtle);">
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Fecha</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Proveedor</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">N° Documento</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: right;">Monto</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Estado</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-documentacion"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- VIEW: TRANSFERENCIAS -->
            <div id="view-transferencias" style="display: none;">
                <div class="row mb-4">
                    <div class="col-12">
                        <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-lg);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
                                <div>
                                    <h2 style="font-family: var(--font-display); font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">🚚 Remitos <span style="color: var(--color-primary-400);">Internos</span></h2>
                                    <p style="color: var(--text-tertiary); font-size: 0.9em; margin: 0;">Movimiento de stock inter-bodega y control de recepciones.</p>
                                </div>
                                <div style="display: flex; gap: var(--space-3);">
                                    <button class="btn btn-primary" id="btn-nueva-transferencia" style="border-radius: var(--radius-lg); font-weight: 700; display: flex; align-items: center; gap: var(--space-2);">
                                        <span>🚛</span> Generar Movimiento
                                    </button>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.01); border-radius: var(--radius-xl); border: 1px solid var(--border-subtle); overflow: hidden;">
                                <div style="overflow-x: auto;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.88em;">
                                        <thead>
                                            <tr style="text-align: left; border-bottom: 1px solid var(--border-subtle);">
                                                <th style="padding: var(--space-4); color: var(--text-tertiary);">Fecha</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary);">Remito</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary);">Origen</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">➡️</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary);">Destino</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary);">Producto</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Cant.</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Estado</th>
                                                <th style="padding: var(--space-4); color: var(--text-tertiary); text-align: center;">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tbody-transferencias"></tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <div class="modal fade" id="modalFactura" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content" style="background: var(--bg-secondary); border: 1px solid var(--border-strong); border-radius: var(--radius-xl);">
                    <div class="modal-header">
                        <h5 class="modal-title font-display">Subir Nueva Documentación</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="form-factura">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                                <div style="grid-column: span 1;">
                                    <label class="small text-tertiary">Proveedor</label>
                                    <input type="text" name="proveedor" required class="form-control">
                                </div>
                                <div style="grid-column: span 1;">
                                    <label class="small text-tertiary">N° Documento</label>
                                    <input type="text" name="nroFactura" required class="form-control">
                                </div>
                                <div style="grid-column: span 1;">
                                    <label class="small text-tertiary">Fecha</label>
                                    <input type="date" name="fecha" required class="form-control">
                                </div>
                                <div style="grid-column: span 1;">
                                    <label class="small text-tertiary">Monto Total</label>
                                    <input type="number" name="monto" required class="form-control">
                                </div>
                                <div style="grid-column: span 2;">
                                    <label class="small text-tertiary">Logística</label>
                                    <select name="logistica" class="form-select">
                                        <option value="con_factura">Llegó con Factura (Cerrado)</option>
                                        <option value="separados">Entrega Diferida (Remitos)</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="btn-save-factura">Guardar</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalTransferencia" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content" style="background: var(--bg-secondary); border: 1px solid var(--border-strong); border-radius: var(--radius-xl);">
                    <div class="modal-header" style="border-bottom: 1px solid var(--border-subtle);">
                        <h5 class="modal-title font-display" style="font-weight: 800;">Generar Remito Interno</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="padding: var(--space-6);">
                        <form id="form-transferencia">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                                <div style="grid-column: span 1;">
                                    <label style="display: block; font-size: 0.75em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 6px; font-weight: 700;">Bodega Origen</label>
                                    <select name="bodegaOrigen" class="form-select doc-select-bodega" required></select>
                                </div>
                                <div style="grid-column: span 1;">
                                    <label style="display: block; font-size: 0.75em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 6px; font-weight: 700;">Bodega Destino</label>
                                    <select name="bodegaDestino" class="form-select doc-select-bodega" required></select>
                                </div>
                                <div style="grid-column: span 1;">
                                    <label style="display: block; font-size: 0.75em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 6px; font-weight: 700;">Producto / Insumo</label>
                                    <select name="productoId" class="form-select doc-select-producto" required></select>
                                </div>
                                <div style="grid-column: span 1;">
                                    <label style="display: block; font-size: 0.75em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 6px; font-weight: 700;">Cantidad a Mover</label>
                                    <input type="number" name="cantidad" step="0.01" required class="form-control" style="background: var(--bg-primary); border: 1px solid var(--border-subtle);">
                                </div>
                                <div style="grid-column: span 2;">
                                    <label style="display: block; font-size: 0.75em; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 6px; font-weight: 700;">Notas de Transporte</label>
                                    <textarea name="notas" rows="2" class="form-control" placeholder="Ej: Chofer Juan Perez, Camion patente ABC-123" style="background: var(--bg-primary); border: 1px solid var(--border-subtle);"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-ghost" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btn-save-transferencia">Emitir Remito Interno</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalConfirmarTransferencia" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="background: var(--bg-secondary); border: 1px solid var(--border-strong); border-radius: var(--radius-xl);">
                    <div class="modal-header">
                        <h5 class="modal-title font-display">Confirmar Recepción Interna</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="transfer-info-confirm" class="mb-4 p-3 rounded bg-glass border-subtle"></div>
                        <form id="form-confirm-transfer">
                            <div>
                                <label class="form-label small text-tertiary">Recibido por (Nombre):</label>
                                <input type="text" name="receptor" required class="form-control mb-3">
                                <label class="form-label small text-tertiary">Observaciones de Recepción:</label>
                                <textarea name="notas" rows="2" class="form-control"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary w-100" id="btn-do-confirm-transfer">Confirmar Ingreso a Bodega</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderTransferRows(transfers) {
    if (!transfers || transfers.length === 0) {
        return `<tr><td colspan="9" style="padding: var(--space-12); text-align: center; color: var(--text-tertiary); opacity: 0.5;">No hay remitos internos registrados.</td></tr>`;
    }

    return transfers.map(t => {
        const statusColor = t.status === 'En Tránsito' ? '#f59e0b' : '#10b981';
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
                <td style="padding: var(--space-4); color: var(--text-secondary); white-space: nowrap;">${new Date(t.fecha).toLocaleDateString()}</td>
                <td style="padding: var(--space-4); font-family: monospace; color: var(--color-primary-400);">${t.nroRemito}</td>
                <td style="padding: var(--space-4); font-weight: 600;">${t.bodegaOrigenNombre}</td>
                <td style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">➡️</td>
                <td style="padding: var(--space-4); font-weight: 600;">${t.bodegaDestinoNombre}</td>
                <td style="padding: var(--space-4);">${t.productoNombre}</td>
                <td style="padding: var(--space-4); text-align: center; font-weight: 800;">${t.cantidad}</td>
                <td style="padding: var(--space-4); text-align: center;">
                    <span style="display: inline-block; padding: 2px 10px; border-radius: 99px; background: ${statusColor}15; color: ${statusColor}; font-size: 0.8em; font-weight: 700;">
                        ${t.status}
                    </span>
                </td>
                <td style="padding: var(--space-4); text-align: center;">
                    ${t.status === 'En Tránsito' ? `
                        <button class="btn btn-primary btn-sm btn-confirm-transfer" data-id="${t.id}" style="padding: 4px 12px; font-size: 0.75em;">
                            Confirmar
                        </button>
                    ` : `<span style="color: var(--color-success); font-size: 1.1em;">✔️</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

export function renderDocumentacionRows(invoices) {
    if (!invoices || invoices.length === 0) {
        return `<tr><td colspan="6" style="padding: var(--space-12); text-align: center; color: var(--text-tertiary); opacity: 0.5;">No se encontró documentación cargada.</td></tr>`;
    }

    return invoices.map(v => {
        let statusBadge = '';
        if (v.status === 'Pendiente de Entrega') {
            statusBadge = `<span style="display: inline-block; padding: 2px 10px; border-radius: 99px; background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 0.8em; font-weight: 700;">⏳ Pendiente</span>`;
        } else if (v.status === 'Entrega Parcial') {
            statusBadge = `<span style="display: inline-block; padding: 2px 10px; border-radius: 99px; background: rgba(59,130,246,0.1); color: #3b82f6; font-size: 0.8em; font-weight: 700;">📦 Parcial (${v.remitos_asociados.length})</span>`;
        } else {
            statusBadge = `<span style="display: inline-block; padding: 2px 10px; border-radius: 99px; background: rgba(16,185,129,0.1); color: #10b981; font-size: 0.8em; font-weight: 700;">✅ Completado</span>`;
        }

        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.01)'" onmouseleave="this.style.background=''">
                <td style="padding: var(--space-4); color: var(--text-secondary); white-space: nowrap; text-align: center;">${new Date(v.fecha).toLocaleDateString()}</td>
                <td style="padding: var(--space-4); text-align: center;">
                    <div style="font-weight: 700; color: var(--text-primary);">${v.proveedor}</div>
                </td>
                <td style="padding: var(--space-4); font-family: monospace; color: var(--color-primary-400); text-align: center;">${v.nroFactura}</td>
                <td style="padding: var(--space-4); text-align: right; font-weight: 800; color: var(--text-primary);">$ ${parseFloat(v.monto).toLocaleString('es-AR')}</td>
                <td style="padding: var(--space-4); text-align: center;">${statusBadge}</td>
                <td style="padding: var(--space-4); text-align: center;">
                    <div style="display: flex; gap: var(--space-2); justify-content: center;">
                        ${v.status !== 'Completado' ? `
                            <button class="btn btn-primary btn-sm btn-add-remito" data-id="${v.id}" title="Registrar Remito" style="padding: var(--space-2) var(--space-3); font-size: 0.75em; font-weight: 700; border-radius: var(--radius-md);">
                                🚛 Recibir
                            </button>
                        ` : `
                            <button class="btn btn-ghost btn-sm" disabled style="opacity: 0.3;">✔️</button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
"""

with open(temp_filepath, 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)
    f.write(new_content)

os.replace(temp_filepath, filepath)
