#!/bin/bash
# install.sh - Deploy Claude Code agents to current machine
# Usage: ./install.sh --global   (installs to ~/.claude/agents/)
#        ./install.sh --project  (installs to ./.claude/agents/)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_usage() {
    echo "Claude Code Agents Installer"
    echo ""
    echo "Usage:"
    echo "  ./install.sh --global   # Install to ~/.claude/agents/"
    echo "  ./install.sh --project  # Install to ./.claude/agents/"
    echo ""
}

if [[ "$1" == "--global" ]]; then
    TARGET_AGENTS="$HOME/.claude/agents"
    TARGET_CONFIG="$HOME/.claude"

    # Create directories
    mkdir -p "$TARGET_AGENTS"

    # Copy agents
    cp -r "$SCRIPT_DIR/agents/"* "$TARGET_AGENTS/"

    # Copy CLAUDE.md
    cp "$SCRIPT_DIR/config/CLAUDE.md" "$TARGET_CONFIG/"

    AGENT_COUNT=$(ls -1 "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l)
    echo "Installed $AGENT_COUNT agents globally to $TARGET_AGENTS"
    echo ""
    echo "Restart Claude Code to load the new agents."

elif [[ "$1" == "--project" ]]; then
    TARGET_AGENTS="./.claude/agents"
    TARGET_CONFIG="./.claude"

    # Create directories
    mkdir -p "$TARGET_AGENTS"

    # Copy agents
    cp -r "$SCRIPT_DIR/agents/"* "$TARGET_AGENTS/"

    # Copy CLAUDE.md
    cp "$SCRIPT_DIR/config/CLAUDE.md" "$TARGET_CONFIG/"

    AGENT_COUNT=$(ls -1 "$TARGET_AGENTS"/*.md 2>/dev/null | wc -l)
    echo "Installed $AGENT_COUNT agents to project $TARGET_AGENTS"
    echo ""
    echo "Restart Claude Code to load the new agents."

else
    show_usage
fi
