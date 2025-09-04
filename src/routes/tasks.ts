import { Router, Request, Response } from 'express';
import { TaskService } from '../services/taskService';
import { CreateTaskRequest, UpdateTaskRequest } from '../types/task';

const router = Router();
const taskService = new TaskService();

// Validation middleware
const validateCreateTask = (req: Request, res: Response, next: Function) => {
  const { title } = req.body;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Title is required and must be a non-empty string' 
    });
  }
  
  if (title.length > 255) {
    return res.status(400).json({ 
      error: 'Title must be less than 255 characters' 
    });
  }
  
  next();
};

const validateUpdateTask = (req: Request, res: Response, next: Function) => {
  const { title, description, completed } = req.body;
  
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Title must be a non-empty string' 
      });
    }
    
    if (title.length > 255) {
      return res.status(400).json({ 
        error: 'Title must be less than 255 characters' 
      });
    }
  }
  
  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ 
      error: 'Description must be a string' 
    });
  }
  
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ 
      error: 'Completed must be a boolean' 
    });
  }
  
  next();
};

// GET /api/tasks - Get all non-deleted tasks
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching tasks' 
    });
  }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await taskService.getTaskById(id);
    
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching task' 
    });
  }
});

// POST /api/tasks - Create a new task
router.post('/', validateCreateTask, async (req: Request, res: Response) => {
  try {
    const taskData: CreateTaskRequest = {
      title: req.body.title.trim(),
      description: req.body.description?.trim()
    };
    
    const task = await taskService.createTask(taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      error: 'Internal server error while creating task' 
    });
  }
});

// PUT /api/tasks/:id - Update an existing task
router.put('/:id', validateUpdateTask, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateTaskRequest = {};
    
    if (req.body.title !== undefined) {
      updates.title = req.body.title.trim();
    }
    
    if (req.body.description !== undefined) {
      updates.description = req.body.description?.trim();
    }
    
    if (req.body.completed !== undefined) {
      updates.completed = req.body.completed;
    }
    
    const task = await taskService.updateTask(id, updates);
    
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating task' 
    });
  }
});

// DELETE /api/tasks/:id - Soft delete a task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await taskService.deleteTask(id);
    
    if (!deleted) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting task' 
    });
  }
});

export default router;