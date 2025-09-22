import { EventEmitter } from 'events';

// 任务状态接口
interface TaskStatus {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  progress?: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// 任务状态管理服务
class TaskStatusService extends EventEmitter {
  private taskStatuses: Map<string, TaskStatus> = new Map();

  // 创建任务状态
  createTaskStatus(taskId: string): TaskStatus {
    const status: TaskStatus = {
      taskId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.taskStatuses.set(taskId, status);
    this.emit('taskCreated', taskId, status);
    
    return status;
  }

  // 更新任务状态
  updateTaskStatus(
    taskId: string, 
    updates: Partial<Omit<TaskStatus, 'taskId' | 'createdAt'>>
  ): TaskStatus | null {
    const currentStatus = this.taskStatuses.get(taskId);
    if (!currentStatus) {
      return null;
    }

    const updatedStatus: TaskStatus = {
      ...currentStatus,
      ...updates,
      updatedAt: new Date()
    };

    // 设置时间戳
    if (updates.status === 'running' && !currentStatus.startedAt) {
      updatedStatus.startedAt = new Date();
    }
    
    if (updates.status && ['completed', 'failed', 'cancelled'].includes(updates.status)) {
      updatedStatus.completedAt = new Date();
    }

    this.taskStatuses.set(taskId, updatedStatus);
    this.emit('taskUpdated', taskId, updatedStatus);
    
    return updatedStatus;
  }

  // 获取任务状态
  getTaskStatus(taskId: string): TaskStatus | null {
    return this.taskStatuses.get(taskId) || null;
  }

  // 获取所有任务状态
  getAllTaskStatuses(): TaskStatus[] {
    return Array.from(this.taskStatuses.values());
  }

  // 获取指定状态的任务
  getTasksByStatus(status: TaskStatus['status']): TaskStatus[] {
    return Array.from(this.taskStatuses.values()).filter(task => task.status === status);
  }

  // 删除任务状态
  removeTaskStatus(taskId: string): boolean {
    const existed = this.taskStatuses.has(taskId);
    if (existed) {
      this.taskStatuses.delete(taskId);
      this.emit('taskRemoved', taskId);
    }
    return existed;
  }

  // 清理完成的任务（可选的清理策略）
  cleanupCompletedTasks(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [taskId, status] of this.taskStatuses.entries()) {
      if (
        ['completed', 'failed', 'cancelled'].includes(status.status) &&
        status.completedAt &&
        status.completedAt < cutoffTime
      ) {
        this.taskStatuses.delete(taskId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.emit('tasksCleanedUp', cleanedCount);
    }

    return cleanedCount;
  }

  // 获取任务统计信息
  getTaskStatistics(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const stats = {
      total: 0,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    for (const status of this.taskStatuses.values()) {
      stats.total++;
      stats[status.status]++;
    }

    return stats;
  }

  // 标记任务开始
  startTask(taskId: string): TaskStatus | null {
    return this.updateTaskStatus(taskId, { status: 'running' });
  }

  // 标记任务完成
  completeTask(taskId: string, result?: any): TaskStatus | null {
    return this.updateTaskStatus(taskId, { 
      status: 'completed', 
      result,
      progress: 100
    });
  }

  // 标记任务失败
  failTask(taskId: string, error: string): TaskStatus | null {
    return this.updateTaskStatus(taskId, { 
      status: 'failed', 
      error 
    });
  }

  // 取消任务
  cancelTask(taskId: string): TaskStatus | null {
    return this.updateTaskStatus(taskId, { status: 'cancelled' });
  }

  // 更新任务进度
  updateTaskProgress(taskId: string, progress: number): TaskStatus | null {
    return this.updateTaskStatus(taskId, { progress });
  }
}

// 导出单例实例
export const taskStatusService = new TaskStatusService();