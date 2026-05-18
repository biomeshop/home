@echo off
setlocal

cd /d "%~dp0"
title BiomeShop Local Server

set "NODE_CMD=node"

where node >nul 2>nul
if errorlevel 1 (
  set "BUNDLED_NODE=C:\Users\Marketing\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if exist "%BUNDLED_NODE%" (
    set "NODE_CMD=%BUNDLED_NODE%"
  ) else (
    echo Node.js was not found in PATH.
    echo The bundled Codex Node runtime was also not found.
    echo Install Node.js or restore the Codex runtime and then run this file again.
    echo.
    pause
    exit /b 1
  )
)

echo Starting local server from:
echo %cd%
echo.
echo The gallery manifest will refresh automatically on startup.
echo Biome app data and validation will refresh automatically on startup.
echo Close this window to stop the server.
echo.

"%NODE_CMD%" scripts\generate-gallery-manifest.mjs
if errorlevel 1 goto :server_error

"%NODE_CMD%" scripts\export-biome-data.mjs
if errorlevel 1 goto :server_error

"%NODE_CMD%" server.mjs
if errorlevel 1 goto :server_error

goto :eof

:server_error
echo.
echo The server stopped because of an error.
pause
