import { Database } from 'sqlite3';

export const initializeDatabase = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const createTables = `
      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted BOOLEAN DEFAULT 0,
        sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'error')),
        server_id TEXT,
        last_synced_at TEXT
      );

      -- Sync queue table
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        operation_type TEXT NOT NULL CHECK(operation_type IN ('create', 'update', 'delete')),
        task_id TEXT NOT NULL,
        task_data TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        last_attempted_at TEXT,
        error_message TEXT,
        FOREIGN KEY (task_id) REFERENCES tasks (id)
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks(sync_status);
      CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_operation_type ON sync_queue(operation_type);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_retry_count ON sync_queue(retry_count);
    `;

    db.exec(createTables, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};