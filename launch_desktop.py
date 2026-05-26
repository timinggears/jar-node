#!/usr/bin/env python3
"""
Sovereign J.A.R.S. - Native Desktop Window Shell
Launches the Nodal Reservoir Console in a dedicated, borderless, hardware-accelerated 
desktop window container instead of a normal web browser.

Required packages:
  pip install pywebview
"""

import sys
import os

try:
    import webview
except ImportError:
    print("\033[1;31m[ERROR] 'pywebview' is not installed in your Python environment.\033[0m")
    print("Please install it by running the following command in your terminal:")
    print("  \033[1;32mpip install pywebview\033[0m")
    sys.exit(1)

# Default development app link provided by the workspace proxy
DEFAULT_URL = "https://ais-dev-hltv4y4usao3e5terlhjvj-107549292245.us-west2.run.app"
LOCAL_URL = "http://localhost:3000"

def main():
    print("\033[1;34m========================================================\033[0m")
    print("\033[1;35m       SOVEREIGN J.A.R.S. - DESKTOP WINDOW SHELL       \033[0m")
    print("\033[1;34m========================================================\033[0m")
    print("Select application route:")
    print(f" [1] Cloud Live Node URL (Standard Remote Deployment)")
    print(f" [2] Local Loopback URL (Running inside container via Port 3000)")
    
    choice = input("\nEnter system choice [1-2] (default: 1): ").strip()
    
    if choice == "2":
        target_url = LOCAL_URL
        print(f"\n[LAUNCH] Routing window frame to local loop: {target_url}")
    else:
        target_url = DEFAULT_URL
        print(f"\n[LAUNCH] Routing window frame to live sovereign cloud node: {target_url}")

    # Configure hardware accelleration & window characteristics 
    print("[DESKTOP_DAEMON] Initializing pywebview viewport...")
    
    window = webview.create_window(
        title="J.A.R.S. Sovereign Cognitive Core Console",
        url=target_url,
        width=1380,
        height=850,
        resizable=True,
        fullscreen=False,
        background_color="#010602"
    )

    # Start the desktop window loops
    # debug=True can be set to inspect console logs via native system developer tools (right-click / inspect)
    webview.start(debug=False)

if __name__ == "__main__":
    main()
