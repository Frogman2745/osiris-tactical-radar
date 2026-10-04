$ErrorActionPreference = 'Stop'

$sourceDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetDirectory = Join-Path ([Environment]::GetFolderPath('Desktop')) 'OSIRIS_EXECUTIVE_PACKAGE'

New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
Copy-Item -Path (Join-Path $sourceDirectory '*') -Destination $targetDirectory -Recurse -Force

Write-Output "OSIRIS desktop package copied to: $targetDirectory"
