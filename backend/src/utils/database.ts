import { Pool } from 'pg';
import { logger } from '../utils/logger';

/**
 * Database connection and query utilities
 */
export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cryptochap',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client) => {
      logger.info('New database client connected');
    });

    this.pool.on('error', (err, client) => {
      logger.error('Unexpected database error', { error: err.message });
    });
  }

  /**
   * Execute a query with parameters
   */
  public async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<{ rows: T[]; rowCount: number }> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Database query executed', {
        query: text,
        duration: `${duration}ms`,
        rowCount: result.rowCount,
      });

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
      };
    } catch (error) {
      logger.error('Database query failed', {
        query: text,
        error: (error as Error).message,
        duration: `${Date.now() - start}ms`,
      });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool
   */
  public async getClient(): Promise<any> {
    return await this.pool.connect();
  }

  /**
   * Close the database connection pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed', { error: (error as Error).message });
      return false;
    }
  }
}

// Export singleton instance
export const db = Database.getInstance();