export class OfflineSyncModel {
    static QUEUE_KEY = 'nf_offline_sync_queue';
    static CATALOGS_KEY = 'nf_offline_catalogs';
    static OFFLINE_STATUS_KEY = 'nf_is_offline';

    // GUARDA LOS CATÁLOGOS LOCALMENTE CUANDO HAY INTERNET
    static saveCatalogsLocally(catalogs) {
        try {
            localStorage.setItem(this.CATALOGS_KEY, JSON.stringify(catalogs));
            console.log('[OfflineSync] Catálogos cacheados exitosamente.');
        } catch (e) {
            console.warn('[OfflineSync] Error al cachear catálogos (Storage Full?)', e);
        }
    }

    // RETORNA LOS CATÁLOGOS CACHEADOS (USADO CUANDO SE ESTÁ OFFLINE)
    static getLocalCatalogs() {
        try {
            const data = localStorage.getItem(this.CATALOGS_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    // ENCOLA UNA JORNADA PARA SINCRONIZACIÓN FUTURA
    static enqueueWorkLog(logData) {
        try {
            let queue = this.getSyncQueue();
            // Asigna un pseudo-ID para que pueda eliminarse/editarse en la vista móvil
            logData._offlineId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            logData._createdAt = new Date().toISOString();
            
            queue.push(logData);
            localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
            console.log('[OfflineSync] Log encolado. Hay', queue.length, 'pendientes.');
            
            // Dispatch event to update UI
            window.dispatchEvent(new CustomEvent('nf-sync-queue-updated', { detail: queue.length }));
            return true;
        } catch (e) {
            console.error('[OfflineSync] Error encolando:', e);
            return false;
        }
    }

    static getSyncQueue() {
        const data = localStorage.getItem(this.QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static dequeueWorkLog(offlineId) {
        let queue = this.getSyncQueue();
        queue = queue.filter(item => item._offlineId !== offlineId);
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
        window.dispatchEvent(new CustomEvent('nf-sync-queue-updated', { detail: queue.length }));
    }

    static clearQueue() {
        localStorage.removeItem(this.QUEUE_KEY);
        window.dispatchEvent(new CustomEvent('nf-sync-queue-updated', { detail: 0 }));
    }

    // DETECCIÓN DE ESTADO DE RED
    static isOnline() {
        return navigator.onLine;
    }
}
