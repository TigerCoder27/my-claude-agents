# Provider Adapter Template

This template shows how to adapt agents for different AI providers.

## Overview

Each provider room uses the same agent definitions but with provider-specific configuration. Adapters translate agent requests to provider-specific API calls.

## Basic Adapter Structure

```
room-{provider}/
├─ .claude/
│  ├ settings.json          (provider-specific settings)
│  ├ CLAUDE.md             (provider routing rules)
│  └ hooks/
│     └ agent-spawn.sh      (provider API initialization)
│
├─ agents/                  (symbolic link to main agents)
│  └─ REGISTRY.md
│
└─ work/
   ├─ agent-{name}-output.md
   └─ agent-{name}-complete.flag
```

## Provider-Specific Configuration

### Claude Settings
```json
{
  "provider": "claude",
  "api_key_env": "ANTHROPIC_API_KEY",
  "model": "claude-opus-4-5",
  "max_tokens": 4096,
  "temperature": 0.7,
  "top_p": 1.0
}
```

### OpenAI Settings
```json
{
  "provider": "openai",
  "api_key_env": "OPENAI_API_KEY",
  "model": "gpt-4-turbo",
  "max_tokens": 4096,
  "temperature": 0.7,
  "top_p": 1.0
}
```

### Gemini Settings
```json
{
  "provider": "gemini",
  "api_key_env": "GOOGLE_API_KEY",
  "model": "gemini-pro-vision",
  "max_tokens": 4096,
  "temperature": 0.7,
  "top_p": 1.0,
  "vision_enabled": true
}
```

### Grok Settings
```json
{
  "provider": "grok",
  "api_key_env": "XAI_API_KEY",
  "model": "grok-1",
  "max_tokens": 4096,
  "temperature": 0.7,
  "top_p": 1.0,
  "real_time_enabled": true
}
```

## Agent Adaptation Patterns

### Pattern 1: Same Agent, Different Provider

**Original (Claude):**
```
Agent: va-react-specialist
Input: "Build a login component"
Claude API → React component code
Output: work/agent-react-specialist-output.md
```

**Adapted (OpenAI):**
```
Agent: va-react-specialist
Input: "Build a login component"
OpenAI API (GPT-4) → React component code (optimized)
Output: work/agent-react-specialist-output.md

Difference: GPT-4 may use different patterns, syntax preferences
Goal: Same deliverable, potentially faster generation
```

### Pattern 2: Provider-Specific Strengths

**Multimodal (Gemini):**
```
Agent: va-ui-designer
Task: "Design dashboard layout"
Gemini (vision-enabled) → Can analyze images, validate mockups
Claude → Can't see images, analyzes description only
Benefit: Gemini validates design quality, Claude validates concept
```

**Real-Time (Grok):**
```
Agent: ws-data-integration
Task: "Fetch latest stock prices"
Grok → Access real-time market data
Claude → Can't access real-time, uses historical patterns
Benefit: Grok gets live prices, Claude structures results
```

## Fallback Strategy

```javascript
// Pseudo-code
function executeTask(task, primaryProvider) {
  try {
    result = primaryProvider.execute(task)
    return result
  } catch (error) {
    console.log(`${primaryProvider} failed, using fallback`)
    fallbackProvider = getFallbackProvider(primaryProvider)
    result = fallbackProvider.execute(task)
    result.note = `Fallback: ${primaryProvider} unavailable`
    return result
  }
}
```

## Cost Optimization Rules

### Rule 1: Use Cheapest Provider First
```
Is task simple routing/classification?
→ Claude (cheapest, sufficient quality)
→ Don't use OpenAI/Gemini/Grok for basic work
```

### Rule 2: Specialize Only When Needed
```
Does task involve code generation?
→ YES: Use OpenAI (30% faster)
→ NO: Use Claude (20% cheaper)
```

### Rule 3: Real-Time Data Requirement
```
Does task need current information?
→ YES: Use Grok (only provider with real-time)
→ NO: Use Claude (better reasoning)
```

### Rule 4: Multimodal Content
```
Does task involve images/vision?
→ YES: Use Gemini (only multimodal capable)
→ NO: Use Claude (works fine without vision)
```

## Testing Provider Adapters

### Test 1: Same Input, Different Providers
```
Input: "Build a React component for user authentication"

Claude result:
- Well-structured, clear comments
- ~2 minutes generation time
- Cost: $0.015

OpenAI result:
- Slightly different patterns, still high-quality
- ~1.2 minutes generation time
- Cost: $0.018

Gemini result:
- Similar structure, multimodal validation available
- ~1.8 minutes generation time
- Cost: $0.012

Verdict: OpenAI fastest, but Claude better value (time + cost)
```

### Test 2: Provider-Specific Task
```
Task: "Analyze this dashboard mockup"

Claude: Must describe layout from text
Gemini: Can see actual image, validates visually
Grok: Can't help (not multimodal)

Verdict: Route to Gemini for this task
```

### Test 3: Real-Time Task
```
Task: "What are the latest AI research breakthroughs?"

Claude: Uses training data, generic response
Grok: Accesses real-time, gives latest announcements
Gemini: Similar to Claude, no real-time
OpenAI: Similar to Claude, no real-time

Verdict: Route to Grok for real-time requirement
```

## Implementation Checklist

- [ ] Create room-{provider} directory structure
- [ ] Set up .claude/settings.json with provider API key
- [ ] Create symbolic link to agents/ directory
- [ ] Configure CLAUDE.md with provider routing rules
- [ ] Set environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- [ ] Test single agent in room with `@agent-name` command
- [ ] Test multi-room parallel execution
- [ ] Validate fallback behavior (simulate provider failure)
- [ ] Benchmark: measure speed and cost for each provider
- [ ] Document results in provider-performance.md

## Provider Performance Benchmarks

Once implemented, track these metrics:

```markdown
| Task Type | Provider | Speed | Quality | Cost | Best For |
|-----------|----------|-------|---------|------|----------|
| Code Gen | OpenAI | 1.2m | 9.5/10 | $0.018 | Fast code |
| Code Gen | Claude | 2.1m | 9.8/10 | $0.015 | Quality code |
| Testing | Claude | 1.5m | 10/10 | $0.012 | TDD focus |
| Multimodal | Gemini | 1.8m | 9.2/10 | $0.012 | Image analysis |
| Real-time | Grok | 0.9m | 8.5/10 | $0.020 | Live data |
```

Use this data to continuously optimize routing decisions.
