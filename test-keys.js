
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST,
    database: process.env.DB_NAME, password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    try {
        const res = await pool.query('SELECT raw_data FROM historicos."2024-2025" LIMIT 50');
        const keys = new Set();
        res.rows.forEach(r => {
            let d = r.raw_data;
            if (typeof d === 'string') d = JSON.parse(d);
            Object.keys(d).forEach(k => keys.add(k));
        });
        console.log('Available keys in raw_data:', Array.from(keys).join(', '));
        
        // Find if any key looks like jornadas
        const candidates = Array.from(keys).filter(k => k.toLowerCase().includes('jornada') || k.toLowerCase().includes('mo') || k.toLowerCase().includes('cantidad'));
        console.log('Candidate keys:', candidates.join(', '));

        res.rows.slice(0, 5).forEach(r => {
             console.log(JSON.stringify(r.raw_data, null, 2));
        });
    } catch (e) { console.error(e); } finally { await pool.end(); }
}
test();
