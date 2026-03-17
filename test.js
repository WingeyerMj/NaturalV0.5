import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:wingeyer@localhost:5432/naturalfood_db'
});
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'historicos'").then(res => {
  console.log(res.rows.map(r => r.table_name));
  pool.end();
});
