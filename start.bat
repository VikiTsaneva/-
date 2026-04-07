@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Проверка за Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo Node.js не е намерен. Инсталирай Node.js от https://nodejs.org и опитай отново.
  pause
  exit /b 1
)

echo Стартиране на локален сървър с npx serve...
 npx serve .

pause
