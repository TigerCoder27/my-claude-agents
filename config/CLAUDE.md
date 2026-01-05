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

## Agent Sources

| Prefix | Repository | Specialty |
|--------|------------|-----------|
| `tdd-` | vanzan01/claude-code-sub-agent-collective | TDD methodology |
| `va-` | VoltAgent/awesome-claude-code-subagents | Domain coverage |
| `ws-` | wshobson/agents | Orchestration |

See `~/.claude/agents/REGISTRY.md` for full agent inventory.
