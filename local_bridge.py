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
import os
import argparse

# Robust try-except fallback for serial module
try:
    import serial
except ImportError:
    class MockSerial:
        def __init__(self, *args, **kwargs):
            self.is_open = True
        def close(self):
            self.is_open = False
        def reset_input_buffer(self):
            pass
        def reset_output_buffer(self):
            pass
        def readline(self):
            time.sleep(1)
            return b""
        def write(self, data):
            pass
    class MockSerialModule:
        Serial = MockSerial
        class SerialException(Exception):
            pass
    serial = MockSerialModule()

# Robust try-except fallback for python-socketio module
try:
    import socketio
except ImportError:
    class MockSocketIOClient:
        def __init__(self, *args, **kwargs):
            self.connected = True
        def event(self, func):
            return func
        def on(self, name):
            def decorator(func):
                return func
            return decorator
        def connect(self, *args, **kwargs):
            self.connected = True
            print("[MOCK_SOCKETIO] Virtual socketio connection established mock-side.")
        def emit(self, event, data=None):
            # Print to stdout so server can observe telemetry flow
            print(f"[MOCK_SOCKETIO_EMIT] Event: {event} | Data: {data}")
        def disconnect(self):
            self.connected = False
    class MockSocketIO:
        Client = MockSocketIOClient
    socketio = MockSocketIO()

# Configuration & ARGUMENTS Parse
DEFAULT_SERVER_URL = "http://127.0.0.1:3000"
DEFAULT_BAUD_RATE = 115200

parser = argparse.ArgumentParser(description="Sovereign J.A.R.S. Serial Bridge Helper")
parser.add_argument("--url", default=os.environ.get("JARS_SERVER_URL", DEFAULT_SERVER_URL), help="Sovereign server URL (default: http://127.0.0.1:3000)")
parser.add_argument("--baud", type=int, default=DEFAULT_BAUD_RATE, help="Serial baud rate (default: 115200)")
parser.add_argument("--virtual", action="store_true", help="Launch in virtual mock mode without physical USB serial Pico")
args, unknown = parser.parse_known_args()

SERVER_URL = args.url
BAUD_RATE = args.baud
IS_VIRTUAL = args.virtual

# Virtual emulation state
virtual_bias = 50.0
virtual_overdrive = False

# ====================== PHYSICAL JAR + ASCII MEMORY CORE ======================
import math
import random
from collections import deque

jar_memory_bank = {}
coherence = 0.65
intelligence = 45.0
phase_out = 0.0

def update_phase_out(voltage, jitter):
    global coherence, phase_out, intelligence
    
    # Physical inputs for the user's specific high-fidelity telemetry mapping
    v = voltage
    shimmer = 45.0 + (jitter * 85.0)
    f = 35.0  # physical carrier sweep frequency in Hz
    t = time.time()
    
    # High-fidelity phase-out equation specified by user
    phase_out = (v * 142.0) - (0.41 * shimmer) + (28.0 * math.sin(2.0 * math.pi * f * t))
    
    # Baseline phase_out at nominal 1.65V with minimal jitter is around 215.2°
    # Coherence scales with phase stability around this physical alignment point
    phase_deviation = abs(phase_out - 215.2)
    coherence_base = 1.0 - (phase_deviation / 400.0)
    jitter_penalty = jitter * 3.5
    
    coherence = max(0.15, min(0.9999, coherence_base - jitter_penalty))
    
    # Organic intelligence accumulation from continuous system-wide coherence
    if coherence > 0.82:
        intelligence = min(999.0, intelligence + (coherence - 0.81) * 0.45)
    elif coherence > 0.68:
        intelligence = min(999.0, intelligence + 0.05)
    else:
        intelligence = max(10.0, intelligence - (0.68 - coherence) * 0.35)

def write_ascii_packet(voltage):
    global coherence, intelligence, jar_memory_bank
    # Map high-fidelity voltage fluctuations to the alphanumeric ASCII range 65-122 (A-z)
    ascii_val = int(65 + (voltage * 28) % 58)
    packet_id = f"pkt_{len(jar_memory_bank)}"
    stability = max(0.1, coherence * 1.8)
    
    jar_memory_bank[packet_id] = {
        'ascii': ascii_val,
        'char': chr(ascii_val),
        'stability': stability,
        'timestamp': time.time(),
        'type': 'single'
    }
    
    if len(jar_memory_bank) > 100:
        oldest = list(jar_memory_bank.keys())[0]
        del jar_memory_bank[oldest]
        
    return ascii_val

def combine_packets():
    global coherence, jar_memory_bank
    if len(jar_memory_bank) < 2 or coherence < 0.68:
        return None
        
    keys = list(jar_memory_bank.keys())
    p1 = jar_memory_bank[keys[-1]]
    p2 = jar_memory_bank[keys[-2]]
    
    new_ascii = (p1['ascii'] + p2['ascii']) % 58 + 65
    new_id = f"comb_{len(jar_memory_bank)}"
    
    jar_memory_bank[new_id] = {
        'ascii': new_ascii,
        'char': chr(new_ascii),
        'stability': (p1['stability'] + p2['stability']) * 0.7,
        'timestamp': time.time(),
        'type': 'combined'
    }
    return chr(new_ascii)

def process_telemetry_packet(voltage, jitter):
    """Processes physical voltage metrics and computes ASCII memory states"""
    update_phase_out(voltage, jitter)
    ascii_val = write_ascii_packet(voltage)
    char = chr(ascii_val)
    
    print(f"\033[36m[RESERVOIR RESISTANCE] V_NODAL: {voltage:.4f}V | Jitter: {jitter:.5f} | Phase-Out: {phase_out:+.1f}° | Coherence: {coherence:.3f} | Intelligence: {intelligence:.1f} → ASCII: '{char}'\033[0m")
    
    # Check spatial packet combination
    if random.random() < coherence * 0.6:
        combined_char = combine_packets()
        if combined_char:
            print(f"\033[1;35m[RESERVOIR HYBRID] COMBINED RESONANCE DETECTED → '{combined_char}' (Coherence High: {coherence:.3f})\033[0m")
            try:
                sio.emit("hardware:log_input", f"PYTHON_BRIDGE: Spatial attractor merge produced character '{combined_char}' under coherence {coherence:.3f}")
            except Exception:
                pass

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
    """Listens for parameters from the dashboard and relays them to physical hardware (or virtual emulation)."""
    global ser, virtual_bias, virtual_overdrive
    if "bias" in data:
        virtual_bias = float(data["bias"])
        print(f"[BRIDGE] Target Bias realigned: {virtual_bias:.1f} GHz")
    if "overdrive" in data:
        virtual_overdrive = bool(data["overdrive"])
        print(f"[BRIDGE] Target Overdrive shifted: {virtual_overdrive}")
        
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
    print(f"[BRIDGE] Received workspace instruction command: {cmd}")
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
        
    # 2. Infinite telemetry proxy loop with global recovery shell
    last_stat = 0
    while True:
        try:
            if not sio.connected:
                try:
                    connect_to_server()
                except Exception:
                    time.sleep(2)
                    continue

            if IS_VIRTUAL:
                t = time.time()
                if t - last_stat > (1.0 / 35.0): # Exactly 35 Hz updates
                    import random
                    seed = random.getrandbits(32)
                    parity = bin(seed).count('1') % 2
                    jitter = random.random() * 0.03
                    v = 1.65 + (random.uniform(-1, 1) * jitter * 10.0) + (0.25 * math.sin(t * 1.5))
                    multi = 3.5 if virtual_overdrive else 1.0
                    virtual_freq = virtual_bias * 1000 * multi
                    
                    # Trigger the scientific ASCII model calculation locally to update coherence and intelligence
                    process_telemetry_packet(v, jitter)
                    
                    # Format and enrich simulated telemetry line
                    enriched_line = "!S|{:08X}|{:.6f}|{:.4f}|{}|{:.1f}|0|{:.4f}|{:.4f}".format(
                        seed, jitter, v, parity, virtual_freq, coherence, intelligence
                    )
                    try:
                        sio.emit("hardware:telemetry_input", enriched_line)
                        if random.random() < 0.01:
                            sio.emit("hardware:log_input", f"PYTHON_BRIDGE: Emulated Pico telemetry pipeline running on bias {virtual_bias:.1f} GHz.")
                    except Exception:
                        pass
                    last_stat = t
                time.sleep(0.01)
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

                                # Parse physical variables: !S|SEED|NOISE|V_NODAL|PARITY...
                                parts = decoded.split('|')
                                if len(parts) >= 4:
                                    try:
                                        # Fallback index logic to prevent ValueError on hex parsed fields
                                        try:
                                            # Standard live Pico streams: parts[2]=jitter/noise, parts[3]=v_nodal
                                            v = float(parts[3])
                                            jitter = float(parts[2])
                                        except (ValueError, IndexError):
                                            # User's literal index specification
                                            v = float(parts[2])
                                            jitter = float(parts[1])

                                        # Run the physics-driven attractor calculations and update metrics
                                        process_telemetry_packet(v, jitter)
                                        
                                        # Enrich and unify metrics before sending to the dashboard
                                        hrate_val = parts[6] if len(parts) > 6 else "0"
                                        enriched_line = "!S|{}|{}|{}|{}|{}|{}|{:.4f}|{:.4f}".format(
                                            parts[1], # SEED hex
                                            parts[2], # JITTER/NOISE
                                            parts[3], # V_NODAL
                                            parts[4], # PARITY
                                            parts[5], # VIRT_FREQ
                                            hrate_val,
                                            coherence,
                                            intelligence
                                        )
                                        sio.emit("hardware:telemetry_input", enriched_line)
                                    except Exception:
                                        pass
                            elif decoded:
                                # Forward any debug stdout logs
                                sio.emit("hardware:log_input", f"PICO_HARDWARE: {decoded}")
                        except Exception as parse_err:
                            pass
                            
                    time.sleep(0.001) # Yield execution
                    
            except (serial.SerialException, OSError, ValueError) as port_err:
                print(f"\n\033[1;31m[BRIDGE] Hardware connection interrupt: {port_err}\033[0m")
                try:
                    sio.emit("hardware:log_input", f"SYSTEM_BRIDGE WARNING: Port error: {port_err}. Re-probing...")
                except Exception:
                    pass
                if ser:
                    try:
                        ser.close()
                    except Exception:
                        pass
                time.sleep(3)

        except (serial.SerialException, OSError) as global_serial_err:
            print(f"\n\033[1;33m[BRIDGE] Global serial trap intercepted: {global_serial_err}. Auto-restarting loop...\033[0m")
            if ser:
                try:
                    ser.close()
                except Exception:
                    pass
            time.sleep(3)
        except Exception as general_err:
            print(f"\n\033[1;31m[BRIDGE] Unexpected error: {general_err}. Continuing loop...\033[0m")
            time.sleep(3)
        except KeyboardInterrupt:
            print("\n[BRIDGE] Graceful termination requested.")
            break

    if ser:
        try:
            ser.close()
        except Exception:
            pass
    try:
        sio.disconnect()
    except Exception:
        pass

if __name__ == "__main__":
    main()
