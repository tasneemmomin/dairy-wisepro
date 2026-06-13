@echo off
setlocal enabledelayedexpansion
title DairyOS Pro - Vasant Dairy Agency
color 0B

:: ── Project paths (no trailing backslash issues) ───────────────────────────
set "ROOT=%~dp0"
set "BACKEND=%~dp0server"
set "FRONTEND=%~dp0client"
set "AIMODEL=%~dp0ml-model"
set BACKEND_PORT=5000
set FRONTEND_PORT=5173
set ML_PORT=8000

:menu
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║          DairyOS Pro - Vasant Dairy Agency               ║
echo  ║    Control Panel v4.0  ^|  Owner: Kedar Patil            ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo    [1]  START ALL          - Launch Backend, Frontend ^& ML Engine
echo    [2]  STOP ALL           - Kill all running services
echo    [3]  HEALTH CHECK       - Check service status
echo    [4]  OPEN BROWSER       - Open app in browser
echo    [5]  INSTALL DEPS       - npm ^& pip install (all packages)
echo    [6]  VERIFY SETUP       - System check
echo    [7]  CLEAR CACHE        - Remove node_modules + dist
echo    [8]  BUILD FRONTEND     - Production React build
echo    [9]  TROUBLESHOOT       - Common issues
echo    [10] EXIT
echo.
set /p choice="  Select option (1-10): "

if "%choice%"=="1"  goto start_all
if "%choice%"=="2"  goto stop_all
if "%choice%"=="3"  goto health_check
if "%choice%"=="4"  goto open_browser
if "%choice%"=="5"  goto install_deps
if "%choice%"=="6"  goto verify_setup
if "%choice%"=="7"  goto clear_cache
if "%choice%"=="8"  goto build_frontend
if "%choice%"=="9"  goto troubleshoot
if "%choice%"=="10" exit /b
goto menu

:: ═══════════════════════════════════════════════════════════════
:start_all
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [START] DairyOS Pro v4.0
echo  ============================================================
echo.

:: ── Node.js check ────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install from: https://nodejs.org
    pause
    goto menu
)
for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v detected

:: ── .env check ───────────────────────────────────────────────────
if not exist "%BACKEND%\.env" (
    echo  [ERROR] server\.env missing! 
    echo         Please copy server\.env.example to server\.env
    pause
    goto menu
)
echo  [OK] server\.env found

:: ── Kill existing processes on our ports ─────────────────────────
echo  [CLEAN] Releasing ports %BACKEND_PORT%, %FRONTEND_PORT%, and %ML_PORT%...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%ML_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
)
timeout /t 1 >nul
echo  [OK] Ports cleared

echo.

:: ── Start Backend ─────────────────────────────────────────────────
echo  [BACKEND] Starting server on port %BACKEND_PORT%...
start "DairyOS-Backend" cmd /k "cd /d %BACKEND% && npm run dev"
timeout /t 4 >nul
echo  [OK] Backend launched

:: ── Start Frontend ────────────────────────────────────────────────
echo  [FRONTEND] Starting Vite on port %FRONTEND_PORT%...
start "DairyOS-Frontend" cmd /k "cd /d %FRONTEND% && npm run dev"
timeout /t 2 >nul
echo  [OK] Frontend launched

:: ── Start ML Engine ────────────────────────────────────────────
where python >nul 2>&1
if not errorlevel 1 (
    if exist "%AIMODEL%\main.py" (
        echo  [ML ENGINE] Starting FastAPI ML engine on port %ML_PORT%...
        start "DairyOS-ML" cmd /k "cd /d %AIMODEL% && uvicorn main:app --reload --host 0.0.0.0 --port %ML_PORT%"
        echo  [OK] AI ML Engine launched
    )
) else (
    echo  [WARN] Python not found. ML Engine skipped.
)

echo.
echo  ============================================================
echo   SUCCESS - All services launched!
echo  ============================================================
echo.
echo   App       : http://localhost:%FRONTEND_PORT%
echo   Admin     : http://localhost:%FRONTEND_PORT%/admin
echo   API Health: http://localhost:%BACKEND_PORT%/api/health
echo   ML Health : http://localhost:%ML_PORT%/docs
echo.
timeout /t 3 >nul
start http://localhost:%FRONTEND_PORT%
goto menu

:: ═══════════════════════════════════════════════════════════════
:stop_all
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [STOP] Stopping all DairyOS services...
echo.

for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
    echo  [OK] Backend stopped (port %BACKEND_PORT%)
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
    echo  [OK] Frontend stopped (port %FRONTEND_PORT%)
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%ML_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
    echo  [OK] ML Engine stopped (port %ML_PORT%)
)

echo.
echo  [DONE] All matching services securely stopped.
echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:health_check
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [HEALTH] Service Status
echo  ====================================================
echo.

netstat -ano 2>nul | findstr ":%BACKEND_PORT% " >nul && (
    echo  [ONLINE]  Backend   - http://localhost:%BACKEND_PORT%
) || (
    echo  [OFFLINE] Backend   - Not running (start with option 1)
)

netstat -ano 2>nul | findstr ":%FRONTEND_PORT% " >nul && (
    echo  [ONLINE]  Frontend  - http://localhost:%FRONTEND_PORT%
) || (
    echo  [OFFLINE] Frontend  - Not running (start with option 1)
)

netstat -ano 2>nul | findstr ":%ML_PORT% " >nul && (
    echo  [ONLINE]  ML Engine - http://localhost:%ML_PORT%
) || (
    echo  [OFFLINE] ML Engine - Not running (start with option 1)
)

echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:open_browser
:: ═══════════════════════════════════════════════════════════════
start http://localhost:%FRONTEND_PORT%
goto menu

:: ═══════════════════════════════════════════════════════════════
:install_deps
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [INSTALL] Installing dependencies...
echo  ----------------------------------------------------
echo.

echo  [1/3] Installing backend (server) dependencies...
cd /d "%BACKEND%"
call npm install
if errorlevel 1 (
    echo  [FAIL] Backend install failed!
) else (
    echo  [OK] Backend dependencies installed
)

echo.
echo  [2/3] Installing frontend (client) dependencies...
cd /d "%FRONTEND%"
call npm install
if errorlevel 1 (
    echo  [FAIL] Frontend install failed!
) else (
    echo  [OK] Frontend dependencies installed
)

echo.
echo  [3/3] Installing ML Model (Python) dependencies...
where python >nul 2>&1
if not errorlevel 1 (
    if exist "%AIMODEL%\requirements.txt" (
        cd /d "%AIMODEL%"
        call pip install -r requirements.txt
        if errorlevel 1 (
            echo  [FAIL] ML model install failed!
        ) else (
            echo  [OK] ML model dependencies installed
        )
    )
) else (
    echo  [WARN] Python not found. Please install Python to use ML features.
)

echo.
echo  [DONE] Full installation complete. Run option 1 to start.
echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:verify_setup
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [VERIFY] DairyOS Pro System Check v4.0
echo  ============================================================
echo.

:: Node.js
echo  [1] Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo      FAIL - Not installed. Get it from https://nodejs.org
) else (
    for /f "tokens=*" %%v in ('node --version') do echo      OK   - Node.js %%v
)

:: Python
echo  [2] Python...
where python >nul 2>&1
if errorlevel 1 (
    echo      WARN - Not installed. AI models won't run.
) else (
    for /f "tokens=*" %%v in ('python --version') do echo      OK   - %%v
)

:: Backend node_modules
echo  [3] Backend dependencies...
if exist "%BACKEND%\node_modules" (
    echo      OK   - node_modules found
) else (
    echo      MISSING - Run option 5 to install
)

:: Frontend node_modules
echo  [4] Frontend dependencies...
if exist "%FRONTEND%\node_modules" (
    echo      OK   - node_modules found
) else (
    echo      MISSING - Run option 5 to install
)

:: .env
echo  [5] server\.env file...
if exist "%BACKEND%\.env" (
    echo      OK   - .env found
) else (
    echo      MISSING - Please copy .env.example
)

echo.
echo  ============================================================
echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:clear_cache
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [CLEAN] Removing node_modules and build cache...
echo  ----------------------------------------------------
echo.

if exist "%BACKEND%\node_modules" (
    echo  Removing server\node_modules...
    rmdir /s /q "%BACKEND%\node_modules"
    echo  [OK] Done
)
if exist "%FRONTEND%\node_modules" (
    echo  Removing client\node_modules...
    rmdir /s /q "%FRONTEND%\node_modules"
    echo  [OK] Done
)
if exist "%FRONTEND%\dist" (
    echo  Removing client\dist...
    rmdir /s /q "%FRONTEND%\dist"
    echo  [OK] Done
)

echo.
echo  [DONE] Cache cleared. Run option 5 to reinstall.
echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:build_frontend
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [BUILD] Creating production build...
echo  ----------------------------------------------------
echo.

cd /d "%FRONTEND%"
call npm run build
if errorlevel 1 (
    echo.
    echo  [FAIL] Build failed - check errors above
) else (
    echo.
    echo  [SUCCESS] Build complete!
    echo  Output: client\dist\
    echo  Deploy this folder to Vercel or any static host.
)
echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:troubleshoot
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [TROUBLESHOOT] Common Issues
echo  ============================================================
echo.
echo  Issue 1: Blank white page on localhost
echo  ──────────────────────────────────────
echo   Fix:
echo    1. Open browser, press F12 ^> Console tab
echo    2. Look for red errors
echo    3. Clear localStorage (Application ^> Local Storage ^> Clear)
echo    4. Hard reload (Ctrl + Shift + R)
echo.
echo  Issue 2: Login fails - wrong credentials
echo  ──────────────────────────────────────
echo   Check your MONGODB_URI. Default Admin:
echo   Email    : vasantdadaagency816@gmail.com
echo   Password : vasantdada123
echo.
echo  Issue 3: npm error missing dependencies
echo  ──────────────────────────────────────
echo   Run Option 5 to install all Node.js and Python packages.
echo.
echo  Issue 4: AI Model failing to start
echo  ──────────────────────────────────────
echo   Ensure Python ^>3.10 is installed and option 5 was run
echo   to install "fastapi" and "uvicorn".
echo.
echo  ============================================================
echo.
pause
goto menu