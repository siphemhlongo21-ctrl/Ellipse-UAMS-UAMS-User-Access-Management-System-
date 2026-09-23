#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Ensures E:\ellipse-documents\docs exists and grants IIS write access.

.DESCRIPTION
  Run on the IIS application server after deploying Ellipse.API.
  Grants Modify to IIS_IUSRS and optionally a named app pool identity.

.EXAMPLE
  .\scripts\ensure-ellipse-documents-acl.ps1
  .\scripts\ensure-ellipse-documents-acl.ps1 -AppPoolName "EllipseApi"
#>
param(
  [string]$RootPath = "E:\ellipse-documents\docs",
  [string]$AppPoolName = ""
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $RootPath | Out-Null
Write-Host "Ensured folder: $RootPath"

# IIS built-in group used by many classic / anonymous pools
icacls $RootPath /grant "IIS_IUSRS:(OI)(CI)M" /T | Out-Null
Write-Host "Granted Modify to IIS_IUSRS"

if ($AppPoolName.Trim()) {
  $identity = "IIS AppPool\$AppPoolName"
  icacls $RootPath /grant "${identity}:(OI)(CI)M" /T | Out-Null
  Write-Host "Granted Modify to $identity"
}

Write-Host ""
Write-Host "Current ACL:"
icacls $RootPath
Write-Host ""
Write-Host "Done. Recycle the Ellipse.API app pool after changing ACLs."
