# ──────────────────────────────────────────────────────────────
#  LifeOS — Full Bootstrap Installer (Windows)
#  Clone -> Install -> Run in a single command
#
#  Usage:  .\install.ps1              # install everything
#          .\install.ps1 -Run         # install everything then start
#          .\install.ps1 -Check       # check only, don't install
#          .\install.ps1 -Docker      # build and run via Docker
# ──────────────────────────────────────────────────────────────
param(
    [switch]$Run,
    [switch]$Check,
    [switch]$Docker,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# ── Colors & helpers ──────────────────────────────────────────
function Write-Ok($msg)     { Write-Host "  " -NoNewline; Write-Host "[OK]" -ForegroundColor Green -NoNewline; Write-Host " $msg" }
function Write-Skip($msg)   { Write-Host "  [OK] $msg (already installed)" -ForegroundColor DarkGray }
function Write-Warn($msg)   { Write-Host "  " -NoNewline; Write-Host "[!]" -ForegroundColor Yellow -NoNewline; Write-Host " $msg" }
function Write-Fail($msg)   { Write-Host "  " -NoNewline; Write-Host "[X]" -ForegroundColor Red -NoNewline; Write-Host " $msg" }
function Write-Info($msg)   { Write-Host "  " -NoNewline; Write-Host "-->" -ForegroundColor Blue -NoNewline; Write-Host " $msg" }
function Write-Header($num, $msg) {
    Write-Host ""
    Write-Host "  [$num] " -ForegroundColor Cyan -NoNewline
    Write-Host $msg
}

$Errors = [System.Collections.ArrayList]::new()
$Installed = [System.Collections.ArrayList]::new()
$Skipped = [System.Collections.ArrayList]::new()
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ── Parse mode ────────────────────────────────────────────────
$Mode = "install"
if ($Help) {
    Write-Host "Usage: .\install.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  (none)     Install all dependencies"
    Write-Host "  -Run       Install everything then start LifeOS"
    Write-Host "  -Check     Check dependencies only (no changes)"
    Write-Host "  -Docker    Build and run via Docker instead"
    Write-Host "  -Help      Show this help"
    exit 0
}
if ($Run) { $Mode = "run" }
if ($Check) { $Mode = "check" }
if ($Docker) { $Mode = "docker" }

Write-Host ""
Write-Host "  LifeOS Installer" -ForegroundColor White
Write-Host "  ================"
Write-Host ""

# ── Detect Windows package manager ───────────────────────────
$PkgMgr = "none"
if (Get-Command winget -ErrorAction SilentlyContinue) {
    $PkgMgr = "winget"
} elseif (Get-Command choco -ErrorAction SilentlyContinue) {
    $PkgMgr = "choco"
} elseif (Get-Command scoop -ErrorAction SilentlyContinue) {
    $PkgMgr = "scoop"
}

Write-Header "System" "Detected Windows with $PkgMgr package manager"

if ($PkgMgr -eq "none" -and $Mode -ne "check") {
    Write-Warn "No package manager found (winget, choco, or scoop)"
    Write-Info "winget is built into Windows 10/11 — checking for App Installer..."

    # winget comes from App Installer — try to find it in WindowsApps
    $wingetPath = (Get-ChildItem "C:\Program Files\WindowsApps\Microsoft.DesktopAppInstaller_*\winget.exe" -ErrorAction SilentlyContinue | Select-Object -Last 1)
    if ($wingetPath) {
        $env:PATH = "$($wingetPath.DirectoryName);$env:PATH"
        $PkgMgr = "winget"
        Write-Ok "Found winget at $($wingetPath.FullName)"
    } else {
        Write-Warn "Will attempt direct downloads for missing dependencies"
    }
}

# ── Helper: version comparison ────────────────────────────────
function Test-VersionGte($current, $minimum) {
    try {
        $cur = [version]$current
        $min = [version]$minimum
        return $cur -ge $min
    } catch {
        return $false
    }
}

# ── Helper: install via package manager ───────────────────────
function Install-SystemPackage {
    param(
        [string]$WingetId,
        [string]$ChocoName,
        [string]$ScoopName,
        [string]$DisplayName
    )

    switch ($PkgMgr) {
        "winget" {
            Write-Info "Installing $DisplayName via winget..."
            winget install --id $WingetId --accept-source-agreements --accept-package-agreements --silent
            return $LASTEXITCODE -eq 0
        }
        "choco" {
            Write-Info "Installing $DisplayName via chocolatey..."
            choco install $ChocoName -y --no-progress
            return $LASTEXITCODE -eq 0
        }
        "scoop" {
            Write-Info "Installing $DisplayName via scoop..."
            scoop install $ScoopName
            return $LASTEXITCODE -eq 0
        }
        default {
            return $false
        }
    }
}

# ── Helper: refresh PATH from registry ────────────────────────
function Update-PathFromRegistry {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:PATH = "$machinePath;$userPath"
}

# ══════════════════════════════════════════════════════════════
#  PHASE 1: System dependencies
# ══════════════════════════════════════════════════════════════
Write-Header "1/5" "System Dependencies"

# ── git ───────────────────────────────────────────────────────
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
    $gitVer = (git --version) -replace 'git version ', '' -replace '\.windows.*', ''
    Write-Skip "git $gitVer"
    [void]$Skipped.Add("git")
} else {
    if ($Mode -eq "check") {
        Write-Fail "git -- not installed"
        [void]$Errors.Add("git is required but not installed")
    } else {
        $result = Install-SystemPackage -WingetId "Git.Git" -ChocoName "git" -ScoopName "git" -DisplayName "Git"
        Update-PathFromRegistry
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Write-Ok "git installed"
            [void]$Installed.Add("git")
        } else {
            Write-Fail "Could not install git"
            [void]$Errors.Add("git is required -- install from https://git-scm.com/download/win")
        }
    }
}

# ── Python 3.11+ ─────────────────────────────────────────────
$PythonCmd = $null
$pythonCandidates = @("python3", "python", "py")
foreach ($cmd in $pythonCandidates) {
    $exe = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($exe) {
        try {
            # "py" launcher supports -3 flag, others use --version
            if ($cmd -eq "py") {
                $verOutput = & py -3 --version 2>&1
            } else {
                $verOutput = & $cmd --version 2>&1
            }
            $verStr = ($verOutput -replace 'Python ', '').Trim()
            $verParts = $verStr.Split('.')
            $major = [int]$verParts[0]
            $minor = [int]$verParts[1]
            if ($major -ge 3 -and $minor -ge 11) {
                if ($cmd -eq "py") {
                    $PythonCmd = "py -3"
                } else {
                    $PythonCmd = $cmd
                }
                break
            }
        } catch {
            continue
        }
    }
}

if ($PythonCmd) {
    $pyVer = if ($PythonCmd -eq "py -3") { & py -3 --version 2>&1 } else { & $PythonCmd --version 2>&1 }
    Write-Skip "Python $($pyVer -replace 'Python ', '')"
    [void]$Skipped.Add("python")
} else {
    if ($Mode -eq "check") {
        Write-Fail "Python 3.11+ -- not found"
        [void]$Errors.Add("Python 3.11+ is required")
    } else {
        $result = Install-SystemPackage -WingetId "Python.Python.3.12" -ChocoName "python312" -ScoopName "python" -DisplayName "Python 3.12"
        Update-PathFromRegistry

        # Re-detect after install
        foreach ($cmd in $pythonCandidates) {
            $exe = Get-Command $cmd -ErrorAction SilentlyContinue
            if ($exe) {
                try {
                    if ($cmd -eq "py") {
                        $verOutput = & py -3 --version 2>&1
                    } else {
                        $verOutput = & $cmd --version 2>&1
                    }
                    $verStr = ($verOutput -replace 'Python ', '').Trim()
                    $verParts = $verStr.Split('.')
                    $major = [int]$verParts[0]
                    $minor = [int]$verParts[1]
                    if ($major -ge 3 -and $minor -ge 11) {
                        if ($cmd -eq "py") { $PythonCmd = "py -3" } else { $PythonCmd = $cmd }
                        break
                    }
                } catch { continue }
            }
        }

        if ($PythonCmd) {
            $pyVer = if ($PythonCmd -eq "py -3") { & py -3 --version 2>&1 } else { & $PythonCmd --version 2>&1 }
            Write-Ok "Python $($pyVer -replace 'Python ', '') installed"
            [void]$Installed.Add("python")
        } else {
            Write-Fail "Could not install Python 3.11+"
            [void]$Errors.Add("Python 3.11+ is required -- install from https://www.python.org/downloads/")
        }
    }
}

# ── Node.js 18+ ──────────────────────────────────────────────
$NodeOk = $false
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVer = (node --version) -replace '^v', ''
    $nodeMajor = [int]($nodeVer.Split('.')[0])
    if ($nodeMajor -ge 18) {
        Write-Skip "Node.js v$nodeVer"
        $NodeOk = $true
        [void]$Skipped.Add("nodejs")
    }
}

if (-not $NodeOk) {
    if ($Mode -eq "check") {
        Write-Fail "Node.js 18+ -- not found"
        [void]$Errors.Add("Node.js 18+ is required")
    } else {
        $result = Install-SystemPackage -WingetId "OpenJS.NodeJS.LTS" -ChocoName "nodejs-lts" -ScoopName "nodejs-lts" -DisplayName "Node.js LTS"
        Update-PathFromRegistry

        $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        if ($nodeCmd) {
            $nodeVer = (node --version) -replace '^v', ''
            $nodeMajor = [int]($nodeVer.Split('.')[0])
            if ($nodeMajor -ge 18) {
                Write-Ok "Node.js v$nodeVer installed"
                $NodeOk = $true
                [void]$Installed.Add("nodejs")
            } else {
                Write-Fail "Node.js installed but version too old: v$nodeVer"
                [void]$Errors.Add("Node.js 18+ required, got v$nodeVer")
            }
        } else {
            Write-Fail "Could not install Node.js"
            [void]$Errors.Add("Node.js 18+ is required -- install from https://nodejs.org/")
        }
    }
}

# ── npm ───────────────────────────────────────────────────────
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCmd) {
    $npmVer = (npm --version).Trim()
    Write-Skip "npm $npmVer"
    [void]$Skipped.Add("npm")
} else {
    if ($Mode -eq "check") {
        Write-Fail "npm -- not found"
        [void]$Errors.Add("npm is required (comes with Node.js)")
    } else {
        Write-Fail "npm not available -- it should come with Node.js"
        [void]$Errors.Add("npm is required but could not be found")
    }
}

# ══════════════════════════════════════════════════════════════
#  PHASE 2: Python tooling (uv)
# ══════════════════════════════════════════════════════════════
Write-Header "2/5" "Python Package Manager (uv)"

$uvCmd = Get-Command uv -ErrorAction SilentlyContinue
if ($uvCmd) {
    $uvVer = ((uv --version) -replace 'uv ', '').Trim()
    Write-Skip "uv $uvVer"
    [void]$Skipped.Add("uv")
} else {
    if ($Mode -eq "check") {
        Write-Fail "uv -- not installed"
        [void]$Errors.Add("uv is required for Python dependency management")
    } else {
        Write-Info "Installing uv..."
        try {
            irm https://astral.sh/uv/install.ps1 | iex
            Update-PathFromRegistry
            # Also add common install locations
            $env:PATH = "$env:USERPROFILE\.local\bin;$env:USERPROFILE\.cargo\bin;$env:PATH"

            if (Get-Command uv -ErrorAction SilentlyContinue) {
                $uvVer = ((uv --version) -replace 'uv ', '').Trim()
                Write-Ok "uv $uvVer installed"
                [void]$Installed.Add("uv")
            } else {
                Write-Fail "Could not install uv"
                [void]$Errors.Add("uv is required -- install from https://docs.astral.sh/uv/")
            }
        } catch {
            Write-Fail "Could not install uv: $_"
            [void]$Errors.Add("uv is required -- install from https://docs.astral.sh/uv/")
        }
    }
}

# ── Bail early if check-only or critical errors ──────────────
if ($Mode -eq "check") {
    Write-Host ""
    if ($Errors.Count -gt 0) {
        Write-Header "Result" "$($Errors.Count) issue(s) found"
        foreach ($err in $Errors) {
            Write-Fail $err
        }
        exit 1
    } else {
        Write-Host ""
        Write-Host "  All system dependencies satisfied!" -ForegroundColor Green
        exit 0
    }
}

if ($Errors.Count -gt 0) {
    Write-Host ""
    Write-Header "Error" "Cannot continue -- missing critical dependencies:"
    foreach ($err in $Errors) {
        Write-Fail $err
    }
    Write-Host ""
    Write-Host "  Fix the above issues and re-run .\install.ps1"
    exit 1
}

# ══════════════════════════════════════════════════════════════
#  PHASE 3: Backend Python dependencies
# ══════════════════════════════════════════════════════════════
Write-Header "3/5" "Backend Dependencies (Python)"

Push-Location "$RootDir\backend"

# Create venv if needed
if (-not (Test-Path ".venv")) {
    Write-Info "Creating Python virtual environment..."
    if ($PythonCmd -eq "py -3") {
        uv venv .venv --python (& py -3 -c "import sys; print(sys.executable)")
    } else {
        uv venv .venv --python $PythonCmd
    }
    Write-Ok "Virtual environment created at backend\.venv"
    [void]$Installed.Add("python-venv")
} else {
    Write-Skip "Virtual environment exists"
    [void]$Skipped.Add("python-venv")
}

# Activate venv
& ".venv\Scripts\Activate.ps1"

# Install Python packages
Write-Info "Installing Python packages..."
uv pip install -r requirements.txt --quiet 2>&1 | Out-Null

# Verify each package individually
$PyPackages = @(
    @{ Name = "fastapi";          Version = "0.115.6"; Desc = "Web framework" }
    @{ Name = "uvicorn";          Version = "0.34.0";  Desc = "ASGI server" }
    @{ Name = "sqlalchemy";       Version = "2.0.36";  Desc = "Database ORM" }
    @{ Name = "aiosqlite";        Version = "0.20.0";  Desc = "Async SQLite driver" }
    @{ Name = "cryptography";     Version = "44.0.0";  Desc = "Encryption library" }
    @{ Name = "anthropic";        Version = "0.42.0";  Desc = "Anthropic Claude SDK" }
    @{ Name = "openai";           Version = "1.58.1";  Desc = "OpenAI SDK" }
    @{ Name = "ollama";           Version = "0.4.4";   Desc = "Ollama SDK" }
    @{ Name = "pydantic";         Version = "2.10.4";  Desc = "Data validation" }
    @{ Name = "python-multipart"; Version = "0.0.20";  Desc = "Multipart form data" }
    @{ Name = "websockets";       Version = "14.1";    Desc = "WebSocket support" }
    @{ Name = "httpx";            Version = "0.27.0";  Desc = "HTTP client" }
)

$pyOk = 0; $pyFail = 0
foreach ($pkg in $PyPackages) {
    $showOutput = uv pip show $pkg.Name 2>&1 | Out-String
    $verMatch = [regex]::Match($showOutput, 'Version:\s+(.+)')
    if ($verMatch.Success) {
        $installedVer = $verMatch.Groups[1].Value.Trim()
        Write-Ok "$($pkg.Name) $installedVer -- $($pkg.Desc)"
        $pyOk++
    } else {
        Write-Fail "$($pkg.Name) -- NOT INSTALLED"
        [void]$Errors.Add("Python package '$($pkg.Name)' failed to install")
        $pyFail++
    }
}

if ($pyFail -eq 0) {
    Write-Info "All $pyOk Python packages verified"
    [void]$Installed.Add("python-packages")
} else {
    Write-Warn "$pyFail Python package(s) failed verification"
}

deactivate
Pop-Location

# ══════════════════════════════════════════════════════════════
#  PHASE 4: Frontend Node.js dependencies
# ══════════════════════════════════════════════════════════════
Write-Header "4/5" "Frontend Dependencies (Node.js)"

Push-Location "$RootDir\frontend"

# Install npm packages
if ((Test-Path "node_modules") -and (Test-Path "node_modules\.package-lock.json")) {
    Write-Info "node_modules exists -- running npm install to sync..."
} else {
    Write-Info "Installing npm packages..."
}
npm install --silent 2>&1 | Out-Null

# Verify key frontend packages
$FePackages = @(
    @{ Name = "react";                     Desc = "React UI library" }
    @{ Name = "react-dom";                 Desc = "React DOM renderer" }
    @{ Name = "react-router-dom";          Desc = "Client-side routing" }
    @{ Name = "vite";                      Desc = "Build tool & dev server" }
    @{ Name = "typescript";                Desc = "TypeScript compiler" }
    @{ Name = "tailwindcss";               Desc = "CSS framework" }
    @{ Name = "@base-ui/react";            Desc = "Headless UI components" }
    @{ Name = "recharts";                  Desc = "Charting library" }
    @{ Name = "react-markdown";            Desc = "Markdown renderer" }
    @{ Name = "lucide-react";              Desc = "Icon library" }
    @{ Name = "shadcn";                    Desc = "Component library" }
    @{ Name = "class-variance-authority";  Desc = "CSS variant utility" }
    @{ Name = "clsx";                      Desc = "Class name utility" }
    @{ Name = "tailwind-merge";            Desc = "Tailwind class merging" }
    @{ Name = "@tailwindcss/vite";         Desc = "Tailwind Vite plugin" }
    @{ Name = "@vitejs/plugin-react";      Desc = "Vite React plugin" }
    @{ Name = "eslint";                    Desc = "Linter" }
)

$feOk = 0; $feFail = 0
foreach ($pkg in $FePackages) {
    $pkgDir = Join-Path "node_modules" $pkg.Name
    if (Test-Path $pkgDir) {
        try {
            $pkgJson = Get-Content (Join-Path $pkgDir "package.json") -Raw | ConvertFrom-Json
            $pkgVer = $pkgJson.version
        } catch {
            $pkgVer = "installed"
        }
        Write-Ok "$($pkg.Name) $pkgVer -- $($pkg.Desc)"
        $feOk++
    } else {
        Write-Fail "$($pkg.Name) -- NOT INSTALLED"
        [void]$Errors.Add("npm package '$($pkg.Name)' failed to install")
        $feFail++
    }
}

if ($feFail -eq 0) {
    Write-Info "All $feOk frontend packages verified"
    [void]$Installed.Add("npm-packages")
} else {
    Write-Warn "$feFail frontend package(s) failed verification"
}

Pop-Location

# ══════════════════════════════════════════════════════════════
#  PHASE 5: Project structure & build check
# ══════════════════════════════════════════════════════════════
Write-Header "5/5" "Project Structure"

Push-Location $RootDir

# Data directory
if (Test-Path "data") {
    Write-Skip "data\ directory"
} else {
    New-Item -ItemType Directory -Path "data" -Force | Out-Null
    Write-Ok "data\ directory created"
}

# Verify key project files exist
$ProjectFiles = @(
    @{ Path = "backend\main.py";           Desc = "Backend entrypoint" }
    @{ Path = "backend\config.py";         Desc = "Backend configuration" }
    @{ Path = "backend\database.py";       Desc = "Database setup" }
    @{ Path = "backend\requirements.txt";  Desc = "Python dependencies" }
    @{ Path = "frontend\package.json";     Desc = "Frontend package manifest" }
    @{ Path = "frontend\vite.config.ts";   Desc = "Vite configuration" }
    @{ Path = "frontend\tsconfig.json";    Desc = "TypeScript configuration" }
    @{ Path = "frontend\src\main.tsx";     Desc = "Frontend entrypoint" }
    @{ Path = "docker-compose.yml";        Desc = "Docker Compose config" }
    @{ Path = "Dockerfile";                Desc = "Docker build config" }
)

foreach ($file in $ProjectFiles) {
    if (Test-Path $file.Path) {
        Write-Ok "$($file.Path) -- $($file.Desc)"
    } else {
        Write-Fail "$($file.Path) -- MISSING"
        [void]$Errors.Add("Project file missing: $($file.Path)")
    }
}

Pop-Location

# ══════════════════════════════════════════════════════════════
#  Summary
# ══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ========================================" -ForegroundColor White
Write-Host ""

if ($Errors.Count -gt 0) {
    Write-Host "  Installation completed with $($Errors.Count) error(s):" -ForegroundColor Red
    Write-Host ""
    foreach ($err in $Errors) {
        Write-Fail $err
    }
    Write-Host ""
    Write-Host "  Fix the above issues and re-run .\install.ps1"
    exit 1
}

Write-Host "  All dependencies installed and verified!" -ForegroundColor Green
Write-Host ""
if ($Installed.Count -gt 0) {
    Write-Host "  Newly installed: $($Installed -join ', ')" -ForegroundColor Green
}
if ($Skipped.Count -gt 0) {
    Write-Host "  Already present: $($Skipped -join ', ')" -ForegroundColor DarkGray
}
Write-Host ""

# ══════════════════════════════════════════════════════════════
#  Docker mode
# ══════════════════════════════════════════════════════════════
if ($Mode -eq "docker") {
    Write-Header "Docker" "Building and starting container..."
    Push-Location $RootDir
    docker compose up -d --build
    Pop-Location
    Write-Host ""
    Write-Host "  LifeOS is running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Open: http://localhost:8081"
    Write-Host "    Logs: docker compose logs -f"
    Write-Host "    Stop: docker compose down"
    Write-Host ""
    exit 0
}

# ══════════════════════════════════════════════════════════════
#  Run mode
# ══════════════════════════════════════════════════════════════
if ($Mode -eq "run") {
    Write-Header "Starting" "LifeOS"

    # Build frontend for production serving
    Write-Info "Building frontend..."
    Push-Location "$RootDir\frontend"
    npm run build 2>&1 | Out-Null

    if (Test-Path "dist") {
        Write-Ok "Frontend built successfully"
    } else {
        Write-Fail "Frontend build failed"
        Pop-Location
        exit 1
    }
    Pop-Location

    # Start backend
    Push-Location $RootDir
    & "$RootDir\backend\.venv\Scripts\Activate.ps1"
    Write-Info "Starting server on http://localhost:8081 ..."
    Write-Host ""

    if ($PythonCmd -eq "py -3") {
        & py -3 backend\main.py
    } else {
        & $PythonCmd backend\main.py
    }
    Pop-Location
    exit 0
}

# ── Default: just show instructions ──────────────────────────
Write-Host "  Quick Start:" -ForegroundColor White
Write-Host ""
Write-Host "    Option 1 -- Single server (production mode):" -ForegroundColor White
Write-Host "      .\install.ps1 -Run"
Write-Host ""
Write-Host "    Option 2 -- Dev mode (hot reload):" -ForegroundColor White
Write-Host "      Terminal 1:  cd backend; .\.venv\Scripts\Activate.ps1; python main.py"
Write-Host "      Terminal 2:  cd frontend; npm run dev"
Write-Host "      Open:        http://localhost:5173"
Write-Host ""
Write-Host "    Option 3 -- Docker:" -ForegroundColor White
Write-Host "      .\install.ps1 -Docker"
Write-Host "      Open:        http://localhost:8081"
Write-Host ""
