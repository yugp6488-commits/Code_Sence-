@echo off
echo Starting CodeSense API Server...
echo.
if not exist "artifacts\api-server\.env" (
  echo ERROR: Missing .env file!
  echo.
  echo Please create the file: artifacts\api-server\.env
  echo With this content:
  echo   NEON_DATABASE_URL=postgresql://...your neon url...
  echo   GEMINI_API_KEY=...your gemini key...
  echo   PORT=8080
  echo.
  pause
  exit /b 1
)
cd artifacts\api-server
pnpm run dev
pause
