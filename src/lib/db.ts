import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

// Prevent multiple instances of Pool in development
declare global {
  var pgPool: Pool | undefined;
}

const pool = globalThis.pgPool || new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for secure Neon connections
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.pgPool = pool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;
