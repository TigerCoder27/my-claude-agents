# colorize-agents.ps1
# CLI Hook Script for Color-Coded Agent Output
# Works with Windows PowerShell and PowerShell Core

param(
    [string]$Message,
    [switch]$Demo
)

# ANSI Color Codes
$script:Colors = @{
    # Agent Types
    RED_FG = "`e[91m"        # Bright Red (Testers)
    ORANGE_FG = "`e[93m"     # Bright Yellow/Orange (Coordinators)
    GREEN_FG = "`e[92m"      # Bright Green (Specialists)

    # Status Colors
    BLUE_FG = "`e[94m"       # Active
    GRAY_FG = "`e[90m"       # Idle

    # Formatting
    BOLD = "`e[1m"
    DIM = "`e[2m"
    RESET = "`e[0m"

    # Background Colors
    RED_BG = "`e[41m"
    ORANGE_BG = "`e[43m"
    GREEN_BG = "`e[42m"
}

# Agent type detection
function Get-AgentType {
    param([string]$AgentName)

    if ($AgentName -match "^tdd-") { return "RED" }
    if ($AgentName -match "^ws-") { return "ORANGE" }
    if ($AgentName -match "^va-") { return "GREEN" }
    return "UNKNOWN"
}

# Get color for agent type
function Get-AgentColor {
    param([string]$Type)

    switch ($Type) {
        "RED" { return $script:Colors.RED_FG }
        "ORANGE" { return $script:Colors.ORANGE_FG }
        "GREEN" { return $script:Colors.GREEN_FG }
        default { return $script:Colors.GRAY_FG }
    }
}

# Get emoji for agent type
function Get-AgentEmoji {
    param([string]$Type)

    switch ($Type) {
        "RED" { return "🔴" }
        "ORANGE" { return "🟠" }
        "GREEN" { return "🟢" }
        default { return "⚪" }
    }
}

# Get status emoji
function Get-StatusEmoji {
    param([string]$Status)

    switch ($Status.ToLower()) {
        "active" { return "🔵" }
        "success" { return "✅" }
        "error" { return "❌" }
        "waiting" { return "⏳" }
        default { return "⚪" }
    }
}

# Format agent name with color
function Format-AgentName {
    param(
        [string]$AgentName,
        [switch]$WithEmoji,
        [switch]$WithBadge
    )

    $type = Get-AgentType $AgentName
    $color = Get-AgentColor $type
    $reset = $script:Colors.RESET
    $bold = $script:Colors.BOLD

    $output = "${color}${bold}${AgentName}${reset}"

    if ($WithEmoji) {
        $emoji = Get-AgentEmoji $type
        $output = "${emoji} ${output}"
    }

    if ($WithBadge) {
        $badge = switch ($type) {
            "RED" { "[TEST]" }
            "ORANGE" { "[ORCH]" }
            "GREEN" { "[SPEC]" }
            default { "[????]" }
        }
        $output = "${color}${badge}${reset} ${output}"
    }

    return $output
}

# Format status message
function Format-AgentStatus {
    param(
        [string]$AgentName,
        [string]$Status,
        [string]$Task
    )

    $type = Get-AgentType $AgentName
    $color = Get-AgentColor $type
    $emoji = Get-AgentEmoji $type
    $statusEmoji = Get-StatusEmoji $Status
    $reset = $script:Colors.RESET
    $bold = $script:Colors.BOLD
    $dim = $script:Colors.DIM

    $formattedName = "${color}${bold}${AgentName}${reset}"
    $formattedTask = "${dim}${Task}${reset}"

    return "${emoji} ${formattedName} ${statusEmoji} ${formattedTask}"
}

# Colorize a full message containing agent names
function Invoke-ColorizeMessage {
    param([string]$Message)

    $output = $Message

    # Pattern to match agent names
    $patterns = @(
        "tdd-[\w-]+",
        "ws-[\w-]+",
        "va-[\w-]+"
    )

    foreach ($pattern in $patterns) {
        $output = $output -replace "($pattern)", {
            $match = $args[0].Groups[1].Value
            Format-AgentName $match
        }
    }

    return $output
}

# Demo function to show all colors
function Show-Demo {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "           Claude Agent Color Coding Demo" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Agent Types
    Write-Host "AGENT TYPES:" -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────────────"
    Write-Host ""

    # RED Agents
    $redColor = $script:Colors.RED_FG
    $reset = $script:Colors.RESET
    Write-Host "  🔴 ${redColor}RED - TESTERS${reset}"
    Write-Host "     ${redColor}tdd-validation-agent${reset}     Testing & Quality"
    Write-Host "     ${redColor}tdd-quality-agent${reset}        Code Quality Gates"
    Write-Host "     ${redColor}tdd-task-checker${reset}         Task Validation"
    Write-Host ""

    # ORANGE Agents
    $orangeColor = $script:Colors.ORANGE_FG
    Write-Host "  🟠 ${orangeColor}ORANGE - COORDINATORS${reset}"
    Write-Host "     ${orangeColor}ws-task-orchestrator${reset}     Workflow Management"
    Write-Host "     ${orangeColor}ws-deployment-agent${reset}      Deployment Pipelines"
    Write-Host "     ${orangeColor}ws-context-manager${reset}       Context Handling"
    Write-Host ""

    # GREEN Agents
    $greenColor = $script:Colors.GREEN_FG
    Write-Host "  🟢 ${greenColor}GREEN - SPECIALISTS${reset}"
    Write-Host "     ${greenColor}va-react-specialist${reset}      React Expert"
    Write-Host "     ${greenColor}va-python-expert${reset}         Python Expert"
    Write-Host "     ${greenColor}va-kubernetes-architect${reset}  K8s Expert"
    Write-Host ""

    # Status Indicators
    Write-Host "STATUS INDICATORS:" -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────────────"
    Write-Host ""
    Write-Host "  ⚪ Idle      - Agent not active"
    Write-Host "  🔵 Active    - Currently working"
    Write-Host "  ✅ Success   - Task completed"
    Write-Host "  ❌ Error     - Task failed"
    Write-Host "  ⏳ Waiting   - Awaiting input"
    Write-Host ""

    # Live Example
    Write-Host "LIVE EXAMPLE:" -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────────────"
    Write-Host ""
    Write-Host (Format-AgentStatus "tdd-validation-agent" "active" "Running tests...")
    Write-Host (Format-AgentStatus "va-react-specialist" "success" "Component built")
    Write-Host (Format-AgentStatus "ws-task-orchestrator" "waiting" "Awaiting subtasks")
    Write-Host ""

    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

# Main execution
if ($Demo) {
    Show-Demo
}
elseif ($Message) {
    Write-Host (Invoke-ColorizeMessage $Message)
}
else {
    # If no arguments, show usage
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\colorize-agents.ps1 -Demo              # Show color demo"
    Write-Host "  .\colorize-agents.ps1 -Message 'text'    # Colorize agent names in text"
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  .\colorize-agents.ps1 -Message 'Deploying va-react-specialist for task'"
}
