@echo off
echo Building and pushing Docker images...
bash ./build-and-push.sh
if %errorlevel% neq 0 (
    echo Build and push failed!
    pause
    exit /b %errorlevel%
)
echo Done!
pause
