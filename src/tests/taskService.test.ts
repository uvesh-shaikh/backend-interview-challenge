import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskService } from '../services/taskService';
import { getDatabase } from '../database/connection';

describe('TaskService', () => {
  let taskService: TaskService;
  let db: any;

  beforeEach(async () => {
    // Use in-memory database for tests
    process.env.DB_PATH = ':memory:';
    db = getDatabase();
    await db.initialize();
    taskService = new TaskService();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('createTask', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description'
      };

      const task = await taskService.createTask(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.completed).toBe(false);
      expect(task.sync_status).toBe('pending');
    });

    it('should create task without description', async () => {
      const taskData = {
        title: 'Task without description'
      };

      const task = await taskService.createTask(taskData);

      expect(task.title).toBe(taskData.title);
      expect(task.description).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const task = await taskService.createTask({
        title: 'Original Title',
        description: 'Original Description'
      });

      const updates = {
        title: 'Updated Title',
        completed: true
      };

      const updatedTask = await taskService.updateTask(task.id, updates);

      expect(updatedTask).not.toBeNull();
      expect(updatedTask?.title).toBe(updates.title);
      expect(updatedTask?.completed).toBe(true);
      expect(updatedTask?.sync_status).toBe('pending');
    });

    it('should return null for non-existent task', async () => {
      const result = await taskService.updateTask('non-existent-id', {
        title: 'Updated Title'
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should soft delete a task', async () => {
      const task = await taskService.createTask({
        title: 'Task to delete'
      });

      const deleted = await taskService.deleteTask(task.id);

      expect(deleted).toBe(true);

      // Task should not be returned in getAllTasks
      const tasks = await taskService.getAllTasks();
      expect(tasks.find(t => t.id === task.id)).toBeUndefined();
    });

    it('should return false for non-existent task', async () => {
      const result = await taskService.deleteTask('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('getAllTasks', () => {
    it('should return all non-deleted tasks', async () => {
      await taskService.createTask({ title: 'Task 1' });
      await taskService.createTask({ title: 'Task 2' });
      const task3 = await taskService.createTask({ title: 'Task 3' });
      
      // Delete one task
      await taskService.deleteTask(task3.id);

      const tasks = await taskService.getAllTasks();

      expect(tasks).toHaveLength(2);
      expect(tasks.find(t => t.title === 'Task 1')).toBeDefined();
      expect(tasks.find(t => t.title === 'Task 2')).toBeDefined();
      expect(tasks.find(t => t.title === 'Task 3')).toBeUndefined();
    });
  });
});