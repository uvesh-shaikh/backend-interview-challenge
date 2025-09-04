export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  sync_status: 'pending' | 'synced' | 'error';
  server_id?: string;
  last_synced_at?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface SyncOperation {
  id: string;
  operation_type: 'create' | 'update' | 'delete';
  task_id: string;
  task_data: string; // JSON string of task data
  retry_count: number;
  created_at: string;
  last_attempted_at?: string;
  error_message?: string;
}

export interface SyncResult {
  successful: number;
  failed: number;
  conflicts: number;
  total: number;
  errors: Array<{
    task_id: string;
    error: string;
  }>;
}