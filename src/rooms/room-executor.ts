/**
 * Room Executor
 * Manages isolated execution contexts ("rooms") for each provider
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

interface RoomConfig {
  provider: string;
  roomPath: string;
  model: string;
  apiKeyEnv: string;
}

interface TaskExecution {
  id: string;
  provider: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  output?: string;
  error?: string;
}

interface RoomResult {
  roomId: string;
  provider: string;
  success: boolean;
  output: string;
  duration: number;
  outputFile: string;
}

export class RoomExecutor extends EventEmitter {
  private workDir: string;
  private rooms: Map<string, RoomConfig> = new Map();
  private executions: Map<string, TaskExecution> = new Map();

  constructor(workDir?: string) {
    super();
    this.workDir = workDir || join(__dirname, '../../work');
    this.ensureWorkDir();
  }

  private ensureWorkDir(): void {
    if (!existsSync(this.workDir)) {
      mkdirSync(this.workDir, { recursive: true });
    }
  }

  /**
   * Register a room for a provider
   */
  registerRoom(provider: string, config: Omit<RoomConfig, 'provider'>): void {
    this.rooms.set(provider, { provider, ...config });
    console.log(`🏠 Room registered: ${provider}`);
  }

  /**
   * Execute a task in an isolated room
   */
  async executeInRoom(
    provider: string,
    task: string,
    agentPrompt: string
  ): Promise<RoomResult> {
    const room = this.rooms.get(provider);
    if (!room) {
      throw new Error(`No room registered for provider: ${provider}`);
    }

    const executionId = `${provider}-${Date.now()}`;
    const outputFile = join(this.workDir, `agent-${executionId}-output.md`);
    const flagFile = join(this.workDir, `agent-${executionId}-complete.flag`);

    const execution: TaskExecution = {
      id: executionId,
      provider,
      task,
      status: 'running',
      startTime: Date.now()
    };
    this.executions.set(executionId, execution);

    this.emit('room:start', { provider, executionId, task });

    try {
      // Build the isolated prompt with output instructions
      const isolatedPrompt = this.buildIsolatedPrompt(task, agentPrompt, outputFile);

      // Execute via the appropriate provider adapter
      const { ProviderAdapter } = await import('../providers/provider-adapter');
      const adapter = new ProviderAdapter(provider);

      const result = await adapter.execute(isolatedPrompt);

      // Write output to file
      writeFileSync(outputFile, result);
      writeFileSync(flagFile, new Date().toISOString());

      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.output = result;

      this.emit('room:complete', { provider, executionId, success: true });

      return {
        roomId: executionId,
        provider,
        success: true,
        output: result,
        duration: execution.endTime - execution.startTime!,
        outputFile
      };

    } catch (error: any) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.error = error.message;

      const errorOutput = `# Execution Failed\n\nProvider: ${provider}\nError: ${error.message}\n`;
      writeFileSync(outputFile, errorOutput);
      writeFileSync(flagFile, 'FAILED');

      this.emit('room:complete', { provider, executionId, success: false, error: error.message });

      return {
        roomId: executionId,
        provider,
        success: false,
        output: errorOutput,
        duration: execution.endTime - execution.startTime!,
        outputFile
      };
    }
  }

  /**
   * Execute multiple tasks in parallel across rooms
   */
  async executeParallel(
    tasks: Array<{ provider: string; task: string; agentPrompt: string }>
  ): Promise<RoomResult[]> {
    this.emit('parallel:start', { count: tasks.length });

    const promises = tasks.map(t =>
      this.executeInRoom(t.provider, t.task, t.agentPrompt)
    );

    const results = await Promise.all(promises);

    this.emit('parallel:complete', {
      count: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;
  }

  /**
   * Build an isolated prompt with output instructions
   */
  private buildIsolatedPrompt(task: string, agentPrompt: string, outputFile: string): string {
    return `${agentPrompt}

## ISOLATION RULES (CRITICAL)
- Work autonomously in isolated context
- Focus ONLY on this specific task
- Write comprehensive output suitable for aggregation
- Do NOT attempt to communicate with other agents

## YOUR TASK
${task}

## OUTPUT INSTRUCTIONS
Provide a complete, well-structured response that can be aggregated with other agent outputs.
Include:
1. What you did
2. Key findings or results
3. Any code, configurations, or artifacts produced
4. Recommendations or next steps
`;
  }

  /**
   * Read output from a completed room
   */
  readRoomOutput(executionId: string): string | null {
    const outputFile = join(this.workDir, `agent-${executionId}-output.md`);
    if (existsSync(outputFile)) {
      return readFileSync(outputFile, 'utf-8');
    }
    return null;
  }

  /**
   * Check if a room execution is complete
   */
  isComplete(executionId: string): boolean {
    const flagFile = join(this.workDir, `agent-${executionId}-complete.flag`);
    return existsSync(flagFile);
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): TaskExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * List all room outputs in work directory
   */
  listOutputs(): string[] {
    const fs = require('fs');
    const files = fs.readdirSync(this.workDir);
    return files.filter((f: string) => f.endsWith('-output.md'));
  }

  /**
   * Clean up work directory
   */
  cleanup(): void {
    const fs = require('fs');
    const files = fs.readdirSync(this.workDir);
    for (const file of files) {
      if (file.endsWith('-output.md') || file.endsWith('-complete.flag')) {
        fs.unlinkSync(join(this.workDir, file));
      }
    }
    console.log('🧹 Work directory cleaned');
  }
}
