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

## Multi-Provider Hybrid System

### Purpose
Enable parallel execution across multiple AI providers (Claude, OpenAI, Gemini, Grok) with intelligent provider selection and isolated execution contexts.

### Supported Providers
| Provider | API Key Env | Best For | Model |
|----------|-------------|----------|-------|
| Claude | ANTHROPIC_API_KEY | Reasoning, writing, balanced | Claude 3.x |
| OpenAI | OPENAI_API_KEY | Code generation, logic | GPT-4, Codex |
| Gemini | GOOGLE_API_KEY | Images, multimodal, analysis | Gemini Pro Vision |
| Grok | XAI_API_KEY | Real-time data, current events | Grok-1 |

### Provider Rooms Structure
Each provider operates in isolated context:
```
~/.my-claude-agents/
├─ room-claude/          (default, all agents available)
│  ├ agents/
│  ├ config/
│  └ work/
│
├─ room-openai/          (specialized: code generation)
│  ├ agents/
│  ├ config/
│  └ work/
│
├─ room-gemini/          (specialized: multimodal)
│  ├ agents/
│  ├ config/
│  └ work/
│
└─ room-grok/            (specialized: real-time data)
   ├ agents/
   ├ config/
   └ work/
```

### Intelligent Provider Routing

**Task Keyword → Provider Priority:**
```
KEYWORD MAPPING:
"code", "build", "implement" → OpenAI (Codex) > Claude
"image", "design", "visual", "draw" → Gemini (multimodal) > Claude
"real-time", "news", "current", "live", "latest" → Grok > Claude
"reason", "analyze", "explain", "plan", "write" → Claude (default)
"test", "validate", "verify", "quality" → Claude (TDD specialists)
```

**Confidence-Based Provider Selection:**
- **100% match (single keyword):** Use specific provider
- **Multiple matches:** Use highest-performing provider for task type
- **No match:** Default to Claude
- **Provider unavailable:** Fallback to next in priority list

### Multi-Provider Execution Pattern

**Single Task with Provider Hints:**
```
User: "Build a React dashboard and validate it works"
Router analyzes:
- "Build React" (code) → OpenAI Codex
- "Validate" (test) → Claude (TDD)
Route type: PARALLEL
Execute:
  └─ Room-OpenAI: va-react-specialist builds components
  └─ Room-Claude: tdd-validation-agent tests output
  └─ Final: va-knowledge-synthesizer merges results
Result: Faster code + guaranteed quality
```

**Complex Multi-Task with Provider Distribution:**
```
User: "Create Content Command Center with publishing and real-time stats"
Router breaks into subtasks:
1. Dashboard UI → Room-Gemini (design validation)
2. Kanban pipeline → Room-OpenAI (complex logic)
3. Publishing engine → Room-Claude (reasoning)
4. Real-time stats → Room-Grok (live data)
5. Integration tests → Room-Claude (TDD)
Execute: All 5 rooms in parallel
Merge: va-knowledge-synthesizer combines outputs
Result: 40% faster than sequential, specialized expert per task
```

### Room Configuration Template
Each room needs `.claude/settings.json`:
```json
{
  "provider": "openai",
  "api_key_env": "OPENAI_API_KEY",
  "model": "gpt-4-turbo",
  "enhanced_routing": {
    "enabled": true,
    "mode": "hybrid",
    "confidence_threshold": 0.6
  },
  "multi_agent_protocol": {
    "enabled": true,
    "isolation": "context",
    "auto_compact_threshold": 0.7,
    "file_output_dir": "work"
  }
}
```

### Provider Fallback & Failover

**If primary provider fails:**
```
Task requires: OpenAI (code generation)
Request fails → Fallback to Claude (capable but slower)
Status: Return result with note "OpenAI unavailable, used Claude fallback"

Task prioritizes: Speed → Grok (real-time)
Grok unavailable → Skip, use Claude's reasoning instead
Status: Return result with caveat "Real-time data unavailable"
```

### Cost Optimization
```
Simple tasks (classification, routing) → Claude (cheapest)
Complex reasoning → Claude (best quality-per-cost)
Code generation → OpenAI Codex (fastest output)
Multimodal → Gemini (only multimodal capable)
Real-time → Grok (only real-time capable)

RESULT: Use specialized provider ONLY when needed
```

## Agent Sources

| Prefix | Repository | Specialty |
|--------|------------|-----------|
| `tdd-` | vanzan01/claude-code-sub-agent-collective | TDD methodology |
| `va-` | VoltAgent/awesome-claude-code-subagents | Domain coverage |
| `ws-` | wshobson/agents | Orchestration |

See `~/.claude/agents/REGISTRY.md` for full agent inventory.
