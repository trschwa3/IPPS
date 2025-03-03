@echo off
REM Start the npm dev server in a minimized cmd window
start /min "" cmd /k "cd /d C:\GitHub\IPPS && npm run dev"

REM Wait a few seconds for the server to start (adjust if needed)
timeout /t 1 /nobreak >nul

REM Open the URL in the default browser
start "" "http://localhost:5173/"

exit

