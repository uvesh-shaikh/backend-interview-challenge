import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { initializeDatabase } from './schema';

export class DatabaseConnection {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  async initialize(): Promise<void> {
    await initializeDatabase(this.db);
  }

  get(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Singleton instance
let dbInstance: DatabaseConnection | null = null;

export const getDatabase = (): DatabaseConnection => {
  if (!dbInstance) {
    const dbPath = process.env.DB_PATH || './database.sqlite';
    dbInstance = new DatabaseConnection(dbPath);
  }
  return dbInstance;
};