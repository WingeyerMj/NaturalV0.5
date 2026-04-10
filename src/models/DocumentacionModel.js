/**
 * ═══════════════════════════════════════════════════════════
 * NATURALFOOD - Documentación & Remitos Model
 * Handles invoice uploads, delivery tracking, and linking
 * between administrative and operative teams.
 * ═══════════════════════════════════════════════════════════
 */

export class DocumentacionModel {
    static STORAGE_KEY = 'naturalfood_documentacion';
    static REMITOS_KEY = 'naturalfood_remitos';
    static TRANSFERS_KEY = 'naturalfood_transfers';

    static INVOICE_STATUS = {
        PENDING: 'Pendiente de Entrega',
        PARTIAL: 'Entrega Parcial',
        COMPLETED: 'Completado',
        REJECTED: 'Rechazado'
    };

    static TRANSFER_STATUS = {
        PENDING: 'En Tránsito',
        COMPLETED: 'Recibido',
        CANCELLED: 'Cancelado'
    };

    /**
     * Save an invoice to storage
     */
    static saveInvoice(data) {
        const invoices = this.getInvoices();
        const newInvoice = {
            id: 'FACT-' + Date.now(),
            fecha_carga: new Date().toISOString(),
            ...data,
            status: data.entregaEnFactura ? this.INVOICE_STATUS.COMPLETED : this.INVOICE_STATUS.PENDING,
            recibido_operativa: data.entregaEnFactura,
            remitos_asociados: []
        };
        
        invoices.push(newInvoice);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
        return newInvoice;
    }

    /**
     * Get all invoices
     */
    static getInvoices() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Create a partial delivery (Remito) from an invoice
     */
    static addRemito(invoiceId, remitoData) {
        const invoices = this.getInvoices();
        const index = invoices.findIndex(inv => inv.id === invoiceId);
        
        if (index === -1) return null;

        const remito = {
            id: 'REM-' + Date.now(),
            fecha: new Date().toISOString(),
            ...remitoData
        };

        invoices[index].remitos_asociados.push(remito);
        
        // Update status if needed
        if (remitoData.status === 'Completado') {
            invoices[index].status = this.INVOICE_STATUS.COMPLETED;
            invoices[index].recibido_operativa = true;
        } else {
            invoices[index].status = this.INVOICE_STATUS.PARTIAL;
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
        return remito;
    }

    /**
     * Mark an invoice as received in field
     */
    static markReceived(invoiceId) {
        const invoices = this.getInvoices();
        const index = invoices.findIndex(inv => inv.id === invoiceId);
        if (index !== -1) {
            invoices[index].recibido_operativa = true;
            invoices[index].status = this.INVOICE_STATUS.COMPLETED;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
        }
    }

    /** ── INTERNAL TRANSFERS (Inter-Bodega) ── **/

    static saveTransfer(data) {
        const transfers = this.getTransfers();
        const newTransfer = {
            id: 'TRANS-' + Date.now(),
            fecha_emision: new Date().toISOString(),
            status: this.TRANSFER_STATUS.PENDING,
            ...data
        };
        transfers.push(newTransfer);
        localStorage.setItem(this.TRANSFERS_KEY, JSON.stringify(transfers));
        return newTransfer;
    }

    static getTransfers() {
        const stored = localStorage.getItem(this.TRANSFERS_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    static confirmTransfer(transferId, receiverData) {
        const transfers = this.getTransfers();
        const index = transfers.findIndex(t => t.id === transferId);
        if (index === -1) return null;

        transfers[index].status = this.TRANSFER_STATUS.COMPLETED;
        transfers[index].fecha_recepcion = new Date().toISOString();
        transfers[index].receptor = receiverData.receptor;
        transfers[index].notas_recepcion = receiverData.notas;

        localStorage.setItem(this.TRANSFERS_KEY, JSON.stringify(transfers));
        
        // Note: Real stock adjustment would happen here or via a dedicated StockModel
        return transfers[index];
    }
}
