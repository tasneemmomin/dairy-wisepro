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
echo  ║    Control Panel v3.4  ^|  Owner: Kedar Patil            ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo    [1]  START ALL          - Launch Backend + Frontend
echo    [2]  STOP ALL           - Kill running services
echo    [3]  HEALTH CHECK       - Check service status
echo    [4]  OPEN BROWSER       - Open app in browser
echo    [5]  INSTALL DEPS       - npm install (both projects)
echo    [6]  VERIFY SETUP       - System check
echo    [7]  CLEAR CACHE        - Remove node_modules + dist
echo    [8]  BUILD FRONTEND     - Production build
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
echo  [START] DairyOS Pro v3.4
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
    echo         Create it with MONGODB_URI and JWT_SECRET
    pause
    goto menu
)
echo  [OK] server\.env found

:: ── Kill existing processes on our ports ─────────────────────────
echo  [CLEAN] Releasing ports %BACKEND_PORT% and %FRONTEND_PORT%...
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%BACKEND_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%FRONTEND_PORT% "') do (
    taskkill /f /pid %%p >nul 2>&1
)
timeout /t 1 >nul
echo  [OK] Ports cleared

echo.

:: ── Start Backend ─────────────────────────────────────────────────
:: KEY FIX: No inner quotes around path - use variable directly
echo  [BACKEND] Starting server on port %BACKEND_PORT%...
start "DairyOS-Backend" cmd /k "cd /d %BACKEND% && node server.js"
timeout /t 4 >nul
echo  [OK] Backend launched

:: ── Start Frontend ────────────────────────────────────────────────
echo  [FRONTEND] Starting Vite on port %FRONTEND_PORT%...
start "DairyOS-Frontend" cmd /k "cd /d %FRONTEND% && npm run dev"
timeout /t 4 >nul
echo  [OK] Frontend launched

:: ── Optional AI engine ────────────────────────────────────────────
where python >nul 2>&1
if not errorlevel 1 (
    if exist "%AIMODEL%\main.py" (
        echo  [AI] Starting AI engine on port %ML_PORT%...
        start "DairyOS-AI" cmd /k "cd /d %AIMODEL% && python main.py"
    )
)

echo.
echo  ============================================================
echo   SUCCESS - All services launched!
echo  ============================================================
echo.
echo   App       : http://localhost:%FRONTEND_PORT%
echo   Admin     : http://localhost:%FRONTEND_PORT%/admin
echo   API Health: http://localhost:%BACKEND_PORT%/api/health
echo.
echo  ════════════════════════════════════════════════════════════
echo   ADMIN LOGIN
echo     Email    : vasantdadaagency816@gmail.com
echo     Password : vasantdada123
echo     Access   : Full Admin Panel (Kedar Patil)
echo  ════════════════════════════════════════════════════════════
echo   USER DASHBOARD
echo     Create account via "Create Account" tab
echo     Use Email + Password (minimum 6 characters)
echo     Features: Cash on Delivery (COD) ^& Online Payments
echo     All orders immediately flow into Admin Panel
echo  ════════════════════════════════════════════════════════════
echo.
echo   Logs show in the terminal windows that opened.
echo   Press Ctrl+C in those windows to stop individual services.
echo.
timeout /t 5 >nul
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
    echo  [OK] AI Engine stopped (port %ML_PORT%)
)

echo.
echo  [DONE] All services stopped.
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
    echo  [ONLINE]  AI Engine - http://localhost:%ML_PORT%
) || (
    echo  [OPTIONAL] AI Engine - Not running (optional)
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

echo  Installing backend (server) dependencies...
cd /d "%BACKEND%"
call npm install
if errorlevel 1 (
    echo  [FAIL] Backend install failed!
) else (
    echo  [OK] Backend dependencies installed
)

echo.
echo  Installing frontend (client) dependencies...
cd /d "%FRONTEND%"
call npm install
if errorlevel 1 (
    echo  [FAIL] Frontend install failed!
) else (
    echo  [OK] Frontend dependencies installed
)

echo.
echo  [DONE] Installation complete. Run option 1 to start.
echo.
pause
goto menu

:: ═══════════════════════════════════════════════════════════════
:verify_setup
:: ═══════════════════════════════════════════════════════════════
cls
echo.
echo  [VERIFY] DairyOS Pro System Check v3.4
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

:: npm
echo  [2] npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo      FAIL - npm not found
) else (
    for /f "tokens=*" %%v in ('npm --version') do echo      OK   - npm v%%v
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
    echo      MISSING - Create server\.env
)

:: bcryptjs
echo  [6] bcryptjs (password hashing)...
cd /d "%BACKEND%"
node -e "require('bcryptjs')" >nul 2>&1
if errorlevel 1 (
    echo      MISSING - Run option 5 to install
) else (
    echo      OK   - bcryptjs ready
)

:: JWT secret
echo  [7] JWT Secret...
cd /d "%BACKEND%"
node -e "require('dotenv').config(); process.exit(process.env.JWT_SECRET?0:1)" >nul 2>&1
if errorlevel 1 (
    echo      MISSING - Add JWT_SECRET to server\.env
) else (
    echo      OK   - JWT_SECRET configured
)

:: MongoDB URI
echo  [8] MongoDB URI...
cd /d "%BACKEND%"
node -e "require('dotenv').config(); process.exit(process.env.MONGODB_URI?0:1)" >nul 2>&1
if errorlevel 1 (
    echo      MISSING - Add MONGODB_URI to server\.env
) else (
    echo      OK   - MONGODB_URI configured
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
    echo  Deploy this folder to any static host (Vercel, Nginx, etc.)
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
echo    3. Clear localStorage: F12 ^> Application ^> Local Storage
echo       ^> right-click ^> Clear
echo    4. Hard reload: Ctrl + Shift + R
echo    5. Make sure backend is running (option 3 to check)
echo.
echo  Issue 2: Login fails - wrong credentials
echo  ──────────────────────────────────────
echo   Admin Email    : vasantdadaagency816@gmail.com
echo   Admin Password : vasantdada123
echo   (Old OTP/mobile login is removed in v3.4)
echo.
echo  Issue 3: npm error - wrong directory
echo  ──────────────────────────────────────
echo   Always use this run.bat to start the project.
echo   Never run npm install from C:\DairyOSPro\DairyOSPro directly.
echo   Use option 5 (Install Deps) from this menu.
echo.
echo  Issue 4: Port already in use
echo  ──────────────────────────────────────
echo   Run option 2 to stop all, wait 5 seconds, then option 1.
echo.
echo  Issue 5: MongoDB connection error
echo  ──────────────────────────────────────
echo   Check MONGODB_URI in server\.env
echo   Make sure your IP is whitelisted in MongoDB Atlas
echo.
echo  Issue 6: Backend starts but frontend blank
echo  ──────────────────────────────────────
echo   Run option 5 to reinstall frontend deps
echo   Then option 1 to restart
echo.
echo  ============================================================
echo.
pause
goto menu