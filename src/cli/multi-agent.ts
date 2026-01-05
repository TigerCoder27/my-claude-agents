#!/usr/bin/env node
/**
 * Multi-Agent CLI
 * Main entrypoint for the multi-provider agent system
 */

import { MultiProviderRouter } from '../router/multi-provider-router';
import { RoomExecutor } from '../rooms/room-executor';
import { KnowledgeSynthesizer } from '../aggregator/knowledge-synthesizer';
import { ProviderAdapter } from '../providers/provider-adapter';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CLIOptions {
  task?: string;
  provider?: string;
  parallel?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  cleanup?: boolean;
}

class MultiAgentCLI {
  private router: MultiProviderRouter;
  private executor: RoomExecutor;
  private synthesizer: KnowledgeSynthesizer;
  private verbose: boolean = false;

  constructor() {
    this.router = new MultiProviderRouter();
    this.executor = new RoomExecutor();
    this.synthesizer = new KnowledgeSynthesizer();
    this.initializeRooms();
  }

  private initializeRooms(): void {
    for (const provider of this.router.getEnabledProviders()) {
      const config = this.router.getProviderConfig(provider);
      if (config) {
        this.executor.registerRoom(provider, {
          roomPath: config.room_path.replace('~', process.env.HOME || process.env.USERPROFILE || ''),
          model: config.model,
          apiKeyEnv: config.api_key_env
        });
      }
    }
  }

  async run(options: CLIOptions): Promise<void> {
    this.verbose = options.verbose || false;

    if (options.cleanup) {
      this.executor.cleanup();
      return;
    }

    if (!options.task) {
      this.showUsage();
      return;
    }

    console.log('\n🤖 Multi-Agent System\n');
    console.log(`📋 Task: "${options.task}"\n`);

    // Analyze the task
    const analysis = this.router.analyzeTask(options.task);

    console.log('🔍 Analysis:');
    console.log(`   Keywords: ${analysis.keywords.join(', ') || 'none detected'}`);
    console.log(`   Task Type: ${analysis.taskType}`);
    console.log(`   Parallelizable: ${analysis.parallelizable ? 'Yes' : 'No'}`);
    console.log('');

    console.log('📡 Routing Decisions:');
    for (const route of analysis.routes) {
      const emoji = this.getProviderEmoji(route.provider);
      console.log(`   ${emoji} ${route.provider.toUpperCase()} (${(route.confidence * 100).toFixed(0)}%)`);
      console.log(`      Reason: ${route.reason}`);
      if (route.fallback) {
        console.log(`      Fallback: ${route.fallback}`);
      }
    }
    console.log('');

    if (options.dryRun) {
      console.log('🏃 Dry run complete. Use --execute to run tasks.\n');
      return;
    }

    // Execute tasks
    if (analysis.parallelizable && options.parallel !== false) {
      await this.executeParallel(options.task, analysis);
    } else {
      await this.executeSequential(options.task, analysis);
    }

    // Synthesize results
    console.log('\n🧠 Synthesizing results...');
    const outputPath = this.synthesizer.run();

    console.log(`\n✅ Complete! Results: ${outputPath}\n`);
  }

  private async executeParallel(task: string, analysis: any): Promise<void> {
    console.log(`⚡ Executing ${analysis.routes.length} tasks in parallel...\n`);

    const tasks = analysis.routes.map((route: any) => ({
      provider: route.provider,
      task: task,
      agentPrompt: this.getAgentPrompt(route.provider, analysis.taskType)
    }));

    this.executor.on('room:start', (data) => {
      const emoji = this.getProviderEmoji(data.provider);
      console.log(`${emoji} [${data.provider}] Starting...`);
    });

    this.executor.on('room:complete', (data) => {
      const emoji = this.getProviderEmoji(data.provider);
      const status = data.success ? '✅' : '❌';
      console.log(`${emoji} [${data.provider}] ${status} Complete`);
    });

    const results = await this.executor.executeParallel(tasks);

    console.log(`\n📊 Parallel Execution Summary:`);
    console.log(`   Total: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  }

  private async executeSequential(task: string, analysis: any): Promise<void> {
    console.log(`📝 Executing ${analysis.routes.length} tasks sequentially...\n`);

    for (const route of analysis.routes) {
      const emoji = this.getProviderEmoji(route.provider);
      console.log(`${emoji} [${route.provider}] Starting...`);

      const result = await this.executor.executeInRoom(
        route.provider,
        task,
        this.getAgentPrompt(route.provider, analysis.taskType)
      );

      const status = result.success ? '✅' : '❌';
      console.log(`${emoji} [${route.provider}] ${status} Complete (${result.duration}ms)`);
    }
  }

  private getAgentPrompt(provider: string, taskType: string): string {
    // Load agent prompt based on provider and task type
    const agentMap: Record<string, Record<string, string>> = {
      claude: {
        testing: 'tdd-validation-agent',
        reasoning: 'va-debugger',
        code_generation: 'va-fullstack-developer'
      },
      openai: {
        code_generation: 'va-frontend-developer',
        optimization: 'va-performance-engineer'
      },
      gemini: {
        multimodal: 'va-ui-designer'
      },
      grok: {
        real_time: 'va-data-researcher'
      }
    };

    const agentName = agentMap[provider]?.[taskType] || 'va-fullstack-developer';
    const agentPath = join(__dirname, `../../agents/${agentName}.md`);

    if (existsSync(agentPath)) {
      return readFileSync(agentPath, 'utf-8');
    }

    return `You are a ${taskType} specialist. Complete the task thoroughly and provide detailed output.`;
  }

  private getProviderEmoji(provider: string): string {
    const emojis: Record<string, string> = {
      claude: '🟣',
      openai: '🟢',
      gemini: '🔵',
      grok: '⚫'
    };
    return emojis[provider] || '⚪';
  }

  private showUsage(): void {
    console.log(`
🤖 Multi-Agent CLI

Usage:
  npx ts-node src/cli/multi-agent.ts --task "your task description"

Options:
  --task, -t       The task to execute (required)
  --provider, -p   Force a specific provider
  --parallel       Force parallel execution
  --no-parallel    Force sequential execution
  --verbose, -v    Show detailed output
  --dry-run        Analyze without executing
  --cleanup        Clean up work directory

Examples:
  # Analyze and execute a task
  npx ts-node src/cli/multi-agent.ts --task "Build a React component"

  # Dry run to see routing
  npx ts-node src/cli/multi-agent.ts --task "Test my API" --dry-run

  # Force specific provider
  npx ts-node src/cli/multi-agent.ts --task "Generate code" --provider openai

  # Clean up work directory
  npx ts-node src/cli/multi-agent.ts --cleanup

With Doppler (recommended):
  doppler run -- npx ts-node src/cli/multi-agent.ts --task "your task"
`);
  }
}

// Parse command line arguments
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--task':
      case '-t':
        options.task = args[++i];
        break;
      case '--provider':
      case '-p':
        options.provider = args[++i];
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--no-parallel':
        options.parallel = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--cleanup':
        options.cleanup = true;
        break;
    }
  }

  return options;
}

// Main execution
const cli = new MultiAgentCLI();
cli.run(parseArgs()).catch(console.error);
