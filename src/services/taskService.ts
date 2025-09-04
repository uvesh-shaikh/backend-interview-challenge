import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection';
import { Task, CreateTaskRequest, UpdateTaskRequest, SyncOperation } from '../types/task';

export class TaskService {
  private db = getDatabase();

  async getAllTasks(): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE is_deleted = 0 
      ORDER BY created_at DESC
    `;
    
    return await this.db.all(query);
  }

  async getTaskById(id: string): Promise<Task | null> {
    const query = `
      SELECT * FROM tasks 
      WHERE id = ? AND is_deleted = 0
    `;
    
    return await this.db.get(query, [id]);
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || undefined,
      completed: false,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      sync_status: 'pending',
      server_id: undefined,
      last_synced_at: undefined
    };

    const query = `
      INSERT INTO tasks (
        id, title, description, completed, created_at, updated_at,
        is_deleted, sync_status, server_id, last_synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      task.id, task.title, task.description, task.completed,
      task.created_at, task.updated_at, task.is_deleted,
      task.sync_status, task.server_id, task.last_synced_at
    ]);

    // Add to sync queue
    await this.addToSyncQueue('create', task.id, task);

    return task;
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task | null> {
    const existingTask = await this.getTaskById(id);
    if (!existingTask) {
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      updated_at: now,
      sync_status: 'pending'
    };

    const query = `
      UPDATE tasks 
      SET title = ?, description = ?, completed = ?, updated_at = ?, sync_status = ?
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await this.db.run(query, [
      updatedTask.title,
      updatedTask.description,
      updatedTask.completed,
      updatedTask.updated_at,
      updatedTask.sync_status,
      id
    ]);

    if (result.changes === 0) {
      return null;
    }

    // Add to sync queue
    await this.addToSyncQueue('update', id, updatedTask);

    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const existingTask = await this.getTaskById(id);
    if (!existingTask) {
      return false;
    }

    const now = new Date().toISOString();
    
    const query = `
      UPDATE tasks 
      SET is_deleted = 1, updated_at = ?, sync_status = ?
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await this.db.run(query, [now, 'pending', id]);

    if (result.changes === 0) {
      return false;
    }

    const deletedTask = { ...existingTask, is_deleted: true, updated_at: now };
    
    // Add to sync queue
    await this.addToSyncQueue('delete', id, deletedTask);

    return true;
  }

  private async addToSyncQueue(operation: 'create' | 'update' | 'delete', taskId: string, taskData: Task): Promise<void> {
    const now = new Date().toISOString();
    const queueEntry: SyncOperation = {
      id: uuidv4(),
      operation_type: operation,
      task_id: taskId,
      task_data: JSON.stringify(taskData),
      retry_count: 0,
      created_at: now
    };

    const query = `
      INSERT INTO sync_queue (id, operation_type, task_id, task_data, retry_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      queueEntry.id,
      queueEntry.operation_type,
      queueEntry.task_id,
      queueEntry.task_data,
      queueEntry.retry_count,
      queueEntry.created_at
    ]);
  }

  async getPendingTasks(): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks 
      WHERE sync_status = 'pending' AND is_deleted = 0
      ORDER BY updated_at ASC
    `;
    
    return await this.db.all(query);
  }

  async updateSyncStatus(taskId: string, status: 'pending' | 'synced' | 'error', serverId?: string): Promise<void> {
    const now = new Date().toISOString();
    let query: string;
    let params: any[];

    if (status === 'synced' && serverId) {
      query = `
        UPDATE tasks 
        SET sync_status = ?, server_id = ?, last_synced_at = ?
        WHERE id = ?
      `;
      params = [status, serverId, now, taskId];
    } else {
      query = `
        UPDATE tasks 
        SET sync_status = ?
        WHERE id = ?
      `;
      params = [status, taskId];
    }

    await this.db.run(query, params);
  }
}