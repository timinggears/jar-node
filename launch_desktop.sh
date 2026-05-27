#!/usr/bin/env bash
# =====================================================================
# Sovereign J.A.R.S. - Standalone Desktop Program Window Spawn Script
# =====================================================================
# This bash script spawns the J.A.R.S. Nodal Reservoir interface directly
# into a client-exclusive, freestanding program window frame.
# =====================================================================

# Colorized console output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}========================================================${NC}"
echo -e "${GREEN}      SOVEREIGN J.A.R.S. - STANDALONE PROCESS SHELL     ${NC}"
echo -e "${CYAN}========================================================${NC}"
echo -e "Readying hardware-accelerated program viewport...\n"

LIVE_URL="https://ais-dev-hltv4y4usao3e5terlhjvj-107549292245.us-west2.run.app"
LOCAL_URL="http://localhost:3000"

echo -e "Which target node core would you like to latch onto?"
echo -e " [1] Cloud Live Node Core (Standard Remote Host)"
echo -e " [2] Local Loopback Core (Running on Localmachine Node on Port 3000)"
read -r -p "Enter Choice [1-2] (default: 1): " choice

if [[ "$choice" == "2" ]]; then
    TARGET_URL=$LOCAL_URL
else
    TARGET_URL=$LIVE_URL
fi

echo -e "\n${CYAN}[SHELL] Target vector loaded:${NC} $TARGET_URL"
echo -e "${CYAN}[SHELL] Determining best window manager on your OS...${NC}"

# Check for Chrome App Mode, pywebview, zenity, xdg-open, etc.
if command -v google-chrome &> /dev/null; then
    echo -e "${GREEN}[LAUNCH] Spawning dedicated Chromium Application Window wrapper...${NC}"
    google-chrome --app="$TARGET_URL" --class="jars_console" --user-data-dir="/tmp/jars_pwa_profile" &
    exit 0
elif command -v chromium-browser &> /dev/null; then
    echo -e "${GREEN}[LAUNCH] Spawning dedicated Chromium Application Window wrapper...${NC}"
    chromium-browser --app="$TARGET_URL" --class="jars_console" --user-data-dir="/tmp/jars_pwa_profile" &
    exit 0
elif command -v chromium &> /dev/null; then
    echo -e "${GREEN}[LAUNCH] Spawning dedicated Chromium Application Window wrapper...${NC}"
    chromium --app="$TARGET_URL" --class="jars_console" --user-data-dir="/tmp/jars_pwa_profile" &
    exit 0
elif [ -f "launch_desktop.py" ] && python3 -c "import webview" &> /dev/null; then
    echo -e "${GREEN}[LAUNCH] Spawning PyWebView native Desktop Frame...${NC}"
    python3 launch_desktop.py
    exit 0
else
    echo -e "${YELLOW}[WARNING] Preferred native browser frames or 'pywebview' not pre-installed.${NC}"
    echo -e "Attempting installation of PyWebView dependency to lock frame..."
    
    python3 -m pip install pywebview --user
    if python3 -c "import webview" &> /dev/null; then
        echo -e "${GREEN}[LAUNCH] PyWebView compiled successfully. Initializing Window Node...${NC}"
        python3 launch_desktop.py
        exit 0
    else
        echo -e "${RED}[ERROR] Desktop managers unavailable.${NC}"
        echo -e "To launch manually, you can run:"
        echo -e "  $ chromium --app=$TARGET_URL"
        echo -e "  - OR install client requirements: pip install pywebview"
    fi
fi
