@echo off
REM Usage: auto_web_optimize.bat input.mp4
REM Output: input_web.mp4 (~50–75 MB target, web-optimized)

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: %0 input.mp4
    exit /b 1
)

set "input=%~1"
set "filename=%~dpn1"

REM --- Get file size in MB ---
for %%I in ("%input%") do set /a filesize_bytes=%%~zI
set /a filesize_mb=%filesize_bytes%/1048576

REM --- Get duration in seconds using ffprobe ---
for /f "usebackq tokens=* delims=" %%a in (`ffprobe -v error -show_entries format^=duration -of default^=noprint_wrappers^=1:nokey^=1 "%input%"`) do set "duration=%%a"
for /f "tokens=1 delims=." %%b in ("%duration%") do set /a duration=%%b

if "%duration%"=="0" (
    echo Error: Could not determine duration.
    exit /b 1
)

REM --- Target size logic ---
set /a target_size_mb=50
if %filesize_mb% GEQ 100 set /a target_size_mb=75

REM --- Compute bitrates (in kbps) ---
set /a target_bitrate_kbps=(%target_size_mb% * 8192) / %duration%
set /a audio_bitrate_kbps=128
set /a video_bitrate_kbps=%target_bitrate_kbps% - %audio_bitrate_kbps%

echo Input:  %filesize_mb% MB, %duration%s
echo Target: %target_size_mb% MB  ^(%target_bitrate_kbps% kbps total, video=%video_bitrate_kbps%k^)
echo Encoding...

REM --- First pass (analysis only) ---
ffmpeg -y -i "%input%" -c:v libx264 -b:v %video_bitrate_kbps%k -pass 1 -an -movflags faststart -preset medium -tune film -f mp4 NUL

REM --- Second pass (encode for web) ---
ffmpeg -i "%input%" -c:v libx264 -b:v %video_bitrate_kbps%k -pass 2 -c:a aac -b:a %audio_bitrate_kbps%k ^
 -movflags faststart -preset medium -tune film -pix_fmt yuv420p "%filename%_web.mp4"

echo ✅ Output saved as "%filename%_web.mp4"
endlocal
