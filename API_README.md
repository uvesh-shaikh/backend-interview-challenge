# Task Management API Documentation

A comprehensive REST API for task management with offline capabilities and automatic synchronization.

## Features

- Create, read, update, and delete tasks
- Offline-first architecture with local SQLite database
- Automatic synchronization with external systems
- RESTful API design
- TypeScript implementation
- Comprehensive error handling
- Validation middleware

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` by default.

## API Documentation

### Base URL
```
http://localhost:3000
```

### Health Check

#### Get API Health Status
- **GET** `/health`
- **Description:** Check if the API is running

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-04T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## Task Management Endpoints

### Get All Tasks
- **GET** `/api/tasks`
- **Description:** Retrieve all non-deleted tasks

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "completed": false,
    "created_at": "2025-09-04T10:00:00.000Z",
    "updated_at": "2025-09-04T10:00:00.000Z",
    "is_deleted": false,
    "sync_status": "pending",
    "server_id": null,
    "last_synced_at": null
  }
]
```

### Get Task by ID
- **GET** `/api/tasks/:id`
- **Description:** Retrieve a specific task by its ID

**Parameters:**
- `id` (string, required) - Task UUID

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "completed": false,
  "created_at": "2025-09-04T10:00:00.000Z",
  "updated_at": "2025-09-04T10:00:00.000Z",
  "is_deleted": false,
  "sync_status": "pending",
  "server_id": null,
  "last_synced_at": null
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

### Create New Task
- **POST** `/api/tasks`
- **Description:** Create a new task

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation"
}
```

**Request Body (Minimal):**
```json
{
  "title": "Buy groceries"
}
```

**Validation Rules:**
- `title` (string, required) - Must be non-empty, max 255 characters
- `description` (string, optional) - Any string

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "completed": false,
  "created_at": "2025-09-04T10:00:00.000Z",
  "updated_at": "2025-09-04T10:00:00.000Z",
  "is_deleted": false,
  "sync_status": "pending",
  "server_id": null,
  "last_synced_at": null
}
```

**Error Response (400):**
```json
{
  "error": "Title is required and must be a non-empty string"
}
```

### Update Task
- **PUT** `/api/tasks/:id`
- **Description:** Update an existing task

**Parameters:**
- `id` (string, required) - Task UUID

**Request Body (all fields optional):**
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "completed": true
}
```

**Request Body (Partial Update):**
```json
{
  "completed": true
}
```

**Validation Rules:**
- `title` (string, optional) - If provided, must be non-empty, max 255 characters
- `description` (string, optional) - If provided, must be a string
- `completed` (boolean, optional) - If provided, must be boolean

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated task title",
  "description": "Updated description",
  "completed": true,
  "created_at": "2025-09-04T10:00:00.000Z",
  "updated_at": "2025-09-04T11:00:00.000Z",
  "is_deleted": false,
  "sync_status": "pending",
  "server_id": null,
  "last_synced_at": null
}
```

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

**Error Response (400):**
```json
{
  "error": "Title must be a non-empty string"
}
```

### Delete Task
- **DELETE** `/api/tasks/:id`
- **Description:** Soft delete a task (marks as deleted, doesn't remove from database)

**Parameters:**
- `id` (string, required) - Task UUID

**Success Response (204):**
- No content returned

**Error Response (404):**
```json
{
  "error": "Task not found"
}
```

---

## Synchronization Endpoints

### Trigger Sync Operation
- **POST** `/api/sync`
- **Description:** Manually trigger synchronization with external systems

**Success Response (200):**
```json
{
  "message": "Sync completed successfully",
  "successful": 5,
  "failed": 0,
  "conflicts": 0,
  "total": 5,
  "errors": []
}
```

**Partial Success Response (207):**
```json
{
  "message": "Sync completed with some failures",
  "successful": 3,
  "failed": 2,
  "conflicts": 0,
  "total": 5,
  "errors": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440001",
      "error": "Network timeout"
    },
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440002",
      "error": "Server rejected update"
    }
  ]
}
```

### Get Sync Status
- **GET** `/api/sync/status`
- **Description:** Get current synchronization status

**Response:**
```json
{
  "pending_operations": 3,
  "failed_operations": 1,
  "last_sync_attempt": "2025-09-04T10:30:00.000Z",
  "next_scheduled_sync": "2025-09-04T11:00:00.000Z"
}
```

### Retry Failed Sync Operations
- **POST** `/api/sync/retry`
- **Description:** Reset failed sync operations for retry

**Response:**
```json
{
  "message": "Failed operations have been reset for retry"
}
```

### Clear Failed Sync Operations
- **DELETE** `/api/sync/failed`
- **Description:** Remove all failed sync operations from the queue

**Response:**
```json
{
  "message": "Failed sync operations have been cleared"
}
```

---

## Error Responses

### Common Error Codes

- **400 Bad Request** - Invalid request data or validation errors
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Error Response Format
```json
{
  "error": "Error message description"
}
```

### Server Error Response
```json
{
  "error": "Internal server error during sync operation",
  "details": "Specific error details"
}
```

---

## Data Models

### Task Object
```typescript
{
  id: string;                    // UUID
  title: string;                 // Task title (max 255 chars)
  description?: string;          // Optional description
  completed: boolean;            // Completion status
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
  is_deleted: boolean;          // Soft delete flag
  sync_status: 'pending' | 'synced' | 'error';
  server_id?: string;           // External system ID
  last_synced_at?: string;      // Last sync timestamp
}
```

### Create Task Request
```typescript
{
  title: string;                // Required, non-empty
  description?: string;         // Optional
}
```

### Update Task Request
```typescript
{
  title?: string;               // Optional, non-empty if provided
  description?: string;         // Optional
  completed?: boolean;          // Optional
}
```

---

## Example Usage

### Creating a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn TypeScript",
    "description": "Complete TypeScript tutorial and build a project"
  }'
```

### Getting All Tasks
```bash
curl -X GET http://localhost:3000/api/tasks
```

### Updating a Task
```bash
curl -X PUT http://localhost:3000/api/tasks/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

### Deleting a Task
```bash
curl -X DELETE http://localhost:3000/api/tasks/550e8400-e29b-41d4-a716-446655440000
```

### Triggering Sync
```bash
curl -X POST http://localhost:3000/api/sync
```

## JavaScript/Node.js Examples

### Using fetch API

#### Create a Task
```javascript
const createTask = async (title, description) => {
  const response = await fetch('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
};
```

#### Get All Tasks
```javascript
const getAllTasks = async () => {
  const response = await fetch('http://localhost:3000/api/tasks');
  
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  
  return await response.json();
};
```

#### Update a Task
```javascript
const updateTask = async (taskId, updates) => {
  const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return await response.json();
};
```

#### Delete a Task
```javascript
const deleteTask = async (taskId) => {
  const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return true; // Success, no content returned
};
```

## Postman Collection

You can import the following endpoints into Postman for testing:

### Environment Variables
- `base_url`: `http://localhost:3000`
- `task_id`: `550e8400-e29b-41d4-a716-446655440000` (example)

### Collection Endpoints

1. **Health Check**
   - Method: GET
   - URL: `{{base_url}}/health`

2. **Get All Tasks**
   - Method: GET
   - URL: `{{base_url}}/api/tasks`

3. **Get Task by ID**
   - Method: GET
   - URL: `{{base_url}}/api/tasks/{{task_id}}`

4. **Create Task**
   - Method: POST
   - URL: `{{base_url}}/api/tasks`
   - Body (JSON):
   ```json
   {
     "title": "Test Task",
     "description": "This is a test task"
   }
   ```

5. **Update Task**
   - Method: PUT
   - URL: `{{base_url}}/api/tasks/{{task_id}}`
   - Body (JSON):
   ```json
   {
     "completed": true
   }
   ```

6. **Delete Task**
   - Method: DELETE
   - URL: `{{base_url}}/api/tasks/{{task_id}}`

7. **Trigger Sync**
   - Method: POST
   - URL: `{{base_url}}/api/sync`

8. **Get Sync Status**
   - Method: GET
   - URL: `{{base_url}}/api/sync/status`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
