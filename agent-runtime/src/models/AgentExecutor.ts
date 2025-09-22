import { EventEmitter } from 'events';
import { 
  AgentConfig, 
  AgentRuntimeState, 
  AgentStatus, 
  AgentExecutionRequest, 
  AgentExecutionResponse 
} from '../types/agent';
import { 
  Task, 
  TaskStatus, 
  TaskResult, 
  ToolCallResult 
} from '../types/task';
import { toolService, ToolCallRequest } from '../services/toolService';

export class AgentExecutor extends EventEmitter {
  private config: AgentConfig;
  private state: AgentRuntimeState;
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.state = {
      status: AgentStatus.IDLE,
      currentTasks: [],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageExecutionTime: 0
      }
    };
  }

  // 获取Agent状态
  getStatus(): AgentRuntimeState {
    return { ...this.state };
  }

  // 获取Agent配置
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  // 更新Agent配置
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  // 添加任务到队列
  async addTask(task: Task): Promise<void> {
    if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
      this.taskQueue.push(task);
      this.emit('taskQueued', task);
    } else {
      await this.executeTask(task);
    }
  }

  // 执行任务
  private async executeTask(task: Task): Promise<void> {
    try {
      this.runningTasks.set(task.id, task);
      this.updateTaskStatus(task, TaskStatus.RUNNING);
      this.updateAgentStatus(AgentStatus.BUSY);

      const startTime = new Date();
      
      // 执行Agent推理
      const result = await this.performInference(task);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // 更新任务结果
      task.result = {
        status: TaskStatus.COMPLETED,
        output: result.output,
        toolCalls: result.toolCalls || [],
        startTime,
        endTime,
        duration,
        retryAttempts: task.result?.retryAttempts || 0
      };

      this.updateMetrics(task, duration);
      this.emit('taskCompleted', task);

    } catch (error) {
      await this.handleTaskError(task, error as Error);
    } finally {
      this.runningTasks.delete(task.id);
      this.processNextTask();
    }
  }

  // 执行Agent推理（核心逻辑）
  private async performInference(task: Task): Promise<{
    output: Record<string, any>;
    toolCalls?: ToolCallResult[];
  }> {
    // 这里是Agent推理的核心逻辑
    // 1. 解析任务输入
    // 2. 构建提示词
    // 3. 调用LLM
    // 4. 解析响应
    // 5. 执行工具调用（如果需要）
    
    const { payload } = task.input;
    const toolCalls: ToolCallResult[] = [];

    // 模拟Agent推理过程
    const prompt = this.buildPrompt(task);
    const llmResponse = await this.callLLM(prompt);
    
    // 解析是否需要工具调用
    const toolCallRequests = this.parseToolCalls(llmResponse);
    
    // 执行工具调用
    for (const toolCall of toolCallRequests) {
      const toolResult = await this.executeToolCall(toolCall);
      toolCalls.push(toolResult);
    }

    return {
      output: {
        response: llmResponse,
        toolResults: toolCalls.map(tc => tc.output)
      },
      toolCalls
    };
  }

  // 构建提示词
  private buildPrompt(task: Task): string {
    const systemPrompt = this.config.prompt;
    const userInput = JSON.stringify(task.input.payload);
    const context = task.input.context;
    
    return `${systemPrompt}\n\nContext: ${JSON.stringify(context)}\n\nUser Input: ${userInput}`;
  }

  // 调用LLM（模拟）
  private async callLLM(prompt: string): Promise<string> {
    // 这里应该调用实际的LLM API
    // 目前返回模拟响应
    return `Agent response for: ${prompt.substring(0, 100)}...`;
  }

  // 解析工具调用
  private parseToolCalls(response: string): Array<{
    toolId: string;
    input: Record<string, any>;
  }> {
    // 解析LLM响应中的工具调用请求
    // 这里是简化的实现
    return [];
  }

  // 执行工具调用
  private async executeToolCall(toolCall: {
    toolId: string;
    input: Record<string, any>;
  }): Promise<ToolCallResult> {
    try {
      const toolCallRequest: ToolCallRequest = {
        toolId: toolCall.toolId,
        toolName: toolCall.toolId, // 假设toolId就是toolName
        input: toolCall.input,
        timeout: this.config.timeout || 30000
      };

      const result = await toolService.callTool(toolCallRequest);
      
      return {
        toolId: toolCall.toolId,
        toolName: toolCall.toolId,
        input: toolCall.input,
        output: result.output,
        error: result.error,
        duration: result.duration,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        toolId: toolCall.toolId,
        toolName: toolCall.toolId,
        input: toolCall.input,
        error: (error as Error).message,
        duration: 0,
        timestamp: new Date()
      };
    }
  }

  // 调用工具（模拟）
  private async callTool(toolId: string, input: Record<string, any>): Promise<Record<string, any>> {
    // 这里应该调用fastgpt-plugin的工具
    return { result: `Tool ${toolId} executed with input: ${JSON.stringify(input)}` };
  }

  // 处理任务错误
  private async handleTaskError(task: Task, error: Error): Promise<void> {
    const retryAttempts = (task.result?.retryAttempts || 0) + 1;
    
    if (retryAttempts < task.input.retryCount) {
      // 重试任务
      task.result = {
        ...task.result,
        status: TaskStatus.PENDING,
        retryAttempts,
        error: error.message
      } as TaskResult;
      
      setTimeout(() => this.executeTask(task), 1000 * retryAttempts); // 指数退避
      this.emit('taskRetry', task, error);
    } else {
      // 任务失败
      task.result = {
        status: TaskStatus.FAILED,
        error: error.message,
        startTime: new Date(),
        retryAttempts,
        toolCalls: []
      };
      
      this.state.metrics.failedTasks++;
      this.emit('taskFailed', task, error);
    }
  }

  // 更新任务状态
  private updateTaskStatus(task: Task, status: TaskStatus): void {
    if (!task.result) {
      task.result = {
        status,
        startTime: new Date(),
        toolCalls: [],
        retryAttempts: 0
      };
    } else {
      task.result.status = status;
    }
    
    this.emit('taskStatusChanged', task, status);
  }

  // 更新Agent状态
  private updateAgentStatus(status: AgentStatus): void {
    this.state.status = status;
    this.state.lastActivity = new Date();
    this.emit('statusChanged', status);
  }

  // 更新指标
  private updateMetrics(task: Task, duration: number): void {
    this.state.metrics.totalTasks++;
    this.state.metrics.completedTasks++;
    
    const totalTime = this.state.metrics.averageExecutionTime * (this.state.metrics.completedTasks - 1) + duration;
    this.state.metrics.averageExecutionTime = totalTime / this.state.metrics.completedTasks;
  }

  // 处理下一个任务
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length > 0 && this.runningTasks.size < this.config.maxConcurrentTasks) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        await this.executeTask(nextTask);
      }
    }
    
    // 如果没有运行中的任务，设置为空闲状态
    if (this.runningTasks.size === 0) {
      this.updateAgentStatus(AgentStatus.IDLE);
    }
  }

  // 停止Agent
  async stop(): Promise<void> {
    this.updateAgentStatus(AgentStatus.OFFLINE);
    
    // 等待所有运行中的任务完成
    const runningTaskPromises = Array.from(this.runningTasks.values()).map(task => 
      new Promise<void>(resolve => {
        const checkTask = () => {
          if (task.result?.status === TaskStatus.COMPLETED || task.result?.status === TaskStatus.FAILED) {
            resolve();
          } else {
            setTimeout(checkTask, 100);
          }
        };
        checkTask();
      })
    );
    
    await Promise.all(runningTaskPromises);
    this.emit('stopped');
  }

  // 获取任务统计
  getTaskStats(): {
    queued: number;
    running: number;
    total: number;
    completed: number;
    failed: number;
  } {
    return {
      queued: this.taskQueue.length,
      running: this.runningTasks.size,
      total: this.state.metrics.totalTasks,
      completed: this.state.metrics.completedTasks,
      failed: this.state.metrics.failedTasks
    };
  }
}