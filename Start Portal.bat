@echo off
title Carebridge Portal
echo Starting Carebridge Portal server...
cd /d "%~dp0"
start /B node server.js
timeout /t 2 /nobreak > nul
start "" "http://localhost:3000/Carebridge Login.html"
echo.
echo Portal is running at http://localhost:3000
echo Open your browser and go to: http://localhost:3000/Carebridge Login.html
echo.
echo Press any key to stop the server and exit.
pause > nul
taskkill /F /IM node.exe /T > nul 2>&1
