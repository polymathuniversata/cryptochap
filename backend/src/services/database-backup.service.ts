import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../services/logging.service';

/**
 * Database backup service
 * Provides automated backup functionality for PostgreSQL
 */
export class DatabaseBackupService {
  private static instance: DatabaseBackupService;
  private backupConfig = {
    backupDir: process.env.DB_BACKUP_DIR || path.join(process.cwd(), 'backups'),
    keepBackups: parseInt(process.env.DB_BACKUP_RETENTION_DAYS || '7'),
    backupInterval: parseInt(process.env.DB_BACKUP_INTERVAL_HOURS || '24'), // hours
    compressBackups: process.env.DB_BACKUP_COMPRESS === 'true'
  };

  private constructor() {
    this.initializeBackupDirectory();
    this.scheduleAutomaticBackups();
  }

  public static getInstance(): DatabaseBackupService {
    if (!DatabaseBackupService.instance) {
      DatabaseBackupService.instance = new DatabaseBackupService();
    }
    return DatabaseBackupService.instance;
  }

  /**
   * Initialize backup directory
   */
  private initializeBackupDirectory(): void {
    if (!fs.existsSync(this.backupConfig.backupDir)) {
      fs.mkdirSync(this.backupConfig.backupDir, { recursive: true });
      logger.info('Created backup directory', { path: this.backupConfig.backupDir });
    }
  }

  /**
   * Schedule automatic backups
   */
  private scheduleAutomaticBackups(): void {
    const intervalMs = this.backupConfig.backupInterval * 60 * 60 * 1000; // Convert hours to ms

    setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        logger.error('Automatic backup failed', { error: (error as Error).message });
      }
    }, intervalMs);

    logger.info('Automatic backup scheduling initialized', {
      interval: `${this.backupConfig.backupInterval} hours`,
      retention: `${this.backupConfig.keepBackups} days`
    });
  }

  /**
   * Create a database backup
   */
  public async createBackup(customFilename?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = customFilename || `cryptochap-backup-${timestamp}.sql`;
    const filepath = path.join(this.backupConfig.backupDir, filename);

    try {
      const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'cryptochap',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
      });

      await client.connect();

      // Get all table names
      const tablesResult = await client.query(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);

      const tables = tablesResult.rows.map(row => row.tablename);

      // Create backup file
      let backupContent = `-- CryptoChap Database Backup\n`;
      backupContent += `-- Generated: ${new Date().toISOString()}\n`;
      backupContent += `-- Tables: ${tables.length}\n\n`;

      // Add schema information
      backupContent += `-- Schema Information\n`;
      backupContent += `SET statement_timeout = 0;\n`;
      backupContent += `SET lock_timeout = 0;\n`;
      backupContent += `SET idle_in_transaction_session_timeout = 0;\n`;
      backupContent += `SET client_encoding = 'UTF8';\n`;
      backupContent += `SET standard_conforming_strings = on;\n`;
      backupContent += `SET check_function_bodies = false;\n`;
      backupContent += `SET xmloption = content;\n`;
      backupContent += `SET client_min_messages = warning;\n`;
      backupContent += `SET row_security = off;\n\n`;

      // Backup each table
      for (const table of tables) {
        backupContent += `-- Backing up table: ${table}\n`;

        // Get table structure
        const structureResult = await client.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [table]);

        // Create table structure
        const columns = structureResult.rows.map(col => {
          let colDef = `"${col.column_name}" ${col.data_type}`;

          if (col.character_maximum_length && col.data_type === 'character varying') {
            colDef += `(${col.character_maximum_length})`;
          } else if (col.numeric_precision && col.data_type === 'numeric') {
            colDef += `(${col.numeric_precision},${col.numeric_scale || 0})`;
          }

          if (col.is_nullable === 'NO') {
            colDef += ' NOT NULL';
          }

          if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`;
          }

          return colDef;
        }).join(', ');

        backupContent += `CREATE TABLE IF NOT EXISTS "${table}" (${columns});\n\n`;

        // Get table data
        const dataResult = await client.query(`SELECT * FROM "${table}" ORDER BY 1`);
        const rows = dataResult.rows;

        if (rows.length > 0) {
          // Create INSERT statements
          const columnsList = structureResult.rows.map(col => `"${col.column_name}"`).join(', ');
          const valuesList = rows.map(row => {
            const values = Object.values(row).map(value => {
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'boolean') return value ? 'true' : 'false';
              if (value instanceof Date) return `'${value.toISOString()}'`;
              if (value === null) return 'NULL';
              return value!.toString();
            });
            return `(${values.join(', ')})`;
          }).join(',\n  ');

          backupContent += `INSERT INTO "${table}" (${columnsList}) VALUES\n  ${valuesList};\n\n`;
        }

        // Add indexes
        const indexesResult = await client.query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = $1 AND schemaname = 'public';
        `, [table]);

        for (const index of indexesResult.rows) {
          backupContent += `${index.indexdef};\n`;
        }

      }

      // Add footer
      backupContent += `-- Backup completed at ${new Date().toISOString()}\n`;
      backupContent += `-- Total tables backed up: ${tables.length}\n`;

      // Write to file
      fs.writeFileSync(filepath, backupContent, 'utf8');

      await client.end();

      const fileSize = fs.statSync(filepath).size;
      logger.info('Database backup created successfully', {
        filename,
        filepath,
        size: `${Math.round(fileSize / 1024)} KB`,
        tables: tables.length
      });

      return filepath;

    } catch (error) {
      logger.error('Database backup failed', {
        error: (error as Error).message,
        filename,
        filepath
      });
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  public async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.backupConfig.backupDir)
        .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
        .map(file => ({
          name: file,
          path: path.join(this.backupConfig.backupDir, file),
          mtime: fs.statSync(path.join(this.backupConfig.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Sort by newest first

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupConfig.keepBackups);

      let deletedCount = 0;
      for (const file of files) {
        if (file.mtime < cutoffDate) {
          fs.unlinkSync(file.path);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info('Old backups cleaned up', {
          deleted: deletedCount,
          retentionDays: this.backupConfig.keepBackups
        });
      }

    } catch (error) {
      logger.error('Backup cleanup failed', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'cryptochap',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
      });

      await client.connect();

      // Read backup file
      const backupContent = fs.readFileSync(backupPath, 'utf8');

      // Split by statements and execute
      const statements = backupContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement);
        }
      }

      await client.end();

      logger.info('Database restored from backup', {
        backupPath,
        statements: statements.length
      });

    } catch (error) {
      logger.error('Database restore failed', {
        error: (error as Error).message,
        backupPath
      });
      throw error;
    }
  }

  /**
   * Get backup information
   */
  public getBackupInfo(): {
    backupDir: string;
    totalBackups: number;
    latestBackup?: string;
    totalSize: number;
  } {
    try {
      const files = fs.readdirSync(this.backupConfig.backupDir)
        .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'));

      const filesWithStats = files.map(file => {
        const filepath = path.join(this.backupConfig.backupDir, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          path: filepath,
          size: stats.size,
          mtime: stats.mtime
        };
      }).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const totalSize = filesWithStats.reduce((sum, file) => sum + file.size, 0);

      return {
        backupDir: this.backupConfig.backupDir,
        totalBackups: files.length,
        latestBackup: filesWithStats[0]?.name,
        totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100 // MB with 2 decimal places
      };

    } catch (error) {
      logger.error('Failed to get backup info', {
        error: (error as Error).message
      });

      return {
        backupDir: this.backupConfig.backupDir,
        totalBackups: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Manual backup creation (for API endpoint)
   */
  public async manualBackup(): Promise<{ success: boolean; filename: string; path: string }> {
    const filename = `manual-backup-${Date.now()}.sql`;
    const backupPath = await this.createBackup(filename);

    return {
      success: true,
      filename,
      path: backupPath
    };
  }
}

// Export singleton instance
export const databaseBackup = DatabaseBackupService.getInstance();
