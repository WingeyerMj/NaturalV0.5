
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://naturalfood_db_user:plJPXLHwpgor82vl5vj3ELtbo6FVMcWi@dpg-d6q267s50q8c73aae4b0-a.oregon-postgres.render.com/naturalfood_db';

async function migrate() {
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to Render database...');
        await client.connect();
        console.log('Connected successfully.');

        const sqlPath = path.join(__dirname, '..', 'public', 'Fuentes', 'naturalfood_pg.sql');
        console.log(`Reading SQL file from: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration script...');
        // We execute the whole file as one query. 
        // PostgreSQL handles multi-statement queries in a single string.
        await client.query(sql);
        
        console.log('Migration completed successfully!');
        
        // Verify users
        const res = await client.query('SELECT name, email, role FROM users');
        console.log('\nVerified users in database:');
        res.rows.forEach(row => console.log(`- ${row.name} (${row.email}) as ${row.role}`));

    } catch (err) {
        console.error('Migration failed:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    } finally {
        await client.end();
    }
}

migrate();
