@echo off
setlocal
cd /d "%~dp0"
title Style Foundry
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install the LTS version from https://nodejs.org
  echo Then close this window and double-click this file again.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing Style Foundry dependencies. This may take a minute...
  call npm.cmd ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo Opening Style Foundry in your browser.
echo Keep this window open while you use the app.
echo If an older copy is running, stop it with Ctrl+C first.
call npm.cmd run dev -- --host localhost --port 5173 --strictPort --open
pause
