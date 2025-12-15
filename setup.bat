@echo off
echo === Creation structure Chandeleur ===

REM Créer les dossiers
mkdir client\shared\js
mkdir client\shared\assets\fonts
mkdir client\ambiance-styles\images
mkdir client\culinarion\images
mkdir client\admin-panel
mkdir server\src\routes
mkdir server\src\middleware
mkdir server\src\models
mkdir server\src\config
mkdir docs

echo Structure creee !

REM Créer fichiers vides
type nul > client\shared\js\game-engine.js
type nul > client\shared\js\api.js
type nul > client\shared\js\utils.js
type nul > client\ambiance-styles\index.html
type nul > client\ambiance-styles\admin.html
type nul > client\ambiance-styles\style.css
type nul > client\ambiance-styles\script.js
type nul > client\ambiance-styles\config.js
type nul > client\culinarion\index.html
type nul > client\culinarion\admin.html
type nul > client\culinarion\style.css
type nul > client\culinarion\script.js
type nul > client\culinarion\config.js
type nul > client\admin-panel\dashboard.html
type nul > client\admin-panel\admin.js
type nul > client\admin-panel\admin.css
type nul > server\src\routes\auth.js
type nul > server\src\routes\participants.js
type nul > server\src\routes\stats.js
type nul > server\src\middleware\auth.js
type nul > server\src\models\database.js
type nul > server\src\config\db.sql
type nul > server\src\server.js
type nul > server\package.json
type nul > server\.env.example
type nul > docs\SETUP.md
type nul > docs\DEPLOY.md
type nul > .gitignore
type nul > README.md

echo Fichiers crees !
echo.
echo === TERMINE ===
pause
