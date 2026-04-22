/**
 * CalendarioAgricolaModel.js
 * Manages the agricultural cycle (May 1st to April 30th).
 * Divided into 52 weeks with phenological states and associated labors.
 */

export class CalendarioAgricolaModel {
    static CICLO_START_MONTH = 4; // May (0-indexed)
    static CICLO_START_DAY = 1;

    static PHENOLOGICAL_STATES = [
        { id: 'reposo', name: 'Reposo Invernal', color: '#94a3b8' },
        { id: 'poda', name: 'Poda', color: '#10b981' },
        { id: 'brotacion', name: 'Brotación', color: '#22c55e' },
        { id: 'floracion', name: 'Floración', color: '#3b82f6' },
        { id: 'cuaje', name: 'Cuaje', color: '#06b6d4' },
        { id: 'envero', name: 'Envero', color: '#f59e0b' },
        { id: 'maduracion', name: 'Maduración', color: '#f97316' },
        { id: 'cosecha', name: 'Cosecha', color: '#ef4444' },
        { id: 'postcosecha', name: 'Postcosecha', color: '#8b5cf6' }
    ];

    static DEFAULT_LABORS = [
        { id: 'l1', stateId: 'poda', name: 'Poda', startWeek: 1, duration: 8 },
        { id: 'l2', stateId: 'poda', name: 'Repase de Poda', startWeek: 5, duration: 4 },
        { id: 'l3', stateId: 'poda', name: 'Pintura de Cortes', startWeek: 2, duration: 8 },
        { id: 'l4', stateId: 'brotacion', name: 'Desbrote', startWeek: 18, duration: 4 },
        { id: 'l5', stateId: 'brotacion', name: 'Acomodado de Brotes', startWeek: 20, duration: 6 },
        { id: 'l6', stateId: 'cosecha', name: 'Cosecha', startWeek: 42, duration: 6 }
    ];

    /**
     * Generates a 52-week structure for a given cycle year.
     * Cycle 2026 starts on 01/05/2026.
     */
    static getWeeksForCycle(year) {
        const weeks = [];
        const startDate = new Date(year, this.CICLO_START_MONTH, this.CICLO_START_DAY);
        
        for (let i = 0; i < 52; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() + (i * 7));
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            weeks.push({
                number: i + 1,
                start: weekStart,
                end: weekEnd,
                label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`
            });
        }
        return weeks;
    }

    /**
     * Loads the calendar data from storage or defaults.
     */
    static loadData(ciclo) {
        const key = `nf_calendario_${ciclo}`;
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
        
        // Default structure
        return {
            ciclo,
            labors: this.DEFAULT_LABORS.map(l => ({ ...l })),
            statesMapping: this.getInitialStatesMapping()
        };
    }

    static getInitialStatesMapping() {
        // Simple default mapping: weeks assigned to states
        const mapping = {};
        for (let i = 1; i <= 52; i++) {
            if (i <= 4) mapping[i] = 'reposo';
            else if (i <= 14) mapping[i] = 'poda';
            else if (i <= 22) mapping[i] = 'brotacion';
            else if (i <= 26) mapping[i] = 'floracion';
            else if (i <= 30) mapping[i] = 'cuaje';
            else if (i <= 36) mapping[i] = 'envero';
            else if (i <= 42) mapping[i] = 'maduracion';
            else if (i <= 48) mapping[i] = 'cosecha';
            else mapping[i] = 'postcosecha';
        }
        return mapping;
    }

    static saveData(ciclo, data) {
        localStorage.setItem(`nf_calendario_${ciclo}`, JSON.stringify(data));
    }

    /**
     * Shifts a labor and all subsequent labors if requested.
     */
    static shiftLabor(ciclo, laborId, deltaWeeks, shiftSubsequent = false) {
        const data = this.loadData(ciclo);
        const labor = data.labors.find(l => l.id === laborId);
        if (!labor) return;

        const oldStart = labor.startWeek;
        labor.startWeek += deltaWeeks;
        if (labor.startWeek < 1) labor.startWeek = 1;

        if (shiftSubsequent) {
            data.labors.forEach(l => {
                if (l.id !== laborId && l.startWeek >= oldStart) {
                    l.startWeek += deltaWeeks;
                    if (l.startWeek < 1) l.startWeek = 1;
                }
            });
        }

        this.saveData(ciclo, data);
        return data;
    }
}
