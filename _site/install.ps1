$ErrorActionPreference = 'Stop'

$processArchitecture = $env:PROCESSOR_ARCHITECTURE
$isX64Emulated = $env:PROCESSOR_ARCHITEW6432 -eq 'AMD64'
if ($processArchitecture -eq 'ARM64' -and -not $isX64Emulated) {
    Write-Error 'Flisk Windows v1 supports AMD64 only. Use WSL2 Ubuntu or a 64-bit Intel/AMD PC.'
    exit 1
}
if ($processArchitecture -ne 'AMD64' -and -not $isX64Emulated) {
    Write-Error "Unsupported Windows architecture: $processArchitecture. Flisk Windows v1 supports AMD64 only."
    exit 1
}

$baseUrl = 'https://github.com/flisk-sh/releases/releases/latest/download'
$installDir = if ($env:FLISK_INSTALL_DIR) {
    $env:FLISK_INSTALL_DIR
} else {
    Join-Path $env:LOCALAPPDATA 'flisk\bin'
}
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ('flisk-install-' + [guid]::NewGuid().ToString('N'))
$exeName = 'flisk-windows-amd64.exe'

try {
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    $exeDownload = Join-Path $tempDir $exeName
    $engineArchive = Join-Path $tempDir 'flisk-cli-engine.tar.gz'
    $checksumsPath = Join-Path $tempDir 'checksums.txt'

    try {
        Invoke-WebRequest "$baseUrl/$exeName" -OutFile $exeDownload
    } catch {
        throw 'The latest Flisk release does not include flisk-windows-amd64.exe yet. Wait for a Windows-enabled release, then rerun this installer.'
    }
    Invoke-WebRequest "$baseUrl/flisk-cli-engine.tar.gz" -OutFile $engineArchive
    Invoke-WebRequest "$baseUrl/checksums.txt" -OutFile $checksumsPath

    $checksumLine = Get-Content $checksumsPath | Where-Object { $_ -match "\s\*?$([regex]::Escape($exeName))$" } | Select-Object -First 1
    if (-not $checksumLine -or $checksumLine -notmatch '^([a-fA-F0-9]{64})\s+\*?') {
        throw "checksums.txt has no valid SHA-256 entry for $exeName"
    }
    $expectedHash = $Matches[1].ToLowerInvariant()
    $actualHash = (Get-FileHash -Algorithm SHA256 $exeDownload).Hash.ToLowerInvariant()
    if ($actualHash -ne $expectedHash) {
        throw "checksum mismatch for $exeName (expected $expectedHash, got $actualHash)"
    }

    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    $engineDir = Join-Path $installDir 'flisk-cli'
    $extractDir = Join-Path $tempDir 'engine'
    New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

    $tar = Get-Command tar.exe -ErrorAction SilentlyContinue
    if (-not $tar) {
        throw 'tar.exe is required to unpack the Flisk engine. Install a supported Windows version with tar.exe and retry.'
    }

    & $tar.Source -xzf $engineArchive -C $extractDir --strip-components=1
    if ($LASTEXITCODE -ne 0) {
        # Older Windows tar.exe may not support --strip-components. Extract normally,
        # then flatten a single top-level directory if the archive has one.
        Get-ChildItem -Force $extractDir | Remove-Item -Recurse -Force
        & $tar.Source -xzf $engineArchive -C $extractDir
        if ($LASTEXITCODE -ne 0) {
            throw 'Could not extract flisk-cli-engine.tar.gz with tar.exe.'
        }
        $children = @(Get-ChildItem -Force $extractDir)
        if ($children.Count -eq 1 -and $children[0].PSIsContainer) {
            $topDir = $children[0].FullName
            $flattenDir = Join-Path $tempDir 'engine-flat'
            New-Item -ItemType Directory -Force -Path $flattenDir | Out-Null
            Get-ChildItem -Force $topDir | Move-Item -Destination $flattenDir
            Remove-Item -Recurse -Force $extractDir
            Move-Item -Path $flattenDir -Destination $extractDir
        }
    }

    if (Test-Path $engineDir) {
        Remove-Item -Recurse -Force $engineDir
    }
    Move-Item -Path $extractDir -Destination $engineDir
    Copy-Item -Path $exeDownload -Destination (Join-Path $installDir 'flisk.exe') -Force

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $pathEntries = @($userPath -split ';' | Where-Object { $_ })
    if (-not ($pathEntries | Where-Object { $_.TrimEnd('\') -ieq $installDir.TrimEnd('\') })) {
        $newUserPath = if ([string]::IsNullOrWhiteSpace($userPath)) { $installDir } else { "$userPath;$installDir" }
        [Environment]::SetEnvironmentVariable('Path', $newUserPath, 'User')
    }

    $versionOutput = & (Join-Path $installDir 'flisk.exe') --version 2>&1 | Select-Object -First 1
    Write-Host "Flisk installed to $(Join-Path $installDir 'flisk.exe') ($versionOutput)."
    Write-Host 'Close this terminal and open a new one, then run flisk --version.'
    Write-Host 'For AI agents, configure your MCP client to launch flisk mcp over local stdio:'
    Write-Host '  https://github.com/flisk-sh/flisk/blob/main/docs/agent-tooling/README.md'
} catch {
    Write-Error $_
    exit 1
} finally {
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
    }
}
