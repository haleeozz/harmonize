param([string]$OutputPath)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) { $OutputPath = Join-Path (Split-Path -Parent $projectRoot) 'harmonize-submit-source.zip' }
$archivePath = [IO.Path]::GetFullPath($OutputPath)
if (Test-Path -LiteralPath $archivePath) { throw 'Archive exists; choose another path to preserve the previous package.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$rootFiles = @('.env.local.example','.gitignore','AGENTS.md','eslint.config.mjs','LICENSE','next.config.ts','package-lock.json','package.json','README.md','tsconfig.json')
$sourceFiles = @($rootFiles | ForEach-Object { Get-Item -LiteralPath (Join-Path $projectRoot $_) })
foreach ($folder in @('src','public','tests','scripts','docs')) { $sourceFiles += @(Get-ChildItem -LiteralPath (Join-Path $projectRoot $folder) -Recurse -File) }
$archive = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($sourceFile in $sourceFiles) {
    $entryName = $sourceFile.FullName.Substring($projectRoot.Length + 1).Replace('\','/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $sourceFile.FullName, $entryName) | Out-Null
  }
} finally { $archive.Dispose() }
$inspection = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
try {
  $unexpected = @($inspection.Entries | Where-Object { $_.FullName -match '(^|/)(\.env\.local|node_modules|\.git|\.next|artifacts|\.vs)(/|$)' })
  if ($unexpected.Count) { throw 'Unexpected private/generated path in source archive.' }
  Write-Output "Verified source archive: $($inspection.Entries.Count) files."
} finally { $inspection.Dispose() }
$sha = [System.Security.Cryptography.SHA256]::Create()
$stream = [IO.File]::OpenRead($archivePath)
try {
  $digest = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant()
  [PSCustomObject]@{ Path = $archivePath; SHA256 = $digest }
} finally { $stream.Dispose(); $sha.Dispose() }
