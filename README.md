# Personal Task Management Backend with Offline Sync

A robust backend API for a personal productivity application designed for users in India with intermittent internet connectivity. The system supports offline-first functionality with automatic synchronization when connectivity is restored.

## Features

### Core Functionality
- **Complete CRUD Operations**: Create, read, update, and delete tasks
- **Offline-First Architecture**: All operations work offline and sync when online
- **Conflict Resolution**: Last-write-wins strategy for handling data conflicts
- **Soft Deletes**: Tasks are never permanently deleted, ensuring data integrity
- **Batch Processing**: Efficient sync operations with configurable batch sizes
- **Retry Mechanism**: Automatic retries for failed sync operations

### API Endpoints

#### Task Management
- `GET /api/tasks` - Retrieve all non-deleted tasks
- `GET /api/tasks/:id` - Get a specific task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Soft delete a task

#### Sync Management
- `POST /api/sync` - Trigger sync operation
- `GET /api/sync/status` - Get current sync status
- `POST /api/sync/retry` - Retry failed sync operations
- `DELETE /api/sync/failed` - Clear all failed sync operations

#### Health Check
- `GET /health` - Application health status

## Architecture

### Data Model
Each task contains:
- `id`: Unique identifier (UUID)
- `title`: Task title (required, max 255 chars)
- `description`: Optional task description
- `completed`: Boolean completion status
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp
- `is_deleted`: Soft delete flag
- `sync_status`: Sync state ('pending', 'synced', 'error')
- `server_id`: Server-assigned ID after sync
- `last_synced_at`: Last successful sync timestamp

### Sync Queue
Operations are tracked in a sync queue with:
- Operation type (create/update/delete)
- Task data snapshot
- Retry attempts tracking
- Error message logging

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

### Configuration

Environment variables (`.env`):
```
PORT=3000
BATCH_SIZE=50
MAX_RETRY_ATTEMPTS=3
DB_PATH=./database.sqlite
NODE_ENV=development
```

## Usage

### Creating a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Complete project", "description": "Finish the sync implementation"}'
```

### Updating a Task
```bash
curl -X PUT http://localhost:3000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Triggering Sync
```bash
curl -X POST http://localhost:3000/api/sync
```

### Checking Sync Status
```bash
curl http://localhost:3000/api/sync/status
```

## Testing

Run the test suite:
```bash
npm run test
```

Run with coverage:
```bash
npm run test:coverage
```

Run type checking:
```bash
npm run typecheck
```

## Sync Strategy

### Offline Operations
1. All CRUD operations work immediately offline
2. Changes are queued in the sync queue
3. Tasks are marked with `sync_status: 'pending'`

### Online Synchronization
1. Batch processing of queued operations (configurable batch size)
2. Conflict resolution using last-write-wins based on `updated_at`
3. Automatic retry with exponential backoff for failed operations
4. Comprehensive logging of all sync activities

### Conflict Resolution
- **Last-Write-Wins**: The most recently updated version wins
- **Conflict Logging**: All conflicts are logged for debugging
- **Data Preservation**: No data is lost during conflict resolution

## Error Handling

- **Network Failures**: Graceful handling without crashes
- **Retry Logic**: Maximum 3 attempts with exponential backoff
- **Validation**: Comprehensive input validation
- **Logging**: Detailed error logging and sync conflict tracking

## Performance Optimizations

- **Batch Operations**: Configurable batch sizes for sync operations
- **Database Indexes**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Minimal Queries**: Optimized database operations

## Development Assumptions

1. **Single User**: Designed for personal use (no multi-user authentication)
2. **Local Storage**: SQLite for local data persistence
3. **Simulated Server**: For demonstration, "sync" operations are simulated
4. **UUID Generation**: Client-side UUID generation for offline capabilities
5. **Timestamp-Based Conflicts**: Using ISO timestamps for conflict resolution

## Production Considerations

For production deployment:
1. Implement actual remote server sync endpoints
2. Add user authentication and authorization
3. Use PostgreSQL or similar for production database
4. Implement connection pooling
5. Add rate limiting and security headers
6. Set up monitoring and alerting
7. Implement proper logging infrastructure

## Contributing

1. Follow TypeScript strict mode guidelines
2. Maintain test coverage above 80%
3. Use conventional commit messages
4. Run linting and type checking before commits

## License

Private project - All rights reserved