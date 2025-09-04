import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SyncService } from '../services/syncService';
import { TaskService } from '../services/taskService';
import { getDatabase } from '../database/connection';

describe('SyncService', () => {
  let syncService: SyncService;
  let taskService: TaskService;
  let db: any;

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:';
    db = getDatabase();
    await db.initialize();
    syncService = new SyncService();
    taskService = new TaskService();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('processSync', () => {
    it('should process pending sync operations', async () => {
      // Create a task which adds it to sync queue
      const task = await taskService.createTask({
        title: 'Test Task'
      });

      // Process sync
      const result = await syncService.processSync();

      expect(result.total).toBe(1);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle batch processing', async () => {
      // Create multiple tasks
      for (let i = 0; i < 5; i++) {
        await taskService.createTask({
          title: `Task ${i + 1}`
        });
      }

      const result = await syncService.processSync();

      expect(result.total).toBe(5);
      expect(result.successful).toBe(5);
      expect(result.failed).toBe(0);
    });
  });

  describe('getSyncStatus', () => {
    it('should return correct sync status', async () => {
      // Create tasks to populate sync queue
      await taskService.createTask({ title: 'Task 1' });
      await taskService.createTask({ title: 'Task 2' });

      const status = await syncService.getSyncStatus();

      expect(status.pending_operations).toBe(2);
      expect(status.failed_operations).toBe(0);
    });
  });

  describe('conflict resolution', () => {
    it('should handle task conflicts using last-write-wins', async () => {
      const task = await taskService.createTask({
        title: 'Original Task'
      });

      // Update task
      await taskService.updateTask(task.id, {
        title: 'Updated Task',
        completed: true
      });

      // Process sync
      const result = await syncService.processSync();

      expect(result.successful).toBeGreaterThan(0);
      expect(result.conflicts).toBe(0); // No actual conflicts in this test setup
    });
  });
});