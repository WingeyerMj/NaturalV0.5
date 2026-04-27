export class OfflineSyncModel {
    static QUEUE_KEY = 'nf_offline_sync_queue';
    static CATALOGS_KEY = 'nf_offline_catalogs';
    static OFFLINE_STATUS_KEY = 'nf_is_offline';

    /**
     * Cachea catálogos maestros para uso offline
     */
    static saveCatalogsLocally(catalogs) {
        try {
            // Unificamos con los existentes si hay
            const existing = this.getLocalCatalogs() || {};
            const merged = { ...existing, ...catalogs };
            localStorage.setItem(this.CATALOGS_KEY, JSON.stringify(merged));
            console.log('[OfflineSync] Catálogos actualizados localmente.');
        } catch (e) {
            console.warn('[OfflineSync] Error al cachear catálogos', e);
        }
    }

    static getLocalCatalogs() {
        try {
            const data = localStorage.getItem(this.CATALOGS_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Encola cualquier tipo de registro para sincronización
     * @param {string} type - Tipo de entidad (worklog, stock, maintenance)
     * @param {object} data - Datos a guardar
     */
    static enqueue(type, data) {
        try {
            let queue = this.getSyncQueue();
            const item = {
                _offlineId: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                _type: type,
                _createdAt: new Date().toISOString(),
                ...data
            };
            
            queue.push(item);
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
            
            window.dispatchEvent(new CustomEvent('nf-sync-queue-updated', { 
                detail: { count: queue.length, lastItem: item } 
            }));
            return true;
        } catch (e) {
            console.error('[OfflineSync] Error encolando:', e);
            return false;
        }
    }

    // Compatibilidad con código anterior
    static enqueueWorkLog(logData) {
        return this.enqueue('worklog', logData);
    }

    static getSyncQueue(type = null) {
        const data = localStorage.getItem(this.QUEUE_KEY);
        const queue = data ? JSON.parse(data) : [];
        if (type) return queue.filter(item => item._type === type);
        return queue;
    }

    static dequeue(offlineId) {
        let queue = this.getSyncQueue();
        queue = queue.filter(item => item._offlineId !== offlineId);
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
        window.dispatchEvent(new CustomEvent('nf-sync-queue-updated', { detail: { count: queue.length } }));
    }

    // Compatibilidad con código anterior
    static dequeueWorkLog(offlineId) {
        this.dequeue(offlineId);
    }

    static clearQueue() {
        localStorage.removeItem(this.QUEUE_KEY);
        window.dispatchEvent(new CustomEvent('nf-sync-queue-updated', { detail: { count: 0 } }));
    }

    static isOnline() {
        return navigator.onLine;
    }
}
