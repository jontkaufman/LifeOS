@echo off
:: LifeOS Installer — Windows launcher
:: Double-click this file or run from cmd.exe
::
:: This wrapper launches install.ps1 with the right execution policy.
:: Pass arguments through: install.bat -Run | -Check | -Docker

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Press any key to close...
    pause >nul
)
