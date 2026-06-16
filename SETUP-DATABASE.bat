@echo off
echo Setting up CodeSense Database...
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
echo Found .env file, pushing schema to database...
pnpm --filter @workspace/db run push
echo.
echo Done! Now run START-API.bat and START-FRONTEND.bat
pause
