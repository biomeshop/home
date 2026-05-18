@echo off
setlocal

cd /d "%~dp0"
title BiomeShop Local Server

set "NODE_CMD=node"
set "LOCAL_NODE=%~dp0.tools\node-v24.15.0-win-x64\node.exe"
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "PROGRAMFILES_NODE=%ProgramFiles%\nodejs\node.exe"

where node >nul 2>nul
if errorlevel 1 (
  if exist "%LOCAL_NODE%" (
    set "NODE_CMD=%LOCAL_NODE%"
  ) else (
    if exist "%CODEX_NODE%" set "NODE_CMD=%CODEX_NODE%"
    if "%NODE_CMD%"=="node" if exist "%PROGRAMFILES_NODE%" set "NODE_CMD=%PROGRAMFILES_NODE%"
  )
)

if "%NODE_CMD%"=="node" (
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js was not found in PATH.
    echo Checked these fallback locations:
    echo   %LOCAL_NODE%
    echo   %CODEX_NODE%
    echo   %PROGRAMFILES_NODE%
    echo.
    echo Install Node.js or place a portable Node runtime in .tools\node-v24.15.0-win-x64\ and then run this file again.
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
