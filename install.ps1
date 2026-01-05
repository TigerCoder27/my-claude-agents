# install.ps1 - Deploy Claude Code agents to current machine
# Usage: .\install.ps1 -Global   (installs to ~/.claude/agents/)
#        .\install.ps1 -Project  (installs to ./.claude/agents/)

param(
    [switch]$Global,
    [switch]$Project
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $Global -and -not $Project) {
    Write-Host "Claude Code Agents Installer" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\install.ps1 -Global   # Install to ~/.claude/agents/"
    Write-Host "  .\install.ps1 -Project  # Install to ./.claude/agents/"
    Write-Host ""
    exit 0
}

if ($Global) {
    $TargetAgents = "$env:USERPROFILE\.claude\agents"
    $TargetConfig = "$env:USERPROFILE\.claude"

    # Create directories
    New-Item -ItemType Directory -Force -Path $TargetAgents | Out-Null

    # Copy agents
    Copy-Item -Path "$ScriptDir\agents\*" -Destination $TargetAgents -Recurse -Force

    # Copy CLAUDE.md
    Copy-Item -Path "$ScriptDir\config\CLAUDE.md" -Destination $TargetConfig -Force

    $AgentCount = (Get-ChildItem -Path $TargetAgents -Filter "*.md").Count
    Write-Host "Installed $AgentCount agents globally to $TargetAgents" -ForegroundColor Green
}

if ($Project) {
    $TargetAgents = ".\.claude\agents"
    $TargetConfig = ".\.claude"

    # Create directories
    New-Item -ItemType Directory -Force -Path $TargetAgents | Out-Null

    # Copy agents
    Copy-Item -Path "$ScriptDir\agents\*" -Destination $TargetAgents -Recurse -Force

    # Copy CLAUDE.md
    Copy-Item -Path "$ScriptDir\config\CLAUDE.md" -Destination $TargetConfig -Force

    $AgentCount = (Get-ChildItem -Path $TargetAgents -Filter "*.md").Count
    Write-Host "Installed $AgentCount agents to project $TargetAgents" -ForegroundColor Green
}

Write-Host ""
Write-Host "Restart Claude Code to load the new agents." -ForegroundColor Yellow
