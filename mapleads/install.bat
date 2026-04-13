@echo off
title MapLeads France - Installation
echo.
echo ============================================
echo   MapLeads France - Installation automatique
echo ============================================
echo.

node -v >/dev/null 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Telecharge et installe Node.js : https://nodejs.org
    start https://nodejs.org
    pause
    exit
)
echo Node.js detecte.

IF NOT EXIST "%USERPROFILE%\mapleads" (
    echo Telechargement...
    cd "%USERPROFILE%"
    git clone https://github.com/hach2208/artizano.git artizano_tmp
    xcopy artizano_tmp\mapleads mapleads /E /I /Q
    rmdir /S /Q artizano_tmp
)
cd "%USERPROFILE%\mapleads"

IF NOT EXIST ".env" (
    copy .env.example .env
    echo.
    set /p ANTHROPIC_KEY="Entre ta cle Anthropic: "
    set /p GOOGLE_KEY="Entre ta cle Google Places: "
    powershell -Command "(gc .env) -replace 'ANTHROPIC_API_KEY=.*', ('ANTHROPIC_API_KEY=' + '%ANTHROPIC_KEY%') | Set-Content .env"
    powershell -Command "(gc .env) -replace 'GOOGLE_PLACES_API_KEY=.*', ('GOOGLE_PLACES_API_KEY=' + '%GOOGLE_KEY%') | Set-Content .env"
    echo .env configure.
)

call npm install --silent
start "" http://localhost:3000
node server.js
