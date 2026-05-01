@echo off
setlocal

cd /d "%~dp0"
title BiomeShop Local Server

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  echo Install Node.js and then run this file again.
  echo.
  pause
  exit /b 1
)

echo Starting local server from:
echo %cd%
echo.
echo The gallery manifest will refresh automatically on startup.
echo Close this window to stop the server.
echo.

node server.mjs

if errorlevel 1 (
  echo.
  echo The server stopped because of an error.
  pause
)
