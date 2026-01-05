#!/bin/bash
# colorize-agents.sh
# CLI Hook Script for Color-Coded Agent Output
# Works with Bash on Mac/Linux

# ANSI Color Codes
RED_FG='\033[91m'        # Bright Red (Testers)
ORANGE_FG='\033[93m'     # Bright Yellow/Orange (Coordinators)
GREEN_FG='\033[92m'      # Bright Green (Specialists)
BLUE_FG='\033[94m'       # Active
GRAY_FG='\033[90m'       # Idle
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Get agent type from name
get_agent_type() {
    local agent_name="$1"

    if [[ $agent_name == tdd-* ]]; then
        echo "RED"
    elif [[ $agent_name == ws-* ]]; then
        echo "ORANGE"
    elif [[ $agent_name == va-* ]]; then
        echo "GREEN"
    else
        echo "UNKNOWN"
    fi
}

# Get color for agent type
get_agent_color() {
    local type="$1"

    case $type in
        RED) echo -e "$RED_FG" ;;
        ORANGE) echo -e "$ORANGE_FG" ;;
        GREEN) echo -e "$GREEN_FG" ;;
        *) echo -e "$GRAY_FG" ;;
    esac
}

# Get emoji for agent type
get_agent_emoji() {
    local type="$1"

    case $type in
        RED) echo "🔴" ;;
        ORANGE) echo "🟠" ;;
        GREEN) echo "🟢" ;;
        *) echo "⚪" ;;
    esac
}

# Get status emoji
get_status_emoji() {
    local status="$1"

    case ${status,,} in
        active) echo "🔵" ;;
        success) echo "✅" ;;
        error) echo "❌" ;;
        waiting) echo "⏳" ;;
        *) echo "⚪" ;;
    esac
}

# Format agent name with color
format_agent_name() {
    local agent_name="$1"
    local with_emoji="$2"
    local with_badge="$3"

    local type=$(get_agent_type "$agent_name")
    local color=$(get_agent_color "$type")

    local output="${color}${BOLD}${agent_name}${RESET}"

    if [[ $with_emoji == "true" ]]; then
        local emoji=$(get_agent_emoji "$type")
        output="${emoji} ${output}"
    fi

    if [[ $with_badge == "true" ]]; then
        local badge=""
        case $type in
            RED) badge="[TEST]" ;;
            ORANGE) badge="[ORCH]" ;;
            GREEN) badge="[SPEC]" ;;
            *) badge="[????]" ;;
        esac
        output="${color}${badge}${RESET} ${output}"
    fi

    echo -e "$output"
}

# Format status message
format_agent_status() {
    local agent_name="$1"
    local status="$2"
    local task="$3"

    local type=$(get_agent_type "$agent_name")
    local color=$(get_agent_color "$type")
    local emoji=$(get_agent_emoji "$type")
    local status_emoji=$(get_status_emoji "$status")

    local formatted_name="${color}${BOLD}${agent_name}${RESET}"
    local formatted_task="${DIM}${task}${RESET}"

    echo -e "${emoji} ${formatted_name} ${status_emoji} ${formatted_task}"
}

# Colorize message containing agent names
colorize_message() {
    local message="$1"

    # Replace agent names with colorized versions
    # tdd-* agents
    message=$(echo "$message" | sed -E "s/(tdd-[a-zA-Z0-9-]+)/${RED_FG}${BOLD}\1${RESET}/g")
    # ws-* agents
    message=$(echo "$message" | sed -E "s/(ws-[a-zA-Z0-9-]+)/${ORANGE_FG}${BOLD}\1${RESET}/g")
    # va-* agents
    message=$(echo "$message" | sed -E "s/(va-[a-zA-Z0-9-]+)/${GREEN_FG}${BOLD}\1${RESET}/g")

    echo -e "$message"
}

# Demo function
show_demo() {
    echo ""
    echo -e "\033[36m═══════════════════════════════════════════════════════════\033[0m"
    echo -e "\033[37m           Claude Agent Color Coding Demo\033[0m"
    echo -e "\033[36m═══════════════════════════════════════════════════════════\033[0m"
    echo ""

    echo -e "\033[37mAGENT TYPES:\033[0m"
    echo "─────────────────────────────────────────────────────────────"
    echo ""

    # RED Agents
    echo -e "  🔴 ${RED_FG}RED - TESTERS${RESET}"
    echo -e "     ${RED_FG}tdd-validation-agent${RESET}     Testing & Quality"
    echo -e "     ${RED_FG}tdd-quality-agent${RESET}        Code Quality Gates"
    echo -e "     ${RED_FG}tdd-task-checker${RESET}         Task Validation"
    echo ""

    # ORANGE Agents
    echo -e "  🟠 ${ORANGE_FG}ORANGE - COORDINATORS${RESET}"
    echo -e "     ${ORANGE_FG}ws-task-orchestrator${RESET}     Workflow Management"
    echo -e "     ${ORANGE_FG}ws-deployment-agent${RESET}      Deployment Pipelines"
    echo -e "     ${ORANGE_FG}ws-context-manager${RESET}       Context Handling"
    echo ""

    # GREEN Agents
    echo -e "  🟢 ${GREEN_FG}GREEN - SPECIALISTS${RESET}"
    echo -e "     ${GREEN_FG}va-react-specialist${RESET}      React Expert"
    echo -e "     ${GREEN_FG}va-python-expert${RESET}         Python Expert"
    echo -e "     ${GREEN_FG}va-kubernetes-architect${RESET}  K8s Expert"
    echo ""

    echo -e "\033[37mSTATUS INDICATORS:\033[0m"
    echo "─────────────────────────────────────────────────────────────"
    echo ""
    echo "  ⚪ Idle      - Agent not active"
    echo "  🔵 Active    - Currently working"
    echo "  ✅ Success   - Task completed"
    echo "  ❌ Error     - Task failed"
    echo "  ⏳ Waiting   - Awaiting input"
    echo ""

    echo -e "\033[37mLIVE EXAMPLE:\033[0m"
    echo "─────────────────────────────────────────────────────────────"
    echo ""
    format_agent_status "tdd-validation-agent" "active" "Running tests..."
    format_agent_status "va-react-specialist" "success" "Component built"
    format_agent_status "ws-task-orchestrator" "waiting" "Awaiting subtasks"
    echo ""

    echo -e "\033[36m═══════════════════════════════════════════════════════════\033[0m"
}

# Show usage
show_usage() {
    echo "Usage:"
    echo "  ./colorize-agents.sh --demo              # Show color demo"
    echo "  ./colorize-agents.sh --message 'text'   # Colorize agent names in text"
    echo ""
    echo "Example:"
    echo "  ./colorize-agents.sh --message 'Deploying va-react-specialist for task'"
}

# Main execution
case "$1" in
    --demo|-d)
        show_demo
        ;;
    --message|-m)
        if [[ -n "$2" ]]; then
            colorize_message "$2"
        else
            echo "Error: No message provided"
            exit 1
        fi
        ;;
    --help|-h)
        show_usage
        ;;
    *)
        show_usage
        ;;
esac
