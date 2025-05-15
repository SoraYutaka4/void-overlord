@echo off
setlocal EnableDelayedExpansion

:: Get the folder containing the .bat file
set "watchDir=%~dp0"
set "flagFile=rscache.flag"

:: If the flag file already exists, delete it first
if exist "%watchDir%%flagFile%" (
    del "%watchDir%%flagFile%"
    echo 🗑 Deleted old file: %flagFile%
)

:: Create a new flag file
echo. > "%watchDir%%flagFile%"
echo 🚀 Created file %flagFile% in %watchDir%
echo 🔄 Watching for %flagFile%...

:: Start watching the file
:watch
if not exist "%watchDir%%flagFile%" (
    echo ✅ File %flagFile% has been deleted! Reset successful!
    exit /b
)

:: If the file still exists, wait and check again
timeout /t 2 /nobreak >nul
goto watch
