import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import taskRoutes from '../routes/tasks';
import syncRoutes from '../routes/sync';
import { getDatabase } from '../database/connection';
import { errorHandler } from '../middleware/errorHandler';

describe('API Endpoints', () => {
  let app: express.Application;
  let db: any;

  beforeEach(async () => {
    process.env.DB_PATH = ':memory:';
    db = getDatabase();
    await db.initialize();

    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
    app.use('/api/sync', syncRoutes);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Title is required');
    });
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      // Create test tasks
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 1' });
      
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 2' });

      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Original Title' });

      const taskId = createResponse.body.id;
      const updates = { title: 'Updated Title', completed: true };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.completed).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .put('/api/tasks/550e8400-e29b-41d4-a716-446655440000')
        .send({ title: 'Updated Title' })
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should soft delete a task', async () => {
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to delete' });

      const taskId = createResponse.body.id;

      await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(204);

      // Verify task is not returned in list
      const listResponse = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(listResponse.body.find((task: any) => task.id === taskId)).toBeUndefined();
    });
  });

  describe('POST /api/sync', () => {
    it('should process sync operations', async () => {
      // Create some tasks to sync
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 1' });
      
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task 2' });

      const response = await request(app)
        .post('/api/sync')
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.successful).toBe(2);
    });
  });

  describe('GET /api/sync/status', () => {
    it('should return sync status', async () => {
      const response = await request(app)
        .get('/api/sync/status')
        .expect(200);

      expect(response.body).toHaveProperty('pending_operations');
      expect(response.body).toHaveProperty('failed_operations');
    });
  });
});