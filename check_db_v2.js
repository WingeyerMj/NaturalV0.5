import pool from './src/db.js';

async function checkColumns() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'trabajo_campo_logs'
        `);
        console.log('Columnas de trabajo_campo_logs:');
        result.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkColumns();
