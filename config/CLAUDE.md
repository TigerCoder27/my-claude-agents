# Claude Code Behavioral Configuration

## Enhanced Routing System (Active)

Automatic agent selection based on natural language intent classification.

**Mode:** Hybrid (confident suggestions + fallback to manual routing)
**Status:** Production Ready
**Confidence Threshold:** 0.6 (60%)

## Agent Routing Priority

When delegating to subagents, use this priority:

1. **TDD/Testing tasks** → Prefer `tdd-*` agents
   - Test-first development
   - Quality gates
   - Validation workflows
   - **Detected by:** "test", "validate", "verify", "bug", "quality", "make sure"

2. **Multi-agent orchestration** → Prefer `ws-*` agents
   - Complex workflows requiring coordination
   - SEO campaigns (full suite)
   - Database migrations
   - Deployment pipelines
   - **Detected by:** "deploy", "migrate", "pipeline", "workflow", "coordinate", "automate"

3. **Specialized domains** → Prefer `va-*` agents
   - Language-specific tasks (Python, TypeScript, etc.)
   - Framework expertise (React, Django, etc.)
   - Infrastructure (Kubernetes, Terraform)
   - Business functions (PM, legal, marketing)
   - **Detected by:** "build", "create", "write", "develop", "[technology name]"

## Development Standards

- Follow TDD: Write tests first (RED → GREEN → REFACTOR)
- Use appropriate agent for the task domain
- Coordinate multi-step tasks through orchestrator agents
- Document decisions in relevant project files

## Multi-Agent Branch Protocol

### Purpose
Prevent context bloat and compaction loops when running multiple agents in parallel.

### Orchestration Agents
| Agent | Role | When to Use |
|-------|------|-------------|
| `tdd-task-orchestrator` | Primary orchestrator | Parallel task execution with dependency management |
| `ws-tdd-orchestrator` | TDD workflow coordination | Multi-agent TDD enforcement |
| `va-knowledge-synthesizer` | Aggregator/Merger | Synthesize outputs from multiple agents |

### Branch Isolation Rules
When spawning multiple agents:

1. **Isolated Context Per Agent**
   - Each agent runs in its own context window
   - No shared context bloat between agents
   - Auto-compact when context > 70% utilized

2. **File-Based Output (NOT Context)**
   - Write ALL output to: `work/agent-{task-name}-output.md`
   - Do NOT return verbose results to main thread
   - Signal completion via file existence

3. **Background Execution**
   - Use `run_in_background: true` for parallel agents
   - Main thread polls for file completion, not context
   - Check with `TaskOutput` using `block: false`

### Agent Directive Template
Include in every spawned agent prompt:
```
ISOLATION RULES:
- Work autonomously in isolated context
- Auto-compact when context > 70% full
- Write output to: work/agent-{name}-output.md
- Return only 1-line status to main thread
- Signal done: create work/agent-{name}-complete.flag
```

### Aggregation Phase
After all agents complete:
1. `va-knowledge-synthesizer` reads all `work/*.md` files
2. Synthesizes into single cohesive output
3. Performs ONE final compaction
4. Writes merged result to `work/final-output.md`

### Example Workflow
```
Main Thread:
  └─→ tdd-task-orchestrator analyzes tasks
        ├─→ Spawns Agent-1 (background) → work/agent-1-output.md
        ├─→ Spawns Agent-2 (background) → work/agent-2-output.md
        └─→ Spawns Agent-3 (background) → work/agent-3-output.md

  └─→ Poll for completion (check file existence)

  └─→ va-knowledge-synthesizer merges outputs
        └─→ work/final-output.md
```

### Benefits
- Each agent has full context window (no sharing)
- Auto-compaction happens independently per agent
- Main thread never bloats (reads files only)
- True parallel execution at scale
- Single merge point = quality gate

## Agent Sources

| Prefix | Repository | Specialty |
|--------|------------|-----------|
| `tdd-` | vanzan01/claude-code-sub-agent-collective | TDD methodology |
| `va-` | VoltAgent/awesome-claude-code-subagents | Domain coverage |
| `ws-` | wshobson/agents | Orchestration |

See `~/.claude/agents/REGISTRY.md` for full agent inventory.
