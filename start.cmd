@echo off
REM Arranque rapido en Windows para la app de Informes Tecnicos Automotrices

if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install || exit /b 1
)

if not exist ".env" (
    echo Creando .env a partir de .env.example ...
    copy /y ".env.example" ".env" >nul
    echo.
    echo  IMPORTANTE: edite .env y agregue su ANTHROPIC_API_KEY antes de generar informes.
    echo.
)

call npm start
