@echo off
echo Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul

echo Cleaning Prisma cache...
cd /d "%~dp0"
if exist "node_modules\.prisma" rmdir /s /q "node_modules\.prisma"

echo Generating Prisma client...
call npx prisma generate

echo Done! You can now start the server with: npm start
pause
