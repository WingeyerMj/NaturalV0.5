export function renderInversionesKanbanView(config, data) {
    const states = ['Idea', 'En Evaluación', 'Aprobada', 'En Ejecución', 'Ejecutada', 'Descartada'];
    
    // Top KPI Calculations
    let totalCartera = data.reduce((acc, i) => acc + (parseFloat(i.costo_estimado) || 0), 0);
    let totalEjecutado = data.reduce((acc, i) => acc + (parseFloat(i.costo_real) || 0), 0);
    
    let html = `
    <div class="inversiones-dashboard" style="padding: 1.5rem; color: #f8fafc;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h2>${config.icon} ${config.title}</h2>
            <button class="btn btn-primary btn-sm" id="btn-inversiones-new" style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nueva Inversión
            </button>
        </div>

        <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; flex: 1; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 0.5rem;">Presupuesto Estimado (Pipeline)</div>
                <div style="font-size: 2rem; font-weight: bold; color: #38bdf8;">$${totalCartera.toLocaleString()}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; flex: 1; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 0.5rem;">Total Ejecutado (Real)</div>
                <div style="font-size: 2rem; font-weight: bold; color: #10b981;">$${totalEjecutado.toLocaleString()}</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 12px; flex: 1; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 0.5rem;">Proyectos Activos</div>
                <div style="font-size: 2rem; font-weight: bold; color: white;">${data.length}</div>
            </div>
        </div>

        <div class="kanban-wrapper" style="overflow-x: auto; padding-bottom: 1rem;">
            <div class="kanban-board" style="display: flex; gap: 1.5rem; min-width: max-content;">
    `;

    // Kanban Columns
    const getPriorityColor = (prioridad) => {
        if (prioridad === 'Alta') return '#ef4444';
        if (prioridad === 'Media') return '#f59e0b';
        return '#10b981';
    };

    states.forEach(state => {
        const items = data.filter(i => (i.estado || 'Idea') === state);
        
        let headerColor = 'rgba(255,255,255,0.5)';
        if (state === 'Aprobada') headerColor = '#38bdf8';
        if (state === 'En Ejecución') headerColor = '#f59e0b';
        if (state === 'Ejecutada') headerColor = '#10b981';
        
        html += `
                <div class="kanban-column" style="width: 320px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 1rem; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid ${headerColor}; padding-bottom: 0.5rem; margin-bottom: 1rem;">
                        <h3 style="font-size: 1.1rem; font-weight: 600;">${state}</h3>
                        <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">${items.length}</span>
                    </div>
                    <div class="kanban-items" style="display: flex; flex-direction: column; gap: 0.75rem;">
        `;
        
        if (items.length === 0) {
            html += `<div style="text-align: center; color: rgba(255,255,255,0.2); font-size: 0.9rem; padding: 2rem 0;">Sin inversiones</div>`;
        } else {
            items.forEach(item => {
                html += `
                        <div class="inversion-card" data-id="${item.id}" style="background: rgba(30, 41, 59, 0.9); padding: 1rem; border-radius: 8px; cursor: pointer; border-left: 4px solid ${getPriorityColor(item.prioridad)}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); transition: transform 0.2s;">
                            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">${item.nombre}</div>
                            <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 4px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                ${item.area_estrategica || 'General'}
                            </div>
                            <div style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 1rem;">
                                ${item.descripcion || 'Sin justificación técnica...'}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                                <div>
                                    <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Presupuesto</div>
                                    <div style="font-weight: 600;">$${(parseFloat(item.costo_estimado)||0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; color: #cbd5e1;">${item.tipo_inversion || 'CAPEX'}</span>
                                </div>
                            </div>
                        </div>
                `;
            });
        }
        
        html += `
                    </div>
                </div>
        `;
    });

    html += `
            </div>
        </div>
    </div>
    `;

    return html;
}
