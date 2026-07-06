#!/bin/bash
set -e
cd /home/nbaytl1992/startup/mindmirror-ai
export https_proxy=http://$(ip route | grep default | awk '{print $3}'):7897
BUILD_ID="0db9bf92-a8f3-4ad4-b1e5-b2a5aac4cba8"

echo "[$(date '+%H:%M:%S')] Start monitoring build $BUILD_ID"

while true; do
  RESULT=$(npx eas build:list --limit 1 --platform ios --json 2>/dev/null | grep -o '"status": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "[$(date '+%H:%M:%S')] status=$RESULT"

  if [ "$RESULT" = "FINISHED" ]; then
    echo "[$(date '+%H:%M:%S')] Build finished, submitting to App Store..."
    npx eas submit --platform ios --id "$BUILD_ID" --non-interactive 2>&1 || echo "Submit exited with $?"
    echo "[$(date '+%H:%M:%S')] Submit done"
    break
  elif [ "$RESULT" = "ERRORED" ] || [ "$RESULT" = "CANCELED" ]; then
    echo "[$(date '+%H:%M:%S')] Build failed or canceled: $RESULT"
    break
  fi

  sleep 120
done
