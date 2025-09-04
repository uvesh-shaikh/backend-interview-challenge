import { getDatabase } from '../database/connection';
import { TaskService } from './taskService';
import { Task, SyncOperation, SyncResult } from '../types/task';

export class SyncService {
  private db = getDatabase();
  private taskService = new TaskService();
  private maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3');
  private batchSize = parseInt(process.env.BATCH_SIZE || '50');

  async getSyncQueue(limit: number = 50): Promise<SyncOperation[]> {
    const query = `
      SELECT * FROM sync_queue 
      WHERE retry_count < ?
      ORDER BY created_at ASC
      LIMIT ?
    `;
    
    return await this.db.all(query, [this.maxRetries, limit]);
  }

  async processSync(): Promise<SyncResult> {
    const operations = await this.getSyncQueue(this.batchSize);
    
    const result: SyncResult = {
      successful: 0,
      failed: 0,
      conflicts: 0,
      total: operations.length,
      errors: []
    };

    for (const operation of operations) {
      try {
        await this.processSyncOperation(operation);
        result.successful++;
        
        // Remove from sync queue on success
        await this.removeFromSyncQueue(operation.id);
        
        // Update task sync status
        await this.taskService.updateSyncStatus(
          operation.task_id, 
          'synced', 
          operation.task_id // Using task_id as server_id for this implementation
        );
      } catch (error) {
        result.failed++;
        result.errors.push({
          task_id: operation.task_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Update retry count and error message
        await this.updateSyncOperationRetry(operation.id, error instanceof Error ? error.message : 'Unknown error');
        
        // Update task sync status to error if max retries exceeded
        if (operation.retry_count + 1 >= this.maxRetries) {
          await this.taskService.updateSyncStatus(operation.task_id, 'error');
        }
      }
    }

    return result;
  }

  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    const taskData: Task = JSON.parse(operation.task_data);
    
    // Simulate server processing and conflict resolution
    switch (operation.operation_type) {
      case 'create':
        await this.handleCreateSync(taskData);
        break;
      case 'update':
        await this.handleUpdateSync(taskData);
        break;
      case 'delete':
        await this.handleDeleteSync(taskData);
        break;
    }
  }

  private async handleCreateSync(task: Task): Promise<void> {
    // In a real implementation, this would send data to a remote server
    // For this demo, we'll simulate server processing
    console.log(`Syncing create operation for task: ${task.id}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check for conflicts (if task already exists on server)
    const existingTask = await this.taskService.getTaskById(task.id);
    if (existingTask && existingTask.server_id) {
      // Conflict detected - use last-write-wins
      console.log(`Conflict detected for task ${task.id} - resolving with last-write-wins`);
      await this.resolveConflict(task, existingTask);
    }
  }

  private async handleUpdateSync(task: Task): Promise<void> {
    console.log(`Syncing update operation for task: ${task.id}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, check server for conflicts
    const existingTask = await this.taskService.getTaskById(task.id);
    if (existingTask && existingTask.last_synced_at) {
      const localUpdate = new Date(task.updated_at);
      const lastSync = new Date(existingTask.last_synced_at);
      
      if (localUpdate > lastSync) {
        console.log(`Local task ${task.id} is newer - proceeding with sync`);
      }
    }
  }

  private async handleDeleteSync(task: Task): Promise<void> {
    console.log(`Syncing delete operation for task: ${task.id}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async resolveConflict(localTask: Task, remoteTask: Task): Promise<void> {
    const localTime = new Date(localTask.updated_at);
    const remoteTime = new Date(remoteTask.updated_at);

    if (localTime >= remoteTime) {
      // Local version wins
      console.log(`Local task ${localTask.id} wins conflict resolution`);
    } else {
      // Remote version wins - update local task
      console.log(`Remote task ${localTask.id} wins conflict resolution`);
      await this.taskService.updateTask(localTask.id, {
        title: remoteTask.title,
        description: remoteTask.description,
        completed: remoteTask.completed
      });
    }
  }

  private async updateSyncOperationRetry(operationId: string, errorMessage: string): Promise<void> {
    const now = new Date().toISOString();
    const query = `
      UPDATE sync_queue 
      SET retry_count = retry_count + 1, last_attempted_at = ?, error_message = ?
      WHERE id = ?
    `;
    
    await this.db.run(query, [now, errorMessage, operationId]);
  }

  private async removeFromSyncQueue(operationId: string): Promise<void> {
    const query = `DELETE FROM sync_queue WHERE id = ?`;
    await this.db.run(query, [operationId]);
  }

  async getSyncStatus(): Promise<{
    pending_operations: number;
    failed_operations: number;
    last_sync_attempt?: string;
  }> {
    const pendingQuery = `SELECT COUNT(*) as count FROM sync_queue WHERE retry_count < ?`;
    const failedQuery = `SELECT COUNT(*) as count FROM sync_queue WHERE retry_count >= ?`;
    const lastAttemptQuery = `SELECT MAX(last_attempted_at) as last_attempt FROM sync_queue`;

    const [pendingResult, failedResult, lastAttemptResult] = await Promise.all([
      this.db.get(pendingQuery, [this.maxRetries]),
      this.db.get(failedQuery, [this.maxRetries]),
      this.db.get(lastAttemptQuery)
    ]);

    return {
      pending_operations: pendingResult.count,
      failed_operations: failedResult.count,
      last_sync_attempt: lastAttemptResult.last_attempt
    };
  }

  async clearFailedOperations(): Promise<void> {
    const query = `DELETE FROM sync_queue WHERE retry_count >= ?`;
    await this.db.run(query, [this.maxRetries]);
  }

  async retryFailedOperations(): Promise<void> {
    const query = `
      UPDATE sync_queue 
      SET retry_count = 0, error_message = NULL 
      WHERE retry_count >= ?
    `;
    await this.db.run(query, [this.maxRetries]);
  }
}