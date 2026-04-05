param(
    [string]$WorktreePath = ".worktree_deploy_prod",
    [string]$Ref = "HEAD",
    [switch]$Deploy
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$rootVercelDir = Join-Path $repoRoot ".vercel"
$rootProjectFile = Join-Path $rootVercelDir "project.json"
$resolvedWorktreePath = if ([System.IO.Path]::IsPathRooted($WorktreePath)) {
    $WorktreePath
} else {
    Join-Path $repoRoot $WorktreePath
}
$resolvedWorktreePath = [System.IO.Path]::GetFullPath($resolvedWorktreePath)
$expectedWorktreePrefix = [System.IO.Path]::GetFullPath((Join-Path $repoRoot ".worktree_"))

if (-not $resolvedWorktreePath.StartsWith($expectedWorktreePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Worktree path must be inside repo root and start with '.worktree_': $resolvedWorktreePath"
}

if ($resolvedWorktreePath -eq [System.IO.Path]::GetFullPath($repoRoot)) {
    throw "Refusing to operate on repository root as a worktree path: $resolvedWorktreePath"
}

if (-not (Test-Path -LiteralPath $rootProjectFile)) {
    throw "Root .vercel/project.json not found: $rootProjectFile"
}

$rootProject = Get-Content -Raw -LiteralPath $rootProjectFile | ConvertFrom-Json
if (-not $rootProject.projectName) {
    throw "Root Vercel project name is missing in $rootProjectFile"
}

if (Test-Path -LiteralPath $resolvedWorktreePath) {
    Write-Host "Removing existing worktree: $resolvedWorktreePath"
    git worktree remove --force "$resolvedWorktreePath"
}

Write-Host "Creating clean worktree from $Ref"
git worktree add "$resolvedWorktreePath" "$Ref"

$worktreeVercelDir = Join-Path $resolvedWorktreePath ".vercel"
if (Test-Path -LiteralPath $worktreeVercelDir) {
    Remove-Item -LiteralPath $worktreeVercelDir -Recurse -Force
}

Copy-Item -LiteralPath $rootVercelDir -Destination $worktreeVercelDir -Recurse -Force

$worktreeProject = Get-Content -Raw -LiteralPath (Join-Path $worktreeVercelDir "project.json") | ConvertFrom-Json
if ($worktreeProject.projectName -ne $rootProject.projectName) {
    throw "Worktree Vercel project mismatch. Expected '$($rootProject.projectName)', got '$($worktreeProject.projectName)'"
}

Write-Host "Worktree ready: $resolvedWorktreePath"
Write-Host "Linked Vercel project: $($worktreeProject.projectName)"

if ($Deploy) {
    Write-Host "Deploying production from clean worktree..."
    Push-Location $resolvedWorktreePath
    try {
        vercel.cmd --prod --yes
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Next command:"
    Write-Host "  cd `"$resolvedWorktreePath`""
    Write-Host "  vercel.cmd --prod --yes"
}
