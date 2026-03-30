
import axios from 'axios';

async function audit() {
    const key = '12345NC5xQdXAxT6jj8WrPH26krbn2y7sf6tt8mf';
    const baseUrl = 'http://localhost:10000/sofia-api/trabajvsfaenas';
    
    const ranges = [
        { d: '2026-01-01', h: '2026-03-31' } 
    ];

    const workers = new Set();
    const records = [];

    for (const r of ranges) {
        const url = `${baseUrl}?nombre_usuario=NATURALFOOD&key_usuario=${key}&fecha_inicial=${r.d}&fecha_final=${r.h}`;
        const res = await axios.get(url);
        if (!Array.isArray(res.data)) continue;
        
        res.data.forEach(item => {
            const labor = (item.labor || '').toLowerCase();
            if (/^cosecha\s+kg\s*[1-5]\b/i.test(labor)) {
                const name = (item.nombre || '').toUpperCase().trim();
                const rut = (item.rut_trabajador || '').toUpperCase().trim();
                workers.add(`${name} | ${rut}`);
                
                if (name.includes('PLAYA') || rut.includes('PLAYA')) {
                    records.push({ date: item.fecha, worker: name, weight: item.rendimiento, clasifica: item.clasificacion || item.clasifica || item.Clasifica });
                }
            }
        });
    }

    console.log("Playa records (Summary):", records);
}

audit();
