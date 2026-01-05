# My Claude Code Agents

Personal collection of **259 Claude Code subagents** curated from three repositories, harmonized with source prefixes to prevent conflicts.

## Agent Sources

| Prefix | Repository | Count | Specialty |
|--------|------------|-------|-----------|
| `tdd-` | [vanzan01/claude-code-sub-agent-collective](https://github.com/vanzan01/claude-code-sub-agent-collective) | 32 | TDD methodology, hub routing |
| `va-` | [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 127 | Comprehensive domain coverage |
| `ws-` | [wshobson/agents](https://github.com/wshobson/agents) | 100 | Multi-agent orchestration |

## Quick Install

### Windows (PowerShell)
```powershell
# Clone this repo
git clone https://github.com/YOUR_USERNAME/my-claude-agents.git
cd my-claude-agents

# Install globally (all projects)
.\install.ps1 -Global

# Or install to current project only
.\install.ps1 -Project
```

### Mac/Linux (Bash)
```bash
# Clone this repo
git clone https://github.com/YOUR_USERNAME/my-claude-agents.git
cd my-claude-agents

# Make executable
chmod +x install.sh

# Install globally (all projects)
./install.sh --global

# Or install to current project only
./install.sh --project
```

## Directory Structure

```
my-claude-agents/
├── agents/           # 259 agent definitions (.md files)
│   ├── tdd-*.md      # TDD/testing agents
│   ├── va-*.md       # Domain specialist agents
│   ├── ws-*.md       # Orchestration agents
│   └── REGISTRY.md   # Full agent inventory
├── config/
│   └── CLAUDE.md     # Behavioral configuration
├── install.ps1       # Windows installer
├── install.sh        # Mac/Linux installer
└── README.md
```

## Routing Priority

1. **TDD tasks** → Use `tdd-*` agents (test-first development)
2. **Orchestration** → Use `ws-*` agents (multi-agent workflows)
3. **Specialized domains** → Use `va-*` agents (language/framework experts)

## Syncing Across Devices

1. Make changes on one device
2. Commit and push: `git add . && git commit -m "Update agents" && git push`
3. On other devices: `git pull && .\install.ps1 -Global`

## License

Agents are sourced from MIT-licensed repositories.
