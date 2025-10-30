#!/bin/bash
# Usage: ./auto_web_optimize.sh input.mp4
# Output: input_web.mp4 (web-optimized for web hosting, ~50–75 MB)

input="$1"
if [ -z "$input" ]; then
  echo "Usage: $0 input.mp4"
  exit 1
fi

# Extract file base name
filename="${input%.*}"

# Get file size in megabytes
filesize_bytes=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input")
filesize_mb=$(echo "scale=2; $filesize_bytes / 1048576" | bc)

# Get duration in seconds (using ffprobe)
duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$input")
duration=$(printf "%.0f" "$duration")

if [ "$duration" -eq 0 ]; then
  echo "Error: could not determine duration."
  exit 1
fi

# Target size logic:
# If input < 100 MB, reduce to 50 MB; if larger, aim for 75 MB
if (( $(echo "$filesize_mb < 100" | bc -l) )); then
  target_size_mb=50
else
  target_size_mb=75
fi

# Compute target total bitrate (kbps)
target_bitrate_kbps=$(echo "scale=0; ($target_size_mb * 8192) / $duration" | bc)

# Reserve audio bitrate (~128 kbps) and compute video bitrate
audio_bitrate_kbps=128
video_bitrate_kbps=$(echo "$target_bitrate_kbps - $audio_bitrate_kbps" | bc)
video_bitrate="${video_bitrate_kbps}k"

echo "Input:  ${filesize_mb} MB, ${duration}s"
echo "Target: ${target_size_mb} MB (~${target_bitrate_kbps} kbps total, video=${video_bitrate})"
echo "Encoding..."

# First pass (analysis)
ffmpeg -y -i "$input" -c:v libx264 -b:v $video_bitrate -pass 1 -an -movflags faststart -preset medium -tune film -f mp4 /dev/null

# Second pass (encode)
ffmpeg -i "$input" -c:v libx264 -b:v $video_bitrate -pass 2 -c:a aac -b:a ${audio_bitrate_kbps}k \
  -movflags faststart -preset medium -tune film -pix_fmt yuv420p \
  "${filename}_web.mp4"

echo "✅ Output saved as ${filename}_web.mp4"

