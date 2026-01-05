/**
 * Multi-Provider Router
 * Routes tasks to optimal AI providers based on task analysis
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ProviderConfig {
  name: string;
  api_key_env: string;
  model: string;
  enabled: boolean;
  priority: number;
  strengths: string[];
  room_path: string;
  fallback_provider: string | null;
}

interface RoutingRule {
  primary: string;
  fallback: string | null;
  confidence: number;
}

interface RoutingConfig {
  providers: Record<string, ProviderConfig>;
  routing_rules: {
    keyword_to_provider: Record<string, RoutingRule>;
    task_type_mapping: Record<string, { preferred: string; secondary: string | null }>;
  };
  execution_rules: {
    parallel_execution: { enabled: boolean; max_parallel_rooms: number };
    context_isolation: { enabled: boolean; auto_compact_threshold: number };
    fallback_strategy: string;
  };
}

interface RouteDecision {
  provider: string;
  confidence: number;
  reason: string;
  fallback: string | null;
}

interface TaskAnalysis {
  keywords: string[];
  taskType: string;
  routes: RouteDecision[];
  parallelizable: boolean;
}

export class MultiProviderRouter {
  private config: RoutingConfig;
  private enabledProviders: string[] = [];

  constructor(configPath?: string) {
    const path = configPath || join(__dirname, '../../config/multi-provider-routing.json');
    this.config = JSON.parse(readFileSync(path, 'utf-8'));
    this.validateProviders();
  }

  private validateProviders(): void {
    for (const [name, provider] of Object.entries(this.config.providers)) {
      if (provider.enabled) {
        const apiKey = process.env[provider.api_key_env];
        if (apiKey) {
          this.enabledProviders.push(name);
          console.log(`✅ ${name}: Ready (${provider.model})`);
        } else {
          console.warn(`⚠️  ${name}: Enabled but ${provider.api_key_env} not found`);
        }
      }
    }

    if (this.enabledProviders.length === 0) {
      throw new Error('No providers available. Set at least ANTHROPIC_API_KEY.');
    }
  }

  /**
   * Analyze a task and determine optimal routing
   */
  analyzeTask(taskDescription: string): TaskAnalysis {
    const keywords = this.extractKeywords(taskDescription);
    const taskType = this.inferTaskType(keywords);
    const routes = this.determineRoutes(keywords, taskType);
    const parallelizable = routes.length > 1 && this.config.execution_rules.parallel_execution.enabled;

    return { keywords, taskType, routes, parallelizable };
  }

  private extractKeywords(text: string): string[] {
    const knownKeywords = Object.keys(this.config.routing_rules.keyword_to_provider);
    const words = text.toLowerCase().split(/\s+/);
    return knownKeywords.filter(kw => words.some(w => w.includes(kw)));
  }

  private inferTaskType(keywords: string[]): string {
    if (keywords.some(k => ['test', 'validate', 'verify'].includes(k))) return 'testing';
    if (keywords.some(k => ['code', 'build', 'implement'].includes(k))) return 'code_generation';
    if (keywords.some(k => ['image', 'design', 'visual'].includes(k))) return 'multimodal';
    if (keywords.some(k => ['real-time', 'news', 'current', 'latest', 'live'].includes(k))) return 'real_time';
    if (keywords.some(k => ['reason', 'analyze', 'explain', 'plan'].includes(k))) return 'reasoning';
    return 'reasoning'; // Default to Claude's strength
  }

  private determineRoutes(keywords: string[], taskType: string): RouteDecision[] {
    const routes: RouteDecision[] = [];
    const seenProviders = new Set<string>();

    // Route by keywords
    for (const keyword of keywords) {
      const rule = this.config.routing_rules.keyword_to_provider[keyword];
      if (rule && this.isProviderAvailable(rule.primary) && !seenProviders.has(rule.primary)) {
        routes.push({
          provider: rule.primary,
          confidence: rule.confidence,
          reason: `Keyword '${keyword}' matched`,
          fallback: this.isProviderAvailable(rule.fallback) ? rule.fallback : null
        });
        seenProviders.add(rule.primary);
      }
    }

    // If no keyword matches, use task type mapping
    if (routes.length === 0) {
      const mapping = this.config.routing_rules.task_type_mapping[taskType];
      if (mapping && this.isProviderAvailable(mapping.preferred)) {
        routes.push({
          provider: mapping.preferred,
          confidence: 0.7,
          reason: `Task type '${taskType}' preferred`,
          fallback: this.isProviderAvailable(mapping.secondary) ? mapping.secondary : null
        });
      }
    }

    // Always ensure at least Claude as fallback
    if (routes.length === 0 && this.isProviderAvailable('claude')) {
      routes.push({
        provider: 'claude',
        confidence: 0.5,
        reason: 'Default fallback',
        fallback: null
      });
    }

    return routes;
  }

  private isProviderAvailable(provider: string | null): boolean {
    return provider !== null && this.enabledProviders.includes(provider);
  }

  /**
   * Get the configuration for a specific provider
   */
  getProviderConfig(name: string): ProviderConfig | null {
    return this.config.providers[name] || null;
  }

  /**
   * Get all enabled providers
   */
  getEnabledProviders(): string[] {
    return [...this.enabledProviders];
  }

  /**
   * Check if parallel execution is available
   */
  canRunParallel(): boolean {
    return this.enabledProviders.length > 1 &&
           this.config.execution_rules.parallel_execution.enabled;
  }

  /**
   * Get max parallel rooms
   */
  getMaxParallelRooms(): number {
    return Math.min(
      this.config.execution_rules.parallel_execution.max_parallel_rooms,
      this.enabledProviders.length
    );
  }
}

// CLI usage
if (require.main === module) {
  const router = new MultiProviderRouter();

  const testTasks = [
    "Build a React dashboard and make sure it works",
    "Analyze this code for bugs",
    "Get the latest stock prices",
    "Validate my UI design mockup"
  ];

  console.log('\n🔀 Multi-Provider Router Test\n');
  console.log('Enabled Providers:', router.getEnabledProviders().join(', '));
  console.log('Parallel Execution:', router.canRunParallel() ? 'Yes' : 'No');
  console.log('');

  for (const task of testTasks) {
    console.log(`📝 "${task}"`);
    const analysis = router.analyzeTask(task);
    console.log(`   Keywords: ${analysis.keywords.join(', ') || 'none'}`);
    console.log(`   Task Type: ${analysis.taskType}`);
    console.log(`   Parallelizable: ${analysis.parallelizable}`);
    for (const route of analysis.routes) {
      console.log(`   → ${route.provider.toUpperCase()} (${(route.confidence * 100).toFixed(0)}%) - ${route.reason}`);
    }
    console.log('');
  }
}
