#!/usr/bin/env python3
"""
Sovereign J.A.R.S. Core - Python Serial Bridge Helper
Bridges the physical Pi Pico USB Serial port with the web dashboard via WebSockets.
Use this helper if Node's native serial port fails to compile/access on your host OS.

Required packages:
  pip install pyserial "python-socketio[client]"
"""

import sys
import time
import glob
import serial
import socketio
import os
import argparse

# Configuration & ARGUMENTS Parse
DEFAULT_SERVER_URL = "http://127.0.0.1:3000"
DEFAULT_BAUD_RATE = 115200

parser = argparse.ArgumentParser(description="Sovereign J.A.R.S. Serial Bridge Helper")
parser.add_argument("--url", default=os.environ.get("JARS_SERVER_URL", DEFAULT_SERVER_URL), help="Sovereign server URL (default: http://127.0.0.1:3000)")
parser.add_argument("--baud", type=int, default=DEFAULT_BAUD_RATE, help="Serial baud rate (default: 115200)")
args, unknown = parser.parse_known_args()

SERVER_URL = args.url
BAUD_RATE = args.baud

def connect_to_server():
    """Establishes Socket.IO connection. For HTTPS/remote URLs, we force 'websocket' transport to bypass cloud proxy polling restrictions."""
    is_remote = SERVER_URL.startswith("https://") or ("127.0.0.1" not in SERVER_URL and "localhost" not in SERVER_URL)
    if is_remote:
        sio.connect(SERVER_URL, transports=['websocket'])
    else:
        sio.connect(SERVER_URL, transports=['polling', 'websocket'])

# Initialize Socket.IO Client
sio = socketio.Client()
ser = None

def find_serial_port():
    """Dynamically scan for Pi Pico or typical USB serial devices."""
    patterns = []
    if sys.platform.startswith("win"):
        ports = [f"COM{i}" for i in range(1, 256)]
    elif sys.platform.startswith("linux"):
        patterns = ["/dev/ttyACM*", "/dev/ttyUSB*"]
    elif sys.platform.startswith("darwin"):
        patterns = ["/dev/tty.usbmodem*", "/dev/tty.usbserial*"]
        
    ports = []
    for pattern in patterns:
        ports.extend(glob.glob(pattern))
        
    if sys.platform.startswith("win"):
        # Test which COMs exist
        active_coms = []
        for p in ports:
            try:
                s = serial.Serial(p)
                s.close()
                active_coms.append(p)
            except Exception:
                pass
        return active_coms[0] if active_coms else None
        
    return ports[0] if ports else None

@sio.event
def connect():
    print(f"\033[1;32m[BRIDGE] Connected to sovereign interface wrapper at {SERVER_URL}\033[0m")
    sio.emit("hardware:log_input", "SYSTEM_BRIDGE: Unified Python serial proxy linked.")

@sio.event
def disconnect():
    print("\033[1;31m[BRIDGE] Disconnected from server. Retrying...\033[0m")

@sio.on("hardware:params")
def on_params(data):
    """Listens for parameters from the dashboard and relays them to physical hardware."""
    global ser
    if ser and ser.is_open:
        try:
            if "bias" in data:
                cmd = f"BIAS:{data['bias']}\n"
                ser.write(cmd.encode("utf-8"))
                print(f"[BRIDGE -> HW] Unified Bias shift: {data['bias']} GHz")
            if "overdrive" in data:
                ov_val = "1" if data["overdrive"] else "0"
                cmd = f"OVERDRIVE:{ov_val}\n"
                ser.write(cmd.encode("utf-8"))
                print(f"[BRIDGE -> HW] Substrate Overdrive toggled: {data['overdrive']}")
        except Exception as e:
            print(f"[BRIDGE -> HW] Command relay error: {e}")

@sio.on("hardware:command")
def on_command(cmd):
    """Forwards generic terminal CLI commands directly to the Pico."""
    global ser
    if ser and ser.is_open:
        try:
            full_cmd = f"{cmd}\n"
            ser.write(full_cmd.encode("utf-8"))
            print(f"[BRIDGE -> HW] Generic CLI payload relayed: {cmd}")
        except Exception as e:
            print(f"[BRIDGE -> HW] Command route exception: {e}")

def main():
    global ser
    print("\033[1;34m========================================================\033[0m")
    print("\033[1;36m       SOVEREIGN J.A.R.S. - LOCAL HARDWARE PROXY       \033[0m")
    print("\033[1;34m========================================================\033[0m")
    
    # 1. Connect to server (using custom parameters / fallback)
    try:
        connect_to_server()
    except Exception as e:
        print(f"\033[1;33m[BRIDGE] Waiting for server at {SERVER_URL} to spin up... (Reason: {e})\033[0m")
        # Attempt deferred loop
        
    # 2. Infinite telemetry proxy loop
    while True:
        if not sio.connected:
            try:
                connect_to_server()
            except Exception:
                time.sleep(2)
                continue

        port = find_serial_port()
        if not port:
            print("[BRIDGE] No physical Pico or USB reservoir detected. Retrying scan in 5s...", end="\r")
            time.sleep(5)
            continue
            
        print(f"\n\033[1;32m[BRIDGE] Substrate hardware channel detected at: {port}\033[0m")
        try:
            ser = serial.Serial(port, BAUD_RATE, timeout=1)
            # Flush existing buffers
            ser.reset_input_buffer()
            ser.reset_output_buffer()
            
            print("\033[1;32m[BRIDGE] Read channel secured. Piping telemetry...\033[0m")
            sio.emit("hardware:log_input", f"SYSTEM_BRIDGE: Live serial loop running successfully on {port}.")
            
            while True:
                if not sio.connected:
                    break
                    
                line = ser.readline()
                if line:
                    try:
                        decoded = line.decode("utf-8", errors="ignore").strip()
                        if decoded.startswith("!S|"):
                            # Forward raw telemetry line back into core SocketIO room
                            sio.emit("hardware:telemetry_input", decoded)
                        elif decoded:
                            # Forward any debug stdout logs
                            sio.emit("hardware:log_input", f"PICO_HARDWARE: {decoded}")
                    except Exception as parse_err:
                        pass
                        
                time.sleep(0.001) # Yield execution
                
        except (serial.SerialException, OSError) as port_err:
            print(f"\n\033[1;31m[BRIDGE] Hardware connection interrupt: {port_err}\033[0m")
            sio.emit("hardware:log_input", f"SYSTEM_BRIDGE WARNING: Port error: {port_err}")
            if ser:
                try:
                    ser.close()
                except Exception:
                    pass
            time.sleep(3)
        except KeyboardInterrupt:
            print("\n[BRIDGE] Graceful termination requested.")
            break
            
    if ser:
        ser.close()
    sio.disconnect()

if __name__ == "__main__":
    main()
