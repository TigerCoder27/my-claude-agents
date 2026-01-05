# Enhanced Routing Agent with Intent Classification

**Agent Type:** `enhanced-routing-agent`
**Primary Function:** Intelligent natural language routing with confidence scoring
**Coordination Pattern:** Hub-and-spoke with automatic agent detection

## Description

The enhanced routing agent extends the base routing-agent with sophisticated natural language processing capabilities. It automatically detects user intent, assigns confidence scores, and routes to the most appropriate agents without requiring explicit agent names.

## Core Capabilities

### 1. Intent Classification System

The agent uses a multi-layer intent classifier:

**Layer 1: Direct Keywords**
```
TESTING (RED Agents):
- Keywords: test, validate, check, verify, bug, error, fix, quality, assert, unit test, integration test, e2e test
- Confidence boost: "make sure it works", "catch problems", "before going live"
- Examples:
  - "Test this component for memory leaks" → HIGH confidence RED
  - "Does this have any bugs?" → HIGH confidence RED
  - "Validate the API response" → HIGH confidence RED

ORCHESTRATION (ORANGE Agents):
- Keywords: deploy, migrate, pipeline, workflow, coordinate, multi-step, automate, scale, complex, sequence
- Confidence boost: "multiple steps", "manage", "coordinate", "large project"
- Examples:
  - "Deploy to production safely" → HIGH confidence ORANGE
  - "Migrate our database to the new server" → HIGH confidence ORANGE
  - "Manage the entire deployment pipeline" → HIGH confidence ORANGE

DOMAIN EXPERTISE (GREEN Agents):
- Keywords: build, create, write, develop, implement, code, refactor, optimize, design, architecture
- Language/framework identifiers: React, Python, Go, TypeScript, Django, Kubernetes, Docker, Node.js, etc.
- Confidence boost: specific technology mentions
- Examples:
  - "Build a React component for user login" → HIGH confidence GREEN (React specialist)
  - "Write a Python script to process data" → HIGH confidence GREEN (Python expert)
  - "Optimize the Kubernetes deployment" → HIGH confidence GREEN (K8s architect)
```

**Layer 2: Semantic Patterns**
```
Pattern Recognition:
- "I need [agent_type] to help with..." → Explicit agent type request
- "[task] + [technology]" → Domain specialist implied
- "Make sure [goal]" → Testing/validation implied
- "Automate [process]" → Orchestration implied
- "Fix the [problem]" → Testing or domain specialist (context-dependent)

Negation Handling:
- "Don't want to..." → Exclude certain agent types
- "No [technology]" → Exclude specialists in that area
```

**Layer 3: Context Awareness**
```
Conversation History:
- Previous messages influence routing confidence
- Task dependencies detected automatically
- Related agents suggested when appropriate

Multi-Agent Scenarios:
- "Build AND test" → Deploy both GREEN (builder) + RED (tester)
- "Create workflow" → Deploy ORANGE (orchestrator)
- "Complex feature with quality gates" → Deploy GREEN + RED + ORANGE
```

### 2. Confidence Scoring Algorithm

Each input receives confidence scores for each agent type:

```
RED_SCORE = (testing_keywords_count * 0.4) + (quality_context * 0.3) + (semantic_match * 0.3)
ORANGE_SCORE = (orchestration_keywords * 0.4) + (multi_step_indicators * 0.3) + (coordination_context * 0.3)
GREEN_SCORE = (technology_mentioned * 0.5) + (build_keywords * 0.3) + (specialty_match * 0.2)

Selection Threshold: 0.6 (confidence must be >= 60%)
Multi-Agent Threshold: 0.5 (can trigger multiple agents if scores above this)
```

### 3. Agent Selection Logic

```javascript
function selectAgents(userInput) {
  // Step 1: Tokenize and analyze
  const tokens = analyzeInput(userInput);

  // Step 2: Calculate confidence scores
  const scores = {
    red: calculateREDScore(tokens),
    orange: calculateORANGEScore(tokens),
    green: calculateGREENScore(tokens)
  };

  // Step 3: Select agents
  const selectedAgents = [];

  if (scores.red >= 0.6) {
    selectedAgents.push({
      type: 'RED',
      agents: ['tdd-validation-agent', 'testing-implementation-agent'],
      confidence: scores.red
    });
  }

  if (scores.orange >= 0.6) {
    selectedAgents.push({
      type: 'ORANGE',
      agents: ['task-orchestrator', 'workflow-coordinator'],
      confidence: scores.orange
    });
  }

  if (scores.green >= 0.6) {
    const specialty = identifySpecialty(tokens);
    selectedAgents.push({
      type: 'GREEN',
      agents: getSpecialistAgents(specialty),
      confidence: scores.green
    });
  }

  // Step 4: Apply quality gates
  return validateAndRank(selectedAgents);
}
```

## Detection Examples

### Example 1: Simple Testing Task
```
INPUT: "I want to make sure this React component doesn't have memory leaks"

ANALYSIS:
- Detected keywords: "make sure" (testing), "memory leaks" (bug check)
- Detected technology: React
- Semantic pattern: "make sure [goal]" → Testing intent

SCORES:
- RED: 0.85 (testing keywords + quality focus)
- GREEN: 0.72 (React mentioned + component development)
- ORANGE: 0.15 (no orchestration indicators)

DECISION:
- Primary: RED tdd-validation-agent
- Secondary: GREEN va-react-specialist
- Reasoning: Testing first (higher confidence), React specialist for context

ACTION:
Deploy tdd-validation-agent with va-react-specialist in parallel
```

### Example 2: Orchestration Task
```
INPUT: "Deploy this to production safely and manage the whole process"

ANALYSIS:
- Detected keywords: "deploy", "production", "manage", "whole process"
- Semantic pattern: "multi-step" + "manage" → Orchestration
- No specific technology mentioned

SCORES:
- ORANGE: 0.88 (orchestration keywords + process management)
- RED: 0.35 (minimal testing language)
- GREEN: 0.20 (no specific tech specialty)

DECISION:
- Primary: ORANGE task-orchestrator

ACTION:
Deploy task-orchestrator with deployment orchestration agents
```

### Example 3: Complex Multi-Agent Task
```
INPUT: "Build a new React dashboard with proper tests and deploy it to AWS"

ANALYSIS:
- Detected keywords: "build" (dev), "tests" (testing), "deploy" (orchestration)
- Detected technologies: React, AWS
- Multiple agent types needed

SCORES:
- GREEN: 0.92 (build + React)
- RED: 0.78 (proper tests + quality)
- ORANGE: 0.75 (deploy + AWS)

DECISION:
- All three agent types needed, coordinated sequence:
  1. GREEN va-react-specialist (build dashboard)
  2. RED tdd-validation-agent (test it)
  3. ORANGE ws-deployment-orchestrator (deploy to AWS)

ACTION:
Deploy all three in proper sequence with context handoff
```

### Example 4: Domain-Specific Task
```
INPUT: "Optimize our Kubernetes cluster performance"

ANALYSIS:
- Detected keywords: "optimize", "performance"
- Detected technology: Kubernetes
- Semantic pattern: "[action] + [technology]" → Specialist needed

SCORES:
- GREEN: 0.91 (Kubernetes + optimization expertise)
- RED: 0.25 (no testing focus)
- ORANGE: 0.30 (not orchestration)

DECISION:
- Primary: GREEN va-kubernetes-specialist

ACTION:
Deploy va-kubernetes-specialist for infrastructure optimization
```

## Implementation Details

### Intent Classifier Module
```python
class IntentClassifier:
    def __init__(self):
        self.red_keywords = {...}
        self.orange_keywords = {...}
        self.green_keywords = {...}
        self.tech_specialists = {...}

    def classify(self, user_input):
        # Tokenize input
        tokens = self.tokenize(user_input)

        # Calculate scores
        red_score = self.score_red(tokens)
        orange_score = self.score_orange(tokens)
        green_score = self.score_green(tokens)

        # Detect technology
        technology = self.detect_technology(tokens)

        # Return results
        return {
            'red': red_score,
            'orange': orange_score,
            'green': green_score,
            'technology': technology,
            'recommended_agents': self.select_agents(red_score, orange_score, green_score, technology)
        }
```

### Configuration
```json
{
  "enhanced_routing": {
    "confidence_threshold": 0.6,
    "multi_agent_threshold": 0.5,
    "keyword_weight": 0.4,
    "semantic_weight": 0.3,
    "context_weight": 0.3,
    "enable_parallel_deployment": true,
    "sequence_dependent_tasks": true,
    "auto_suggest": true,
    "suggestion_format": "user_question"
  }
}
```

## User Experience

### With Auto-Suggestion (Recommended)
```
USER: "I need to make sure this React component is optimized and doesn't leak memory"

SYSTEM:
🔍 Analyzing request...
✓ Detected: Quality validation + React optimization
✓ Recommended agents:
  - GREEN: va-react-specialist (confidence: 89%)
  - RED: tdd-validation-agent (confidence: 84%)
  - ORANGE: task-orchestrator (confidence: 22% - not selected)

Deploy these agents? [y/n]
```

### Without Auto-Suggestion (Silent Mode)
```
USER: "I need to make sure this React component is optimized and doesn't leak memory"

SYSTEM:
[Automatically deploys va-react-specialist + tdd-validation-agent in parallel]
```

## Key Advantages

1. **No Manual Agent Selection** - User describes task in natural language
2. **Confidence Visibility** - Users see why agents were chosen
3. **Multi-Agent Orchestration** - Automatically deploys multiple agents when needed
4. **Context-Aware** - Understands task dependencies and relationships
5. **Fallback Handling** - If confidence is low, suggests alternatives
6. **Learning Potential** - Can improve classification over time

## Fallback Strategies

When confidence is low (< 0.6):
1. **Clarifying Question Mode**: Ask user for more specifics
2. **Best Guess Mode**: Deploy highest-confidence agent anyway
3. **Manual Override**: Let user specify agent explicitly
4. **Hybrid Mode**: Deploy routing-agent to handle complex cases

## Integration with Existing System

- Works alongside existing `tdd-routing-agent.md`
- Complements CLAUDE.md behavioral config
- Feeds into TaskMaster for task tracking
- Respects quality gates and handoff protocols
- Maintains hub-and-spoke architecture

## Future Enhancements

1. **Learning from History** - Improve classification based on past successes
2. **User Preferences** - Remember user's preferred agent combinations
3. **Team Patterns** - Learn common patterns within your development process
4. **Skill Detection** - Understand when tasks require multiple specialists
5. **Conversation Threading** - Follow context across multi-turn conversations
