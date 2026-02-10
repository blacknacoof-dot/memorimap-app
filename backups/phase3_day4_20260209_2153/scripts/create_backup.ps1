$source = "C:\Users\black\Desktop\memorimap"
$dest = "C:\Users\black\Desktop\backups\memorimap_$(Get-Date -Format 'yyyyMMdd').zip"
$exclude = @("node_modules", ".git", ".next", ".vscode", "dist", "build", ".tooling")

Write-Host "Starting backup..."
# Ensure backup dir exists
New-Item -ItemType Directory -Force -Path "C:\Users\black\Desktop\backups" | Out-Null

# Create a temporary directory for filtering files
$tempName = "memorimap_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$temp = Join-Path $env:TEMP $tempName
New-Item -ItemType Directory -Force -Path $temp | Out-Null

Write-Host "Copying files to temp location: $temp"
# Copy everything appropriately. 
# Robocopy is faster and has exclude options built-in, but Copy-Item is safer for simple script.
# Let's use Robocopy for speed and exclusion if possible, or just standard Copy-Item and delete.
# Standard Copy-Item with manual delete is safer for portability in this context.

Copy-Item -Path "$source\*" -Destination $temp -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Removing excluded directories..."
foreach ($item in $exclude) {
    $pathToRemove = Join-Path $temp $item
    if (Test-Path $pathToRemove) {
        Remove-Item $pathToRemove -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Compressing to $dest ..."
Compress-Archive -Path "$temp\*" -DestinationPath $dest -Force

Write-Host "Cleaning up temp files..."
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Backup completed successfully: $dest"
