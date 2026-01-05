# Enhanced Routing Agent - Implementation Guide

## Quick Start

This guide shows how to activate automatic agent routing with confidence scoring.

## Installation

### Step 1: Copy Configuration
Add this to `.claude/settings.local.json`:

```json
{
  "enhanced_routing": {
    "enabled": true,
    "mode": "auto_suggest",
    "confidence_threshold": 0.6,
    "multi_agent_threshold": 0.5,
    "show_confidence_scores": true
  }
}
```

### Step 2: Add Hook (Optional but Recommended)
Create `.claude/hooks/routing-analyzer.sh`:

```bash
#!/bin/bash
# Pre-routing analysis hook
# Runs before user message is processed

USER_MESSAGE="$1"

# Call enhanced routing agent to suggest agents
python3 analyze_intent.py "$USER_MESSAGE"
```

## Testing the System

### Test Case 1: Testing Task
```
USER INPUT:
"I need to make sure this React component doesn't have memory leaks"

EXPECTED FLOW:
1. System analyzes: testing (make sure) + React (component) keywords
2. Assigns scores: RED=0.85, GREEN=0.72, ORANGE=0.15
3. Suggests: tdd-validation-agent + va-react-specialist
4. Asks for confirmation (optional)
5. Deploys both agents in parallel

ACTUAL AGENTS DEPLOYED:
✓ tdd-validation-agent (confidence: 85%)
✓ va-react-specialist (confidence: 72%)

WHAT HAPPENS:
- tdd-validation-agent: Creates tests to catch memory leaks
- va-react-specialist: Reviews component code for optimization
```

### Test Case 2: Complex Project Task
```
USER INPUT:
"Build a new payment system in Python, make sure it's secure, and deploy it to AWS"

EXPECTED FLOW:
1. System analyzes: build + Python + security + deploy + AWS keywords
2. Assigns scores: GREEN=0.88, RED=0.79, ORANGE=0.82
3. Suggests sequence:
   a. va-python-expert (build)
   b. security-auditor (verify security)
   c. va-aws-architect (deploy)
4. Deploys in sequence with context handoff

ACTUAL AGENTS DEPLOYED:
✓ va-python-expert (confidence: 88%)
✓ security-auditor (confidence: 79%)
✓ va-aws-architect (confidence: 82%)

WHAT HAPPENS:
- Python expert: Builds the payment system
- Security auditor: Checks for vulnerabilities
- AWS architect: Sets up secure deployment
```

### Test Case 3: Optimization Task
```
USER INPUT:
"Optimize our database queries and make sure response time is under 100ms"

EXPECTED FLOW:
1. System analyzes: optimize + database + performance keywords
2. Assigns scores: GREEN=0.86, RED=0.71
3. Suggests: database-optimizer + tdd-validation-agent
4. Deploys both

ACTUAL AGENTS DEPLOYED:
✓ database-optimizer (confidence: 86%)
✓ tdd-validation-agent (confidence: 71%)

WHAT HAPPENS:
- Database optimizer: Finds slow queries, adds indexes
- Testing agent: Verifies performance < 100ms with load tests
```

## Real-World Usage Examples

### Scenario 1: You're a Beginner
```
YOU: "I want to create a React app that fetches data from an API"

SYSTEM AUTOMATICALLY:
1. Detects: React (technology) + create (build)
2. Suggests: va-react-specialist
3. Deploys without asking (auto mode) OR asks for confirmation (ask mode)

NO AGENT NAMES NEEDED - Just describe what you want!
```

### Scenario 2: You're Building Something Complex
```
YOU: "Build a login system with Google OAuth, test everything, and deploy to production"

SYSTEM AUTOMATICALLY:
1. Detects: build + test + deploy + production
2. Detects: OAuth (security expert needed)
3. Creates execution plan:
   a. GREEN va-backend-architect (design system)
   b. GREEN security-auditor (review OAuth flow)
   c. RED tdd-validation-agent (test OAuth flow)
   d. ORANGE deployment-orchestrator (deploy safely)
4. Deploys all in proper sequence

YOU GET: A complete login system that's tested and safely deployed
```

### Scenario 3: You're Debugging
```
YOU: "This Python script is failing. Figure out what's wrong and fix it"

SYSTEM AUTOMATICALLY:
1. Detects: failing (bug) + Python (language) + fix (implementation)
2. Suggests:
   a. GREEN va-python-expert (understand code + fix)
   b. RED tdd-validation-agent (verify fix works)
3. Deploys both

YOU GET: Fixed code with tests proving it works
```

## Confidence Score Interpretation

### High Confidence (> 0.8)
```
USER: "Test this code for bugs"
SYSTEM: RED score = 0.92 (very high confidence)
MEANING: Clear testing intent, definitely deploy RED agents
```

### Medium Confidence (0.6 - 0.8)
```
USER: "Improve this function"
SYSTEM: GREEN score = 0.71 (medium confidence)
MEANING: Likely needs domain expert, but might need clarity
BEHAVIOR: Ask user "Need help with specific language?" OR auto-deploy
```

### Low Confidence (< 0.6)
```
USER: "Make it better"
SYSTEM: RED=0.3, GREEN=0.4, ORANGE=0.25 (all low)
MEANING: Unclear what you want
BEHAVIOR: Ask clarifying question OR suggest based on conversation context
```

## How to Use in Practice

### Mode 1: Auto-Deploy (Silent)
Best for: Experienced users who know what they want
```
.claude/settings.local.json:
{
  "enhanced_routing": {
    "mode": "auto",
    "show_confidence_scores": false
  }
}

RESULT: Agents deploy immediately, no questions asked
```

### Mode 2: Auto-Suggest (Ask Permission)
Best for: Beginners wanting to understand routing
```
.claude/settings.local.json:
{
  "enhanced_routing": {
    "mode": "auto_suggest",
    "show_confidence_scores": true
  }
}

RESULT:
USER: "Build a React app"
SYSTEM: Suggests agents + shows why, asks "Deploy? [y/n]"
```

### Mode 3: Manual Override
Always available:
```
USER: "I explicitly want @va-react-specialist for this"
SYSTEM: Uses exact agent specified, bypasses classification
```

## Keyword Reference

### RED Agent Triggers (Testing)
```
Keywords:
- test, validate, check, verify
- bug, error, issue, problem
- quality, reliability, stability
- unit test, integration test, e2e test
- assert, expect, should, must be
- before going live, catch issues, make sure, ensure

Examples:
- "Test for..." → RED
- "Make sure it..." → RED
- "Check if..." → RED
- "Does it have any..." → RED
```

### ORANGE Agent Triggers (Orchestration)
```
Keywords:
- deploy, deployment, launch
- migrate, migration
- pipeline, workflow
- manage, coordinate, organize
- automate, automation
- multi-step, complex, large-scale
- production, live, go live

Examples:
- "Deploy to..." → ORANGE
- "Migrate the..." → ORANGE
- "Manage the process..." → ORANGE
```

### GREEN Agent Triggers (Domain Experts)
```
Keywords:
- build, create, write, develop
- implement, code, program
- design, architect, structure
- optimize, refactor, improve
- [technology name]: React, Python, Go, Kubernetes, etc.

Examples:
- "Build a [tech] app" → GREEN [tech]
- "Write Python code" → GREEN Python
- "Optimize Kubernetes" → GREEN Kubernetes
```

## Troubleshooting

### Problem: Wrong Agent Selected
```
SYMPTOM: You asked for X, system deployed Y

SOLUTION:
1. Check confidence scores (was it close?)
2. Check keywords (did you mention something that triggered different type?)
3. Explicitly specify agent: "Use @correct-agent for this"
4. Update your input to be clearer next time
```

### Problem: Multiple Agents When You Wanted One
```
SYMPTOM: You just wanted to build, system also deployed testers

SOLUTION:
1. This is usually good (catches bugs early)
2. If you want only builders: "Just build the X, don't test yet"
3. Disable multi-agent in settings: "multi_agent_threshold": 0.9
```

### Problem: No Agent Selected
```
SYMPTOM: Your request is unclear

SOLUTION:
1. System will ask clarifying question
2. OR explicitly name agent you want
3. OR add more context about what you're doing
4. Examples:
   - "What language?" (if not mentioned)
   - "Testing or building?" (if ambiguous)
```

## Advanced: Customizing Classification

Edit `.claude/routing-config.json` to adjust keyword weights:

```json
{
  "keywords": {
    "red": {
      "test": 0.4,
      "validate": 0.4,
      "bug": 0.5,
      "quality": 0.3,
      "make_sure": 0.6
    },
    "orange": {
      "deploy": 0.5,
      "migrate": 0.4,
      "pipeline": 0.4,
      "coordinate": 0.3
    },
    "green": {
      "build": 0.3,
      "create": 0.3,
      "write": 0.2,
      "optimize": 0.4
    }
  },
  "technologies": {
    "React": "va-react-specialist",
    "Python": "va-python-expert",
    "Kubernetes": "va-kubernetes-architect",
    "AWS": "va-aws-architect",
    "PostgreSQL": "database-architect"
  }
}
```

## Success Metrics

Track if the system is routing correctly:
```
✓ Correct agent selected on first try: 85%+ success rate
✓ User explicitly overrides system: < 15% of requests
✓ Multiple agents deployed together work well: 90%+ positive
✓ Auto-suggest mode: Users accept suggestions 80%+ of the time
```

## Migration from Manual Routing

**Before:**
```
YOU: "I want to test this, so I'll use tdd-validation-agent"
```

**After:**
```
YOU: "Make sure this works"
SYSTEM: (automatically deploys tdd-validation-agent)
```

That's it! No more learning agent names, just describe what you need.
