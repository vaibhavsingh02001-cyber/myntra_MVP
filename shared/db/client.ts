import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Singleton PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client', err.message);
});

export const db = {
  /**
   * Execute a SQL query against the pool.
   */
  query: (text: string, params?: any[]): Promise<QueryResult<any>> =>
    pool.query(text, params),

  /**
   * Acquire a dedicated client for transactions.
   */
  getClient: (): Promise<PoolClient> => pool.connect(),

  /**
   * Run a series of queries inside a transaction.
   * Automatically rolls back on error.
   */
  transaction: async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Ping the database — used for health checks.
   */
  ping: async (): Promise<boolean> => {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Gracefully close the pool (for tests / shutdown).
   */
  close: () => pool.end(),
};

export default db;
